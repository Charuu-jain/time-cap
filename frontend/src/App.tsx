import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CreateBounty } from './components/CreateBounty';
import { ExploreVaults } from './components/ExploreVaults';
import { MilestoneManager } from './components/MilestoneManager';
import { ActivityFeed } from './components/ActivityFeed';
import { WalletProvider } from './WalletContext';
import { INITIAL_BOUNTIES, INITIAL_MILESTONES, VAULTPAY_ESCROW_ID } from './utils';
import type { BountyBox, MilestoneEscrow } from './types';
import { Lock, Compass, ShieldCheck, Cpu, Layers } from 'lucide-react';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'milestones' | 'explore' | 'create'>('milestones');

  const [bounties, setBounties] = useState<BountyBox[]>(() => {
    const saved = localStorage.getItem('timecap_bounties_v4');
    if (saved) {
      try {
        const parsed: BountyBox[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with INITIAL_BOUNTIES to ensure latest accurate hashes on seed items
          return INITIAL_BOUNTIES.map((init) => {
            const existing = parsed.find((p) => p.id === init.id);
            return existing ? { ...init, claimed: existing.claimed, claimedBy: existing.claimedBy } : init;
          }).concat(parsed.filter((p) => !INITIAL_BOUNTIES.some((init) => init.id === p.id)));
        }
      } catch { /* use initial */ }
    }
    return INITIAL_BOUNTIES;
  });

  const [milestones, setMilestones] = useState<MilestoneEscrow[]>(() => {
    const saved = localStorage.getItem('timecap_milestones_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* use initial */ }
    }
    return INITIAL_MILESTONES;
  });

  useEffect(() => { localStorage.setItem('timecap_bounties_v4', JSON.stringify(bounties)); }, [bounties]);
  useEffect(() => { localStorage.setItem('timecap_milestones_v4', JSON.stringify(milestones)); }, [milestones]);

  const handleBountyCreated = (newBounty: BountyBox) => {
    setBounties((prev) => [newBounty, ...prev]);
    setActiveTab('explore');
  };

  const handleClaimSuccess = (bountyId: string, solverAddress: string) => {
    setBounties((prev) =>
      prev.map((b) =>
        b.id === bountyId ? { ...b, claimed: true, claimedBy: `${solverAddress.slice(0, 4)}…${solverAddress.slice(-4)}` } : b
      )
    );
  };

  const handleAddMilestone = (m: MilestoneEscrow) => setMilestones((prev) => [m, ...prev]);
  const handleUpdateMilestone = (updated: MilestoneEscrow) => setMilestones((prev) => prev.map((m) => m.id === updated.id ? updated : m));

  const activeBounties = bounties.filter((b) => !b.claimed).length;
  const activeEscrows = milestones.filter((m) => m.status !== 'released').length;

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-stone-900 flex flex-col font-sans selection:bg-[#8B0000] selection:text-stone-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ─── Hero Banner ─── */}
        <div className="relative rounded-2xl overflow-hidden mb-8 border border-[#E5DCCB] bg-[#FFFDF9] p-7 md:p-9 shadow-sm vp-animate-in">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B0000]/6 border border-[#8B0000]/15 text-[#8B0000] text-[0.68rem] font-mono font-medium mb-4">
              <Cpu className="w-3 h-3" /> Soroban Smart Contracts · Level 4 Milestone Escrow
            </span>
            <h1 className="font-playfair text-3xl md:text-[2.75rem] font-medium tracking-tight text-[#8B0000] mb-3 leading-[1.15]">
              VaultPay <span className="italic font-normal text-[#991B1B]">Milestone&nbsp;Escrow</span>
            </h1>
            <p className="text-stone-500 text-base md:text-[1.05rem] mb-5 leading-relaxed">
              Trustless multi-sig milestone funding for sponsors and builders on Stellar Testnet.
              Create escrow vaults, submit deliverables, and release payouts — all verified on-chain.
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-4 border-t border-[#E5DCCB] text-[0.68rem] font-mono text-stone-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8B0000]" />
                <span>Multi-Sig Auth</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#8B0000]" />
                <span>{activeEscrows} Active Escrow{activeEscrows !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>{activeBounties} Riddle Vault{activeBounties !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Activity Feed ─── */}
        <ActivityFeed />

        {/* ─── Tab Navigation ─── */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-[#FFFDF9] border border-[#E5DCCB] shadow-sm">
            {([
              { id: 'milestones' as const, icon: Layers, label: 'Milestone Escrow' },
              { id: 'explore' as const, icon: Compass, label: 'Riddle Vaults' },
              { id: 'create' as const, icon: Lock, label: 'Create Vault' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium text-[0.8rem] transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#8B0000] text-[#FBF8F3] shadow-sm'
                    : 'text-stone-500 hover:text-[#8B0000] hover:bg-[#8B0000]/[0.03]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === 'milestones' ? (
          <MilestoneManager milestones={milestones} onAddMilestone={handleAddMilestone} onUpdateMilestone={handleUpdateMilestone} />
        ) : activeTab === 'create' ? (
          <CreateBounty onBountyCreated={handleBountyCreated} />
        ) : (
          <ExploreVaults bounties={bounties} onClaimSuccess={handleClaimSuccess} />
        )}
      </main>

      <footer className="border-t border-[#E5DCCB] py-5 px-6 text-center text-[0.68rem] text-stone-400 font-mono">
        <p>VaultPay · Level 4 Milestone Escrow on Stellar Soroban · Contract {VAULTPAY_ESCROW_ID.slice(0, 8)}…{VAULTPAY_ESCROW_ID.slice(-4)}</p>
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
