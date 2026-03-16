---
name: frontend-design
description: Hardcoded style guide for Blatant Engagement. All pages MUST match this spec exactly.
---
# Blatant Engagement — Design Spec (DO NOT DEVIATE)

## Font Stack
- Headlines / Display: 'Plus Jakarta Sans', sans-serif
- Body: 'Inter', sans-serif
- Load via Google Fonts: Plus Jakarta Sans (600, 700, 800, 900) + Inter (400, 500, 600)

## Colors
```css
:root {
  --hero-bg:     #120e0b;
  --dark:        #1a1512;
  --dark-2:      #231c17;
  --dark-border: #312620;
  --accent:      #c05a28;
  --accent-h:    #9d4820;
  --accent-glow: rgba(192,90,40,0.10);
  --white:       #ffffff;
  --warm-white:  #fdfaf7;
  --warm-cream:  #f3ece0;
  --warm-border: #e4d9cc;
  --text:        #1c1915;
  --text-light:  #6b5f54;
  --text-muted:  #a09080;
  --success:     #3d8c5e;
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body:    'Inter', sans-serif;
  --max-w:       1100px;
}
```

## Layout Rules
- Max content width: 1100px, centered
- Section padding: 96px top/bottom on desktop, 48px on mobile
- Card border-radius: 14px
- Button border-radius: 7px
- Spacing scale: 4px, 8px, 14px, 16px, 24px, 32px, 48px, 72px, 96px

## Typography Scale
- Hero headline: clamp(2.5rem, 6vw, 4.6rem) / 1.06 line-height, weight 900, letter-spacing -0.03em
- Section headline: clamp(1.75rem, 4vw, 2.75rem) / 1.14, weight 800, letter-spacing -0.025em
- Card title: 1rem / weight 700, letter-spacing -0.01em
- Body: 1rem / 1.65
- Small/label: 0.875rem / 1.4
- Eyebrow/badge: 0.72rem, uppercase, letter-spacing 0.16em, font-weight 600, color var(--accent)

## Components

### Buttons
- Primary: bg var(--accent), white text, padding 15px 34px, font-family var(--font-display), font-size 0.95rem, font-weight 700, border-radius 7px, hover bg var(--accent-h) + translateY(-1px), transition 0.15s
- Ghost: transparent bg, color rgba(255,255,255,0.5), font-size 0.9rem, font-weight 500, padding 15px 4px, hover color rgba(255,255,255,0.85)
- Nav CTA: bg var(--accent), white, padding 10px 22px, border-radius 6px, font-size 0.85rem, font-weight 600

### Form Inputs
- Background: white
- Border: 1px solid var(--warm-border)
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: 1rem
- Focus: border-color var(--accent), outline none
- Labels: font-weight 500, margin-bottom 6px, color var(--text)

### Cards / Feature Grid
- Background: var(--warm-white)
- Border: 1px solid var(--warm-border)
- Border-radius: 14px
- Padding: 36px 32px
- Hover: background #faf4ec
- Icon wrap: 44x44px, border-radius 10px, bg var(--warm-cream), SVG stroke var(--accent) 1.75px

### Section Labels (Eyebrow)
- 0.72rem, font-weight 600, letter-spacing 0.16em, uppercase, color var(--accent), margin-bottom 14px
- Optional leading line: 24px wide, 1px tall, bg var(--accent), displayed inline before text

### Status/Progress
- Horizontal stepped progress bar
- Active step: var(--accent) filled circle
- Completed step: var(--success) filled circle with SVG checkmark
- Inactive step: var(--warm-border) outline circle
- Connecting line between steps in var(--warm-border)

## Page Structure
- Dark hero/header sections: bg var(--hero-bg), text white
- Light content sections: alternate var(--warm-white) and var(--warm-cream)
- Dark sections (CTA, footer): bg var(--dark), border-top var(--dark-border)
- Nav: fixed, bg rgba(18,14,11,0.88), backdrop-filter blur(14px), border-bottom rgba(255,255,255,0.05)

## Animation
- Staggered fade-up on page load (0.1s delay between elements)
- Hover transitions: 0.15s–0.2s ease
- No emoji anywhere, ever — use SVG icons only

## STRICT RULES
- DO NOT use any font other than Plus Jakarta Sans and Inter
- DO NOT use the indigo/purple accent (#4f46e5) — accent is always #c05a28
- DO NOT use emoji as icons — SVG only, stroke var(--accent), stroke-width 1.75
- DO NOT deviate from the color variables above
- ALL pages must feel like they belong to the same site
- Mobile-first responsive — test at 375px width
