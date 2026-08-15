import type { BountyBox, MilestoneEscrow } from './types';

export const CONTRACT_ID = 'CDYIRLVHTA34LR5SPDCS42CNSMB6V4R7A4NASFZCLQ52ICHJMKN4YHYU';
export const REGISTRY_ID = 'CC4KVRNPU33PKYHDHO6T2YYID2D6O2RRKUBCWSH4CLYUZ6ZFEZLFIIYA';
export const XLM_TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
export const VAULTPAY_ESCROW_ID = 'CCK7CXFEAQIFWLBBOVMGBQD2BHYDJJRUN2Z7VZFZE5OEU6FS5BGX3MCX';


export const INITIAL_BOUNTIES: BountyBox[] = [
  {
    id: 'bounty-1',
    contractId: CONTRACT_ID,
    title: 'The Cypherpunk Riddle',
    hint: 'Famous Satoshi Nakamoto quote, uppercase words separated by hyphen (e.g. BTC-GENESIS-2009)',
    solution: 'BTC-GENESIS-2009',
    creator: 'GBX4...9KL2',
    amount: '250',
    claimed: false,
    secretHash: '3ab1ed3802e3b2e597148bf5b722bb7648ce2a6cfca069ef84a7e937d57a9159',
    createdAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'bounty-2',
    contractId: CONTRACT_ID,
    title: 'Stellar Launch Year',
    hint: 'What year was the Stellar network founded? Format: YYYY',
    solution: '2014',
    creator: 'GA7P...3MN1',
    amount: '100',
    claimed: false,
    secretHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // SHA256 of "2014"
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'bounty-3',
    contractId: CONTRACT_ID,
    title: 'Soroban Smart Contracts',
    hint: 'Primary language used for writing Soroban contracts (lower-case)',
    solution: 'rust',
    creator: 'GDF9...8QQ4',
    amount: '500',
    claimed: false,
    secretHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', // SHA256 of "rust"
    createdAt: Date.now() - 3600000 * 48,
  },
  {
    id: 'bounty-4',
    contractId: CONTRACT_ID,
    title: 'Stellar Native Token',
    hint: 'Ticker symbol for Stellar Lumen token (upper-case)',
    solution: 'XLM',
    creator: 'GBK9...1AA4',
    amount: '150',
    claimed: false,
    secretHash: '0a80e15647573f08b3400a40660ea9b4a451152a514d0263f350c33a92eeefb2', // SHA256 of "XLM"
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'bounty-5',
    contractId: CONTRACT_ID,
    title: 'Soroban WASM Architecture',
    hint: 'Target architecture triple for Soroban compilation',
    solution: 'wasm32-unknown-unknown',
    creator: 'GCM3...7KK8',
    amount: '300',
    claimed: false,
    secretHash: 'e6371cf7fd748a071ed77085ef1295286ce17bbd22223a54d588523b1c67caaa', // SHA256 of "wasm32-unknown-unknown"
    createdAt: Date.now() - 3600000 * 8,
  },
  {
    id: 'bounty-6',
    contractId: CONTRACT_ID,
    title: 'Stellar Consensus Protocol',
    hint: 'Abbreviation of Stellar Consensus Protocol (upper-case)',
    solution: 'SCP',
    creator: 'GD77...2MM9',
    amount: '200',
    claimed: false,
    secretHash: 'cc29b16584bf72d17482811a2f643e2e0edcfb677a2ee344d9f6ce4fa65239a5', // SHA256 of "SCP"
    createdAt: Date.now() - 3600000 * 16,
  },
  {
    id: 'bounty-7',
    contractId: CONTRACT_ID,
    title: 'Stellar Testnet Horizon Passphrase',
    hint: 'First word of Stellar Testnet Network Passphrase',
    solution: 'Test',
    creator: 'GBZ2...4VV1',
    amount: '120',
    claimed: false,
    secretHash: '532ea6710124d4009670a50e035ed896c0245a36435c437a2417e9d592658d8e', // SHA256 of "Test"
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'bounty-8',
    contractId: CONTRACT_ID,
    title: 'Stellar Creator',
    hint: 'First name of Stellar founder Jed (lower-case)',
    solution: 'jed',
    creator: 'GAP8...6QQ3',
    amount: '180',
    claimed: false,
    secretHash: '35ec8a635832a84e311db6cb766324bfa76722d363f82f256ea455a297e6be9a', // SHA256 of "jed"
    createdAt: Date.now() - 3600000 * 20,
  },
  {
    id: 'bounty-9',
    contractId: CONTRACT_ID,
    title: 'Stellar Wallet Standard',
    hint: 'Default browser extension wallet for Stellar dApps',
    solution: 'Freighter',
    creator: 'GBH5...9LL0',
    amount: '350',
    claimed: false,
    secretHash: '7394eb18d6e32bc0cbb105e1a12ea354c4a450c6066ce6c8d32b509efef8dce2', // SHA256 of "Freighter"
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'bounty-10',
    contractId: CONTRACT_ID,
    title: 'Soroban Storage Type',
    hint: 'Soroban storage type for contract lifetime persistence',
    solution: 'persistent',
    creator: 'GDK1...5WW7',
    amount: '400',
    claimed: false,
    secretHash: '115e45a0b73c4f74d0891d4e414c2b9a7b9736c05d7616b4fb6c17e0e84c98f9', // SHA256 of "persistent"
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'bounty-11',
    contractId: CONTRACT_ID,
    title: 'Cryptographic Hash Algorithm',
    hint: 'Standard 256-bit hashing function used in Soroban',
    solution: 'sha256',
    creator: 'GCB3...8ZZ2',
    amount: '220',
    claimed: false,
    secretHash: '5d5b09f6dcb2d53a5fffc60c4ac0d55fad1551e07c938072049d5ef222f77e68', // SHA256 of "sha256"
    createdAt: Date.now() - 3600000 * 7,
  },
  {
    id: 'bounty-12',
    contractId: CONTRACT_ID,
    title: 'Stellar Asset Contract',
    hint: 'Abbreviation for Stellar Asset Contract (upper-case)',
    solution: 'SAC',
    creator: 'GA99...1BB5',
    amount: '280',
    claimed: false,
    secretHash: '7021eb199b50db084803923efcf9ffea5561a35ae4f3f1e967fa71c1103f1ebf', // SHA256 of "SAC"
    createdAt: Date.now() - 3600000 * 14,
  }
];

