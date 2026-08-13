import { rpc, Contract, Address, nativeToScVal, xdr, TransactionBuilder } from '@stellar/stellar-sdk';
import { CONTRACT_ID, REGISTRY_ID, XLM_TOKEN_ID } from './utils';

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export const server = new rpc.Server(SOROBAN_RPC_URL);

/**
 * Converts a hex string (64 characters, e.g. SHA-256) into a 32-byte ScVal BytesN
 */
function hexToBytesN32ScVal(hexStr: string): xdr.ScVal {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hexStr.substring(i * 2, i * 2 + 2), 16) || 0;
  }
  return nativeToScVal(bytes, { type: 'bytes' });
}

/**
 * Categorizes and formats errors for user-friendly UI display:
 * 1. Wallet Not Found / Not Installed
 * 2. Transaction Rejected by User
 * 3. Insufficient XLM Balance
 */
export function categorizeError(err: any): string {
  const msg = err?.message || String(err);
  if (
    msg.includes('Wallet Not Found') ||
    msg.includes('not installed') ||
    msg.includes('No wallet') ||
    msg.includes('Extension not found')
  ) {
    return 'Wallet Error: Selected wallet extension is not installed or available.';
  }
  if (
    msg.includes('User rejected') ||
    msg.includes('declined') ||
    msg.includes('user canceled') ||
    msg.includes('User denied')
  ) {
    return 'Transaction Error: Transaction request was rejected by the user.';
  }
  if (
    msg.includes('Error(Storage, MissingValue)') ||
    msg.includes('insufficient balance') ||
    msg.includes('underfunded') ||
    msg.includes('tx_insufficient_balance') ||
    msg.includes('HostError') ||
    msg.includes('BalanceExceeded')
  ) {
    return 'Balance Error: Insufficient XLM balance or missing funded account on Testnet.';
  }
  return msg;
}

/**
 * Polls for transaction completion using server.getTransaction(hash)
 */
export async function pollTransaction(
  hash: string,
  onStatusUpdate?: (status: string) => void,
  maxAttempts = 20,
  intervalMs = 2000
): Promise<rpc.Api.GetTransactionResponse> {
  onStatusUpdate?.('Polling transaction confirmation on-chain...');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const txResponse = await server.getTransaction(hash);
    if (txResponse.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return txResponse;
    }
    if (txResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction ${hash} failed on-chain.`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Transaction ${hash} timed out after polling.`);
}

/**
 * Invokes create_bounty contract call following full Soroban lifecycle:
 * 1. Build Operation & Transaction
 * 2. Simulate via server.prepareTransaction
 * 3. Sign via wallet kit
 * 4. Send via server.sendTransaction
 * 5. Poll for confirmation
 */
export async function submitCreateBounty({
  creatorAddress,
  secretHash,
  amountXlm,
  signTransactionFn,
  onStatusUpdate,
}: {
  creatorAddress: string;
  secretHash: string;
  amountXlm: string;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    onStatusUpdate?.('Simulating transaction on Soroban RPC...');

    const account = await server.getAccount(creatorAddress);
    const contract = new Contract(CONTRACT_ID);

    const amountStroops = BigInt(Math.round(parseFloat(amountXlm) * 10000000));

    const tokenScVal = Address.fromString(XLM_TOKEN_ID).toScVal();
    const creatorScVal = Address.fromString(creatorAddress).toScVal();
    const secretHashScVal = hexToBytesN32ScVal(secretHash);
    const amountScVal = nativeToScVal(amountStroops, { type: 'i128' });
    const registryScVal = Address.fromString(REGISTRY_ID).toScVal();

    const op = contract.call('create_bounty', tokenScVal, creatorScVal, secretHashScVal, amountScVal, registryScVal);

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    let preparedTx;
    try {
      preparedTx = await server.prepareTransaction(tx);
    } catch (simErr: any) {
      throw new Error(`Simulation Failed: ${categorizeError(simErr)}`);
    }

    onStatusUpdate?.('Awaiting user wallet signature...');

    let signedResult;
    try {
      signedResult = await signTransactionFn(preparedTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: creatorAddress,
      });
    } catch (signErr: any) {
      throw new Error(`Signing Failed: ${categorizeError(signErr)}`);
    }

    const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult?.signedTxXdr || signedResult?.signedXdr);
    if (!signedXdr) {
      throw new Error('Transaction signing was cancelled or returned empty.');
    }

    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    onStatusUpdate?.('Submitting transaction to Stellar Testnet...');
    const sendRes = await server.sendTransaction(signedTx);
    if (sendRes.status === 'ERROR') {
      throw new Error(`Transaction Submission Failed: ${JSON.stringify(sendRes.errorResult)}`);
    }

    const txHash = sendRes.hash;

    await pollTransaction(txHash, onStatusUpdate);

    return { txHash };
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

/**
 * Invokes claim_bounty contract call following full Soroban lifecycle:
 * claim_bounty(env, solver: Address, solution_str: String)
 */
export async function submitClaimBounty({
  solverAddress,
  solutionStr,
  signTransactionFn,
  onStatusUpdate,
}: {
  solverAddress: string;
  solutionStr: string;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    onStatusUpdate?.('Simulating claim_bounty transaction on Soroban RPC...');

    const account = await server.getAccount(solverAddress);
    const contract = new Contract(CONTRACT_ID);

    const solverScVal = Address.fromString(solverAddress).toScVal();
    const solutionScVal = nativeToScVal(solutionStr, { type: 'string' });

    const op = contract.call('claim_bounty', solverScVal, solutionScVal);

    const tx = new TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    let preparedTx;
    try {
      preparedTx = await server.prepareTransaction(tx);
    } catch (simErr: any) {
      throw new Error(`Simulation Failed: ${categorizeError(simErr)}`);
    }

    onStatusUpdate?.('Awaiting user wallet signature...');

    let signedResult;
    try {
      signedResult = await signTransactionFn(preparedTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: solverAddress,
      });
    } catch (signErr: any) {
      throw new Error(`Signing Failed: ${categorizeError(signErr)}`);
    }

    const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult?.signedTxXdr || signedResult?.signedXdr);
    if (!signedXdr) {
      throw new Error('Transaction signing was cancelled or returned empty.');
    }

    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    onStatusUpdate?.('Submitting claim transaction to Stellar Testnet...');
    const sendRes = await server.sendTransaction(signedTx);
    if (sendRes.status === 'ERROR') {
      throw new Error(`Transaction Submission Failed: ${JSON.stringify(sendRes.errorResult)}`);
    }

    const txHash = sendRes.hash;

    await pollTransaction(txHash, onStatusUpdate);

    return { txHash };
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}
