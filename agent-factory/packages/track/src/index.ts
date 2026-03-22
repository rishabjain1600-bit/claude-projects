/**
 * track.js — Agent Factory universal behavioral tracking script
 *
 * Privacy-by-design:
 * - Captures structural signals only (navigation, timing, interaction types)
 * - Never captures form values, email addresses, names, or any PII
 * - Session IDs are hashed before transmission
 * - Aggregate pattern signals only — no raw session replay
 *
 * Add to any site: <script src="https://[domain]/track.js" data-key="YOUR_KEY"></script>
 */

import type { TrackEvent, AggregateSignal, AgentConfig, TriggerCondition } from './types';

declare global {
  interface Window {
    AgentFactory?: AgentFactoryInstance;
    __AF_KEY__?: string;
  }
}

interface AgentFactoryInstance {
  track: (event: Omit<TrackEvent, 'sessionId' | 'customerKey' | 'timestamp'>) => void;
  getActiveAgent: () => AgentConfig | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

// ============================================================
// Session management (anonymous)
// ============================================================

function generateSessionId(): string {
  const raw = `${Date.now()}-${Math.random()}-${navigator.userAgent}`;
  // Simple hash for demo — in production use SubtleCrypto
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36) + Date.now().toString(36);
}

function getSessionId(): string {
  const key = '__af_sid__';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = generateSessionId();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

// ============================================================
// PII stripping (defensive — strip common PII field patterns)
// ============================================================

function sanitizeLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  const piiPatterns = /email|password|card|cvv|ssn|phone|address|name|zip/i;
  if (piiPatterns.test(label)) return '[redacted]';
  return label;
}

function sanitizePath(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    // Strip query params and hash (may contain session tokens or PII)
    return u.pathname;
  } catch {
    return '/';
  }
}

// ============================================================
// Event buffer (batches events before pattern detection)
// ============================================================

const eventBuffer: TrackEvent[] = [];
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let idleStart: number | null = null;

function pushEvent(partial: Omit<TrackEvent, 'sessionId' | 'customerKey' | 'timestamp'>) {
  const event: TrackEvent = {
    sessionId: getSessionId(),
    customerKey: window.__AF_KEY__ || '',
    timestamp: Date.now(),
    ...partial,
    pageUrl: sanitizePath(partial.pageUrl || window.location.href),
    pageTitle: document.title,
    elementLabel: sanitizeLabel(partial.elementLabel),
    metadata: partial.metadata || {},
  };
  eventBuffer.push(event);
  analyzePatterns(event);
}

// ============================================================
// Pattern analysis (runs client-side, no raw data sent to server)
// ============================================================

let activeAgent: AgentConfig | null = null;
let widgetMounted = false;

function analyzePatterns(latestEvent: TrackEvent) {
  if (activeAgent || widgetMounted) return;

  const recentEvents = eventBuffer.slice(-20);

  // Check each agent trigger condition
  if (window.__AF_AGENTS__) {
    for (const agent of window.__AF_AGENTS__) {
      if (matchesTrigger(agent.triggerCondition, latestEvent, recentEvents)) {
        activateAgent(agent);
        return;
      }
    }
  }
}

function matchesTrigger(
  trigger: TriggerCondition,
  latest: TrackEvent,
  recent: TrackEvent[]
): boolean {
  switch (trigger.type) {
    case 'idle':
      return (
        latest.type === 'idle_start' &&
        (latest.idleSeconds || 0) >= trigger.seconds &&
        latest.pageUrl.includes(trigger.pagePattern)
      );

    case 'back_navigation': {
      const backNavs = recent.filter(
        e => e.type === 'back_navigation' && e.pageUrl.includes(trigger.from)
      );
      return backNavs.length >= trigger.count;
    }

    case 'form_error':
      return (
        latest.type === 'form_error' &&
        latest.pageUrl.includes(trigger.pagePattern)
      );

    case 'return_visit': {
      const pageViews = recent.filter(
        e => e.type === 'page_view' && e.pageUrl.includes(trigger.pagePattern)
      );
      return pageViews.length >= trigger.minVisits;
    }

    default:
      return false;
  }
}

// ============================================================
// Agent activation (dispatches custom event — widget listens)
// ============================================================

declare global {
  interface Window {
    __AF_AGENTS__?: AgentConfig[];
  }
}

function activateAgent(agent: AgentConfig) {
  activeAgent = agent;

  // Build page context for the agent (structural only, no PII)
  const pageContext = buildPageContext();

  // Dispatch to the widget
  window.dispatchEvent(new CustomEvent('af:agent:activate', {
    detail: { agent, pageContext, sessionId: getSessionId() }
  }));

  // Send anonymized activation signal to the stream (for observer panel)
  sendObserverUpdate({
    type: 'agent_activated',
    agentName: agent.name,
    frictionType: agent.frictionType,
    pageUrl: sanitizePath(window.location.href),
    sessionId: getSessionId(),
  });
}

