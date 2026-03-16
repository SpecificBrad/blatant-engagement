# Blatant Engagement — Sprint Plan

_Saved from be-sprints.pdf — approximately 2 days old as of current session_

---

## Sprint 1: Database only ✅ COMPLETE (with variations)
Add these tables to Supabase. SQL only, no frontend.

**Tables:**
- `clients` (id uuid, name, business_name, email, phone, package text, portal_token text unique, status text default 'lead', lost_reason text, created_at, updated_at, deposit_paid_at, delivery_due_at, completed_at, preview_url text, live_url text, notes text)
- `agreements` (id uuid, client_id uuid FK, signed_at, signer_ip text, signer_name text, agreement_version text)
- `invoices` (id uuid, client_id uuid FK, amount decimal, type text, description text, stripe_checkout_session_id text, status text default 'pending', paid_at, created_at)
- `client_files` (id uuid, client_id uuid FK, file_name text, file_url text, file_type text, uploaded_at)
- `discovery_responses` (id uuid, client_id uuid FK, question_key text, answer text, answered_at)
- `activity_log` (id uuid, client_id uuid nullable FK, event_type text, description text, created_at)
- `transactions` (id uuid, client_id uuid FK, invoice_id uuid nullable FK, type text, amount decimal, currency text default 'CAD', description text, category text, payment_method text, stripe_payment_intent_id text, tax_amount decimal, notes text, transaction_date, created_at)

**Storage:** Supabase Storage bucket "client-assets"
**RLS:** admin full access, clients read own records via portal_token

**Deviations built:** Schema has additional columns (price, lead_id, stripe_customer_id, dev_start_at, collateral_submitted_at, agreement_status, stage_updated_at). agreements table has job_specifics JSONB + declined_at. Leads table has client_id FK. Core structure matches.

---

## Sprint 2: Create client function + admin auth ✅ COMPLETE
Build Netlify Function /api/create-client. Takes: name, email, phone, business_name, package. Generates unique portal_token. Inserts into clients table. Logs to activity_log. Returns portal URL. Admin auth — /admin route protected by Supabase auth (magic link), only admin email can access.

**Built:** `netlify/functions/create-client.js` + `admin/index.html` (magic link auth → redirects to /admin/pipeline/).

---

## Sprint 3: Admin pipeline kanban ✅ COMPLETE
Build /admin/pipeline page. Kanban board with columns: Lead, Contacted, Quoted, Agreement Sent, Deposit Paid, In Progress, Review, Revision, Final Payment, Complete, Lost. Cards show business_name, name, package, dollar amount, days in stage. Drag and drop → update status + log. "New Client" button → modal with create-client form.

**Built:** `admin/pipeline/index.html` — full kanban with drag & drop, days-in-stage coloring, Approve Lead modal (sends agreement, not just creates record).

---

## Sprint 4: Client detail panel ⬜ NOT STARTED
When clicking a client card on the kanban, open a slide-in panel from the right showing:
- Client info (editable fields)
- Status dropdown
- Agreement status
- Invoices list
- Uploaded files with download links
- Discovery responses
- Editable notes field (auto-save)
- Activity timeline
- Preview URL and live URL fields
- "Send Portal Link" button (emails client via Resend)

---

## Sprint 5: Client portal — account creation + agreement ✅ COMPLETE (with deviation)
Build /client/:token page. Step 1: account creation form (email pre-filled, password, confirm password, TOS). Creates Supabase auth user linked to client. Step 2: agreement text, pre-fill client info, "I agree" + signature input, records signer_name/IP/timestamp, logs, sends Telegram.

**Built:** `/client/{portal_token}` — agreement display with Agree/Decline. **Deviation:** Uses magic link (no password auth) — simpler, fewer failure points. signer_ip/signer_name not captured. Agreement text is generated from job_specifics rather than hardcoded.

---

## Sprint 6: Client portal — deposit payment ✅ COMPLETE
After agreement signed → deposit payment section → "Pay Deposit" → Stripe Checkout Session. Webhook handles checkout.session.completed: updates invoice to paid, client status to deposit_paid, sets delivery_due_at, logs to activity_log + transactions, sends Telegram.

**Built:** `agree-agreement.js` (creates Stripe Checkout, 50% deposit), `stripe-webhook.js` (handles payment confirmation). **Pending:** delivery_due_at not set (needs business days calculation). Stripe webhook not yet configured in Stripe dashboard.

---

## Sprint 7: Client portal — discovery + uploads ✅ COMPLETE (simplified)
After deposit paid: Discovery questionnaire (6 questions — about business, website goal checkboxes, sites admire, brand preferences, features needed, main CTA). Auto-saves to discovery_responses. Asset upload: drag-and-drop, categorize, Supabase Storage client-assets/{client_id}/. Telegram on upload.

**Built:** Collateral upload (drag & drop, Supabase Storage) + brand fields (colors, fonts, notes) → discovery_responses. **Deviation:** 6-question structured questionnaire not implemented — simplified to 3 text fields. Telegram notification on upload not implemented.

---

## Sprint 8: Client portal — status dashboard ⬜ NOT STARTED
Always visible after login. Progress tracker bar: Agreement → Deposit → Discovery → Assets → Building → Review → Live. Current status message. List of uploaded files. Invoice history with payment status.

---

## Sprint 9: Admin nav + placeholder tabs ⬜ NOT STARTED
Add nav bar to /admin with tabs: Pipeline (active), Calendar ("Coming in v2"), Revenue ("Coming in v2"), Accounting ("Coming in v2"). "Send Invoice" quick action — modal: select client, enter amount/type/description → Stripe Checkout Session + invoice record + Resend email + activity_log.

---

## Sprint 10: Deploy + end-to-end test ⬜ NOT STARTED
Deploy everything. Test full flow: create client → portal link → account → agreement → deposit (Stripe test mode) → discovery → upload → verify Telegram → verify activity_log → verify kanban updates. One deploy.

---

## Summary
| Sprint | Status | Notes |
|--------|--------|-------|
| 1 — Database | ✅ Done | Schema has extra columns, core matches |
| 2 — Create client + admin auth | ✅ Done | Magic link auth |
| 3 — Pipeline kanban | ✅ Done | Enhanced with Approve Lead flow |
| 4 — Client detail panel | ⬜ Next | Slide-in panel, editable fields, file list |
| 5 — Portal: agreement | ✅ Done | Magic link instead of password |
| 6 — Portal: deposit | ✅ Done | Stripe webhook needs Stripe config |
| 7 — Portal: discovery + uploads | ✅ Done | Simplified to 3 fields |
| 8 — Portal: status dashboard | ⬜ Todo | Progress bar, file list, invoice history |
| 9 — Admin nav + invoice tool | ⬜ Todo | Nav tabs + Send Invoice modal |
| 10 — Deploy + test | ⬜ Todo | Blocked until Stripe env vars set |
