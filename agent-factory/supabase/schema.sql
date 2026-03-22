-- Agent Factory — Database Schema
-- Designed for extensibility: new verticals, signals, and agent types
-- are additive — never require schema changes to existing tables.

-- ============================================================
-- CUSTOMERS (businesses that install the script)
-- ============================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  api_key text unique not null default gen_random_uuid()::text,
  -- Business context (hardcoded for MVP, populated via onboarding quiz later)
  vertical text not null default 'ecommerce',       -- ecommerce | saas | marketplace | fintech
  primary_goal text not null default 'purchase',    -- purchase | signup | activate | apply
  site_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PATTERN SIGNALS (anonymous aggregated behavioral patterns)
-- Never stores individual user behavior or PII.
-- Each row = one observed pattern cluster from one customer's site.
-- ============================================================
create table if not exists pattern_signals (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,

  -- Pattern identity
  pattern_key text not null,        -- e.g. "checkout_payment_idle"
  vertical text not null,           -- inherited from customer context
  workflow text not null,           -- e.g. "checkout", "onboarding", "search"

  -- Worthiness signals (the 5-factor score)
  frequency numeric not null,       -- 0.0–1.0, % of sessions matching this path
  consistency numeric not null,     -- 0.0–1.0, inverse of step variance
  depth int not null,               -- number of steps in the pattern
  friction numeric not null,        -- 0.0–1.0, % that abandon at the key step
  recurrence numeric not null,      -- avg times same hashed user hits this pattern

  -- Computed score
  worthiness_score numeric generated always as (
    frequency * consistency * (depth::numeric / 10) * friction * recurrence
  ) stored,

  -- Human-readable context
  inferred_intent text,             -- e.g. "User is trying to: complete purchase"
  friction_type text,               -- "process" | "decision" | "contextual"
  drop_off_step text,               -- which step users abandon at
  avg_time_at_step_seconds int,

  -- Extensible metadata for future signals
  metadata jsonb not null default '{}',

  -- Seeded vs real
  is_seeded boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AGENT CONFIGS (activated agent definitions per customer)
-- The config that the widget fetches to know how to behave.
-- JSON schema designed for extensibility: new verticals = new rows.
-- ============================================================
create table if not exists agent_configs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  pattern_signal_id uuid references pattern_signals(id),

  -- Agent identity
  name text not null,               -- e.g. "Checkout Recovery Agent"
  vertical text not null,
  workflow text not null,

  -- Trigger definition (what causes the widget to activate)
  trigger_condition jsonb not null,
  -- e.g. { "type": "idle", "page_pattern": "/checkout/payment", "seconds": 60 }
  -- or   { "type": "back_navigation", "from": "/checkout/payment", "count": 2 }

  -- Agent behavior (what Claude is instructed to do)
  system_prompt text not null,
  friction_type text not null,      -- "process" | "decision"

  -- Allowed actions (enforced at runtime — Claude cannot exceed this list)
  allowed_actions jsonb not null default '[]',
  -- e.g. ["fill_field", "click_button", "select_option"]

  -- Confirmation copy
  confirmation_title text,          -- e.g. "Here's what I'll do"
  confirmation_cta text,            -- e.g. "Confirm & Complete Order"
  dismiss_label text,               -- e.g. "Not now"

  -- Status
  status text not null default 'draft',   -- draft | live | paused
  deployed_at timestamptz,

  -- Template versioning (for future network-effects upgrades)
  template_version text not null default 'v1',

  -- Extensible metadata
  metadata jsonb not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AGENT INTERACTIONS (runtime feedback loop)
-- Every agent activation is logged for calibration.
-- No PII stored — hashed session ID only.
-- ============================================================
create table if not exists agent_interactions (
  id uuid primary key default gen_random_uuid(),
  agent_config_id uuid not null references agent_configs(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,

  -- Anonymous session (hashed, non-reversible)
  hashed_session_id text not null,

  -- Interaction outcome
  outcome text not null,            -- "confirmed" | "rejected" | "dismissed" | "corrected"
  friction_type text,               -- what the system classified this as
  was_friction_correct boolean,     -- did the user's outcome match the classification?

  -- Page context at activation time (no PII)
  page_url text,
  idle_seconds int,

  -- For calibration
  user_correction_text text,        -- if user corrected the agent, what did they say?

  -- Extensible
  metadata jsonb not null default '{}',

  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists pattern_signals_customer_id on pattern_signals(customer_id);
create index if not exists pattern_signals_worthiness on pattern_signals(worthiness_score desc);
create index if not exists agent_configs_customer_id on agent_configs(customer_id);
create index if not exists agent_configs_status on agent_configs(status);
create index if not exists agent_interactions_agent_config_id on agent_interactions(agent_config_id);

-- ============================================================
-- SEED DATA — demo e-commerce customer + patterns
-- ============================================================
insert into customers (id, name, api_key, vertical, primary_goal, site_url)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sole Society (Demo)',
  'demo-store-001',
  'ecommerce',
  'purchase',
  'http://localhost:3001'
) on conflict (id) do nothing;

-- Pattern 1: Checkout payment abandonment (HIGH confidence — the showcase agent)
insert into pattern_signals (
  id, customer_id, pattern_key, vertical, workflow,
  frequency, consistency, depth, friction, recurrence,
  inferred_intent, friction_type, drop_off_step, avg_time_at_step_seconds,
  is_seeded
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'checkout_payment_idle', 'ecommerce', 'checkout',
  0.67, 0.82, 4, 0.71, 2.3,
  'User is trying to: complete purchase',
  'process',
  '/checkout/payment',
  87,
  true
) on conflict (id) do nothing;

-- Pattern 2: Product page hesitation (MEDIUM confidence — decision friction)
insert into pattern_signals (
  id, customer_id, pattern_key, vertical, workflow,
  frequency, consistency, depth, friction, recurrence,
  inferred_intent, friction_type, drop_off_step, avg_time_at_step_seconds,
  is_seeded
) values (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'product_return_visit', 'ecommerce', 'product_consideration',
  0.41, 0.58, 3, 0.49, 3.1,
  'User is trying to: decide on a product (returning visitor)',
  'decision',
  '/product',
  142,
  true
) on conflict (id) do nothing;

-- Pattern 3: Cart edit loop (LOW confidence — not yet agent-ready, shown grayed out)
insert into pattern_signals (
  id, customer_id, pattern_key, vertical, workflow,
  frequency, consistency, depth, friction, recurrence,
  inferred_intent, friction_type, drop_off_step, avg_time_at_step_seconds,
  is_seeded
) values (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'cart_quantity_loop', 'ecommerce', 'cart_management',
  0.22, 0.31, 2, 0.28, 1.4,
  'User is trying to: adjust cart contents',
  'decision',
  '/cart',
  45,
  true
) on conflict (id) do nothing;
