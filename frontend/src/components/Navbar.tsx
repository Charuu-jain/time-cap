import React from 'react';
import { Wallet } from 'lucide-react';
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
    <nav className="border-b border-stone-200/80 bg-[#F9F6F0]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Typography-Based Serif Logo */}
        <div className="flex items-center space-x-3">
          <span className="font-serif text-2xl font-normal text-rose-900 tracking-widest">
            Vault.
          </span>
          <span className="bg-rose-900/10 text-rose-900 text-xs px-2.5 py-0.5 rounded-full border border-rose-900/20 font-mono font-medium">
            Time-Capsule
          </span>
        </div>

        {/* Status / Connect Button */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-full bg-stone-200/60 border border-stone-300 text-stone-700 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2"></span>
            Stellar Testnet
          </div>

          {isConnected && walletAddress ? (
            <div className="flex items-center space-x-3 bg-white border border-stone-200 rounded-xl p-1.5 pl-4 shadow-sm">
              <div className="flex flex-col text-right">
                <span className="text-xs font-mono font-medium text-stone-800">
                  {walletAddress.slice(0, 5)}...{walletAddress.slice(-5)}
                </span>
                <span className="text-xs font-mono text-rose-900 font-semibold">
                  {balance ? `${balance} XLM` : 'Loading...'}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-medium rounded-lg transition-opacity duration-300 cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center space-x-2 px-5 py-2.5 bg-rose-900 hover:bg-rose-800 text-stone-50 font-medium text-sm rounded-xl border border-rose-900/20 transition-opacity duration-300 cursor-pointer shadow-sm"
            >
              <Wallet className="w-4 h-4 text-stone-100" />
              <span>Connect Freighter</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
