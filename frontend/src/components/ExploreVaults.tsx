import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle2, AlertTriangle, Key, Search, Sparkles, Coins, ExternalLink, Inbox } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { BountyBox } from '../types';
import { hashSecret } from '../utils';
import { submitClaimBounty } from '../soroban';

interface ExploreVaultsProps {
  bounties: BountyBox[];
  walletAddress: string | null;
  onClaimSuccess: (bountyId: string, solverAddress: string) => void;
}

export const ExploreVaults: React.FC<ExploreVaultsProps> = ({
  bounties: initialBountiesFromProps,
  walletAddress,
  onClaimSuccess,
}) => {
  const [bounties, setBounties] = useState<BountyBox[]>(initialBountiesFromProps);

  // Sync state when props change
  useEffect(() => {
    setBounties(initialBountiesFromProps);
  }, [initialBountiesFromProps]);

  // Fetch and render list of active bounties from localStorage on initial mount
  useEffect(() => {
    const saved = localStorage.getItem('timecap_bounties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBounties(parsed);
        }
      } catch (e) {
        console.error('Error reading timecap_bounties from localStorage:', e);
      }
    }
  }, []);

  const [selectedBounty, setSelectedBounty] = useState<BountyBox | null>(null);
  const [guess, setGuess] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'error' | 'info';
    text: string;
    txHash?: string;
  } | null>(null);
  const [unlockedModal, setUnlockedModal] = useState<{
    bounty: BountyBox;
    amount: string;
    txHash: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#f59e0b', '#10b981', '#ec4899'],
    });
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBounty) return;
    if (!walletAddress) {
      setStatusMsg({ type: 'error', text: 'Please connect your Freighter wallet to claim bounties!' });
      return;
    }
    if (!guess.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a solution guess.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Verifying solution and submitting claim_bounty transaction...' });

    try {
      const computedHash = await hashSecret(guess.trim());

      if (computedHash.toLowerCase() !== selectedBounty.secretHash.toLowerCase()) {
        throw new Error('Incorrect solution! The cryptographic hash does not match.');
      }

      const res = await submitClaimBounty({
        solverAddress: walletAddress,
        solutionStr: guess.trim(),
      });
      const txHash = res.txHash;

      onClaimSuccess(selectedBounty.id, walletAddress);
      setUnlockedModal({
        bounty: selectedBounty,
        amount: selectedBounty.amount,
        txHash,
      });
      setSelectedBounty(null);
      setGuess('');
      triggerConfetti();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to claim bounty box.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBounties = bounties.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.hint?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Explore & Crack Vaults <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-sm text-gray-400">
            Enter plaintext solutions to verify on-chain and instantly claim locked XLM bounties
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search active puzzles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stellar-dark border border-stellar-border rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Grid of Vaults */}
      {filteredBounties.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-stellar-border flex flex-col items-center justify-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Bounty Vaults Found</h3>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            There are currently no active time-capsule bounty boxes available. Create a new vault to lock XLM bounties!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBounties.map((bounty) => (
            <div
              key={bounty.id}
              className={`glass-card rounded-2xl p-6 border relative flex flex-col justify-between overflow-hidden ${
                bounty.claimed ? 'border-gray-800 opacity-75' : 'border-stellar-border'
              }`}
            >
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  bounty.claimed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {bounty.claimed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Active Vault
                  </>
                )}
              </span>

              <div className="flex items-center space-x-1.5 text-amber-400 font-mono font-bold text-lg">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>{bounty.amount} XLM</span>
              </div>
            </div>

            {/* Title & Info */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{bounty.title}</h3>
              {bounty.hint && (
                <div className="bg-stellar-dark/60 border border-stellar-border/60 rounded-xl p-3 text-xs text-gray-300 mb-3">
                  <span className="text-indigo-400 font-semibold uppercase tracking-wider block mb-1">
                    Hint:
                  </span>
                  {bounty.hint}
                </div>
              )}

              <div className="space-y-1 text-xs font-mono text-gray-500">
                <p>Creator: {bounty.creator}</p>
                <p className="truncate">Hash: {bounty.secretHash.slice(0, 16)}...</p>
              </div>
            </div>

            {/* Button */}
            {bounty.claimed ? (
              <div className="w-full py-2.5 px-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-xs font-mono text-gray-400 text-center flex items-center justify-center space-x-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span>Solved by {bounty.claimedBy || 'Bounty Hunter'}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedBounty(bounty);
                  setStatusMsg(null);
                  setGuess('');
                }}
                className="w-full py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Attempt Solution</span>
              </button>
            )}
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {selectedBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-stellar-border shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" /> Crack Vault Solution
              </h3>
              <button
                onClick={() => setSelectedBounty(null)}
                className="text-gray-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-200 mb-1">{selectedBounty.title}</p>
              <p className="text-xs text-amber-400 font-mono font-bold">Reward: {selectedBounty.amount} XLM</p>
              {selectedBounty.hint && (
                <p className="text-xs text-gray-400 mt-2">
                  <span className="text-gray-300 font-semibold">Hint:</span> {selectedBounty.hint}
                </p>
              )}
            </div>

            {statusMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex flex-col space-y-2 border ${
                  statusMsg.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{statusMsg.text}</span>
                </div>

                {statusMsg.txHash && (
                  <div className="pt-2 border-t border-current/20 font-mono flex items-center justify-between">
                    <span className="text-gray-400">Tx Hash:</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${statusMsg.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline flex items-center gap-1 hover:text-white break-all"
                    >
                      <span>{statusMsg.txHash.slice(0, 12)}...{statusMsg.txHash.slice(-12)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Enter Plaintext Guess *
                </label>
                <input
                  type="text"
                  placeholder="Case-sensitive answer string"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="w-full bg-stellar-dark border border-stellar-border rounded-xl px-4 py-3 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center space-x-2 text-sm">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Invoking Soroban claim_bounty...</span>
                  </span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Submit & Claim Reward</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Congratulatory Unlocked Modal */}
      {unlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-8 border border-emerald-500/40 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500"></div>

            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2">Vault Unlocked! 🎉</h2>
            <p className="text-sm text-gray-300 mb-4">
              Congratulations! Your solution matched the Soroban SHA-256 state hash.
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
              <span className="text-xs text-emerald-400 uppercase font-semibold tracking-wider block mb-1">
                Transferred to your wallet
              </span>
              <span className="text-3xl font-extrabold text-amber-400 font-mono">
                +{unlockedModal.amount} XLM
              </span>
            </div>

            <div className="mb-6 p-3 rounded-xl bg-stellar-dark/80 border border-stellar-border font-mono text-xs flex flex-col text-left space-y-1">
              <span className="text-gray-400 font-sans text-xs">On-Chain Transaction Hash:</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${unlockedModal.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 font-bold underline flex items-center gap-1 hover:text-indigo-300 break-all"
              >
                <span>{unlockedModal.txHash}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            </div>

            <button
              onClick={() => setUnlockedModal(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
