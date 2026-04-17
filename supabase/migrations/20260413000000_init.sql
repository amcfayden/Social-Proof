-- Social Proof API: api_keys + usage_logs + atomic usage RPC
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- API key storage (must match Next.js lib/auth/apiKey.ts — hashApiKey)
--
-- When minting a key for insert into api_keys:
--   1. Choose a raw secret string (e.g. cryptographically random). Never store it in the DB.
--   2. Let pepper = the value of env API_KEY_HASH_PEPPER on the Vercel app.
--      If that env var is unset or empty, pepper is the empty string "".
--   3. Compute message = pepper concatenated with the raw secret (UTF-8 string, no delimiter).
--   4. key_hash = SHA-256(message) as a lowercase hexadecimal string (64 hex chars for SHA-256).
--   5. key_prefix (optional): first few characters of the raw secret for support / dashboards only.
--
-- The API sends the raw secret in the x-api-key header; the server hashes it the same way and
-- compares to key_hash via consume_api_usage.
-- ---------------------------------------------------------------------------

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  key_prefix text,
  email text,
  created_at timestamptz not null default now(),
  requests_used bigint not null default 0,
  requests_limit bigint not null,
  constraint api_keys_requests_used_non_negative check (requests_used >= 0),
  constraint api_keys_requests_limit_non_negative check (requests_limit >= 0)
);

create index if not exists api_keys_email_idx on public.api_keys (email);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references public.api_keys (id) on delete cascade,
  endpoint text not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_api_key_id_created_at_idx
  on public.usage_logs (api_key_id, created_at desc);

create index if not exists usage_logs_endpoint_idx on public.usage_logs (endpoint);

alter table public.api_keys enable row level security;
alter table public.usage_logs enable row level security;

-- Table privileges: only service_role may access these tables via the Supabase API.
-- (PostgREST uses anon/authenticated; without grants they cannot read/write regardless of RLS.)
revoke all on table public.api_keys from public;
revoke all on table public.api_keys from anon;
revoke all on table public.api_keys from authenticated;
grant select, insert, update, delete on table public.api_keys to service_role;

revoke all on table public.usage_logs from public;
revoke all on table public.usage_logs from anon;
revoke all on table public.usage_logs from authenticated;
grant select, insert, update, delete on table public.usage_logs to service_role;

-- RLS: no policies for anon/authenticated => all row access denied for those roles.
-- Explicit policies for service_role (full read/write). Note: on Supabase, service_role also
-- bypasses RLS when using the service key; these policies document intent and stay correct if
-- you ever rely on RLS without bypass.
create policy api_keys_service_role_all
  on public.api_keys
  for all
  to service_role
  using (true)
  with check (true);

create policy usage_logs_service_role_all
  on public.usage_logs
  for all
  to service_role
  using (true)
  with check (true);

-- Atomically validate key, enforce limit, increment usage, and log the request.
create or replace function public.consume_api_usage (p_key_hash text, p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.api_keys%rowtype;
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
    'api_key_id', v_row.id
  );
end;
$$;

revoke all on function public.consume_api_usage (text, text) from public;
revoke all on function public.consume_api_usage (text, text) from anon;
revoke all on function public.consume_api_usage (text, text) from authenticated;
grant execute on function public.consume_api_usage (text, text) to service_role;

comment on function public.consume_api_usage (text, text) is
  'Validates API key hash, rejects if over limit, increments requests_used, inserts usage_logs. Call only from trusted server (service role).';
