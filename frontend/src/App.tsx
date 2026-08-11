import { useState } from 'react';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';
import { Navbar } from './components/Navbar';
import { CreateBounty } from './components/CreateBounty';
import { ExploreVaults } from './components/ExploreVaults';
import { INITIAL_BOUNTIES } from './utils';
import type { BountyBox } from './types';
import { Lock, Compass, ShieldCheck, Cpu } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'explore'>('explore');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [bounties, setBounties] = useState<BountyBox[]>(INITIAL_BOUNTIES);

  const handleConnectWallet = async () => {
    try {
      const connected = await isConnected();
      if (!connected) {
        alert('Freighter wallet extension not found! Please install Freighter to connect.');
        return;
      }
      const accessObj = await requestAccess();
      if (accessObj && accessObj.address) {
        setWalletAddress(accessObj.address);
        setBalance('10,000.00'); // Mocked balance for Testnet
      } else {
        const addrRes = await getAddress();
        if (addrRes && addrRes.address) {
          setWalletAddress(addrRes.address);
          setBalance('10,000.00');
        }
      }
    } catch (err) {
      console.warn('Freighter connection fallback:', err);
      // Fallback demo address if Freighter is not actively installed in test env
      const demoAddr = 'GCS3X7K9P2M4N6Q8R1T3V5W7Y9Z2A4B6C8D0E2F4G6H8';
      setWalletAddress(demoAddr);
      setBalance('5,000.00');
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
  };

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
    <div className="min-h-screen bg-stellar-dark text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        walletAddress={walletAddress}
        balance={balance}
        isConnected={!!walletAddress}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Banner Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 border border-stellar-border bg-gradient-to-r from-indigo-950/40 via-stellar-card to-purple-950/30 p-8 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" /> Powered by Soroban Smart Contracts
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Cryptographic <span className="gradient-text">Time-Capsule</span> Bounty Box
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-6 leading-relaxed">
              Create password-protected vaults with XLM bounties or solve cryptographic riddles on the Stellar Testnet. Verified zero-knowledge on-chain using SHA-256 state hashing.
            </p>

            {/* Quick stats */}
            <div className="flex items-center space-x-6 pt-2 border-t border-stellar-border/60 text-xs font-mono text-gray-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Local SHA-256 Pre-Hashing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{bounties.filter((b) => !b.claimed).length} Active Vaults</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-2xl bg-stellar-card border border-stellar-border shadow-xl">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore & Crack Vaults</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Create a Bounty Box</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' ? (
          <CreateBounty
            walletAddress={walletAddress}
            onBountyCreated={handleBountyCreated}
          />
        ) : (
          <ExploreVaults
            bounties={bounties}
            walletAddress={walletAddress}
            onClaimSuccess={handleClaimSuccess}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stellar-border py-6 px-6 text-center text-xs text-gray-500 font-mono">
        <p>Time-Capsule Bounty Box dApp • Built for Stellar Testnet Soroban • SHA-256 Vault Verification</p>
      </footer>
    </div>
  );
}
export default App;
