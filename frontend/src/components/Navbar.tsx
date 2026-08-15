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
    <nav className="border-b border-[#E5DCCB] bg-[#FBF8F3]/92 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* VaultPay Logo — Playfair Display */}
        <div className="flex items-center gap-3">
          <span className="font-playfair text-[1.65rem] font-semibold tracking-wide text-[#8B0000] leading-none">
            VaultPay
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8B0000]/6 border border-[#8B0000]/15">
            <span className="w-[6px] h-[6px] rounded-full bg-emerald-600 vp-pulse-dot"></span>
            <span className="text-[0.65rem] font-mono font-medium text-[#8B0000]/80">Stellar Testnet</span>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-3">
          {isConnected && walletAddress ? (
            <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E5DCCB] rounded-xl px-1.5 py-1.5 pl-4 shadow-sm">
              <div className="flex flex-col text-right leading-tight">
                <span className="text-[0.7rem] font-mono font-medium text-stone-700">
                  {walletAddress.slice(0, 5)}…{walletAddress.slice(-5)}
                </span>
                <span className="text-[0.7rem] font-mono text-[#8B0000] font-bold">
                  {balance ? `${balance} XLM` : '…'}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="px-2.5 py-1.5 bg-[#8B0000]/5 hover:bg-[#8B0000]/10 border border-[#8B0000]/15 text-[#8B0000] text-[0.7rem] font-medium rounded-lg transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="vp-btn-primary"
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
