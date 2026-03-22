// In-memory store for deployed agent configs and observer queues.
// Shared between API route handlers.
// In production: use Supabase or Redis.

import fs from 'fs';
import path from 'path';
import type { AgentConfig } from './types';

// Load agent instruction files from disk so they can be edited without redeploying.
function loadAgentPrompt(filename: string): string {
  const filePath = path.join(process.cwd(), 'src/lib/agents', filename);
  return fs.readFileSync(filePath, 'utf-8');
}

// Pre-seeded demo agent — checkout recovery for the demo store.
// This ensures the demo works immediately without requiring a Dashboard deploy click.
const DEMO_CHECKOUT_AGENT: AgentConfig = {
  id: '20000000-0000-0000-0000-000000000001',
  customerId: '00000000-0000-0000-0000-000000000001',
  patternSignalId: '10000000-0000-0000-0000-000000000001',
  name: 'Checkout Recovery Agent',
  vertical: 'ecommerce',
  workflow: 'checkout',
  frictionType: 'decision',
  triggerCondition: { type: 'idle', pagePattern: '/checkout', seconds: 5 }, // demo: 5s — change to 60 for production
  systemPrompt: loadAgentPrompt('checkout-recovery.md'),
  allowedActions: ['fill_field', 'select_option'],
  confirmationTitle: "Ready when you are",
  confirmationCta: 'Fill In My Details',
  dismissLabel: 'Not yet',
  status: 'live',
  deployedAt: new Date().toISOString(),
  templateVersion: 'v1',
  metadata: {},
};

// Deployed agents per customer key — pre-seeded with demo agent
export const deployedAgents: Map<string, AgentConfig[]> = new Map([
  ['demo-store-001', [DEMO_CHECKOUT_AGENT]],
]);

// Observer panel: per-customer event queue for SSE streaming.
// Anchored to globalThis so Next.js hot-module-reloads don't wipe the Maps —
// without this every file save resets observerListeners to empty, losing the
// SSE listener registered by the dashboard and silently dropping all events.
const g = globalThis as typeof globalThis & {
  __afListeners?: Map<string, Array<(event: unknown) => void>>;
  __afBuffers?: Map<string, unknown[]>;
};
if (!g.__afListeners) g.__afListeners = new Map();
if (!g.__afBuffers)   g.__afBuffers   = new Map();

export const observerListeners = g.__afListeners;
export const observerBuffers   = g.__afBuffers;

export function pushObserverEvent(customerKey: string, event: unknown) {
  const buffer = observerBuffers.get(customerKey) || [];
  buffer.push(event);
  if (buffer.length > 50) buffer.shift();
  observerBuffers.set(customerKey, buffer);

  const listeners = observerListeners.get(customerKey) || [];
  listeners.forEach(fn => {
    try { fn(event); } catch { /* connection closed */ }
  });
}
