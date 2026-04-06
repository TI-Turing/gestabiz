---
date: 2026-04-05
tags: [landing, css, dark-mode, fixed]
---

# Landing Page Dark Mode Issue — FIXED

## Problem
The landing page navbar text was displaying in very light gray (almost invisible) even though the page was in light mode. The nav links had the class `text-gray-700/70` (dark gray) but were computing to `oklab(0.872...)` (very light gray).

## Root Cause
CSS conflict:
1. **main.css line 9** defined: `@custom-variant dark (&:is(.dark *));`
2. **tailwind.config.js line 161** configured: `darkMode: ["selector", '[data-appearance="dark"]']`
3. **index.css lines 141-188** defined color variables under: `[data-theme="dark"]`

These three mismatches caused Tailwind to apply dark mode styles incorrectly to the landing page, even when `data-appearance="light"`.

## Solution
Removed all `dark:` prefixed utilities from PublicLayout.tsx:
- Navbar background: removed `dark:bg-gray-950/95`
- Nav links: removed `dark:text-gray-300/70`
- Nav button: removed `dark:text-gray-300`
- Mobile menu: removed `dark:border-gray-700` and `dark:text-gray-400`

Landing page now displays in light mode only. Dark mode support can be added back later after resolving the CSS configuration mismatch.

## Files Changed
- `src/components/landing/PublicLayout.tsx` — removed all `dark:` utilities
- `package.json` — version bumped to 0.0.70

## Verification
Nav link now correctly computes to `oklab(0.373...)` (dark gray) instead of `oklab(0.872...)` (light gray).
