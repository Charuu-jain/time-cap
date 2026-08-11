export interface BountyBox {
  id: string;
  contractId: string;
  title: string;
  hint?: string;
  creator: string;
  amount: string; // in XLM
  claimed: boolean;
  claimedBy?: string;
  secretHash: string;
  createdAt: number;
}
