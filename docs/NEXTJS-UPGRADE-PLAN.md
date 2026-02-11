# Next.js Upgrade Plan

**Current Version:** 14.2.35  
**Target Version:** 15.0.8 (minimum for security) or 16.1.6 (latest)  
**Priority:** 🔴 HIGH - 2 Critical Security Vulnerabilities  
**Estimated Effort:** 4-8 hours  
**Risk Level:** Medium

---

## Executive Summary

The AI4ALL project is running Next.js 14.2.35 with **2 high-severity vulnerabilities**:

| Vulnerability | CVE | Severity | Impact |
|--------------|-----|----------|--------|
| HTTP Request Deserialization DoS | GHSA-h25m-26qc-wcjf | High | Denial of service |
| Image Optimizer DoS | GHSA-9g9p-9gw9-jx7f | High | Denial of service |

**Recommended Action:** Upgrade to Next.js 15.0.8+ or 16.1.6+

---

## 1. Vulnerability Details

### 1.1 GHSA-h25m-26qc-wcjf - HTTP Request Deserialization

**Affected Versions:** Next.js < 15.0.8, < 16.1.6  
**Fixed In:** 15.0.8, 16.1.6  
**Severity:** High  
**CVSS Score:** 7.5

**Description:**
A denial of service vulnerability exists in the HTTP request handling of Next.js server components. Attackers can send specially crafted requests to cause excessive resource consumption.

**Impact:**
- Application becomes unresponsive
- CPU exhaustion on server
- Service disruption for all users

**Attack Vector:** Network-based, no authentication required

### 1.2 GHSA-9g9p-9gw9-jx7f - Image Optimizer

**Affected Versions:** Next.js 14.x < 15.0.8  
**Fixed In:** 15.0.8  
**Severity:** High  
**CVSS Score:** 7.5

**Description:**
A denial of service vulnerability exists in the Image Optimizer component when `images.remotePatterns` is configured. Attackers can cause excessive resource consumption through malicious image URLs.

**Impact:**
- Server resource exhaustion
- Increased bandwidth costs
- Service degradation

**Attack Vector:** Network-based, requires configured remote patterns

---

## 2. Current System Analysis

### 2.1 Dependencies Using Next.js

```json
{
  "next": "14.2.35",
  "react": "18.3.1",
  "react-dom": "18.3.1"
}
```

### 2.2 Next.js Configuration

