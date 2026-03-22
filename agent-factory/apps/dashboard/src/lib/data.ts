// Seeded demo data — mirrors what's in schema.sql
// In production, this comes from Supabase queries.

import type { PatternSignal, AgentConfig } from './types';

export const DEMO_CUSTOMER_KEY = 'demo-store-001';

export const SEEDED_PATTERNS: PatternSignal[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    customerId: '00000000-0000-0000-0000-000000000001',
    patternKey: 'checkout_payment_idle',
    vertical: 'ecommerce',
    workflow: 'checkout',
    frequency: 0.67,
    consistency: 0.82,
    depth: 4,
    friction: 0.71,
    recurrence: 2.3,
    worthinessScore: 0.67 * 0.82 * (4 / 10) * 0.71 * 2.3,
    inferredIntent: 'User is trying to: complete purchase',
    frictionType: 'process',
    dropOffStep: '/checkout/payment',
    avgTimeAtStepSeconds: 87,
    isSeeded: true,
    metadata: {},
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    customerId: '00000000-0000-0000-0000-000000000001',
    patternKey: 'product_return_visit',
    vertical: 'ecommerce',
    workflow: 'product_consideration',
    frequency: 0.41,
    consistency: 0.58,
    depth: 3,
    friction: 0.49,
    recurrence: 3.1,
    worthinessScore: 0.41 * 0.58 * (3 / 10) * 0.49 * 3.1,
    inferredIntent: 'User is trying to: decide on a product (returning visitor)',
    frictionType: 'decision',
    dropOffStep: '/product',
    avgTimeAtStepSeconds: 142,
    isSeeded: true,
    metadata: {},
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    customerId: '00000000-0000-0000-0000-000000000001',
    patternKey: 'cart_quantity_loop',
    vertical: 'ecommerce',
    workflow: 'cart_management',
    frequency: 0.22,
    consistency: 0.31,
    depth: 2,
    friction: 0.28,
    recurrence: 1.4,
    worthinessScore: 0.22 * 0.31 * (2 / 10) * 0.28 * 1.4,
    inferredIntent: 'User is trying to: adjust cart contents',
    frictionType: 'decision',
    dropOffStep: '/cart',
    avgTimeAtStepSeconds: 45,
    isSeeded: true,
    metadata: {},
  },
];

export const CHECKOUT_RECOVERY_AGENT: AgentConfig = {
  id: '20000000-0000-0000-0000-000000000001',
  customerId: '00000000-0000-0000-0000-000000000001',
  patternSignalId: '10000000-0000-0000-0000-000000000001',
  name: 'Checkout Recovery Agent',
  vertical: 'ecommerce',
  workflow: 'checkout',
  frictionType: 'process',
  triggerCondition: {
    type: 'idle',
    pagePattern: '/checkout/payment',
    seconds: 60,
  },
  systemPrompt: `You are a helpful checkout assistant for Sole Society, a sneaker store.
A customer has been idle on the payment step for over 60 seconds. Your goal is to help them complete their purchase — but only if they genuinely want to.

Context about the user's session:
- They added items to their cart and proceeded to checkout
- They completed the shipping step
- They stalled at payment (process friction, not product doubt)
- The page shows their saved payment and shipping information

Your approach:
1. Open warmly and show you understand what they're trying to do (complete their order)
2. Offer to help — but make it clear they're in control
3. Before taking ANY action, tell them EXACTLY what you'll do in plain language
4. Always show totals and confirm before submitting anything
5. If they seem unsure about the product (not just the payment), switch to information mode — DO NOT push checkout

Remember: You can only use the allowed actions listed in your config. Never fill in payment card numbers — always use the site's saved payment method.`,
  allowedActions: ['fill_field', 'click_button', 'select_option'],
  confirmationTitle: "Here's what I'll do",
  confirmationCta: 'Confirm & Complete Order',
  dismissLabel: 'Not now',
  status: 'draft',
  templateVersion: 'v1',
  metadata: {},
};

// Confidence level helper
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.08) return 'high';
  if (score >= 0.03) return 'medium';
  return 'low';
}

// Worthiness thresholds
export const THRESHOLDS = {
  frequency: 0.20,
  consistency: 0.40,
  depth: 3,
  friction: 0.25,
  recurrence: 2.0,
};

export function isAgentReady(pattern: PatternSignal): boolean {
  return (
    pattern.frequency >= THRESHOLDS.frequency &&
    pattern.consistency >= THRESHOLDS.consistency &&
    pattern.depth >= THRESHOLDS.depth &&
    pattern.friction >= THRESHOLDS.friction &&
    pattern.recurrence >= THRESHOLDS.recurrence
  );
}

// ROI estimate (simplified)
export function estimateMonthlyROI(pattern: PatternSignal, monthlyVisitors = 10000, avgOrderValue = 89): string {
  const stalled = monthlyVisitors * pattern.frequency;
  const recoveryRate = 0.22; // industry average
  const recovered = Math.round(stalled * recoveryRate);
  const revenue = recovered * avgOrderValue;
  return `~$${revenue.toLocaleString()}/mo`;
}
