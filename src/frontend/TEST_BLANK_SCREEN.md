# Debugging Blank Screen

## Steps to Debug

1. **Open browser DevTools** (F12 or Right-click → Inspect)

2. **Check Console tab** for JavaScript errors

3. **Common Issues:**

### Issue 1: Wagmi Configuration Error
**Symptom:** Error about chains or connectors

**Fix:** Check browser console for exact error

### Issue 2: MetaMask Not Installed
**Symptom:** No errors, just blank

**Fix:** This is expected - app needs MetaMask. Install MetaMask extension.

### Issue 3: CSS Not Loading
**Symptom:** Blank white screen

**Check:** Network tab - is globals.css loading?

## Quick Test

Open browser console and type:

```javascript
// Check if React root exists
document.getElementById('root')

// Check if React mounted
document.getElementById('root').children.length

// Should be > 0 if React mounted
```

## What I Need From You

1. Open http://localhost:3002
2. Press F12 to open DevTools
3. Click "Console" tab
4. Copy any RED error messages
5. Send them to me

## Expected Behavior

If working correctly, you should see:
- Header with "Mirror Protocol" title
- "Connect Wallet" button (top right)
- "Welcome to Mirror Protocol" message
- 4 feature cards
- Dark background with purple/gold accents

## Common Fixes

### Fix 1: Clear Browser Cache
```
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Fix 2: Kill and Restart Dev Server
```bash
# Kill it
pkill -f "vite"

# Restart
cd "/Users/apple/Desktop/Mimic Protocol/src/frontend"
pnpm dev
```

### Fix 3: Check Port
Dev server is on: **http://localhost:3002** (NOT 3000 or 5173)
