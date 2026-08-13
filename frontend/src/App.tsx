import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CreateBounty } from './components/CreateBounty';
import { ExploreVaults } from './components/ExploreVaults';
import { ActivityFeed } from './components/ActivityFeed';
import { WalletProvider } from './WalletContext';
import { INITIAL_BOUNTIES } from './utils';
import type { BountyBox } from './types';
import { Lock, Compass, ShieldCheck, Cpu } from 'lucide-react';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'create' | 'explore'>('explore');
  const [bounties, setBounties] = useState<BountyBox[]>(() => {
    const saved = localStorage.getItem('timecap_bounties');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_BOUNTIES.length) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved bounties from localStorage:', e);
      }
    }
    return INITIAL_BOUNTIES;
  });

  // Sync bounties to localStorage on change
  useEffect(() => {
    localStorage.setItem('timecap_bounties', JSON.stringify(bounties));
  }, [bounties]);

  const handleBountyCreated = (newBounty: BountyBox) => {
    setBounties((prev) => [newBounty, ...prev]);
    setActiveTab('explore');
  };

  const handleClaimSuccess = (bountyId: string, solverAddress: string) => {
    setBounties((prev) =>
      prev.map((b) =>
        b.id === bountyId
          ? {
              ...b,
              claimed: true,
              claimedBy: `${solverAddress.slice(0, 4)}...${solverAddress.slice(-4)}`,
            }
          : b
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 p-8 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" /> Powered by Soroban Smart Contracts
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Cryptographic <span className="gradient-text">Time-Capsule</span> Bounty Box
            </h1>
            <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed">
              Create password-protected vaults with XLM bounties or solve cryptographic riddles on the Stellar Testnet. Verified on-chain with contract events & pure Freighter wallet.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Local SHA-256 Pre-Hashing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{bounties.filter((b) => !b.claimed).length} Active Vaults Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Event Listening Activity Feed */}
        <ActivityFeed />

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore & Crack Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Create a Bounty Box</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' ? (
          <CreateBounty onBountyCreated={handleBountyCreated} />
        ) : (
          <ExploreVaults bounties={bounties} onClaimSuccess={handleClaimSuccess} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        <p>Time-Capsule Bounty Box dApp • Built for Stellar Testnet Soroban • Verified On-Chain Transactions</p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
