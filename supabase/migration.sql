-- Blatant Engagement — Supabase Migration
-- Run this in your Supabase SQL Editor

-- ─── SPRINT 4 COLUMNS ───────────────────────────────────────────
-- Add missing columns to clients table (from Sprint 1 spec)
alter table clients add column if not exists notes       text;
alter table clients add column if not exists preview_url text;
alter table clients add column if not exists live_url    text;

-- ─── PORTAL TOKEN RLS ADDITIONS ─────────────────────────────────
-- Run these once to allow the client portal to update its own record
-- and insert discovery responses + files.

-- Allow client to update own record via portal_token (for collateral submit)
create policy "portal_update_own_client"
  on clients for update
  to anon
  using (portal_token::text = current_setting('request.headers', true)::json->>'x-portal-token')
  with check (portal_token::text = current_setting('request.headers', true)::json->>'x-portal-token');

-- Allow client to insert discovery responses
create policy "portal_insert_own_discovery"
  on discovery_responses for insert
  to anon
  with check (
    client_id in (
      select id from clients
      where portal_token::text = current_setting('request.headers', true)::json->>'x-portal-token'
    )
  );

-- Storage: allow portal token holders to upload to their own folder
-- Run in Supabase dashboard → Storage → Policies → client-assets
-- INSERT policy:
--   ( (storage.foldername(name))[1] = auth.uid()::text )
-- NOTE: since portal users are not Supabase Auth users, set bucket to
-- public=false and use a service-role upload via a Netlify function instead.
-- See submit-collateral.js for the recommended approach.

-- ─── LEADS TABLE ───────────────────────────────────────────────
-- Captures contact form submissions from blatantengagement.com
create table if not exists leads (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  name          text not null,
  business_name text not null,
  email         text not null,
  phone         text,
  message       text,
  source        text default 'blatant-engagement-site',
  status        text default 'new'  -- new | contacted | booked | closed
);

-- RLS: Allow anonymous inserts (public form), deny reads (protect client data)
alter table leads enable row level security;

create policy "Allow anonymous insert"
  on leads for insert
  to anon
  with check (true);

-- Only authenticated users (you) can read leads
create policy "Allow authenticated read"
  on leads for select
  to authenticated
  using (true);


-- ─── CLIENT CONTACTS TABLE ─────────────────────────────────────
-- Captures contact form submissions from individual client sites
create table if not exists client_contacts (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null,
  email      text not null,
  phone      text,
  message    text,
  source     text  -- slug identifying which client site (e.g. 'aplus-auto')
);

alter table client_contacts enable row level security;

create policy "Allow anonymous insert on client_contacts"
  on client_contacts for insert
  to anon
  with check (true);

create policy "Allow authenticated read on client_contacts"
  on client_contacts for select
  to authenticated
  using (true);
