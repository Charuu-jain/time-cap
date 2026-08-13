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
    <div className="min-h-screen bg-[#F9F6F0] text-stone-900 flex flex-col font-sans selection:bg-rose-900 selection:text-stone-50">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 border border-stone-200/80 bg-white p-8 md:p-10 shadow-sm">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/10 border border-rose-900/20 text-rose-900 text-xs font-mono font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" /> Powered by Soroban Smart Contracts
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-normal tracking-tight text-rose-950 mb-4 leading-tight">
              Cryptographic <span className="text-rose-900 italic">Time-Capsule</span> Bounty Box
            </h1>
            <p className="text-stone-600 text-base md:text-lg mb-6 leading-relaxed font-light">
              Create password-protected vaults with XLM bounties or solve cryptographic riddles on the Stellar Testnet. Verified on-chain with contract events & pure Freighter wallet.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-stone-100 text-xs font-mono text-stone-600">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-rose-900" />
                <span>Local SHA-256 Pre-Hashing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>{bounties.filter((b) => !b.claimed).length} Active Vaults Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Event Listening Activity Feed */}
        <ActivityFeed />

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-stone-200 shadow-sm">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-opacity duration-300 cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-rose-900 text-stone-50 shadow-sm'
                  : 'text-stone-600 hover:text-rose-900 hover:bg-stone-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore & Crack Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-opacity duration-300 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-rose-900 text-stone-50 shadow-sm'
                  : 'text-stone-600 hover:text-rose-900 hover:bg-stone-50'
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
      <footer className="border-t border-stone-200/80 py-6 px-6 text-center text-xs text-stone-500 font-mono">
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
