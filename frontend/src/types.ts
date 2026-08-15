export interface BountyBox {
  id: string;
  contractId: string;
  title: string;
  hint?: string;
  solution?: string; // Plaintext solution displayed on page
  creator: string;
  amount: string; // in XLM
  claimed: boolean;
  claimedBy?: string;
  secretHash: string;
  createdAt: number;
}

export type MilestoneStatus = 'created' | 'funded' | 'work_submitted' | 'released' | 'disputed';

export interface MilestoneEscrow {
  id: string;
  contractId: string;
  title: string;
  description: string;
  sponsor: string;
  builder: string;
  amount: string;
  tokenSymbol: string;
  status: MilestoneStatus;
  workLink?: string;
  workNotes?: string;
  createdAt: number;
  updatedAt: number;
}
