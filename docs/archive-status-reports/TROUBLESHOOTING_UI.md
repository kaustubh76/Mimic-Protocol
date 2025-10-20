# 🔧 UI Troubleshooting Guide

**Issue:** Only HTML page loading, React not rendering

---

## ✅ **Quick Fixes**

### 1. **Check the Correct Port**

The dev server is running on **port 3003**, not 3000!

**Open this URL:**
```
http://localhost:3003
```

Ports 3000, 3001, and 3002 were already in use.

---

### 2. **Check Browser Console**

Open browser dev tools (F12) and check the Console tab for errors.

**Common errors to look for:**
- Module not found
- Import errors
- TypeScript errors
- React errors

---

### 3. **If You See Errors, Try This:**

#### Clear Cache and Restart:
```bash
# Kill the dev server
pkill -f "vite"

# Clear Vite cache
cd "src/frontend"
rm -rf node_modules/.vite
rm -rf dist

# Restart
pnpm dev
```

---

### 4. **If Still Not Working, Use Old App:**

Switch back to the old working App temporarily:

```bash
cd "src/frontend"
```

Edit `src/main.tsx`:
```typescript
// Change this:
import { AppNew as App } from './AppNew';

// To this:
import { App } from './App';
```

Then refresh browser.

---

## 🔍 **Diagnostic Checklist**

### Server Running?
```bash
cd "src/frontend"
pnpm dev
```

**Expected output:**
```
✓ ready in XXXms
➜ Local: http://localhost:XXXX/
```

### Port Active?
```bash
lsof -i :3003
```

Should show node/vite process.

### Files Exist?
```bash
ls src/main.tsx
ls src/AppNew.tsx
ls src/App.tsx
```

All should exist.

### TypeScript Compiling?
```bash
cd "src/frontend"
pnpm build
```

Should complete without errors.

---

## 🐛 **Common Issues**

### Issue 1: "Cannot find module"
**Solution:** Check import paths in AppNew.tsx

```bash
# Check if files exist:
ls components/layout/Header.tsx
ls components/layout/Hero.tsx
ls components/ui/Button.tsx
```

### Issue 2: "Unexpected token"
**Solution:** Check for syntax errors

```bash
# Try to import the file manually:
node -e "require('./src/AppNew.tsx')"
```

### Issue 3: White screen, no errors
**Solution:** Check if React is mounting

Add console.log to AppNew.tsx:
```typescript
export function AppNew() {
  console.log('🚀 AppNew is mounting!')
  // ... rest of code
}
```

### Issue 4: CSS not loading
**Solution:** Check globals.css import

In `src/main.tsx`, ensure:
```typescript
import './globals.css'
```

---

## 🔥 **Emergency Rollback**

If nothing works, here's how to get back to working state:

### Step 1: Use Old App
```bash
cd "src/frontend/src"
```

Edit `main.tsx`:
```typescript
import { App } from './App';  // Use old App
import './globals.css';

// ... rest stays the same
```

### Step 2: Restart Server
```bash
cd "src/frontend"
pkill -f vite
pnpm dev
```

### Step 3: Open Browser
```
http://localhost:XXXX  (check console for port)
```

You should see the old UI working.

---

## 📋 **Debug Steps**

### 1. Check What's Being Served
```bash
curl http://localhost:3003 | grep "root"
```

Should show: `<div id="root"></div>`

### 2. Check If React Loads
Open browser console and type:
```javascript
window.React
```

Should show React object, not undefined.

### 3. Check If Main.tsx Runs
Add to `src/main.tsx` at the top:
```typescript
console.log('🎯 main.tsx is loading!')
```

Refresh browser and check console.

### 4. Check If AppNew Exports
Add to `src/AppNew.tsx` at the top:
```typescript
console.log('📦 AppNew.tsx is loading!')
```

---

## 💡 **Most Likely Issues**

### 1. Wrong Port (MOST COMMON)
**Solution:** Use http://localhost:3003 (not 3000)

### 2. Import Path Error
**Solution:** Check relative paths in imports

### 3. TypeScript Error
**Solution:** Run `pnpm build` to see errors

### 4. Missing Dependencies
**Solution:** Run `pnpm install`

---

## 🆘 **If All Else Fails**

### Nuclear Option - Fresh Start:

```bash
cd "src/frontend"

# Backup your new files
cp src/AppNew.tsx src/AppNew.tsx.backup
cp components/layout/Header.tsx components/layout/Header.tsx.backup
# ... etc

# Use old App temporarily
# Edit main.tsx to import { App } from './App'

# Restart
pkill -f vite
pnpm dev
```

Then we can debug the new App separately.

---

## 📞 **Quick Commands**

### Check Server Status:
```bash
ps aux | grep vite
```

### Kill All Node Processes:
```bash
pkill -f node
```

### Restart Fresh:
```bash
cd "src/frontend"
pkill -f vite
rm -rf node_modules/.vite
pnpm dev
```

### Check Port:
```bash
lsof -i :3003
```

---

## ✅ **What Should Work**

After following these steps, you should see:

1. **Terminal:** "ready in XXXms" message
2. **Browser:** Opens to http://localhost:XXXX
3. **Screen:** Either new UI or old UI rendering
4. **Console:** No red errors

---

## 🎯 **Next Steps After Fix**

Once you get **something** rendering:

1. Check browser console for specific errors
2. Share the error message
3. We'll fix the specific issue
4. Get back to winner UI!

---

**Remember:** The port is **3003**, not 3000!

Try: http://localhost:3003

---

**Status:** 🔧 TROUBLESHOOTING MODE
**Goal:** Get React rendering again
**Priority:** Fix > Polish > Win!
