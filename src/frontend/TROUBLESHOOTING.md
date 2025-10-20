# Frontend Troubleshooting - Blank Screen

**Server Status:** ✅ Running on http://localhost:3000
**HTML Loading:** ✅ Yes
**JavaScript Loading:** ✅ Yes
**Issue:** Blank screen (React not rendering)

---

## Diagnosis Steps

### Step 1: Open Browser DevTools

1. Open http://localhost:3000 in browser
2. Press **F12** (or Right-click → Inspect)
3. Go to **Console** tab
4. Look for RED error messages

### Step 2: Common Errors to Look For

#### Error A: "WalletConnector not found" or wagmi error
**Cause:** Wagmi/Web3 library issue
**Fix:** MetaMask needs to be installed

#### Error B: "Cannot read properties of undefined"
**Cause:** Missing environment variable or config
**Fix:** Check console for which property

#### Error C: "Module not found"
**Cause:** Import path issue
**Fix:** Already fixed in App.tsx

#### Error D: Nothing in console, just blank
**Cause:** CSS hiding content or render issue
**Fix:** Check Elements tab to see if #root has children

---

## Quick Tests

### Test 1: Check React Root

Open Console and type:

```javascript
document.getElementById('root')
```

**Expected:** Should return the div element

### Test 2: Check React Rendered

```javascript
document.getElementById('root').innerHTML
```

**Expected:** Should show HTML content (not empty string)

### Test 3: Check for Errors

```javascript
console.clear()
// Refresh page (Cmd+R / Ctrl+R)
// Check console for errors
```

---

## Manual Fix Steps

### Fix 1: Clear Vite Cache

```bash
# Stop server (Ctrl+C)
cd "/Users/apple/Desktop/Mimic Protocol/src/frontend"
rm -rf node_modules/.vite
pnpm dev
```

### Fix 2: Hard Refresh Browser

```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### Fix 3: Check Port Conflicts

```bash
# Check what's on port 3000
lsof -i :3000

# If multiple processes, kill them
pkill -f vite

# Restart clean
pnpm dev
```

---

## What Should You See?

When working correctly:

1. **Dark background** (#0A0A0A)
2. **Header** with "🔄 Mirror Protocol"
3. **Connect Wallet** button (top right)
4. **Welcome message**
5. **4 feature cards** with icons
6. **Footer** at bottom

---

## Copy Error Message

If you see a RED error in console:

1. Click on the error to expand it
2. Copy the full error message
3. Look for the file name and line number
4. Send this info

Example error format:
```
Error: Cannot read properties of undefined (reading 'address')
    at useAccount (useAccount.ts:45)
    at App.tsx:19
```

---

## Network Tab Check

1. Open DevTools → **Network** tab
2. Refresh page
3. Look for failed requests (RED)
4. Common issues:
   - main.tsx failed → Check server running
   - App.tsx failed → Check imports
   - globals.css failed → Check CSS file exists

---

## Likely Causes

Based on current setup:

1. **Most Likely:** Wagmi needs MetaMask installed
2. **Second:** Browser doesn't support Wagmi (use Chrome/Brave/Edge)
3. **Third:** Some component has runtime error

---

## MetaMask Requirement

The app uses Wagmi which expects Web3 wallet:

**Without MetaMask:**
- App might not render
- Console shows errors about Web3Provider

**Solution:**
1. Install MetaMask browser extension
2. Don't need to connect yet, just installed
3. Refresh page

---

## Alternative: Test Without Wagmi

Temporary fix to see if Wagmi is the issue:

1. Comment out Wagmi in main.tsx
2. Render App directly
3. See if it shows

This will break functionality but confirm diagnosis.

---

## What I Need From You

Please send me:

1. **Console errors** (exact text of any RED errors)
2. **`document.getElementById('root').innerHTML`** output
3. **Is MetaMask installed?** (Yes/No)
4. **Which browser?** (Chrome/Firefox/Safari/Other)

This will help me fix the exact issue!