export const INITIAL_MILESTONES: MilestoneEscrow[] = [
  {
    id: 'milestone-1',
    contractId: VAULTPAY_ESCROW_ID,
    title: 'Frontend UI Redesign & Red-Beige Theme Integration',
    description: 'Implement responsive sponsor-builder dashboard with authentic Time-Cap visual tokens.',
    sponsor: 'GBLC...IBYQ',
    builder: 'GDPK...2M66',
    amount: '10',
    tokenSymbol: 'XLM',
    status: 'funded',
    workLink: '',
    workNotes: '',
    createdAt: Date.now() - 3600000 * 36,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'milestone-2',
    contractId: VAULTPAY_ESCROW_ID,
    title: 'Soroban Multi-Sig Escrow Contract Deployment',
    description: 'Deploy milestone escrow smart contract with require_auth() checks on Stellar Testnet.',
    sponsor: 'GBLC...IBYQ',
    builder: 'GDPK...2M66',
    amount: '25',
    tokenSymbol: 'XLM',
    status: 'work_submitted',
    workLink: 'https://github.com/stellar/soroban-examples/pull/4',
    workNotes: 'Contract initialized, funded, and pass 9 unit tests cleanly on Stellar Testnet.',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'milestone-3',
    contractId: VAULTPAY_ESCROW_ID,
    title: 'Freighter Multi-Wallet Transaction Signing & Telemetry',
    description: 'Wire up real-time status notifications and wallet balance refreshes post-release.',
    sponsor: 'GBLC...IBYQ',
    builder: 'GDPK...2M66',
    amount: '50',
    tokenSymbol: 'XLM',
    status: 'released',
    workLink: 'https://stellar.expert/explorer/testnet/tx/3a50e414b21db6201529d56df2a8c7d4dbdcaed7d32c40a7cad9a57e68a151ae',
    workNotes: 'Verified funds release with multi-sig auth on Stellar Testnet.',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 24,
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