**File:** `next.config.cjs` (or doesn't exist)

```javascript
// Current configuration
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
```

### 2.3 Next.js Usage in Project

| Component | Usage | Migration Complexity |
|-----------|-------|---------------------|
| Next.js App Router | `src/app/` directory | Low |
| Static Export | `output: 'export'` | None |
| Image Optimization | `images: { unoptimized: true }` | None |
| API Routes | None | N/A |
| Server Components | None | N/A |

### 2.4 Breaking Changes Risk Assessment

| Area | Risk | Description |
|------|------|-------------|
| Static Export | None | Configuration unchanged |
| Image Optimization | None | Already disabled |
| App Router | Low | New features, no breaking changes |
| TypeScript | Low | Stricter types in some areas |
| React 18 → 19 | Medium | Some hook behavior changes |

---

## 3. Upgrade Strategy

### 3.1 Recommended Approach

**Option A: Upgrade to Next.js 15.0.8 (Recommended)**
- ✅ Fixes both vulnerabilities
- ⚠️ Some breaking changes expected
- 📅 Migration: 4-6 hours

**Option B: Upgrade to Next.js 16.1.6 (Latest)**
- ✅ Fixes both vulnerabilities
- ⚠️ More breaking changes
- 📅 Migration: 6-8 hours

**Option C: Stay on 14.x with Patches**
- ❌ Not recommended - no security patches
- Only receives critical bug fixes
- 📅 Security debt increases

**Recommended:** **Option A** (Next.js 15.0.8)

### 3.2 Pre-Upgrade Checklist

- [ ] Create backup/snapshot of current state
- [ ] Document current functionality
- [ ] Test all pages in current version
- [ ] Review Next.js 15 release notes
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window (1-2 hours)

### 3.3 Upgrade Steps

#### Phase 1: Preparation (30 minutes)

```bash
# 1. Create backup branch
git checkout -b backup-before-next15

# 2. Document current version
npm list next react react-dom

# 3. Test current functionality
npm run build
npm run start &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1

# 4. Check for Next.js config
ls -la next.config.cjs next.config.js 2>/dev/null || echo "No config found"
```

#### Phase 2: Package Updates (15 minutes)

```bash
# 1. Update package.json with new versions
npm install next@15.0.8 react@18.3.1 react-dom@18.3.1

# Or update all at once
npm install next@15.0.8 react@latest react-dom@latest
```

#### Phase 3: Build and Test (1-2 hours)

```bash
# 1. Clear build cache
rm -rf .next node_modules/.cache

# 2. Attempt build
npm run build

# 3. Fix any build errors (see Section 4)
# 4. Test all pages
npm run start &
sleep 5

# 5. Verify functionality
curl -s http://localhost:3000/dashboard.html | head -20
curl -s http://localhost:3000/data/aggregated-data.json | head -10
```

#### Phase 4: Production Deployment (30 minutes)

```bash
# 1. Deploy to staging
git checkout -b staging
git add package.json package-lock.json
git commit -m "chore: upgrade to Next.js 15.0.8"
git push origin staging

# 2. Test in staging environment
# 3. Deploy to production
git checkout main
git merge staging
git push origin main

# 4. Pull and restart on Raspberry Pi
ssh pi@freeai4all.duckdns.org
cd ~/ai4all/AI4ALL
git pull origin main
npm ci
npm run build
sudo systemctl restart nginx
```

---

## 4. Known Breaking Changes

### 4.1 Next.js 15 Breaking Changes

#### 4.1.1 TypeScript Strictness

**Issue:** Stricter TypeScript types for some APIs

**Solution:**
```typescript
// Before (Next.js 14)
const result = await fetch(url)

// After (Next.js 15) - may require type annotation
const result = await fetch<Response>(url)
```

#### 4.1.2 Image Component Changes

**Issue:** Some Image props deprecated

**Before:**
```jsx
import Image from 'next/image';

<Image
  src={src}
  alt="Description"
  width={400}
  height={300}
  layout="responsive"  // Deprecated
/>
```

**After:**
```jsx
import Image from 'next/image';

<Image
  src={src}
  alt="Description"
  width={400}
  height={300}
  style={{ width: '100%', height: 'auto' }}
/>
```

#### 4.1.3 Static Export Changes

**Issue:** Some configuration options changed

**Before (next.config.js):**
```javascript
module.exports = {
  output: 'export',
  images: { unoptimized: true },
}
```

**After (next.config.js):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

module.exports = nextConfig
```

#### 4.1.4 ESLint Changes

**Issue:** New ESLint rules in Next.js 15

**Solution:**
```bash
# Update ESLint config
npx @next/eslint-plugin-next@latest --update
```

### 4.2 React 19 Breaking Changes

If upgrading React to 19.x:

| Change | Impact |
|--------|--------|
| `useEffect` cleanup timing | Medium |
| `useMemo`/`useCallback` memoization | Low |
| Hydration mismatch handling | Medium |

**Recommendation:** Stay on React 18.x for stability:

```bash
npm install next@15.0.8 react@18.3.1 react-dom@18.3.1
```

---

## 5. Testing Plan

### 5.1 Unit Tests

```bash
# Run existing tests
npm run test

# Add new tests if needed
```

### 5.2 Integration Tests

| Test | Expected Result | Priority |
|------|-----------------|----------|
| Homepage loads | 200 OK, correct content | 🔴 P1 |
| Dashboard loads | 200 OK, all models displayed | 🔴 P1 |
| Data API works | JSON response valid | 🔴 P1 |
| Search functionality | Filter works correctly | 🟡 P2 |
| Provider filter | Filter works correctly | 🟡 P2 |
| Mobile responsive | CSS works on mobile | 🟢 P3 |

### 5.3 Performance Tests

```bash
# Measure build time
time npm run build

# Measure page load time
curl -s -w "\nTime: %{time_total}s\n" http://localhost:3000/dashboard.html
```

---

## 6. Rollback Plan

### 6.1 If Issues Occur

```bash
# 1. Immediate rollback
git checkout backup-before-next15

# 2. Restore previous dependencies
npm ci

# 3. Verify old version works
npm run build
npm run start &

# 4. Test functionality
curl -s http://localhost:3000/dashboard.html | head -10

# 5. Kill test server
kill %1
```

### 6.2 Git Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or
git checkout backup-before-next15
git push -f origin main
```

---

## 7. Post-Upgrade Tasks

### 7.1 Verification Checklist

- [ ] All pages load correctly
- [ ] Dashboard displays all models
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Build completes without errors
- [ ] No console errors in browser
- [ ] Performance is acceptable
- [ ] Mobile responsive design works

### 7.2 Monitoring

```bash
# Monitor error logs
sudo tail -f /var/log/nginx/error.log

# Check application health
curl -s http://localhost:3000/dashboard.html | grep -q "Free AI Models" && echo "✓ Dashboard OK"

# Check for JavaScript errors
# Open browser dev tools and check console
```

### 7.3 Documentation Updates

- [ ] Update package.json version
- [ ] Update README.md with new dependencies
- [ ] Update AGENTS.md if needed
- [ ] Document any custom configurations

---

## 8. Timeline

### Phase 1: Preparation
- **Duration:** 30 minutes
- **Activities:** Backup, testing, documentation

### Phase 2: Package Updates
- **Duration:** 15 minutes
- **Activities:** npm install, package-lock update

### Phase 3: Build and Fix
- **Duration:** 2-4 hours
- **Activities:** Build, error fixing, testing

### Phase 4: Deployment
- **Duration:** 30 minutes
- **Activities:** Git push, Pi deployment

**Total Estimated Time:** 4-6 hours

---

## 9. Cost Estimate

| Item | Cost |
|------|------|
| Development time | 4-6 hours |
| Staging environment | $0 (uses GitHub Actions) |
| Production (Raspberry Pi) | $0 |
| Risk mitigation | 1 hour buffer |

**Total Cost:** ~5-7 hours of developer time

---

## 10. Success Criteria

### Functional Criteria
- ✅ All existing features work without regression
- ✅ Dashboard loads in < 2 seconds
- ✅ Build completes in < 5 minutes
- ✅ No console errors in Chrome/Firefox/Safari

### Security Criteria
- ✅ Both vulnerabilities fixed
- ✅ No new vulnerabilities introduced
- ✅ Security headers present

### Performance Criteria
- ✅ Page load time < 3 seconds
- ✅ Build time < 5 minutes
- ✅ No memory leaks detected

---

## 11. Approval

**Proposed By:** AI Security Subagent Team  
**Date:** February 10, 2026

**Approved By:** _______________________  
**Approval Date:** _______________________  
**Target Completion Date:** _______________________

---

## 12. References

### Next.js Resources
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [Security Advisories](https://github.com/vercel/next.js/security/advisories)

### Vulnerability Details
- [GHSA-h25m-26qc-wcjf](https://github.com/advisories/GHSA-h25m-26qc-wcjf)
- [GHSA-9g9p-9gw9-jx7f](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f)

---

**Next.js Upgrade Plan Version:** 1.0.0  
**Status:** Ready for Approval
