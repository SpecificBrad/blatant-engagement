# Blatant Engagement — Claude Code Instructions

## Project Summary
Service landing page for Blatant Engagement (blatantengagement.com). Sells single-page websites to small businesses at $500–$750. Built and maintained by Brad Bastow. Deployed on Netlify. Forms submit to Supabase `leads` table.

## Stack
- Static HTML/CSS/JS (single `index.html`)
- Netlify (hosting + deploy)
- Supabase (form submissions)
- Hostinger (domain registrar — blatantengagement.com)

## Key Files
- `index.html` — the landing page
- `template/index.html` — reusable client site template
- `admin/index.html` — Brad-only login (magic link → redirects to /admin/pipeline/)
- `admin/pipeline/index.html` — kanban pipeline board (11 columns, drag & drop, Approve Lead modal)
- `onboarding/index.html` — public client intake form (submits to onboarding.js)
- `client/index.html` — client portal (agreement → Stripe deposit → collateral upload → confirmation)
- `facebook-posts.md` — Facebook Marketplace post copy
- `_claude/client-checklist.md` — new client build workflow + intake questionnaire
- `_claude/frontend-design-guide.md` — design system spec (Plus Jakarta Sans, warm browns, orange accent)
- `netlify.toml` — Netlify build config (functions, redirects for /admin, /admin/pipeline, /onboarding, /client)
- `netlify/functions/new-lead.js` — webhook handler: Telegram ping + Claude reply via Resend
- `netlify/functions/approve-lead.js` — admin JWT-gated: creates client + agreement + sends magic link to client
- `netlify/functions/agree-agreement.js` — portal token gated: marks agreement agreed, creates Stripe Checkout session
- `netlify/functions/decline-agreement.js` — portal token gated: marks declined, Telegram ping to Brad
- `netlify/functions/stripe-webhook.js` — handles checkout.session.completed → sets deposit_paid_at, moves to deposit_paid
- `netlify/functions/onboarding.js` — public (no auth): creates client with status 'lead' from public form
- `netlify/functions/create-client.js` — legacy admin function (superseded by approve-lead.js)
- `robots.txt` — AI crawler permissions (GPTBot, ClaudeBot, etc.)
- `.well-known/ai-plugin.json` — ChatGPT plugin discovery
- `api/openapi.json` — OpenAPI 3.1 spec for leads endpoint

## Environment Notes
- Windows 10, Claude Code via Desktop Commander
- Netlify CLI available — `netlify deploy --prod` requires site to be linked first (`netlify link`)
- Netlify team slug: `specificbrad` (NOT brad-bastow)
- Netlify site ID: `03ef082f-f63c-4065-a81e-5fdda08f805e`
- Netlify DNS zone ID: `69b5b4647a8bf7ccfa812631`
- gh CLI may need PATH fix
- **NEVER deploy to Netlify without explicit instruction from Brad**
- **Netlify credits are limited — one deploy per session max, only when requested**
- `netlify dns:create` does NOT exist as a CLI command — use `netlify api createDnsRecord` or do it manually via the UI
- `netlify api createDnsRecord` with zone_id returns `Unprocessable Entity` — DNS records must be added manually via app.netlify.com UI

## Google Analytics
- GA4 Measurement ID: `G-4P2YQ68SXT`
- Added to `index.html` (Blatant Engagement landing page)
- Template (`template/index.html`) has GA placeholder `G-XXXXXXXXXX` — swap with client's own GA4 ID on each build

## Supabase
- Project: tnytkvmfswpupxtlnaad.supabase.co
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXRrdm1mc3dwdXB4dGxuYWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTEzMjIsImV4cCI6MjA4OTA4NzMyMn0.P6PLx5bpu5ep75snwermVglH1Y459fL6bLEj6o2tAYY
- Tables: `leads` (active), `client_contacts` (unused — safe to drop: `drop table client_contacts;`)
- Client portal tables: `clients`, `agreements`, `invoices`, `client_files`, `discovery_responses`, `activity_log`, `transactions`
- Storage bucket: `client-assets` (private, 10MB limit, images + PDF only)
- RLS: enabled on all portal tables — service_role full access, anon reads own rows via `x-portal-token` request header
- portal_token: auto-generated uuid on insert, passed as `x-portal-token` header in frontend requests
- WARNING: Do NOT use the service_role key — anon key only in frontend code

