import React, { useState } from 'react';
import { Lock, Unlock, CheckCircle2, AlertTriangle, Key, Search, Sparkles, Coins, ExternalLink, Inbox, RefreshCw, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { BountyBox } from '../types';
import { hashSecret } from '../utils';
import { submitClaimBounty } from '../soroban';
import { useWallet } from '../WalletContext';

interface ExploreVaultsProps {
  bounties: BountyBox[];
  onClaimSuccess: (bountyId: string, solverAddress: string) => void;
}

export const ExploreVaults: React.FC<ExploreVaultsProps> = ({
  bounties: initialBountiesFromProps,
  onClaimSuccess,
}) => {
  const { walletAddress, signTx, refreshBalance } = useWallet();
  // State synced from parent props
  const bounties = initialBountiesFromProps;

  const [selectedBounty, setSelectedBounty] = useState<BountyBox | null>(null);
  const [guess, setGuess] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingStep, setPendingStep] = useState<string>('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
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

  const togglePasswordVisibility = (bountyId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [bountyId]: !prev[bountyId],
    }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9f1239', '#d97706', '#059669', '#be123c'],
    });
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBounty) return;
    if (!walletAddress) {
      setStatusMsg({ type: 'error', text: 'Please connect your Stellar wallet to claim bounties!' });
      return;
    }
    const cleanGuess = guess.trim();
    if (!cleanGuess) {
      setStatusMsg({ type: 'error', text: 'Please enter a solution guess.' });
      return;
    }

    setLoading(true);
    setPendingStep('Verifying SHA-256 solution...');
    setStatusMsg({ type: 'info', text: 'Verifying solution and preparing claim_bounty transaction...' });

    try {
      const computedHash = await hashSecret(cleanGuess);
      const targetHash = selectedBounty.secretHash.trim().toLowerCase();

      // Check exact match, uppercase match, or lowercase match
      const isMatch =
        computedHash === targetHash ||
        (await hashSecret(cleanGuess.toUpperCase())) === targetHash ||
        (await hashSecret(cleanGuess.toLowerCase())) === targetHash ||
        (selectedBounty.solution && cleanGuess.toLowerCase() === selectedBounty.solution.trim().toLowerCase());

      if (!isMatch) {
        throw new Error('Incorrect solution! The cryptographic hash does not match.');
      }

      const res = await submitClaimBounty({
        solverAddress: walletAddress,
        solutionStr: cleanGuess,
        signTransactionFn: signTx,
        onStatusUpdate: (stepText) => {
          setPendingStep(stepText);
          setStatusMsg({ type: 'info', text: stepText });
        },
      });
      const txHash = res.txHash;

      onClaimSuccess(selectedBounty.id, walletAddress);
      await refreshBalance();
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
      setPendingStep('');
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
          <h2 className="text-2xl font-serif font-normal text-rose-950 flex items-center gap-2">
            Explore & Crack Vaults <Sparkles className="w-5 h-5 text-amber-700" />
          </h2>
          <p className="text-sm text-stone-600 font-light">
            Enter plaintext solutions to verify on-chain and instantly claim locked XLM bounties
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search active puzzles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Grid of Vaults */}
      {filteredBounties.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-stone-200 flex flex-col items-center justify-center my-8 bg-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-rose-900">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-normal text-rose-950 mb-2">No Active Bounty Vaults Found</h3>
          <p className="text-sm text-stone-600 max-w-md mb-6 font-light">
            There are currently no active time-capsule bounty boxes available. Create a new vault to lock XLM bounties!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBounties.map((bounty) => (
            <div
              key={bounty.id}
              className={`glass-card rounded-2xl p-6 border relative flex flex-col justify-between overflow-hidden bg-white ${
                bounty.claimed ? 'border-stone-200 opacity-80' : 'border-stone-200'
              }`}
            >
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  bounty.claimed
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
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

              <div className="flex items-center space-x-1.5 text-amber-800 font-mono font-bold text-lg">
                <Coins className="w-5 h-5 text-amber-700" />
                <span>{bounty.amount} XLM</span>
              </div>
            </div>

            {/* Title & Info */}
            <div className="mb-6">
              <h3 className="text-xl font-serif font-normal text-rose-950 mb-2">{bounty.title}</h3>
              {bounty.hint && (
                <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs text-stone-700 mb-3">
                  <span className="text-rose-900 font-semibold uppercase tracking-wider block mb-1">
                    Hint:
                  </span>
                  {bounty.hint}
                </div>
              )}

              {bounty.solution && (
                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs font-mono text-rose-900 mb-3 flex items-center justify-between shadow-inner">
                  <div className="flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-rose-900" />
                    <span className="text-stone-700 font-medium">Solution Key:</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="bg-white px-2.5 py-1 rounded-lg text-rose-900 font-bold tracking-wide border border-rose-200">
                      {visiblePasswords[bounty.id] ? bounty.solution : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(bounty.id)}
                      className="p-1 rounded-md text-stone-500 hover:text-rose-900 hover:bg-rose-100/50 transition-opacity duration-300 cursor-pointer"
                      title={visiblePasswords[bounty.id] ? 'Hide Password' : 'Show Password'}
                    >
                      {visiblePasswords[bounty.id] ? (
                        <EyeOff className="w-4 h-4 text-rose-900" />
                      ) : (
                        <Eye className="w-4 h-4 text-stone-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-xs font-mono text-stone-500">
                <p>Creator: {bounty.creator}</p>
                <p className="truncate">Hash: {bounty.secretHash.slice(0, 16)}...</p>
              </div>
            </div>

            {/* Button */}
            {bounty.claimed ? (
              <div className="w-full py-2.5 px-4 bg-stone-100 border border-stone-200 rounded-xl text-xs font-mono text-stone-600 text-center flex items-center justify-center space-x-2">
                <Unlock className="w-4 h-4 text-emerald-700" />
                <span>Solved by {bounty.claimedBy || 'Bounty Hunter'}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedBounty(bounty);
                  setStatusMsg(null);
                  setGuess(bounty.solution || '');
                }}
                className="w-full py-2.5 px-4 bg-rose-900 hover:opacity-90 text-stone-50 font-medium rounded-xl border border-rose-900/20 transition-opacity duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-stone-200 shadow-xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-normal text-rose-950 flex items-center gap-2">
                <Key className="w-5 h-5 text-rose-900" /> Crack Vault Solution
              </h3>
              <button
                onClick={() => setSelectedBounty(null)}
                className="text-stone-400 hover:text-stone-800 text-lg font-bold px-2 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 bg-stone-50 border border-stone-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-rose-950 mb-1">{selectedBounty.title}</p>
              <p className="text-xs text-amber-800 font-mono font-bold">Reward: {selectedBounty.amount} XLM</p>
              {selectedBounty.hint && (
                <p className="text-xs text-stone-600 mt-2">
                  <span className="text-stone-800 font-semibold">Hint:</span> {selectedBounty.hint}
                </p>
              )}
            </div>

            {statusMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex flex-col space-y-2 border ${
                  statusMsg.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-900" />
                  <span>{statusMsg.text}</span>
                </div>

                {statusMsg.txHash && (
                  <div className="pt-2 border-t border-current/20 font-mono flex items-center justify-between">
                    <span className="text-stone-600">Tx Hash:</span>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${statusMsg.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold underline flex items-center gap-1 hover:text-rose-900 break-all"
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
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Enter Plaintext Guess *
                </label>
                <input
                  type="text"
                  placeholder="Case-sensitive answer string"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 font-mono text-sm focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-rose-900 hover:opacity-90 text-stone-50 font-medium rounded-xl shadow-sm transition-opacity duration-300 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 border border-rose-900/20"
              >
                {loading ? (
                  <span className="flex items-center space-x-2 text-xs font-mono">
                    <RefreshCw className="w-4 h-4 text-stone-100 animate-spin" />
                    <span>{pendingStep || 'Invoking Soroban claim_bounty...'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-md p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-8 border border-stone-200 shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-rose-900" />
            </div>

            <h2 className="text-2xl font-serif font-normal text-rose-950 mb-2">Vault Unlocked! 🎉</h2>
            <p className="text-sm text-stone-600 mb-4 font-light">
              Congratulations! Your solution matched the Soroban SHA-256 state hash.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <span className="text-xs text-amber-900 uppercase font-semibold tracking-wider block mb-1">
                Transferred to your wallet
              </span>
              <span className="text-3xl font-extrabold text-amber-800 font-mono">
                +{unlockedModal.amount} XLM
              </span>
            </div>

            <div className="mb-6 p-3 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs flex flex-col text-left space-y-1">
              <span className="text-stone-500 font-sans text-xs">On-Chain Transaction Hash:</span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${unlockedModal.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-rose-900 font-bold underline flex items-center gap-1 hover:text-rose-800 break-all"
              >
                <span>{unlockedModal.txHash}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            </div>

            <button
              onClick={() => setUnlockedModal(null)}
              className="w-full py-3 bg-rose-900 hover:opacity-90 text-stone-50 font-medium rounded-xl transition-opacity duration-300 cursor-pointer shadow-sm border border-rose-900/20"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
