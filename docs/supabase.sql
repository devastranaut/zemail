-- Run this in Supabase SQL editor.
-- It creates per-user MCP keys and encrypted Google OAuth storage.

create extension if not exists pgcrypto;

create table if not exists public.mcp_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists mcp_api_keys_user_id_idx on public.mcp_api_keys(user_id);

create table if not exists public.user_google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token_encrypted text not null,
  updated_at timestamptz not null default now()
);

alter table public.mcp_api_keys enable row level security;
alter table public.user_google_connections enable row level security;

drop policy if exists "Users can manage their own API keys" on public.mcp_api_keys;
create policy "Users can manage their own API keys"
on public.mcp_api_keys
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own Google connection" on public.user_google_connections;
create policy "Users can manage their own Google connection"
on public.user_google_connections
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