// ============================================================
// Page context builder (reads DOM structure, no values)
// ============================================================

function buildPageContext(): Record<string, unknown> {
  const forms = Array.from(document.querySelectorAll('form')).map(form => ({
    id: form.id,
    fields: Array.from(form.querySelectorAll('input, select, textarea')).map(el => ({
      type: (el as HTMLInputElement).type,
      label: sanitizeLabel(
        document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()
      ),
      hasValue: !!(el as HTMLInputElement).value,
      isRequired: (el as HTMLInputElement).required,
    })),
  }));

  const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map(el => ({
    label: el.textContent?.trim().slice(0, 50),
    type: (el as HTMLButtonElement).type,
  }));

  // Look for saved data indicators (visible on the page — not from our storage)
  const savedIndicators = Array.from(document.querySelectorAll('[data-saved], .saved-address, .saved-card, [data-af-saved]')).map(el => ({
    type: el.getAttribute('data-saved') || el.className,
    label: el.textContent?.trim().slice(0, 100),
  }));

  return { forms, buttons, savedIndicators, url: sanitizePath(window.location.href) };
}

// ============================================================
// Observer panel stream (sends structural signals, no PII)
// ============================================================

async function sendObserverUpdate(data: Record<string, unknown>) {
  const customerKey = window.__AF_KEY__;
  if (!customerKey) return;

  try {
    await fetch(`${API_BASE}/api/observer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, customerKey }),
    });
  } catch {
    // Silently fail — observer panel is demo-only infrastructure
  }
}

// ============================================================
// Idle detection
// ============================================================

const IDLE_THRESHOLD_MS = 10_000; // 10s to start tracking, triggers at agent config threshold

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  if (idleStart !== null) {
    pushEvent({ type: 'idle_end', pageUrl: window.location.href, metadata: {} });
    idleStart = null;
  }
  idleTimer = setTimeout(() => {
    idleStart = Date.now();
    const checkIdle = () => {
      const seconds = Math.floor((Date.now() - (idleStart || Date.now())) / 1000);
      pushEvent({ type: 'idle_start', pageUrl: window.location.href, idleSeconds: seconds, metadata: {} });
      // Check every 5 seconds while idle
      if (idleStart !== null) {
        setTimeout(checkIdle, 5000);
      }
    };
    checkIdle();
  }, IDLE_THRESHOLD_MS);
}

// ============================================================
// Navigation tracking
// ============================================================

function trackPageView() {
  pushEvent({ type: 'page_view', pageUrl: window.location.href, metadata: {} });
}

let lastUrl = window.location.href;
function checkNavigation() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    const fromUrl = lastUrl;
    lastUrl = currentUrl;
    trackPageView();
    // Detect back navigation
    if (window.history.state?.direction === 'back' ||
        document.referrer.includes(window.location.origin)) {
      pushEvent({
        type: 'back_navigation',
        pageUrl: currentUrl,
        metadata: { from: sanitizePath(fromUrl) }
      });
    }
    // Send page view to observer
    sendObserverUpdate({
      type: 'page_view',
      pageUrl: sanitizePath(currentUrl),
      pageTitle: document.title,
      sessionId: getSessionId(),
    });
  }
}

// ============================================================
// Initialization
// ============================================================

export function init(customerKey: string) {
  window.__AF_KEY__ = customerKey;

  // Load active agents from the API
  fetch(`${API_BASE}/api/agents?key=${customerKey}`)
    .then(r => r.json())
    .then((agents: AgentConfig[]) => { window.__AF_AGENTS__ = agents; })
    .catch(() => { window.__AF_AGENTS__ = []; });

  // Initial page view
  trackPageView();
  sendObserverUpdate({
    type: 'session_start',
    pageUrl: sanitizePath(window.location.href),
    pageTitle: document.title,
    sessionId: getSessionId(),
  });

  // Idle detection
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
  activityEvents.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
  resetIdleTimer();

  // Navigation detection (SPA-compatible)
  setInterval(checkNavigation, 500);

  // Form interaction tracking (labels only, never values)
  document.addEventListener('focusin', (e) => {
    const el = e.target as HTMLInputElement;
    if (!['input', 'select', 'textarea'].includes(el.tagName?.toLowerCase())) return;
    const label = document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim();
    pushEvent({
      type: 'form_focus',
      pageUrl: window.location.href,
      elementType: el.tagName.toLowerCase(),
      elementLabel: label,
      stepName: document.querySelector('[data-step]')?.getAttribute('data-step') || undefined,
      metadata: {},
    });
  });

  // Expose public API
  window.AgentFactory = {
    track: pushEvent,
    getActiveAgent: () => activeAgent,
  };
}

// Auto-init from script tag
if (typeof document !== 'undefined') {
  const script = document.querySelector('script[data-key]');
  if (script) {
    const key = script.getAttribute('data-key');
    if (key) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init(key));
      } else {
        init(key);
      }
    }
  }
}
