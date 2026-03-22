'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Wifi, WifiOff } from 'lucide-react';
import type { ObserverEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ObserverPanelProps {
  customerKey: string;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Category color palette ─────────────────────────────────────────────────
// 1. User interactions  — slate   (passive, low signal)
// 2. Context from DOM   — teal    (data the agent is learning)
// 3. Pattern / trigger  — amber   (attention signal, pre-activation)
// 4. Agent reasoning    — violet  (internal plan, hidden from customer)
// 5. Conversation       — indigo  (the actual exchange)
// 6. Tool use           — cyan    (external calls mid-conversation)
// 7. Actions            — emerald (things the agent does on the page)

const EVENT_STYLES: Record<ObserverEvent['type'], { color: string; prefix: string }> = {
  // 1 — User interactions
  user_click:           { color: 'text-slate-500',   prefix: '↑' },
  user_select:          { color: 'text-slate-500',   prefix: '◉' },
  field_focus:          { color: 'text-slate-500',   prefix: '✎' },

  // 2 — Context from DOM
  session_start:        { color: 'text-teal-400',    prefix: '→' },
  page_view:            { color: 'text-teal-400',    prefix: '·' },
  size_select:          { color: 'text-teal-300',    prefix: '◎' },
  cart_add:             { color: 'text-teal-300',    prefix: '+' },
  cart_edit:            { color: 'text-teal-400',    prefix: '↩' },
  checkout_step:        { color: 'text-teal-400',    prefix: '›' },

  // 3 — Pattern / trigger
  idle_warning:         { color: 'text-amber-400',   prefix: '⏱' },
  pattern_match:        { color: 'text-amber-400',   prefix: '◆' },
  friction_classified:  { color: 'text-amber-300',   prefix: '◈' },
  agent_activated:      { color: 'text-amber-400',   prefix: '⚡' },

  // 4 — Agent reasoning
  agent_plan:           { color: 'text-violet-300',  prefix: '◈' },

  // 5 — Conversation
  customer_message:     { color: 'text-indigo-300',  prefix: '↗' },
  agent_response:       { color: 'text-indigo-400',  prefix: '↙' },

  // 6 — Tool use
  tool_call:            { color: 'text-cyan-400',    prefix: '◆' },
  tool_result:          { color: 'text-cyan-300',    prefix: '★' },

  // 7 — Actions
  cart_step:            { color: 'text-emerald-400', prefix: '⟳' },
  cart_updated:         { color: 'text-emerald-400', prefix: '✓' },
  agent_confirmed:      { color: 'text-emerald-400', prefix: '✓' },
  agent_rejected:       { color: 'text-emerald-300', prefix: '✗' },
  task_complete:        { color: 'text-emerald-400', prefix: '★' },
};

function EventLine({ event }: { event: ObserverEvent }) {
  const style = EVENT_STYLES[event.type] || { color: 'text-slate-400', prefix: '·' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2 group"
    >
      <span className="text-slate-600 font-mono text-xs flex-shrink-0 mt-px select-none">
        {formatTime(event.timestamp)}
      </span>
      <span className={cn('font-mono text-xs flex-shrink-0 mt-px w-3', style.color)}>
        {style.prefix}
      </span>
      <div className="min-w-0">
        <span className={cn('font-mono text-xs', style.color)}>{event.message}</span>
        {event.detail && (
          <p className="text-slate-500 text-xs font-mono mt-0.5 whitespace-pre-wrap">{event.detail}</p>
        )}
      </div>
    </motion.div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <div className="h-px flex-1 bg-slate-800" />
      <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{children}</span>
      <div className="h-px flex-1 bg-slate-800" />
    </div>
  );
}

export function ObserverPanel({ customerKey }: ObserverPanelProps) {
  const [events, setEvents] = useState<ObserverEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `/api/observer/stream?key=${customerKey}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const event: ObserverEvent = JSON.parse(e.data);
        setEvents(prev => [...prev.slice(-50), event]); // keep last 50

        // Update section label to match the 7-category taxonomy
        const sectionMap: Partial<Record<ObserverEvent['type'], string>> = {
          session_start:       'Building Context',
          page_view:           'Building Context',
          size_select:         'Building Context',
          cart_add:            'Building Context',
          cart_edit:           'Building Context',
          checkout_step:       'Building Context',
          user_click:          'User Interactions',
          user_select:         'User Interactions',
          field_focus:         'User Interactions',
          idle_warning:        'Pattern & Trigger',
          pattern_match:       'Pattern & Trigger',
          friction_classified: 'Pattern & Trigger',
          agent_activated:     'Pattern & Trigger',
          agent_plan:          'Agent Reasoning',
          customer_message:    'Conversation',
          agent_response:      'Conversation',
          tool_call:           'Tool Use',
          tool_result:         'Tool Use',
          cart_step:           'Agent Actions',
          cart_updated:        'Agent Actions',
          agent_confirmed:     'Agent Actions',
          agent_rejected:      'Agent Actions',
          task_complete:       'Agent Actions',
        };
        if (sectionMap[event.type]) setCurrentSection(sectionMap[event.type]!);
      } catch { /* ignore malformed events */ }
    };

    return () => es.close();
  }, [customerKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Agent Observer</span>
          <span className="text-xs text-slate-500 font-mono">— live reasoning stream</span>
        </div>
        <div className="flex items-center gap-1.5">
          {connected
            ? <><Wifi size={12} className="text-emerald-400" /><span className="text-xs text-emerald-400">Live</span></>
            : <><WifiOff size={12} className="text-slate-500" /><span className="text-xs text-slate-500">Waiting for store...</span></>
          }
        </div>
      </div>

      {/* Events */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Terminal size={16} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Observer ready</p>
              <p className="text-xs text-slate-600 mt-1 font-mono">Open the demo store to start tracking</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {events.map((event, i) => {
            const prevEvent = events[i - 1];

            // Category sets — drives section header transitions
            const userTypes    = new Set(['user_click', 'user_select', 'field_focus']);
            const contextTypes = new Set(['session_start', 'page_view', 'size_select', 'cart_add', 'cart_edit', 'checkout_step']);
            const triggerTypes = new Set(['idle_warning', 'pattern_match', 'friction_classified', 'agent_activated']);
            const convoTypes   = new Set(['customer_message', 'agent_response']);
            const toolTypes    = new Set(['tool_call', 'tool_result']);
            const actionTypes  = new Set(['cart_step', 'cart_updated', 'agent_confirmed', 'agent_rejected', 'task_complete']);

            const category = (t: string) =>
              userTypes.has(t)    ? 'user'    :
              contextTypes.has(t) ? 'context' :
              triggerTypes.has(t) ? 'trigger' :
              t === 'agent_plan'  ? 'reason'  :
              convoTypes.has(t)   ? 'convo'   :
              toolTypes.has(t)    ? 'tool'    :
              actionTypes.has(t)  ? 'action'  : 'other';

            const prevCat = prevEvent ? category(prevEvent.type) : '';
            const thisCat = category(event.type);
            const showHeader = !prevEvent || thisCat !== prevCat;

            const sectionLabel =
              thisCat === 'user'    ? 'User Interactions' :
              thisCat === 'context' ? 'Building Context'  :
              thisCat === 'trigger' ? 'Pattern & Trigger' :
              thisCat === 'reason'  ? 'Agent Reasoning'   :
              thisCat === 'convo'   ? 'Conversation'      :
              thisCat === 'tool'    ? 'Tool Use'          :
              thisCat === 'action'  ? 'Agent Actions'     : null;

            return (
              <div key={`${event.timestamp}-${i}`}>
                {showHeader && sectionLabel && <SectionHeader>{sectionLabel}</SectionHeader>}
                <EventLine event={event} />
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Cursor */}
      {connected && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-800 flex-shrink-0">
          <span className="font-mono text-xs text-slate-600">▋</span>
        </div>
      )}
    </div>
  );
}