## Supabase Schema — clients table (current columns)
id, created_at, name, contact_name, email, phone, slug, portal_token, status, business_name, package, stage_updated_at, lead_id, price, stripe_customer_id, deposit_paid_at, dev_start_at, collateral_submitted_at, agreement_status

## Supabase Schema — agreements table (current columns)
id, created_at, client_id, title, content, status, signed_at, job_specifics (JSONB), declined_at

## Supabase Schema — leads table (current columns)
id, created_at, name, business_name, email, phone, message, source, status, client_id

## Client Pipeline Status Values (snake_case — must match pipeline COLUMNS array)
lead → contacted → quoted → agreement_sent → deposit_paid → in_progress → review → revision → final_payment → complete → lost

## RLS Policies (portal token)
- `portal_read_own_client` on clients FOR SELECT
- `portal_read_own_agreements` on agreements FOR SELECT
- `portal_insert_own_files` on client_files FOR INSERT
- All via: `portal_token::text = current_setting('request.headers', true)::json->>'x-portal-token'`

## Netlify Function — new-lead (2026-03-15)
- File: `netlify/functions/new-lead.js`
- Trigger: Supabase webhook POST on INSERT to `leads` table
- Actions: 1) Telegram notification to chat ID 6193238817, 2) Claude API reply → Resend email to lead
- Env vars set in Netlify: `TELEGRAM_BOT_TOKEN`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY` ✓
- Resend domain verified ✓ — sends FROM hello@blatantengagement.com
- Zero npm dependencies — uses native fetch for all API calls

## Netlify Function — approve-lead (current primary admin function)
- File: `netlify/functions/approve-lead.js`
- Auth: requires Supabase JWT in Authorization header — verifies with Supabase, checks email matches ADMIN_EMAIL env var
- Actions: creates client record, creates agreement with job_specifics, links lead_id, logs activity, sends magic link to client
- Env vars needed: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`
- Returns: `{ success, client_id, portal_url }`
- Pipeline modal calls this when Brad clicks "Approve & Send Agreement"

## Netlify Function — agree-agreement
- File: `netlify/functions/agree-agreement.js`
- Auth: `x-portal-token` header (client portal)
- Actions: marks agreement agreed + signed_at, updates client agreement_status, creates Stripe Checkout session (50% deposit)
- Env vars needed: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`
- Returns: `{ checkout_url }` → client redirected to Stripe

## Netlify Function — decline-agreement
- File: `netlify/functions/decline-agreement.js`
- Auth: `x-portal-token` header (client portal)
- Actions: marks agreement declined, reverts client to `quoted`, sends Telegram notification to Brad
- Env vars needed: `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`

## Netlify Function — stripe-webhook
- File: `netlify/functions/stripe-webhook.js`
- Trigger: Stripe webhook on `checkout.session.completed`
- Actions: sets deposit_paid_at, moves client to `deposit_paid`, records transaction
- Env vars needed: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET` (add once configured)
- NOTE: Stripe webhook URL must be set in Stripe dashboard → Webhooks → blatantengagement.com/.netlify/functions/stripe-webhook

## Site Routes
- `/` — public landing page
- `/onboarding` → `onboarding/index.html` — public client intake form
- `/client/{portal_token}` → `client/index.html` — client portal (agreement → Stripe → collateral → done)
- `/admin` → `admin/index.html` — Brad-only magic link login
- `/admin/pipeline` → `admin/pipeline/index.html` — Brad-only kanban pipeline

## Admin Portal
- URL: blatantengagement.com/admin
- Auth: Supabase magic link → auto-redirects to /admin/pipeline/ on login
- REQUIRED SETUP in Supabase Auth → URL Configuration:
  - Site URL: https://blatantengagement.com
  - Redirect URLs: https://blatantengagement.com/admin AND https://blatantengagement.com/client/*

