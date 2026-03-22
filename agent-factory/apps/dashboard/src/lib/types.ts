// Dashboard-side types — mirrors database schema

export interface PatternSignal {
  id: string;
  customerId: string;
  patternKey: string;
  vertical: string;
  workflow: string;

  // Worthiness signals
  frequency: number;
  consistency: number;
  depth: number;
  friction: number;
  recurrence: number;
  worthinessScore: number;

  // Context
  inferredIntent: string;
  frictionType: 'process' | 'decision' | 'contextual';
  dropOffStep: string;
  avgTimeAtStepSeconds: number;
  isSeeded: boolean;

  metadata: Record<string, unknown>;
}

export interface AgentConfig {
  id: string;
  customerId: string;
  patternSignalId?: string;
  name: string;
  vertical: string;
  workflow: string;
  frictionType: 'process' | 'decision';
  triggerCondition: TriggerCondition;
  systemPrompt: string;
  allowedActions: AllowedAction[];
  confirmationTitle: string;
  confirmationCta: string;
  dismissLabel: string;
  status: 'draft' | 'live' | 'paused';
  deployedAt?: string;
  templateVersion: string;
  metadata: Record<string, unknown>;
}

export type AllowedAction = 'fill_field' | 'click_button' | 'select_option' | 'navigate' | 'scroll';

export type TriggerCondition =
  | { type: 'idle'; pagePattern: string; seconds: number }
  | { type: 'back_navigation'; from: string; count: number }
  | { type: 'form_error'; pagePattern: string }
  | { type: 'return_visit'; pagePattern: string; minVisits: number };

export interface AgentInteraction {
  id: string;
  agentConfigId: string;
  outcome: 'confirmed' | 'rejected' | 'dismissed' | 'corrected';
  frictionType: string;
  wasFrictionCorrect: boolean;
  createdAt: string;
}

// Observer panel event (streamed via SSE)
export interface ObserverEvent {
  type:
    | 'session_start'
    | 'page_view'
    | 'size_select'
    | 'cart_add'
    | 'cart_edit'
    | 'checkout_step'
    | 'idle_warning'
    | 'pattern_match'
    | 'friction_classified'
    | 'agent_activated'
    | 'agent_confirmed'
    | 'agent_rejected'
    | 'task_complete'
    | 'tool_call'
    | 'tool_result'
    | 'customer_message'
    | 'agent_response'
    | 'cart_updated'
    | 'cart_step'
    | 'agent_plan'
    | 'user_click'
    | 'user_select'
    | 'field_focus';
  timestamp: number;
  sessionId: string;
  message: string;
  detail?: string;
  severity?: 'info' | 'warning' | 'success' | 'action';
}
