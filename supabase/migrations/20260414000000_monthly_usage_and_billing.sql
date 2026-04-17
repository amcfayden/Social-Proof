-- Social Proof API: monthly usage windows + billing fields
-- Run after 20260413000000_init.sql

-- Extend api_keys with plan + monthly window + Stripe identifiers
alter table public.api_keys
  add column if not exists plan text,
  add column if not exists usage_period_start timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_subscription_id text;

-- Defaults + constraints (safe to re-run)
alter table public.api_keys
  alter column plan set default 'free',
  alter column usage_period_start set default date_trunc('month', now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'api_keys_plan_valid'
      and conrelid = 'public.api_keys'::regclass
  ) then
    alter table public.api_keys
      add constraint api_keys_plan_valid check (plan in ('free', 'pro'));
  end if;
end $$;

-- Backfill existing rows
update public.api_keys
set
  plan = coalesce(plan, 'free'),
  usage_period_start = coalesce(usage_period_start, date_trunc('month', now()))
where plan is null or usage_period_start is null;

create index if not exists api_keys_stripe_customer_id_idx on public.api_keys (stripe_customer_id);
create index if not exists api_keys_stripe_subscription_id_idx on public.api_keys (stripe_subscription_id);

-- Update consume_api_usage to reset usage monthly, then enforce and increment atomically.
create or replace function public.consume_api_usage (p_key_hash text, p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.api_keys%rowtype;
  v_period_start timestamptz := date_trunc('month', now());
begin
  if p_key_hash is null or length(trim(p_key_hash)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_key');
  end if;

  select *
  into v_row
  from public.api_keys
  where key_hash = p_key_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_key');
  end if;

  -- Monthly reset: if the stored period is missing or from a prior month, reset usage_used.
  if v_row.usage_period_start is null or v_row.usage_period_start < v_period_start then
    update public.api_keys
    set
      usage_period_start = v_period_start,
      requests_used = 0
    where id = v_row.id;

    -- Keep local copy in sync for the remainder of this function call.
    v_row.usage_period_start := v_period_start;
    v_row.requests_used := 0;
  end if;

  if v_row.requests_used >= v_row.requests_limit then
    return jsonb_build_object('ok', false, 'error', 'limit_exceeded');
  end if;

  update public.api_keys
  set requests_used = requests_used + 1
  where id = v_row.id;

  insert into public.usage_logs (api_key_id, endpoint)
  values (v_row.id, p_endpoint);

  return jsonb_build_object(
    'ok', true,
    'api_key_id', v_row.id,
    'plan', coalesce(v_row.plan, 'free'),
    'usage_period_start', v_row.usage_period_start
  );
end;
$$;

-- Re-assert function privileges (safe to re-run)
revoke all on function public.consume_api_usage (text, text) from public;
revoke all on function public.consume_api_usage (text, text) from anon;
revoke all on function public.consume_api_usage (text, text) from authenticated;
grant execute on function public.consume_api_usage (text, text) to service_role;

comment on function public.consume_api_usage (text, text) is
  'Validates API key hash, resets requests_used monthly, rejects if over limit, increments requests_used, inserts usage_logs. Call only from trusted server (service role).';

