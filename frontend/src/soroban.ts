import { rpc, Contract, Address, nativeToScVal, xdr, TransactionBuilder } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { CONTRACT_ID, XLM_TOKEN_ID } from './utils';

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
 * Polls for transaction completion using server.getTransaction(hash)
 */
export async function pollTransaction(hash: string, maxAttempts = 20, intervalMs = 2000): Promise<rpc.Api.GetTransactionResponse> {
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
 * Invokes create_bounty contract call following the full Soroban lifecycle:
 * create_bounty(env, token: Address, creator: Address, secret_hash: BytesN<32>, amount: i128)
 */
export async function submitCreateBounty({
  creatorAddress,
  secretHash,
  amountXlm,
}: {
  creatorAddress: string;
  secretHash: string;
  amountXlm: string;
}): Promise<{ txHash: string }> {
  // 1. Fetch account details to get sequence number
  const account = await server.getAccount(creatorAddress);
  const contract = new Contract(CONTRACT_ID);

  // Convert amount to stroops (i128)
  const amountStroops = BigInt(Math.round(parseFloat(amountXlm) * 10000000));

  // Construct ScVals matching Rust signature:
  // create_bounty(env, token: Address, creator: Address, secret_hash: BytesN<32>, amount: i128)
  const tokenScVal = new Address(XLM_TOKEN_ID).toScVal();
  const creatorScVal = new Address(creatorAddress).toScVal();
  const secretHashScVal = hexToBytesN32ScVal(secretHash);
  const amountScVal = nativeToScVal(amountStroops, { type: 'i128' });

  // Build Operation
  const op = contract.call('create_bounty', tokenScVal, creatorScVal, secretHashScVal, amountScVal);

  // Build Transaction
  const tx = new TransactionBuilder(account, {
    fee: '10000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  // 2. Prepare / Simulate transaction
  const preparedTx = await server.prepareTransaction(tx);

  // 3. Sign transaction using Freighter
  const signedResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: creatorAddress,
  });

  const signedXdr = typeof signedResult === 'string' ? signedResult : signedResult.signedTxXdr;
  if (!signedXdr) {
    throw new Error(signedResult?.error || 'Failed to sign transaction with Freighter.');
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // 4. Send transaction
  const sendRes = await server.sendTransaction(signedTx);
  if (sendRes.status === 'ERROR') {
    throw new Error(`Transaction submission error: ${JSON.stringify(sendRes.errorResult)}`);
  }

  const txHash = sendRes.hash;

  // 5. Poll for confirmation
  await pollTransaction(txHash);

  return { txHash };
}

/**
 * Invokes claim_bounty contract call following the full Soroban lifecycle:
 * claim_bounty(env, solver: Address, solution_str: String)
 */
export async function submitClaimBounty({
  solverAddress,
  solutionStr,
}: {
  solverAddress: string;
  solutionStr: string;
}): Promise<{ txHash: string }> {
  const account = await server.getAccount(solverAddress);
  const contract = new Contract(CONTRACT_ID);

  const solverScVal = new Address(solverAddress).toScVal();
  const solutionScVal = nativeToScVal(solutionStr, { type: 'string' });

  const op = contract.call('claim_bounty', solverScVal, solutionScVal);

  const tx = new TransactionBuilder(account, {
    fee: '10000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  // 2. Prepare / Simulate
  const preparedTx = await server.prepareTransaction(tx);

  // 3. Sign
  const signedResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: solverAddress,
  });

  const signedXdr = typeof signedResult === 'string' ? signedResult : signedResult.signedTxXdr;
  if (!signedXdr) {
    throw new Error(signedResult?.error || 'Failed to sign transaction with Freighter.');
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  // 4. Send
  const sendRes = await server.sendTransaction(signedTx);
  if (sendRes.status === 'ERROR') {
    throw new Error(`Transaction submission error: ${JSON.stringify(sendRes.errorResult)}`);
  }

  const txHash = sendRes.hash;

  // 5. Poll
  await pollTransaction(txHash);

  return { txHash };
}
