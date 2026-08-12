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

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      try {
        const eventsRes = await server.getEvents({
          filters: [
            {
              type: 'contract',
              contractIds: [CONTRACT_ID],
            },
          ],
          cursor: '',
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

          setEvents(parsedEvents);
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
    <div className="glass-panel rounded-2xl p-6 border border-stellar-border shadow-xl mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-stellar-border/60">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Real-Time Contract Events <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-gray-400">Live Soroban event stream polling every 8s</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 bg-stellar-dark/60 px-3 py-1.5 rounded-full border border-stellar-border/60">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Last sync: {lastPolled}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs font-mono text-gray-400 flex items-center justify-center space-x-2">
          <span className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
          <span>Polling Soroban Contract Event Logs...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400 font-mono bg-stellar-dark/40 rounded-xl border border-stellar-border/40">
          No contract events published yet on Testnet. Create or claim a vault to trigger events!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                evt.type === 'Created'
                  ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {evt.type === 'Created' ? (
                  <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <span className="font-bold uppercase tracking-wider mr-2">
                    [{evt.type}]
                  </span>
                  <span className="text-gray-300">
                    {evt.type === 'Created' ? 'Bounty Vault Lock' : 'Vault Reward Claim'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-right">
                <span className="text-gray-400">Account: {evt.account}</span>
                <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
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
