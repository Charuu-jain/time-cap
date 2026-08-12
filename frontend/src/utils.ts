import type { BountyBox } from './types';

export const INITIAL_BOUNTIES: BountyBox[] = [
  {
    id: 'bounty-1',
    contractId: 'CAG2TRR4Z6UKIPDI4TWHZVP2EJH5AULGVRD47HZDXI6KE6OH44B6RKWG',
    title: 'The Cypherpunk Riddle',
    hint: 'Famous Satoshi Nakamoto quote, uppercase words separated by hyphen (e.g. BTC-GENESIS-2009)',
    creator: 'GBX4...9KL2',
    amount: '250',
    claimed: false,
    secretHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'bounty-2',
    contractId: 'CD1E3F5G7H9I1J3K5L7M9N1O3P5Q7R9S1T3U5V7W9X',
    title: 'Stellar Launch Year',
    hint: 'What year was the Stellar network founded? Format: YYYY',
    creator: 'GA7P...3MN1',
    amount: '100',
    claimed: false,
    secretHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // SHA256 of "2014"
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'bounty-3',
    contractId: 'CF2G4H6J8K0L2M4N6P8R0T2V4X6Z8A0B2C4D6E8F0G',
    title: 'Soroban Smart Contracts',
    hint: 'Primary language used for writing Soroban contracts (lower-case)',
    creator: 'GDF9...8QQ4',
    amount: '500',
    claimed: true,
    claimedBy: 'GCH3...2ZZ9',
    secretHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', // SHA256 of "rust"
    createdAt: Date.now() - 3600000 * 48,
  }
];

export async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateTxHash(): string {
  const chars = 'abcdef0123456789';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}
