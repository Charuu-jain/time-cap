/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction,
} from '@stellar/freighter-api';
import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  Address,
  nativeToScVal,
} from 'stellar-sdk';
import { CONTRACT_ID } from './constants';
import { trackEvent } from './analytics';

const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(TESTNET_RPC_URL);

export async function connectWallet() {
  trackEvent('wallet_connect_attempt');
  let allowed = await isAllowed();
  if (!allowed) {
    allowed = await setAllowed();
    if (!allowed) {
      throw new Error('Freighter not allowed');
    }
  }

  const addressRes = await getAddress();
  const publicKey =
    typeof addressRes === 'string' ? addressRes : (addressRes as any).address;
  if (!publicKey) throw new Error('No public key');

  trackEvent('wallet_connect_success', { publicKey });
  return { publicKey, network: 'TESTNET' };
}

function parseSimulationError(simResult: any): string {
  if (simResult.error) {
    if (typeof simResult.error === 'string') return simResult.error;
    if (simResult.error.message) return simResult.error.message;
    return JSON.stringify(simResult.error);
  }
  return 'Simulation failed';
}

export async function depositEscrow(
  sponsor: string,
  builder: string,
  amount: number,
  token: string
) {
  trackEvent('deposit_escrow_attempt', { sponsor, builder, amount, token });
  try {
    const sourceAccount = await server.getAccount(sponsor);
    const contract = new Contract(CONTRACT_ID);

    const sponsorVal = Address.fromString(sponsor).toScVal();
    const builderVal = Address.fromString(builder).toScVal();
    const amountVal = nativeToScVal(amount, { type: 'i128' });
    const tokenVal = Address.fromString(token).toScVal();

    const invokeArgs = [sponsorVal, builderVal, amountVal, tokenVal];
    const operation = contract.call('deposit', ...invokeArgs);

    let transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(transaction);
    if (rpc.Api.isSimulationError(simResult)) {
      const err = parseSimulationError(simResult);
      throw new Error(`Simulation failed: ${err}`);
    }

    transaction = rpc
      .assembleTransaction(transaction, simResult as any)
      .build();

    const signedXdrRes = await signTransaction(transaction.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const signedTx = TransactionBuilder.fromXDR(
      signedXdrRes.signedTxXdr || (signedXdrRes as any),
      NETWORK_PASSPHRASE
    );
    const sendResult = await server.sendTransaction(signedTx as any);

    if (sendResult.errorResult) {
      throw new Error(`Transaction failed: ${sendResult.errorResult}`);
    }

    trackEvent('deposit_escrow_success', { txHash: sendResult.hash });
    return sendResult.hash;
  } catch (err) {
    trackEvent('deposit_escrow_error', { error: String(err) });
    throw err;
  }
}

export async function releaseEscrowFunds(sponsor: string) {
  trackEvent('release_escrow_attempt', { sponsor });
  try {
    const sourceAccount = await server.getAccount(sponsor);
    const contract = new Contract(CONTRACT_ID);

    const operation = contract.call('release_funds');

    let transaction = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const simResult = await server.simulateTransaction(transaction);
    if (rpc.Api.isSimulationError(simResult)) {
      const err = parseSimulationError(simResult);
      throw new Error(`Simulation failed: ${err}`);
    }

    transaction = rpc
      .assembleTransaction(transaction, simResult as any)
      .build();

    const signedXdrRes = await signTransaction(transaction.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const signedTx = TransactionBuilder.fromXDR(
      signedXdrRes.signedTxXdr || (signedXdrRes as any),
      NETWORK_PASSPHRASE
    );
    const sendResult = await server.sendTransaction(signedTx as any);

    if (sendResult.errorResult) {
      throw new Error(`Transaction failed: ${sendResult.errorResult}`);
    }

    trackEvent('release_escrow_success', { txHash: sendResult.hash });
    return sendResult.hash;
  } catch (err) {
    trackEvent('release_escrow_error', { error: String(err) });
    throw err;
  }
}

export async function fetchEscrowDetails() {
  trackEvent('fetch_escrow_details');
  return { status: 'Active' };
}
