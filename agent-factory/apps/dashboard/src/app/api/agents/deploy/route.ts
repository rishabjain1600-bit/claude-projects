import { NextRequest, NextResponse } from 'next/server';
import { deployedAgents, pushObserverEvent } from '@/lib/agent-store';
import type { AgentConfig } from '@/lib/types';

const CHECKOUT_RECOVERY_CONFIG: AgentConfig = {
  id: '20000000-0000-0000-0000-000000000001',
  customerId: '00000000-0000-0000-0000-000000000001',
  patternSignalId: '10000000-0000-0000-0000-000000000001',
  name: 'Checkout Recovery Agent',
  vertical: 'ecommerce',
  workflow: 'checkout',
  frictionType: 'process',
  triggerCondition: {
    type: 'idle',
    pagePattern: '/checkout',
    seconds: 60,
  },
  systemPrompt: `You are a helpful checkout assistant for Sole Society, a sneaker store.
A customer has been idle on the payment step. Your goal is to help them complete their purchase — but only if they genuinely want to.

The page shows the customer's saved payment method and shipping address. Read the page context carefully.

Your approach:
1. Greet warmly and show you understand they're trying to complete their order
2. Offer to help — make it clear they're in control
3. Before taking ANY action, tell them EXACTLY what you'll do: which saved card, address, total
4. Always show the full total before confirming
5. If they seem hesitant about the PRODUCT (not just the payment), switch to information mode

Rules:
- Never fill in card numbers — only reference saved payment methods shown on the page
- Always get explicit confirmation before submitting
- Keep responses short and conversational`,
  allowedActions: ['fill_field', 'click_button', 'select_option'],
  confirmationTitle: "Here's what I'll do",
  confirmationCta: 'Confirm & Complete Order',
  dismissLabel: 'Not now',
  status: 'live',
  deployedAt: new Date().toISOString(),
  templateVersion: 'v1',
  metadata: {},
};

const PRODUCT_INFO_CONFIG: AgentConfig = {
  id: '20000000-0000-0000-0000-000000000002',
  customerId: '00000000-0000-0000-0000-000000000001',
  patternSignalId: '10000000-0000-0000-0000-000000000002',
  name: 'Product Decision Support Agent',
  vertical: 'ecommerce',
  workflow: 'product_consideration',
  frictionType: 'decision',
  triggerCondition: {
    type: 'return_visit',
    pagePattern: '/product',
    minVisits: 2,
  },
  systemPrompt: `You are a helpful product advisor for Sole Society, a sneaker store.
A customer has returned to view this product multiple times — they're interested but hesitating.

Your role is to help them DECIDE, not to push them to buy.
- Answer sizing questions accurately
- Explain the return policy if asked
- Check size availability if relevant
- Be honest if you don't know something
- NEVER push checkout — let the customer decide when they're ready`,
  allowedActions: ['scroll'],
  confirmationTitle: "I'll look that up",
  confirmationCta: 'Yes, check it',
  dismissLabel: 'Thanks, I got it',
  status: 'live',
  deployedAt: new Date().toISOString(),
  templateVersion: 'v1',
  metadata: {},
};

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  '10000000-0000-0000-0000-000000000001': CHECKOUT_RECOVERY_CONFIG,
  '10000000-0000-0000-0000-000000000002': PRODUCT_INFO_CONFIG,
};

export async function POST(req: NextRequest) {
  const { patternId, customerKey } = await req.json();

  if (!patternId || !customerKey) {
    return NextResponse.json({ error: 'Missing patternId or customerKey' }, { status: 400 });
  }

  const agentConfig = AGENT_CONFIGS[patternId];
  if (!agentConfig) {
    return NextResponse.json({ error: 'No agent template for this pattern' }, { status: 404 });
  }

  const deployed = { ...agentConfig, status: 'live' as const, deployedAt: new Date().toISOString() };
  const existing = deployedAgents.get(customerKey) || [];
  const updated = existing.filter(a => a.id !== deployed.id);
  updated.push(deployed);
  deployedAgents.set(customerKey, updated);

  pushObserverEvent(customerKey, {
    type: 'agent_activated',
    timestamp: Date.now(),
    sessionId: 'dashboard',
    message: `Agent deployed: ${deployed.name}`,
    detail: `  Status: LIVE\n  Trigger: ${JSON.stringify(deployed.triggerCondition)}`,
    severity: 'action',
  });

  return NextResponse.json({ ok: true, agent: deployed });
}
