import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Lock, CheckCircle2, Clock } from 'lucide-react';
import { server } from '../soroban';
import { CONTRACT_ID } from '../utils';

export interface OnChainEvent {
  id: string;
  type: 'Created' | 'Claimed' | 'ContractEvent';
  account: string;
  amount: string;
  ledger: number;
  timestamp: string;
}

export const ActivityFeed: React.FC = () => {
  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPolled, setLastPolled] = useState<string>('Just now');
  const [currentStartLedger, setCurrentStartLedger] = useState<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      try {
        let startLedgerToUse = currentStartLedger;

        if (startLedgerToUse === undefined) {
          const latestLedgerObj = await server.getLatestLedger();
          startLedgerToUse = latestLedgerObj.sequence;
          if (isMounted) {
            setCurrentStartLedger(startLedgerToUse);
          }
        }

        const eventsRes = await server.getEvents({
          startLedger: startLedgerToUse,
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
            },
          ],
          limit: 10,
        });

        if (isMounted && eventsRes && eventsRes.events) {
          const parsedEvents: OnChainEvent[] = eventsRes.events.map((evt, idx) => {
            const topicSymbol = evt.topic && evt.topic[0] ? String(evt.topic[0]) : 'Event';
            const isCreated = topicSymbol.toLowerCase().includes('created');
            const isClaimed = topicSymbol.toLowerCase().includes('claimed');
            const eventType = isCreated ? 'Created' : isClaimed ? 'Claimed' : 'ContractEvent';

            const accountVal = evt.topic && evt.topic[1] ? String(evt.topic[1]) : 'G...';
            const amountVal = evt.value ? String(evt.value) : '100';

            return {
              id: evt.id || `evt-${idx}-${Date.now()}`,
              type: eventType,
              account: accountVal.length > 12 ? `${accountVal.slice(0, 4)}...${accountVal.slice(-4)}` : accountVal,
              amount: amountVal,
              ledger: evt.ledger || 0,
              timestamp: new Date().toLocaleTimeString(),
            };
          });

          if (parsedEvents.length > 0) {
            const maxLedger = Math.max(...parsedEvents.map((e) => e.ledger));
            if (maxLedger > 0) {
              setCurrentStartLedger(maxLedger + 1);
            }
          }

          setEvents((prev) => {
            const combined = [...parsedEvents, ...prev];
            // Deduplicate by ID
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            return unique.slice(0, 15);
          });

          setLastPolled(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.warn('Error polling contract events from Soroban RPC:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEvents();
    const interval = setInterval(fetchEvents, 8000); // Poll every 8 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 border border-stone-200 shadow-sm mb-8 bg-white">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-900/10 border border-rose-900/20 flex items-center justify-center text-rose-900">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif font-normal text-rose-950 flex items-center gap-2">
              Real-Time Contract Events <Sparkles className="w-4 h-4 text-amber-700" />
            </h3>
            <p className="text-xs text-stone-500 font-light">Live Soroban event stream polling every 8s</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-stone-600 bg-stone-100/70 px-3 py-1.5 rounded-full border border-stone-200">
          <Clock className="w-3.5 h-3.5 text-rose-900" />
          <span>Last sync: {lastPolled}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs font-mono text-stone-500 flex items-center justify-center space-x-2">
          <span className="w-4 h-4 border-2 border-rose-900/20 border-t-rose-900 rounded-full animate-spin"></span>
          <span>Polling Soroban Contract Event Logs...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-xs text-stone-500 font-mono bg-stone-50 rounded-xl border border-stone-200/60">
          No contract events published yet on Testnet. Create or claim a vault to trigger events!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-opacity duration-300 ${
                evt.type === 'Created'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {evt.type === 'Created' ? (
                  <Lock className="w-4 h-4 text-rose-900 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                )}
                <div>
                  <span className="font-bold uppercase tracking-wider mr-2">
                    [{evt.type}]
                  </span>
                  <span className="text-stone-700">
                    {evt.type === 'Created' ? 'Bounty Vault Lock' : 'Vault Reward Claim'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-right">
                <span className="text-stone-500">Account: {evt.account}</span>
                <span className="font-bold text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-300">
                  Ledger #{evt.ledger}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
