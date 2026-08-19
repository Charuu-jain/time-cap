import { rpc, Contract, Address, nativeToScVal, xdr, TransactionBuilder } from '@stellar/stellar-sdk';
import { CONTRACT_ID, REGISTRY_ID, XLM_TOKEN_ID, VAULTPAY_ESCROW_ID } from './utils';

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
 * Categorizes and unmasks errors for user-friendly UI display:
 */
export function categorizeError(err: any): string {
  if (!err) return 'Unknown error occurred.';

  const rawMsg = typeof err === 'string' ? err : err?.message || err?.error || JSON.stringify(err);

  if (
    rawMsg.includes('Wallet Not Found') ||
    rawMsg.includes('not installed') ||
    rawMsg.includes('No wallet') ||
    rawMsg.includes('Extension not found')
  ) {
    return 'Wallet Error: Freighter wallet extension is not installed or available.';
  }
  if (
    rawMsg.includes('User rejected') ||
    rawMsg.includes('declined') ||
    rawMsg.includes('user canceled') ||
    rawMsg.includes('User denied')
  ) {
    return 'Transaction Error: Transaction signing was rejected by user in Freighter.';
  }
  if (rawMsg.includes('Incorrect solution') || rawMsg.includes('WasmVm') || rawMsg.includes('Error(Contract, #3)')) {
    return 'Wrong Answer: The solution you entered does not match the stored hash for any on-chain bounty vault.';
  }
  if (rawMsg.includes('AlreadyClaimed') || rawMsg.includes('Error(Contract, #2)')) {
    return 'Already Claimed: This bounty vault has already been solved and claimed by another solver.';
  }
  if (rawMsg.includes('AlreadyInitialized') || rawMsg.includes('Error(Contract, #1)')) {
    return 'Duplicate Bounty: A bounty with this secret hash already exists on-chain.';
  }
  if (
    rawMsg.includes('UnreachableCodeReached') ||
    rawMsg.includes('InvalidAction') ||
    rawMsg.includes('HostError')
  ) {
    return 'Contract Simulation: Action rejected by on-chain verification rules (unauthorized caller or invalid vault state).';
  }

  return rawMsg;
}


/**
 * Polls for transaction completion using server.getTransaction(hash)
 */
