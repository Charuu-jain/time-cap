import React, { useState } from 'react';
import { ShieldCheck, PlusCircle, CheckCircle2, Send, ExternalLink, RefreshCw, UserCheck, Coins, FileText, Clock, ArrowUpRight } from 'lucide-react';
import type { MilestoneEscrow, MilestoneStatus } from '../types';
import { useWallet } from '../WalletContext';
import { generateTxHash, VAULTPAY_ESCROW_ID } from '../utils';

interface MilestoneManagerProps {
  milestones: MilestoneEscrow[];
  onAddMilestone: (m: MilestoneEscrow) => void;
  onUpdateMilestone: (m: MilestoneEscrow) => void;
}

const STATUS_STEPS: MilestoneStatus[] = ['created', 'funded', 'work_submitted', 'released'];

function getProgressPercent(status: MilestoneStatus): number {
  const idx = STATUS_STEPS.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STATUS_STEPS.length) * 100);
}

function getStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case 'created': return 'Created';
    case 'funded': return 'Escrow Funded';
    case 'work_submitted': return 'Work Submitted';
    case 'released': return 'Payout Released';
    case 'disputed': return 'Disputed';
    default: return status;
  }
}

function getStatusBadgeClass(status: MilestoneStatus): string {
  switch (status) {
    case 'created': return 'vp-badge vp-badge-created';
    case 'funded': return 'vp-badge vp-badge-funded';
    case 'work_submitted': return 'vp-badge vp-badge-submitted';
    case 'released': return 'vp-badge vp-badge-released';
    default: return 'vp-badge vp-badge-created';
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const MilestoneManager: React.FC<MilestoneManagerProps> = ({
  milestones,
  onAddMilestone,
  onUpdateMilestone,
}) => {
  const { walletAddress, refreshBalance } = useWallet();
  const [role, setRole] = useState<'sponsor' | 'builder'>('sponsor');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneEscrow | null>(null);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [builderAddr, setBuilderAddr] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('XLM');

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [workLink, setWorkLink] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string; txHash?: string } | null>(null);

  // Transaction log
  const [txLog, setTxLog] = useState<{ text: string; time: number; hash?: string }[]>([]);

  const addTxLog = (text: string, hash?: string) => {
    setTxLog((prev) => [{ text, time: Date.now(), hash }, ...prev].slice(0, 8));
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !builderAddr || !amount) return;

    const newMilestone: MilestoneEscrow = {
      id: `milestone-${Date.now()}`,
      contractId: VAULTPAY_ESCROW_ID,
      title,
      description,
      sponsor: walletAddress ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}` : 'GBX4…9KL2',
      builder: builderAddr.length > 10 ? `${builderAddr.slice(0, 4)}…${builderAddr.slice(-4)}` : builderAddr,
      amount,
      tokenSymbol,
      status: 'funded',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAddMilestone(newMilestone);
    addTxLog(`Milestone vault "${title}" created & funded with ${amount} ${tokenSymbol}`, generateTxHash());
    setShowCreateModal(false);
    setTitle(''); setDescription(''); setBuilderAddr(''); setAmount('');
    setStatusMsg({ type: 'success', text: `Milestone vault funded with ${newMilestone.amount} ${newMilestone.tokenSymbol}!` });
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;
    setActionLoading(true);
    setStatusMsg({ type: 'info', text: 'Invoking submit_work on Soroban…' });

    setTimeout(() => {
      const updated: MilestoneEscrow = {
        ...selectedMilestone,
        status: 'work_submitted',
        workLink: workLink || 'https://github.com/stellar/soroban-examples',
        workNotes: workNotes || 'Milestone deliverable submitted for sponsor review.',
        updatedAt: Date.now(),
      };
      onUpdateMilestone(updated);
      addTxLog(`Builder submitted work for "${selectedMilestone.title}"`, generateTxHash());
      setActionLoading(false);
      setSelectedMilestone(null);
      setWorkLink(''); setWorkNotes('');
      setStatusMsg({ type: 'success', text: 'Deliverable proof submitted! Awaiting sponsor approval.' });
    }, 1100);
  };

  const handleReleaseFunds = async (m: MilestoneEscrow) => {
    if (!walletAddress) {
      setStatusMsg({ type: 'error', text: 'Connect Freighter wallet to authorize multi-sig release.' });
      return;
    }
    setActionLoading(true);
    setStatusMsg({ type: 'info', text: 'Signing approve_and_release via Freighter…' });

    try {
      await new Promise((res) => setTimeout(res, 1200));
      const txHash = generateTxHash();
      const updated: MilestoneEscrow = { ...m, status: 'released', updatedAt: Date.now() };
      onUpdateMilestone(updated);
      await refreshBalance();
      addTxLog(`Released ${m.amount} ${m.tokenSymbol} to builder for "${m.title}"`, txHash);
      setStatusMsg({ type: 'success', text: `${m.amount} ${m.tokenSymbol} released to builder!`, txHash });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Release failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 vp-animate-in">
      {/* ─── Section Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-playfair text-2xl font-medium text-[#8B0000] flex items-center gap-2">
            Milestone Escrow <ShieldCheck className="w-5 h-5" />
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Trustless multi-sig milestone funding & payout on Stellar Soroban
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Role Switcher */}
          <div className="inline-flex p-0.5 rounded-xl bg-[#F5EFEB] border border-[#E5DCCB]">
            <button
              onClick={() => setRole('sponsor')}
              className={`px-3.5 py-1.5 rounded-[0.6rem] text-xs font-medium transition-all ${
                role === 'sponsor' ? 'bg-[#8B0000] text-[#FBF8F3] shadow-sm' : 'text-stone-600 hover:text-[#8B0000]'
              }`}
            >
              Sponsor
            </button>
            <button
              onClick={() => setRole('builder')}
              className={`px-3.5 py-1.5 rounded-[0.6rem] text-xs font-medium transition-all ${
                role === 'builder' ? 'bg-[#8B0000] text-[#FBF8F3] shadow-sm' : 'text-stone-600 hover:text-[#8B0000]'
              }`}
            >
              Builder
            </button>
          </div>

          {role === 'sponsor' && (
            <button onClick={() => setShowCreateModal(true)} className="vp-btn-primary text-xs">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Vault</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Status Toast ─── */}
      {statusMsg && (
        <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-start justify-between border vp-animate-in ${
          statusMsg.type === 'error' ? 'bg-red-50/80 border-red-200 text-red-900' :
          statusMsg.type === 'success' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' :
          'bg-[#F5EFEB] border-[#E5DCCB] text-stone-800'
        }`}>
          <div className="flex-1">
            <span className="font-medium">{statusMsg.text}</span>
            {statusMsg.txHash && (
              <a href={`https://stellar.expert/explorer/testnet/tx/${statusMsg.txHash}`} target="_blank" rel="noreferrer"
                className="mt-1.5 font-mono text-[0.65rem] flex items-center gap-1 underline opacity-70 hover:opacity-100">
                {statusMsg.txHash.slice(0, 20)}… <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-current opacity-40 hover:opacity-100 font-bold ml-3 text-sm leading-none">×</button>
        </div>
      )}

      {/* ─── Milestones Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {milestones.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
            {/* Progress bar at top */}
            <div className="vp-progress-track rounded-none">
              <div className="vp-progress-fill" style={{ width: `${getProgressPercent(m.status)}%` }} />
            </div>

            <div className="p-5 flex flex-col flex-1">
              {/* Status + Amount */}
              <div className="flex items-center justify-between mb-3">
                <span className={getStatusBadgeClass(m.status)}>
                  {m.status === 'released' && <CheckCircle2 className="w-3 h-3" />}
                  {m.status === 'work_submitted' && <Send className="w-3 h-3" />}
                  {getStatusLabel(m.status)}
                </span>
                <span className="flex items-center gap-1 text-amber-800 font-mono font-bold text-sm">
                  <Coins className="w-3.5 h-3.5 text-amber-700" />
                  {m.amount} {m.tokenSymbol}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-playfair text-lg font-medium text-[#8B0000] mb-1.5 leading-snug">{m.title}</h3>
              <p className="text-xs text-stone-500 mb-3 line-clamp-2">{m.description}</p>

              {/* Participants */}
              <div className="bg-[#F5EFEB] border border-[#E5DCCB] rounded-xl p-3 text-[0.68rem] space-y-1 font-mono mb-3">
                <div className="flex justify-between"><span className="text-stone-400">Sponsor</span><span className="text-stone-700 font-medium">{m.sponsor}</span></div>
                <div className="flex justify-between"><span className="text-stone-400">Builder</span><span className="text-stone-700 font-medium">{m.builder}</span></div>
                <div className="flex justify-between"><span className="text-stone-400">Updated</span><span className="text-stone-500">{timeAgo(m.updatedAt)}</span></div>
              </div>

              {/* Deliverable proof */}
              {m.workLink && (
                <div className="bg-[#8B0000]/[0.03] border border-[#8B0000]/10 rounded-xl p-3 text-xs mb-3">
                  <span className="text-[#8B0000] font-semibold text-[0.65rem] uppercase tracking-wider block mb-1">Deliverable</span>
                  <a href={m.workLink} target="_blank" rel="noreferrer" className="text-stone-600 underline truncate block font-mono text-[0.68rem] hover:text-[#8B0000]">
                    {m.workLink}
                  </a>
                  {m.workNotes && <p className="text-stone-500 mt-1 italic text-[0.68rem]">{m.workNotes}</p>}
                </div>
              )}

              {/* ─── Action Buttons ─── */}
              <div className="mt-auto pt-3 border-t border-[#E5DCCB]">
                {role === 'sponsor' ? (
                  m.status === 'work_submitted' ? (
                    <button onClick={() => handleReleaseFunds(m)} disabled={actionLoading} className="vp-btn-primary w-full text-xs">
                      {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      Approve & Release Payout
                    </button>
                  ) : m.status === 'released' ? (
                    <div className="w-full py-2 text-center text-[0.7rem] font-mono text-emerald-800 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                      ✓ Funds Released
                    </div>
                  ) : (
                    <div className="w-full py-2 text-center text-[0.7rem] font-mono text-stone-400 bg-[#F5EFEB] rounded-xl border border-[#E5DCCB]">
                      <Clock className="w-3 h-3 inline mr-1 -mt-0.5" /> Awaiting Deliverable
                    </div>
                  )
                ) : (
                  m.status === 'funded' ? (
                    <button onClick={() => setSelectedMilestone(m)} className="vp-btn-primary w-full text-xs">
                      <Send className="w-3 h-3" /> Submit Deliverable
                    </button>
                  ) : m.status === 'work_submitted' ? (
                    <div className="w-full py-2 text-center text-[0.7rem] font-mono text-amber-800 bg-amber-50/60 rounded-xl border border-amber-200/60">
                      <Clock className="w-3 h-3 inline mr-1 -mt-0.5" /> Pending Sponsor Review
                    </div>
                  ) : (
                    <div className="w-full py-2 text-center text-[0.7rem] font-mono text-emerald-800 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                      ✓ Payout Complete
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Transaction Activity Log ─── */}
      {txLog.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-playfair text-base font-medium text-[#8B0000] mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Transaction Activity
          </h3>
          <div className="space-y-2">
            {txLog.map((log, i) => (
              <div key={i} className="flex items-start justify-between bg-[#F5EFEB] border border-[#E5DCCB] rounded-xl px-3.5 py-2.5 text-[0.7rem]">
                <span className="text-stone-700">{log.text}</span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-stone-400 font-mono">{timeAgo(log.time)}</span>
                  {log.hash && (
                    <a href={`https://stellar.expert/explorer/testnet/tx/${log.hash}`} target="_blank" rel="noreferrer"
                      className="text-[#8B0000] hover:underline font-mono flex items-center gap-0.5">
                      {log.hash.slice(0, 8)}… <ArrowUpRight className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Create Milestone Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFDF9] max-w-md w-full rounded-2xl p-6 border border-[#E5DCCB] shadow-2xl vp-animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-playfair text-xl font-medium text-[#8B0000]">Create Milestone Vault</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-700 font-bold text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3.5">
              <div>
                <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">Title *</label>
                <input type="text" placeholder="e.g. Smart Contract Audit" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="vp-input" required />
              </div>
              <div>
                <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">Description</label>
                <textarea placeholder="Scope of work & expected deliverable…" value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} className="vp-input resize-none" />
              </div>
              <div>
                <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">Builder Address *</label>
                <input type="text" placeholder="G… Stellar Public Key" value={builderAddr} onChange={(e) => setBuilderAddr(e.target.value)}
                  className="vp-input font-mono text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">Amount *</label>
                  <input type="number" placeholder="1000" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="vp-input font-mono" required min="1" />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">Token</label>
                  <select value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value)} className="vp-input">
                    <option value="XLM">Native XLM</option>
                    <option value="USDC">Testnet USDC</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="vp-btn-primary w-full mt-1">
                <PlusCircle className="w-4 h-4" /> Fund & Initialize Escrow
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Builder Submit Work Modal ─── */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFDF9] max-w-md w-full rounded-2xl p-6 border border-[#E5DCCB] shadow-2xl vp-animate-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-playfair text-xl font-medium text-[#8B0000]">Submit Deliverable</h3>
              <button onClick={() => setSelectedMilestone(null)} className="text-stone-400 hover:text-stone-700 font-bold text-lg leading-none">×</button>
            </div>

            <div className="bg-[#F5EFEB] border border-[#E5DCCB] rounded-xl p-3 mb-4 text-xs">
              <p className="font-medium text-[#8B0000]">{selectedMilestone.title}</p>
              <p className="text-amber-800 font-mono font-bold mt-0.5">{selectedMilestone.amount} {selectedMilestone.tokenSymbol} Escrow</p>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-3.5">
              <div>
                <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">PR / Proof Link *</label>
                <input type="url" placeholder="https://github.com/…" value={workLink} onChange={(e) => setWorkLink(e.target.value)}
                  className="vp-input font-mono text-sm" required />
              </div>
              <div>
                <label className="block text-[0.68rem] font-semibold text-stone-600 uppercase tracking-wider mb-1">Notes</label>
                <textarea placeholder="What was completed and how to verify…" value={workNotes} onChange={(e) => setWorkNotes(e.target.value)}
                  rows={3} className="vp-input resize-none" />
              </div>
              <button type="submit" disabled={actionLoading} className="vp-btn-primary w-full">
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Proof to Sponsor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
