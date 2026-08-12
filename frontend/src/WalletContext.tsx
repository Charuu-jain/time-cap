import React, { createContext, useContext, useEffect, useState } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FREIGHTER_ID, FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { XBULL_ID, xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { ALBEDO_ID, AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';

interface WalletContextType {
  walletAddress: string | null;
  selectedWalletId: string | null;
  balance: string | null;
  isConnected: boolean;
  isModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTx: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
}

// Initialize StellarWalletsKit static configuration
StellarWalletsKit.init({
  modules: [
    new FreighterModule(),
    new xBullModule(),
    new AlbedoModule(),
  ],
  network: Networks.TESTNET,
});

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openWalletModal = () => setIsModalOpen(true);
  const closeWalletModal = () => setIsModalOpen(false);

  useEffect(() => {
    async function restoreConnection() {
      try {
        const savedWalletId = localStorage.getItem('timecap_wallet_id');
        const savedAddress = localStorage.getItem('timecap_wallet_address');
        if (savedWalletId && savedAddress) {
          try {
            StellarWalletsKit.setWallet(savedWalletId);
            setSelectedWalletId(savedWalletId);
            setWalletAddress(savedAddress);
            setBalance('10,000.00');
          } catch (innerErr) {
            console.warn('Silent wallet set failure:', innerErr);
          }
        }
      } catch (err) {
        console.warn('Silent wallet restore error:', err);
      }
    }
    restoreConnection();
  }, []);

  const connectWallet = async (walletId: string) => {
    try {
      StellarWalletsKit.setWallet(walletId);
      const res = await StellarWalletsKit.getAddress();
      const address = typeof res === 'string' ? res : res?.address;
      if (!address) {
        throw new Error('Wallet extension not found or address request denied.');
      }
      setSelectedWalletId(walletId);
      setWalletAddress(address);
      setBalance('10,000.00');
      localStorage.setItem('timecap_wallet_id', walletId);
      localStorage.setItem('timecap_wallet_address', address);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Wallet Kit Connection Error:', err);
      throw err;
    }
  };

  const disconnectWallet = async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      // ignore
    }
    setWalletAddress(null);
    setSelectedWalletId(null);
    setBalance(null);
    localStorage.removeItem('timecap_wallet_id');
    localStorage.removeItem('timecap_wallet_address');
  };

  const signTx = async (xdr: string, opts?: any) => {
    if (!walletAddress) {
      throw new Error('No wallet connected.');
    }
    const res = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
      address: walletAddress,
      ...opts,
    });
    return res;
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        selectedWalletId,
        balance,
        isConnected: !!walletAddress,
        isModalOpen,
        openWalletModal,
        closeWalletModal,
        connectWallet,
        disconnectWallet,
        signTx,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export { FREIGHTER_ID, XBULL_ID, ALBEDO_ID };