## Client Onboarding Flow
1. Lead submits form on index.html → `leads` table → Telegram + auto-email
2. Brad contacts lead, agrees on specs
3. Brad opens pipeline → "Approve & Send Agreement" modal → enters name/email/price/package/deliverables
4. `approve-lead.js` creates client + agreement + sends magic link email to client
5. Client clicks magic link → lands on `/client/{token}` → reviews agreement
6. Client agrees → `agree-agreement.js` → Stripe Checkout (50% deposit)
7. Stripe webhook confirms payment → client moves to `deposit_paid`
8. Client uploads brand collateral → `in_progress`, 7-day dev clock starts
9. Client declines → `decline-agreement.js` → Brad gets Telegram ping, card reverts to `quoted`

## DNS / Email (Completed 2026-03-14)
- Nameservers: dns1–dns4.p01.nsone.net (pointing to Netlify)
- Email hosted on Hostinger (hello@blatantengagement.com)
- All email DNS records added to Netlify DNS zone:
  - MX @ mx1.hostinger.com priority 5 TTL 14400
  - MX @ mx2.hostinger.com priority 10 TTL 14400
  - TXT @ v=spf1 include:_spf.mail.hostinger.com ~all TTL 3600
  - CNAME hostingermail-a._domainkey → hostingermail-a.dkim.mail.hostinger.com TTL 300
  - CNAME hostingermail-b._domainkey → hostingermail-b.dkim.mail.hostinger.com TTL 300
  - CNAME hostingermail-c._domainkey → hostingermail-c.dkim.mail.hostinger.com TTL 300
  - TXT _dmarc → v=DMARC1; p=none TTL 3600
- Hostinger confirmed all 4 checks green: MX ✓ SPF ✓ DKIM ✓ DMARC ✓

---

## Session Rules (ALWAYS FOLLOW)
1. At the START of every session, read this file completely before doing anything.
2. At the END of every session (or when context is getting long), update this file with:
   - What was completed
   - What's still blocked
   - Current TODO list in priority order
   - Any environment issues encountered and their fixes
3. NEVER start working without checking the current TODO list below.
4. If the TODO list is empty, ask Brad what to prioritize before writing any code.
5. Always maintain an active TodoWrite task list during any multi-step session.
6. Do NOT deploy to Netlify unless Brad explicitly says "deploy" or "push it live".

---

## Sprint Progress (see `_claude/sprints.md` for full detail)
- Sprint 1 ✅ DB schema — done (extra columns added beyond spec)
- Sprint 2 ✅ Create client + admin auth — done
- Sprint 3 ✅ Pipeline kanban — done (enhanced with Approve Lead flow)
- Sprint 4 ⬜ Client detail panel — NOT STARTED (slide-in panel, editable fields, file list, activity timeline)
- Sprint 5 ✅ Portal: agreement — done (magic link instead of password auth)
- Sprint 6 ✅ Portal: deposit — done (Stripe webhook needs Stripe config)
- Sprint 7 ✅ Portal: discovery + uploads — done (simplified to 3 fields vs 6-question form)
- Sprint 8 ⬜ Portal: status dashboard — NOT STARTED (progress bar, file list, invoice history)
- Sprint 9 ⬜ Admin nav + invoice tool — NOT STARTED
- Sprint 10 ⬜ Deploy + end-to-end test — blocked until Stripe env vars set

