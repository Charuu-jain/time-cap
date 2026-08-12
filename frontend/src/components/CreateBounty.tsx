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
      setStatusMsg({ type: 'error', text: 'Please connect your Stellar wallet via the Multi-Wallet modal first!' });
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
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-stellar-border shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create a Bounty Box</h2>
            <p className="text-sm text-gray-400">Lock XLM rewards inside a cryptographic Soroban smart vault</p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border flex flex-col space-y-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : statusMsg.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 animate-pulse'
            }`}
          >
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="break-all font-medium">{statusMsg.text}</span>
            </div>

            {statusMsg.txHash && (
              <div className="mt-2 pt-2 border-t border-current/20 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-gray-300">Transaction Hash:</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${statusMsg.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline flex items-center gap-1 hover:text-white break-all"
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
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Bounty Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Quantum Cipher Riddle #1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stellar-dark/80 border border-stellar-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Secret Password / Answer *
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Plaintext solution (Hashed locally before on-chain commit)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full bg-stellar-dark/80 border border-stellar-border rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm"
                required
              />
              <KeyRound className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Secured with SHA-256 hashing. The plain password is never sent or stored on-chain!
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Public Hint (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Satoshi's birth year + Genesis Block code"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                className="w-full bg-stellar-dark/80 border border-stellar-border rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <HelpCircle className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
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
                className="w-full bg-stellar-dark/80 border border-stellar-border rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-base font-semibold"
                required
              />
              <Coins className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
              <span className="absolute right-4 top-3 text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                XLM
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center space-x-2 text-sm font-mono">
                <RefreshCw className="w-4 h-4 text-indigo-300 animate-spin" />
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
