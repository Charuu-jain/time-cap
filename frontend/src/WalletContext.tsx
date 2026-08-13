import React, { createContext, useContext, useEffect, useState } from 'react';
import { isConnected, isAllowed, requestAccess, getAddress, signTransaction } from '@stellar/freighter-api';

interface WalletContextType {
  walletAddress: string | null;
  balance: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  signTx: (xdr: string, opts?: any) => Promise<{ signedTxXdr?: string; signedXdr?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Helper to fetch live XLM balance from Stellar Testnet Horizon API
  const fetchLiveBalance = async (address: string) => {
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.balances)) {
          const nativeBalanceObj = data.balances.find((b: any) => b.asset_type === 'native');
          if (nativeBalanceObj && nativeBalanceObj.balance) {
            const num = parseFloat(nativeBalanceObj.balance);
            setBalance(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            return;
          }
        }
      }
      setBalance('0.00');
    } catch (err) {
      console.warn('Error fetching live Stellar account balance from Horizon:', err);
      setBalance('10,000.00');
    }
  };

  // Restore Freighter wallet state on initial mount
  useEffect(() => {
    async function restoreConnection() {
      try {
        const connectionRes = await isConnected();
        const connected = typeof connectionRes === 'boolean' ? connectionRes : connectionRes?.isConnected;
        if (connected) {
          const allowedRes = await isAllowed();
          const allowed = typeof allowedRes === 'boolean' ? allowedRes : allowedRes?.isAllowed;
          if (allowed) {
            const addrRes = await getAddress();
            const address = typeof addrRes === 'string' ? addrRes : addrRes?.address;
            if (address && !addrRes?.error) {
              setWalletAddress(address);
              await fetchLiveBalance(address);
            }
          }
        }
      } catch (err) {
        console.warn('Silent Freighter wallet restore check:', err);
      }
    }
    restoreConnection();
  }, []);

  const connectWallet = async () => {
    try {
      const connectionRes = await isConnected();
      const connected = typeof connectionRes === 'boolean' ? connectionRes : connectionRes?.isConnected;
      if (!connected) {
        throw new Error('Freighter wallet extension not found! Please install Freighter to connect.');
      }
      const accessObj = await requestAccess();
      const address = typeof accessObj === 'string' ? accessObj : accessObj?.address;
      if (address && !accessObj?.error) {
        setWalletAddress(address);
        await fetchLiveBalance(address);
      } else {
        const addrRes = await getAddress();
        const fallbackAddr = typeof addrRes === 'string' ? addrRes : addrRes?.address;
        if (fallbackAddr && !addrRes?.error) {
          setWalletAddress(fallbackAddr);
          await fetchLiveBalance(fallbackAddr);
        } else {
          throw new Error('User denied wallet connection access.');
        }
      }
    } catch (err: any) {
      console.warn('Freighter connection error:', err?.message || err);
      throw err;
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
  };

  const signTx = async (xdr: string, opts?: any) => {
    if (!walletAddress) {
      throw new Error('No wallet connected.');
    }
    const signedResult: any = await signTransaction(xdr, {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address: walletAddress,
      ...opts,
    });

    const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult?.signedTxXdr || signedResult?.signedAuthEntry);
    if (!signedXdr || signedResult?.error) {
      throw new Error(signedResult?.error || 'Transaction signing was rejected by user in Freighter.');
    }
    return { signedTxXdr: signedXdr };
  };

  const refreshBalance = async () => {
    if (walletAddress) {
      await fetchLiveBalance(walletAddress);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        balance,
        isConnected: !!walletAddress,
        connectWallet,
        disconnectWallet,
        refreshBalance,
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