## Current TODO
1. **Deploy** — all local changes need a single deploy: onboarding flow, pipeline, client portal, approve-lead/agree/decline/stripe functions
2. **Netlify env vars** — add before deploy: `STRIPE_SECRET_KEY`, then update `ADMIN_EMAIL` → `goblackcar@gmail.com`
3. **Stripe webhook** — after deploy: set webhook URL in Stripe dashboard → `/.netlify/functions/stripe-webhook`, copy secret → add `STRIPE_WEBHOOK_SECRET` in Netlify, redeploy
4. **Supabase Auth redirect URLs** — add `https://blatantengagement.com/client/*` to allowed redirect URLs
5. **DMARC DNS update** — change `_dmarc` TXT from `p=none` to `p=quarantine; rua=mailto:hello@blatantengagement.com`
6. **Expired/used magic link message** — show clear error on `/admin` when link has been used/expired
7. **Drop `client_contacts`** — run `drop table client_contacts;` in Supabase SQL editor
8. **Post on Facebook Marketplace** — use facebook-posts.md templates

## Blocked
- None

## Supabase MCP Status
- MCP confirmed on correct project (tnytkvmfswpupxtlnaad) as of 2026-03-15 session
- Verified via list_tables: sees `leads` (3 rows), `clients`, `agreements`, `invoices`, `client_files`, `discovery_responses`, `activity_log`, `transactions`, `client_contacts`
- Root cause of past MCP issues: `claude_desktop_config.json` had wrong `--project-ref`. The `.mcp.json` files are IRRELEVANT — desktop config overrides them.
- If MCP connects to wrong project again, check `claude_desktop_config.json` FIRST (AppData/Roaming/Claude/ or similar)
- Portal tables confirmed created on correct project — all 7 present with RLS enabled

## Recently Completed (current session)
- Full client onboarding pipeline designed and built (lead → agreement → Stripe → collateral → in_progress)
- DB migration: added price, lead_id, stripe_customer_id, deposit_paid_at, dev_start_at, collateral_submitted_at, agreement_status to clients; job_specifics + declined_at to agreements; client_id to leads
- RLS portal-token policies added: portal_read_own_client, portal_read_own_agreements, portal_insert_own_files
- netlify/functions/approve-lead.js — admin function replacing create-client for pipeline ✓
- netlify/functions/agree-agreement.js — client portal agree → Stripe Checkout ✓
- netlify/functions/decline-agreement.js — client portal decline → Telegram ping ✓
- netlify/functions/stripe-webhook.js — deposit confirmed → deposit_paid status ✓
- client/index.html — full 4-step portal (agreement → payment → collateral → done) ✓
- admin/pipeline modal updated — "Approve & Send Agreement" with price + deliverables fields ✓
- netlify.toml — redirects added for /admin/pipeline, /onboarding, /client ✓
- Site structure finalised: /onboarding (public), /client/{token} (client), /admin (Brad login), /admin/pipeline (Brad kanban) ✓
- All statuses normalised to snake_case to match pipeline COLUMNS array ✓
- All changes local only — NOT deployed

## Previously Completed (2026-03-16)
- ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL all set in Netlify ✓
- Supabase webhook configured: INSERT on leads → POST to new-lead function ✓
- Full end-to-end pipeline tested ✓ — form → Supabase → webhook → Telegram + Claude email
- frontend-design-guide.md corrected to match actual site design ✓
- admin/index.html — login-only, redirects to /admin/pipeline/ on auth ✓
- admin/pipeline/index.html — full kanban board with drag & drop ✓

## Previously Completed (2026-03-15)
- Contact form JS bug fixed: form.elements['name'] vs form.name property conflict
- Form status display fixed: catch block now un-hides status element
- Contact form tested end-to-end ✓ — lead visible in Supabase leads table
- Form input colors fixed: white bg + dark text
- netlify/functions/new-lead.js built and deployed — Telegram + Claude + Resend pipeline
- TELEGRAM_BOT_TOKEN and RESEND_API_KEY set as Netlify env vars
- Resend domain blatantengagement.com verified ✓ (DNS records added to Netlify zone)
- Resend DNS records added: TXT resend._domainkey, MX send → amazonses, TXT send SPF
- .claude/launch.json created for local preview server (Python http.server port 3000)

## Previously Completed (2026-03-14)
- Landing page built, deployed, DNS cutover, email configured
- GA4 added (G-4P2YQ68SXT), Supabase wired, AI discoverability files added
- hello@blatantengagement.com all 4 Hostinger checks green ✓

