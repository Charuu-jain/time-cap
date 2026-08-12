import React from 'react';
import { Wallet, Zap } from 'lucide-react';
import { useWallet } from '../WalletContext';

export const Navbar: React.FC = () => {
  const {
    walletAddress,
    balance,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err: any) {
      alert(err?.message || 'Failed to connect Freighter wallet.');
    }
  };

  return (
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
                Bounty Box
              </span>
            </div>
            <p className="text-xs text-gray-400">Stellar Soroban Vault Rewards</p>
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
              onClick={handleConnect}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Freighter</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