export async function pollTransaction(
  hash: string,
  onStatusUpdate?: (status: string) => void,
  maxAttempts = 25,
  intervalMs = 1500
): Promise<rpc.Api.GetTransactionResponse> {
  onStatusUpdate?.('Polling transaction confirmation on Stellar Testnet...');
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
 * Generic helper to build, simulate, sign with Freighter, send, and poll a Soroban contract transaction
 */
async function executeContractTx({
  callerAddress,
  operation,
  signTransactionFn,
  onStatusUpdate,
}: {
  callerAddress: string;
  operation: xdr.Operation;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  onStatusUpdate?.('Simulating transaction on Soroban RPC...');

  const account = await server.getAccount(callerAddress);

  const tx = new TransactionBuilder(account, {
    fee: '10000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  let preparedTx;
  try {
    const sim = await server.simulateTransaction(tx);
    console.log('[Soroban Simulation Result]:', sim);
    if (rpc.Api.isSimulationError(sim)) {
      console.error('[Soroban Simulation Error Details]:', sim.error, sim.events);
      throw new Error(sim.error || 'Simulation returned an error on Soroban RPC.');
    }
    preparedTx = await server.prepareTransaction(tx);
    const simResponse = preparedTx as any;
    if (simResponse?.error) {
      throw new Error(simResponse.error);
    }
  } catch (simErr: any) {
    console.error('[Soroban Prepare Error]:', simErr);
    throw new Error(`Simulation Failed: ${categorizeError(simErr)}`);
  }

  onStatusUpdate?.('Awaiting Freighter wallet approval...');

  let signedResult;
  try {
    signedResult = await signTransactionFn(preparedTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: callerAddress,
    });
  } catch (signErr: any) {
    console.error('[Freighter Signing Error]:', signErr);
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
    console.error('[Soroban Send Error]:', sendRes.errorResult);
    throw new Error(`Transaction Submission Failed: ${JSON.stringify(sendRes.errorResult)}`);
  }

  const txHash = sendRes.hash;
  console.log('[Soroban Confirmed Broadcast TX Hash]:', txHash);
  await pollTransaction(txHash, onStatusUpdate);
  return { txHash };
}

// ─────────────────────────────────────────────────────────────
// VAULTPAY LEVEL 4 MILESTONE ESCROW CONTRACT INVOCATIONS
// ─────────────────────────────────────────────────────────────

/**
 * 1. Initialize & Fund Milestone Vault (Combined or Step 1: initialize_vault)
 */
export async function submitInitializeVault({
  sponsorAddress,
  builderAddress,
  tokenAddress,
  amountTokens,
  milestoneId,
  signTransactionFn,
  onStatusUpdate,
}: {
  sponsorAddress: string;
  builderAddress: string;
  tokenAddress?: string;
  amountTokens: string;
  milestoneId: number;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    const contract = new Contract(VAULTPAY_ESCROW_ID);
    const tokenContractAddress = tokenAddress || XLM_TOKEN_ID;
    const amountStroops = BigInt(Math.round(parseFloat(amountTokens) * 10000000));

    const sponsorScVal = Address.fromString(sponsorAddress).toScVal();
    const builderScVal = Address.fromString(builderAddress).toScVal();
    const tokenScVal = Address.fromString(tokenContractAddress).toScVal();
    const amountScVal = nativeToScVal(amountStroops, { type: 'i128' });
    const milestoneIdScVal = nativeToScVal(milestoneId, { type: 'u32' });

    const op = contract.call('initialize_vault', sponsorScVal, builderScVal, tokenScVal, amountScVal, milestoneIdScVal);

    return await executeContractTx({
      callerAddress: sponsorAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

/**
 * 2. Fund Milestone Vault: fund_vault(env, milestone_id)
 */
export async function submitFundVault({
  sponsorAddress,
  milestoneId,
  signTransactionFn,
  onStatusUpdate,
}: {
  sponsorAddress: string;
  milestoneId: number;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    const contract = new Contract(VAULTPAY_ESCROW_ID);
    const milestoneIdScVal = nativeToScVal(milestoneId, { type: 'u32' });
    const op = contract.call('fund_vault', milestoneIdScVal);

    return await executeContractTx({
      callerAddress: sponsorAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

/**
 * 3. Submit Work: submit_work(env, milestone_id, deliverable_url)
 */
export async function submitMilestoneWork({
  builderAddress,
  milestoneId,
  deliverableUrl,
  signTransactionFn,
  onStatusUpdate,
}: {
  builderAddress: string;
  milestoneId: number;
  deliverableUrl: string;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    console.log('[submitMilestoneWork] Invoking submit_work with ScVal parameters:', {
      contractId: VAULTPAY_ESCROW_ID,
      builderAddress,
      milestoneId,
      deliverableUrl,
    });
    const contract = new Contract(VAULTPAY_ESCROW_ID);
    const milestoneIdScVal = nativeToScVal(milestoneId, { type: 'u32' });
    const urlScVal = nativeToScVal(deliverableUrl, { type: 'string' });

    const op = contract.call('submit_work', milestoneIdScVal, urlScVal);

    return await executeContractTx({
      callerAddress: builderAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

/**
 * 4. Approve & Release: approve_and_release(env, milestone_id)
 */
export async function submitApproveAndRelease({
  sponsorAddress,
  milestoneId,
  signTransactionFn,
  onStatusUpdate,
}: {
  sponsorAddress: string;
  milestoneId: number;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    const contract = new Contract(VAULTPAY_ESCROW_ID);
    const milestoneIdScVal = nativeToScVal(milestoneId, { type: 'u32' });

    const op = contract.call('approve_and_release', milestoneIdScVal);

    return await executeContractTx({
      callerAddress: sponsorAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

/**
 * 5. Refund Vault: refund(env, milestone_id)
 */
export async function submitRefund({
  sponsorAddress,
  milestoneId,
  signTransactionFn,
  onStatusUpdate,
}: {
  sponsorAddress: string;
  milestoneId: number;
  signTransactionFn: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ txHash: string }> {
  try {
    const contract = new Contract(VAULTPAY_ESCROW_ID);
    const milestoneIdScVal = nativeToScVal(milestoneId, { type: 'u32' });

    const op = contract.call('refund', milestoneIdScVal);

    return await executeContractTx({
      callerAddress: sponsorAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

// ─────────────────────────────────────────────────────────────
// LEVEL 3 BOUNTY BOX CONTRACT INVOCATIONS (PRESERVED)
// ─────────────────────────────────────────────────────────────

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
    const contract = new Contract(CONTRACT_ID);
    const amountStroops = BigInt(Math.round(parseFloat(amountXlm) * 10000000));

    const tokenScVal = Address.fromString(XLM_TOKEN_ID).toScVal();
    const creatorScVal = Address.fromString(creatorAddress).toScVal();
    const secretHashScVal = hexToBytesN32ScVal(secretHash);
    const amountScVal = nativeToScVal(amountStroops, { type: 'i128' });
    const registryScVal = Address.fromString(REGISTRY_ID).toScVal();

    const op = contract.call('create_bounty', tokenScVal, creatorScVal, secretHashScVal, amountScVal, registryScVal);

    return await executeContractTx({
      callerAddress: creatorAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

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
    const trimmedSolution = solutionStr.trim();
    if (!trimmedSolution) throw new Error('Solution string cannot be empty.');

    console.log('[submitClaimBounty] Invoking claim_bounty with parameters:', {
      contractId: CONTRACT_ID,
      solverAddress,
      solutionStr: trimmedSolution,
      solutionLength: trimmedSolution.length,
    });

    const contract = new Contract(CONTRACT_ID);
    // solver: Address ScVal
    const solverScVal = Address.fromString(solverAddress).toScVal();
    // solution_str: Soroban String ScVal — contract will sha256() this internally and look up the bounty key
    const solutionScVal = nativeToScVal(trimmedSolution, { type: 'string' });

    const op = contract.call('claim_bounty', solverScVal, solutionScVal);

    return await executeContractTx({
      callerAddress: solverAddress,
      operation: op,
      signTransactionFn,
      onStatusUpdate,
    });
  } catch (err: any) {
    throw new Error(categorizeError(err));
  }
}

