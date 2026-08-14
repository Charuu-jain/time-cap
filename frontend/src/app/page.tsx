/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import {
  connectWallet,
  depositEscrow,
  releaseEscrowFunds,
  fetchEscrowDetails,
} from '../utils/soroban';
import { ActivityLedger } from '../components/ActivityLedger';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'sponsor' | 'builder'>('sponsor');
  const [wallet, setWallet] = useState<{
    publicKey: string;
    network: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [builderAddress, setBuilderAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenId, setTokenId] = useState('');

  const handleConnect = async () => {
    try {
      const res = await connectWallet();
      setWallet(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const handleDeposit = async () => {
    if (!wallet) return setError('Connect wallet first');
    if (!builderAddress || !amount || !tokenId)
      return setError('Fill all fields');
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const hash = await depositEscrow(
        wallet.publicKey,
        builderAddress,
        Number(amount),
        tokenId
      );
      setSuccess(`Deposit successful! Tx Hash: ${hash}`);
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!wallet) return setError('Connect wallet first');
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const hash = await releaseEscrowFunds(wallet.publicKey);
      setSuccess(`Funds released! Tx Hash: ${hash}`);
    } catch (err: any) {
      setError(err.message || 'Release failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header & Wallet */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              VaultPay Escrow
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Secure milestone payments on Stellar Soroban
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {wallet ? (
              <div className="px-4 py-2 bg-zinc-100 rounded-full text-sm font-medium border border-zinc-200">
                Connected: {wallet.publicKey.slice(0, 6)}...
                {wallet.publicKey.slice(-4)}
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="px-6 py-2.5 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Feedback Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 text-xl">📝</span>
            <div>
              <p className="text-base text-blue-900 font-semibold">
                Provide Beta Feedback
              </p>
              <p className="text-sm text-blue-700">
                Help us improve VaultPay and shape the future of Web3 escrow.
              </p>
            </div>
          </div>
          <a
            href="https://forms.gle/placeholder"
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Submit Feedback &rarr;
          </a>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-zinc-100 p-1 rounded-xl w-max">
          <button
            onClick={() => setActiveTab('sponsor')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'sponsor'
                ? 'bg-white shadow-sm text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Sponsor Portal
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'builder'
                ? 'bg-white shadow-sm text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Builder Portal
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm break-all">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm break-all">
            {success}
            <div className="mt-2">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${success.split('Hash: ')[1]}`}
                target="_blank"
                rel="noreferrer"
                className="underline font-medium hover:text-green-800"
              >
                View on Stellar Expert
              </a>
            </div>
          </div>
        )}

        {/* Portals */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-zinc-200">
          {activeTab === 'sponsor' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-xl font-semibold">Fund Escrow</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Lock tokens in the contract for a builder.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Builder Address
                  </label>
                  <input
                    type="text"
                    value={builderAddress}
                    onChange={(e) => setBuilderAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                    placeholder="G..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                    placeholder="C..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none transition-all"
                    placeholder="1000"
                  />
                </div>
              </div>
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Deposit Funds'}
              </button>

              <div className="border-t border-zinc-100 pt-6 mt-6">
                <h2 className="text-xl font-semibold mb-4">
                  Approve Milestone
                </h2>
                <button
                  onClick={handleRelease}
                  disabled={loading}
                  className="w-full py-3 bg-white border border-zinc-300 text-zinc-900 rounded-xl font-medium hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Release Funds to Builder'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-xl font-semibold">Active Escrows</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Track your project milestones and payment status.
                </p>
              </div>

              <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 bg-zinc-200 rounded-full flex items-center justify-center text-xl">
                  💼
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900">
                    Escrow #1 (Demo)
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Status: Waiting for Sponsor Approval
                  </p>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Locked
                </div>
              </div>
            </div>
          )}
        </div>

        <ActivityLedger />
      </div>
    </div>
  );
}
