import { NextRequest, NextResponse } from 'next/server';
import { pushObserverEvent } from '@/lib/agent-store';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerKey, ...eventData } = body;

  if (!customerKey) {
    return NextResponse.json({ error: 'Missing customerKey' }, { status: 400 });
  }

  const event = {
    ...eventData,
    timestamp: Date.now(),
    message: buildMessage(eventData),
    detail: buildDetail(eventData),
    severity: buildSeverity(eventData.type as string),
  };

  pushObserverEvent(customerKey, event);

  return NextResponse.json({ ok: true }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function trunc(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max - 3) + '...' : text;
}

function buildMessage(data: Record<string, unknown>): string {
  switch (data.type) {

    // ── Journey events ────────────────────────────────────────────────────
    case 'session_start':
      return `Session started — ${data.pageUrl}`;

    case 'page_view': {
      const path = String(data.pageUrl || '');
      if (path === '/') return 'Browsing: Home — product catalogue';
      if (path.startsWith('/product')) {
        const name  = data.productName  ? `${data.productName} ($${data.productPrice})` : 'product page';
        const brand = data.productBrand ? ` — ${data.productBrand}` : '';
        return `Viewing: ${name}${brand}`;
      }
      if (path === '/cart')     return 'Cart page — reviewing order';
      if (path === '/checkout') return 'Checkout started';
      if (path === '/order-confirmation') return 'Order placed — confirmation page';
      return `Page: ${path}`;
    }

    case 'size_select':
      return `Size selected: ${data.size}${data.product ? ` (${data.product})` : ''} — purchase intent rising`;

    case 'cart_add':
      return `Added to cart${data.product ? `: ${data.product}` : ''} — purchase intent: HIGH`;

    case 'cart_edit':
      return 'Cart edited ← hesitation signal';

    case 'checkout_step': {
      const step = String(data.step || '');
      return step === 'payment'
        ? 'Reached payment step — shipping done, card on file'
        : `Checkout: ${step} step`;
    }

    case 'idle_warning': {
      const secs      = Number(data.seconds || 0);
      const threshold = Number(data.threshold || 60);
      const pct       = Math.min(100, Math.round((secs / threshold) * 100));
      const filled    = Math.floor(pct / 10);
      const bar       = '█'.repeat(filled) + '░'.repeat(10 - filled);
      return `Idle: ${secs}s  [${bar}] ${pct}% of threshold`;
    }

    // ── Agent decision events ─────────────────────────────────────────────
    case 'pattern_match':
      return 'Pattern matched: checkout_payment_idle — confidence: HIGH';

    case 'friction_classified':
      return `Friction: ${String(data.frictionType || '').toUpperCase()} — customer is reconsidering, not stuck`;

    case 'agent_activated':
      return `Activating agent — will open with sizing/product offer`;

    // ── Conversation events ───────────────────────────────────────────────
    case 'agent_plan':
      return 'Agent reasoning';

    case 'customer_message':
      return `Customer: "${trunc(String(data.text || ''))}"`;

    case 'agent_response':
      return `Agent: "${trunc(String(data.text || ''))}"`;

    // ── Tool use events ───────────────────────────────────────────────────
    case 'tool_call':
      return String(data.message || `Agent calling tool`);

    case 'tool_result':
      return String(data.message || `Tool returned result`);

    // ── Raw page interactions (DOM-derived, not pre-scripted) ─────────────
    case 'user_click':
      return `Clicked: "${trunc(String(data.elementText || ''), 80)}"`;

    case 'user_select':
      return `Selected: "${trunc(String(data.elementText || ''), 60)}"`;

    case 'field_focus':
      return `Typing in: ${data.label}`;

    // ── Action events ─────────────────────────────────────────────────────
    case 'cart_step':
      return String(data.message || 'Cart action in progress...');

    case 'cart_updated': {
      const from = data.oldSize ? `size ${data.oldSize}` : 'old size';
      const to   = data.newSize ? `size ${data.newSize}` : 'new size';
      return `Cart updated: ${from} → ${to}`;
    }

    case 'agent_confirmed': {
      const action = String(data.confirmedAction || '');
      if (action === 'update_cart_size') {
        return `Customer confirmed: swap to size ${data.newSize || '?'}`;
      }
      return 'Customer confirmed: fill in payment details';
    }

    case 'agent_rejected':
      return 'Customer dismissed agent';

    case 'task_complete':
      return 'Payment details pre-filled — customer clicking Place Order';

    default:
      return String(data.type || 'event');
  }
}

function buildDetail(data: Record<string, unknown>): string | undefined {
  switch (data.type) {
    case 'page_view': {
      const path = String(data.pageUrl || '');
      if (path.startsWith('/product') && data.productName) {
        return `  Brand: ${data.productBrand || '—'}\n  Price: $${data.productPrice || '—'}`;
      }
      return undefined;
    }

    case 'checkout_step': {
      const ctx  = data.sessionContext as Record<string, string> | undefined;
      const step = String(data.step || '');
      if (step === 'payment' && ctx?.productName) {
        return `  Product: ${ctx.productName} ($${ctx.productPrice})\n  Size in cart: ${ctx.selectedSize || '—'}\n  Watching for idle / friction signal`;
      }
      return undefined;
    }

    case 'idle_warning': {
      const secs = Number(data.seconds || 0);
      const step = String(data.checkoutStep || 'payment');
      if (secs >= 5) {
        return `  Step: ${step}\n  No form interaction detected\n  Watching: checkout_payment_idle pattern`;
      }
      return undefined;
    }

    case 'pattern_match': {
      const ctx = data.sessionContext as Record<string, string> | undefined;
      const lines = [
        `  Coverage: ${Math.round(((data.coverage as number) || 0.67) * 100)}% of sessions`,
        `  Confidence: HIGH`,
      ];
      if (ctx?.productName) lines.push(`  Product: ${ctx.productName} (size ${ctx.selectedSize || '?'})`);
      lines.push(`  Inferred intent: complete purchase — hesitating`);
      return lines.join('\n');
    }

    case 'friction_classified':
      return '  Signals: idle at payment, no back navigation\n  Mode: help customer feel confident, not push sale';

    case 'agent_activated':
      return `  Trigger: idle > ${data.triggerSeconds || 10}s at checkout\n  Opening: offer sizing help, answer questions`;

    case 'agent_response': {
      const text = String(data.text || '');
      if (text.length > 120) {
        return `  Full response:\n  "${text}"`;
      }
      return undefined;
    }

    case 'cart_updated':
      return `  sessionStorage updated\n  Checkout page re-reads cart reactively`;

    case 'tool_call':
      return data.detail ? String(data.detail) : undefined;

    case 'tool_result':
      return data.detail ? String(data.detail) : undefined;

    default:
      return undefined;
  }
}

function buildSeverity(type: string): 'info' | 'warning' | 'success' | 'action' {
  if (['agent_confirmed', 'task_complete', 'cart_updated'].includes(type)) return 'success';
  if (['agent_activated', 'pattern_match', 'friction_classified', 'tool_call'].includes(type)) return 'action';
  if (['idle_warning', 'cart_edit'].includes(type)) return 'warning';
  return 'info';
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
