import React, { useState } from 'react';
import { Lock, KeyRound, Coins, Sparkles, HelpCircle, ShieldAlert, ExternalLink, RefreshCw } from 'lucide-react';
import { hashSecret, CONTRACT_ID } from '../utils';
import { submitCreateBounty } from '../soroban';
import { useWallet } from '../WalletContext';
import type { BountyBox } from '../types';

interface CreateBountyProps {
  onBountyCreated: (newBounty: BountyBox) => void;
}

export const CreateBounty: React.FC<CreateBountyProps> = ({ onBountyCreated }) => {
  const { walletAddress, signTx } = useWallet();
  const [title, setTitle] = useState('');
  const [secret, setSecret] = useState('');
  const [hint, setHint] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingStep, setPendingStep] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    txHash?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      setStatusMsg({ type: 'error', text: 'Please connect your Stellar wallet first!' });
      return;
    }
    if (!title.trim() || !secret.trim() || !amount || Number(amount) <= 0) {
      setStatusMsg({ type: 'error', text: 'Please fill in all required fields with valid amounts.' });
      return;
    }

    setLoading(true);
    setPendingStep('Computing SHA-256 state hash...');
    setStatusMsg({ type: 'info', text: 'Computing local Web Crypto SHA-256 hash...' });

    try {
      const secretHash = await hashSecret(secret.trim());

      const res = await submitCreateBounty({
        creatorAddress: walletAddress,
        secretHash,
        amountXlm: amount.trim(),
        signTransactionFn: signTx,
        onStatusUpdate: (stepText) => {
          setPendingStep(stepText);
          setStatusMsg({ type: 'info', text: stepText });
        },
      });

      const txHash = res.txHash;

      const newBounty: BountyBox = {
        id: `bounty-${Date.now()}`,
        contractId: CONTRACT_ID,
        title: title.trim(),
        hint: hint.trim() || 'No hint provided by creator.',
        solution: secret.trim(),
        creator: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        amount: amount.trim(),
        claimed: false,
        secretHash,
        createdAt: Date.now(),
      };

      onBountyCreated(newBounty);

      setStatusMsg({
        type: 'success',
        text: `Bounty Vault Created & Confirmed On-Chain! SHA-256 Hash stored: ${secretHash.slice(0, 16)}...`,
        txHash,
      });

      setTitle('');
      setSecret('');
      setHint('');
      setAmount('');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to create bounty box transaction.',
      });
    } finally {
      setLoading(false);
      setPendingStep('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <Lock className="w-6 h-6 text-rose-900" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-normal text-rose-950">Create a Bounty Box</h2>
            <p className="text-sm text-stone-600 font-light">Lock XLM rewards inside a cryptographic Soroban smart vault</p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border flex flex-col space-y-2 transition-opacity duration-300 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-900" />
              <span className="break-all font-medium">{statusMsg.text}</span>
            </div>

            {statusMsg.txHash && (
              <div className="mt-2 pt-2 border-t border-current/20 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-stone-600">Transaction Hash:</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${statusMsg.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline flex items-center gap-1 hover:text-rose-900 break-all transition-colors"
                >
                  <span>{statusMsg.txHash.slice(0, 16)}...{statusMsg.txHash.slice(-16)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Bounty Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Quantum Cipher Riddle #1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900 font-medium transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Secret Password / Answer *
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Plaintext solution (Hashed locally before on-chain commit)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 pl-11 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900 font-mono text-sm transition-colors"
                required
              />
              <KeyRound className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1 font-light">
              <Sparkles className="w-3.5 h-3.5 text-rose-900" />
              Secured with SHA-256 hashing. The plain password is never sent or stored on-chain!
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Public Hint (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Satoshi's birth year + Genesis Block code"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 pl-11 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900 text-sm transition-colors"
              />
              <HelpCircle className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              XLM Reward Amount *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 pl-11 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900 font-mono text-base font-semibold transition-colors"
                required
              />
              <Coins className="w-5 h-5 text-amber-700 absolute left-3.5 top-3.5" />
              <span className="absolute right-4 top-3 text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                XLM
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-6 bg-rose-900 hover:opacity-90 text-stone-50 font-medium rounded-xl border border-rose-900/20 transition-opacity duration-300 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span className="flex items-center space-x-2 text-sm font-mono">
                <RefreshCw className="w-4 h-4 text-stone-100 animate-spin" />
                <span>{pendingStep || 'Processing Soroban Transaction...'}</span>
              </span>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Deploy Bounty Box Vault</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
