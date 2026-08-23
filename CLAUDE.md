# Blatant Engagement — Claude Code Instructions

## Project
$500–$750 single-page websites for small businesses. blatantengagement.com. Netlify + Supabase + Stripe.

## Stack
Static HTML/CSS/JS · Netlify (hosting + functions) · Supabase (leads/clients/portal) · Stripe (deposits/invoices) · Resend (email) · Telegram (notifications)

## Key Files
- `index.html` — landing page
- `template/index.html` — reusable client site template
- `admin/index.html` — Brad login (magic link)
- `admin/pipeline/index.html` — kanban board (11 cols, drag+drop, Approve Lead modal)
- `onboarding/index.html` — public intake form
- `client/index.html` — client portal (agreement → Stripe → collateral → status)
- `netlify/functions/` — all backend logic (13 functions)
- `_claude/client-checklist.md` — build workflow
- `_claude/frontend-design-guide.md` — design system (Plus Jakarta Sans, warm browns, orange)
- `CLAUDE.md.archive` — full historical context (read if you need schema/DNS/sprint detail)

## Rules
- NEVER deploy without Brad saying "deploy" or "push it live"
- NEVER use service_role key in frontend — anon key only
- Read `CLAUDE.md.archive` if you need schema, DNS records, env vars, or sprint history
- Check TODO below before starting any work

## Environment
- Windows 10, Claude Code + Desktop Commander
- Netlify team: `specificbrad` · Site ID: `03ef082f-f63c-4065-a81e-5fdda08f805e`
- Supabase project: `tnytkvmfswpupxtlnaad`
- GA4: `G-4P2YQ68SXT`

## Current TODO
1. Set `STRIPE_WEBHOOK_SECRET` in Netlify env vars (Stripe dashboard → Webhooks → copy secret)
2. Add `https://blatantengagement.com/client/*` to Supabase Auth redirect URLs
3. End-to-end test: contact form → pipeline → Approve Lead → portal → Stripe → collateral
4. Update `_dmarc` TXT to `p=quarantine; rua=mailto:hello@blatantengagement.com`
5. Show error on `/admin` for expired/used magic links
6. Drop `client_contacts` table in Supabase SQL editor
7. Post on Facebook Marketplace (see facebook-posts.md)
8. Add `privacy.html` and `terms.html` to main blatant repo and deploy (files in Downloads, need Termly consent banner + footer links wired)
9. Add Termly consent banner script to main `index.html`

## AI Consulting Site (ai.blatantengagement.com)
- **Working file:** `C:/Users/brad/Downloads/ai-blatant-stability-style_11.html`
- **Deploy folder:** `C:/Users/brad/Downloads/ai-deploy/`
- **Netlify site ID:** `93450cc9-25d1-4d20-8f75-bfeb6ad8b458`
- **GA4:** `G-VYHD7L5CX9` · **GTM:** `GTM-T7N9MF6F`
- **TODO:** Test contact form → confirm Telegram ping live on ai.blatantengagement.com
- **TODO:** Create `terms.html` (have Termly T&C template at `C:/Users/brad/Downloads/terms_and_conditions.txt`)
- **TODO:** Wire footer "Consent Preferences" Termly link
- **TODO:** Contact form popup modals for tools section (next iteration)
- **TODO:** Add GA4 property for ai.blatant in GTM container (property created, tag `G-VYHD7L5CX9` in head)

## Blocked
- Full Stripe flow blocked until `STRIPE_WEBHOOK_SECRET` set

## Commands
/plan · /code-review · /learn · /learn-eval

## Skills
frontend-patterns (auto-loads for HTML/CSS/JS work)
