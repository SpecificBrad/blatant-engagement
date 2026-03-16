# New Client Build Checklist
## Blatant Engagement

### INTAKE (Day 1 after deposit)
- [ ] Send intake questionnaire (copy from below)
- [ ] Collect: business name, tagline, about copy, services list
- [ ] Collect: address, phone, email, hours
- [ ] Collect: logo file (SVG or PNG, ideally on transparent background)
- [ ] Collect: 4–8 photos (or schedule a phone visit)
- [ ] Collect: Facebook/Instagram links
- [ ] Confirm package: Starter ($500) or Pro ($750)
- [ ] Confirm domain situation (have one? need one? use subdomain?)

### BUILD (Day 2–3)
- [ ] Copy `template/index.html` to new folder: `clients/CLIENT_SLUG/index.html`
- [ ] Swap CSS variables (colors to match brand)
- [ ] Swap all `CLIENT_*` placeholder text
- [ ] Add logo to nav
- [ ] Add hero image (or choose solid color)
- [ ] Enable/disable gallery section based on package
- [ ] Add Google Maps embed with correct address
- [ ] Update Supabase `source` value to client slug
- [ ] Update social links
- [ ] Update footer
- [ ] Update all SEO meta tags (title, description, keywords)

### REVIEW (Day 3–4)
- [ ] Test contact form — confirm data lands in Supabase
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Check all links work
- [ ] Send preview link to client (Netlify preview URL)

### REVISIONS (Day 4)
- [ ] Collect feedback in writing
- [ ] Apply revisions (Starter: 1 round, Pro: 2 rounds)
- [ ] Re-send preview link

### LAUNCH (Day 5)
- [ ] Collect payment (Stripe invoice or e-transfer)
- [ ] Set up custom domain in Netlify (or subdomain)
- [ ] Deploy to production
- [ ] Send client the live link + login for any accounts they need
- [ ] Add to portfolio on blatantengagement.com

---

## INTAKE QUESTIONNAIRE
> Copy and paste into an email or DM after receiving deposit

---

Hi [Name]! Excited to get started on your website. I just need a bit of info from you and then I'll get building. Takes about 5 minutes to fill out.

**1. Business name** (exactly as you want it on the site):

**2. What does your business do?** (1–2 sentences, in plain language):

**3. Your address:**

**4. Phone number:**

**5. Email (for the contact form to notify):**

**6. Hours of operation:**

**7. Do you have a logo?** Yes / No / Not sure
   - If yes, please send the file (PNG or SVG preferred)

**8. Do you have photos of your business, products, or work?**
   - Yes, I'll send them
   - I'll take some this week
   - No, I need help with this

**9. Facebook page URL (if you have one):**

**10. Instagram handle (if you have one):**

**11. Are there any websites you like the look of?** (optional — helps me understand your style):

**12. Anything else you want on the site or want me to know?**

---

*Reply to this email or send files to [YOUR EMAIL]. I'll get started as soon as I hear back.*

---

## CSS VARIABLE QUICK-SWAP
> Copy into Claude Code: "Swap CSS variables to match [brand color]"

```
--color-primary: #HEX      ← hero/nav background
--color-accent: #HEX       ← buttons, highlights
--color-accent-hover: #HEX ← button hover (slightly darker)
```

Common combos:
- Auto shop: primary #1a1a2e, accent #e63946 (dark blue + red)
- Restaurant: primary #1c1008, accent #e08c3a (dark brown + amber)
- Trades/construction: primary #0d1b2a, accent #f59e0b (dark navy + yellow)
- Health/wellness: primary #1a2e2a, accent #22c55e (dark green + bright green)
- Retail/boutique: primary #1a0a2e, accent #a855f7 (dark purple + purple)
