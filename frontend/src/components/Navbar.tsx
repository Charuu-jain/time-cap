import React, { useState } from 'react';
import { Wallet, Zap, ShieldCheck, X } from 'lucide-react';
import { useWallet, FREIGHTER_ID, XBULL_ID, ALBEDO_ID } from '../WalletContext';

export const Navbar: React.FC = () => {
  const {
    walletAddress,
    balance,
    isConnected,
    isModalOpen,
    openWalletModal,
    closeWalletModal,
    connectWallet,
    disconnectWallet,
    selectedWalletId,
  } = useWallet();

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectWallet = async (id: string) => {
    setConnectingId(id);
    setErrorMsg(null);
    try {
      await connectWallet(id);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('not installed') || msg.includes('Wallet Not Found')) {
        setErrorMsg(`Selected wallet module (${id}) is not installed in your browser.`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <>
      <nav className="border-b border-stellar-border bg-stellar-dark/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Time-Capsule</h1>
                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  Bounty Box Level 2
                </span>
              </div>
              <p className="text-xs text-gray-400">Stellar Soroban Multi-Wallet Kit</p>
            </div>
          </div>

          {/* Status / Connect Button */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
              Stellar Testnet
            </div>

            {isConnected && walletAddress ? (
              <div className="flex items-center space-x-3 bg-stellar-card border border-stellar-border rounded-xl p-1.5 pl-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-mono font-medium text-gray-200">
                    {walletAddress.slice(0, 5)}...{walletAddress.slice(-5)}
                    <span className="ml-1 text-[10px] text-indigo-400 font-sans uppercase">({selectedWalletId})</span>
                  </span>
                  <span className="text-xs font-mono text-indigo-400 font-semibold">
                    {balance ? `${balance} XLM` : 'Loading...'}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={openWalletModal}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet (Multi-Kit)</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Multi-Wallet Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-stellar-border shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-stellar-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" /> Select Stellar Wallet
              </h3>
              <button
                onClick={closeWalletModal}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {/* Freighter Option */}
              <button
                onClick={() => handleSelectWallet(FREIGHTER_ID)}
                disabled={connectingId !== null}
                className="w-full p-4 rounded-xl border border-stellar-border bg-stellar-card hover:border-indigo-500 hover:bg-indigo-950/20 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                    F
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">Freighter Wallet</h4>
                    <p className="text-xs text-gray-400">Browser Extension • Recommended</p>
                  </div>
                </div>
                {connectingId === FREIGHTER_ID ? (
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="text-xs text-indigo-400 font-semibold group-hover:underline">Connect &rarr;</span>
                )}
              </button>

              {/* xBull Option */}
              <button
                onClick={() => handleSelectWallet(XBULL_ID)}
                disabled={connectingId !== null}
                className="w-full p-4 rounded-xl border border-stellar-border bg-stellar-card hover:border-purple-500 hover:bg-purple-950/20 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400">
                    X
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-300">xBull Wallet</h4>
                    <p className="text-xs text-gray-400">Browser Extension / Web Wallet</p>
                  </div>
                </div>
                {connectingId === XBULL_ID ? (
                  <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="text-xs text-purple-400 font-semibold group-hover:underline">Connect &rarr;</span>
                )}
              </button>

              {/* Albedo Option */}
              <button
                onClick={() => handleSelectWallet(ALBEDO_ID)}
                disabled={connectingId !== null}
                className="w-full p-4 rounded-xl border border-stellar-border bg-stellar-card hover:border-emerald-500 hover:bg-emerald-950/20 transition-all flex items-center justify-between cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                    A
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300">Albedo</h4>
                    <p className="text-xs text-gray-400">Web Link / Popup Wallet</p>
                  </div>
                </div>
                {connectingId === ALBEDO_ID ? (
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold group-hover:underline">Connect &rarr;</span>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-400" />
              <span>Powered by StellarWalletsKit. Select your preferred wallet extension.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
