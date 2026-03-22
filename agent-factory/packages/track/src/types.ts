// Event schema — extensible, never breaks on new fields
// Once deployed to real sites, this contract is hard to change.
// Always add new fields under metadata{} rather than top-level.

export type EventType =
  | 'page_view'
  | 'cart_add'
  | 'cart_edit'
  | 'checkout_step'
  | 'form_focus'
  | 'form_blur'
  | 'form_error'
  | 'idle_start'
  | 'idle_end'
  | 'back_navigation'
  | 'search'
  | 'session_start'
  | 'session_end';

export interface TrackEvent {
  // Identity (anonymized — no PII)
  sessionId: string;        // hashed, non-reversible
  customerKey: string;      // the data-key from the script tag

  // What happened
  type: EventType;
  timestamp: number;        // unix ms

  // Where (structural, not content — no form values)
  pageUrl: string;          // path only, no query params that might contain PII
  pageTitle: string;

  // Contextual signals (no PII)
  idleSeconds?: number;
  stepName?: string;        // e.g. "payment", "shipping"
  elementType?: string;     // e.g. "input", "button" — not the value
  elementLabel?: string;    // e.g. "Card number" — not the value

  // Extensible — add new signals here without schema changes
  metadata: Record<string, string | number | boolean>;
}

export interface AggregateSignal {
  // Sent to the server — collapsed from raw events
  customerKey: string;
  patternKey: string;
  sessionId: string;
  events: Pick<TrackEvent, 'type' | 'pageUrl' | 'stepName' | 'idleSeconds' | 'timestamp'>[];
  metadata: Record<string, string | number | boolean>;
}

export interface AgentConfig {
  id: string;
  name: string;
  vertical: string;
  workflow: string;
  frictionType: 'process' | 'decision' | 'contextual';
  triggerCondition: TriggerCondition;
  systemPrompt: string;
  allowedActions: AllowedAction[];
  confirmationTitle: string;
  confirmationCta: string;
  dismissLabel: string;
}

export type AllowedAction =
  | 'fill_field'
  | 'click_button'
  | 'select_option'
  | 'navigate'
  | 'scroll';

export type TriggerCondition =
  | { type: 'idle'; pagePattern: string; seconds: number }
  | { type: 'back_navigation'; from: string; count: number }
  | { type: 'form_error'; pagePattern: string }
  | { type: 'return_visit'; pagePattern: string; minVisits: number };
