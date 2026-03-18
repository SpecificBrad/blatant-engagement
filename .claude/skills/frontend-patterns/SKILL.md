# Frontend Patterns — Blatant Engagement

## Stack
Vanilla HTML/CSS/JS. No frameworks. No build step.

## Supabase Fetch Pattern
```js
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value)
if (error) { showError(error.message); return; }
```

## Netlify Function Call Pattern
```js
const res = await fetch('/.netlify/functions/function-name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: value })
});
const data = await res.json();
if (!res.ok) { showError(data.error); return; }
```

## Portal Token Auth Pattern
```js
const res = await fetch('/.netlify/functions/function-name', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-portal-token': portalToken
  },
  body: JSON.stringify({ key: value })
});
```

## Form Submit Pattern
```js
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = form.elements['name'].value.trim(); // always use form.elements
  if (!name) { showStatus('Name required', 'error'); return; }
  btn.disabled = true;
  try {
    // fetch call here
    showStatus('Success!', 'success');
  } catch (err) {
    showStatus(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});
```

## Design System
- Font: Plus Jakarta Sans
- Accent: orange (#F97316 or similar)
- Background: warm off-white/brown tones
- See `_claude/frontend-design-guide.md` for full spec