## Known Mistakes / Lessons Learned
- **Netlify branch deploys wipe functions**: Deploying from a feature branch (e.g. `claude/build-corporate-website`) that doesn't include `netlify/functions/` will REMOVE all functions from production. The deploy summary will say "No functions deployed." Always verify the branch includes the functions directory before deploying, or deploy from main. If functions disappear, redeploy from main branch.
- **Supabase webhook payload**: The `supabase_functions.http_request` trigger function automatically includes row data as `{type, table, schema, record, old_record}` in the POST body. The `'{}'` parameter in the trigger definition is for extra static body content, not the row data. The function code correctly reads `body.record`.
- **Supabase webhook timeout**: The webhook has a 5000ms timeout. If the Netlify function takes longer (e.g. waiting for Claude API), the webhook marks it as timed out. The function may still complete, but Supabase won't wait for it.
- **Credential rotation process**: Telegram token rotated via @BotFather `/revoke` then select bot. New token must be updated in Netlify env vars (Site config → Environment variables → TELEGRAM_BOT_TOKEN), then site must be REDEPLOYED for the new value to take effect.
- **Opus context management**: Do NOT use Opus for iterative troubleshooting with many tool calls. Opus burns context fast. Use Opus for planning/prompts, route heavy troubleshooting to Claude Code or sidebar Sonnet.
- **DC/Chrome tools only in desktop app**: Claude in Chrome and Desktop Commander MCP tools are only available in the Claude desktop app, not in claude.ai web interface.
- **Netlify team slug**: Brad's team slug is `specificbrad`, NOT `brad-bastow`. Always navigate to app.netlify.com home first to confirm the slug.
- **Netlify DNS via CLI**: `netlify dns:create` does not exist. `netlify api createDnsRecord` returns Unprocessable Entity. DNS record additions must be done manually via the Netlify UI at app.netlify.com/teams/specificbrad/dns/blatantengagement.com
- **Auto-deploying without permission**: Claude deployed without being explicitly asked. Brad called this out. Rule is strict: NEVER deploy unless Brad says "deploy" or "push it live".
- **Supabase MCP wrong project**: MCP defaults to a different project (jnhkqbdabxcbjwqbvqkb). Fixed by adding `?project_id=tnytkvmfswpupxtlnaad` to the URL in `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/supabase/.mcp.json`. Requires Claude Code restart to take effect.
- **form.name JS conflict**: `HTMLFormElement.name` returns the form's own `name` attribute, not the input named "name". Use `form.elements['fieldname'].value` instead of `form.fieldname.value` for all form fields.
- **Service role key**: Brad accidentally pasted the service_role key. Caught before use. Only ever use the anon key in frontend code.
- **Chrome automation dropdown**: Netlify's record type dropdown in the "Add new record" modal is not reliably clickable via Chrome automation. Use manual entry or API instead.
- **Moving nameservers kills email**: When nameservers are moved to Netlify, ALL DNS (including MX/SPF/DKIM/DMARC) must be re-added in Netlify's DNS panel. Hostinger email stops working until this is done.

---

## Skills Available (auto-load from .claude/skills/)
| Skill | When It Activates |
|---|---|
| `frontend-patterns` | Building or editing HTML/CSS/JS, client site template work |

## Commands Available (use in Claude Code chat)
| Command | What It Does |
|---|---|
| `/plan` | Restate requirements → risks → steps → wait for confirmation. Use before any layout or template changes. |
| `/code-review` | Quality review of recent changes before deploying. |
| `/learn` | After solving something non-trivial — extracts the pattern and saves it as a reusable skill. |
| `/learn-eval` | Like /learn but with quality gate: checks for duplicates, decides global vs project scope, then Save / Improve / Absorb / Drop. Prefer this. |

## Agents Available
| Agent | Model | When It's Used |
|---|---|---|
| `code-reviewer` | Sonnet | Reviews changes for quality issues, missing error handling, console.logs left in, hardcoded values |
