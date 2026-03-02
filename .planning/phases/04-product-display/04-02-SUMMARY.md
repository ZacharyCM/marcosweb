---
phase: 04-product-display
plan: 02
subsystem: ui
tags: [nextjs, sanity, react, tailwind, carousel, groq]

# Dependency graph
requires:
  - phase: 04-product-display/04-01
    provides: PRODUCTS_BY_STRAIN_QUERY, sanityFetch, TypeGen types (PRODUCTS_BY_STRAIN_QUERYResult)
  - phase: 03-auth-gate
    provides: auth(), session with status field, logout action
provides:
  - Netflix-style horizontal carousel layout on /menu
  - StrainCarousel component (CSS scroll-snap, hidden scrollbar)
  - ProductCard component (image, name, strain badge, price, THC%, CBD%)
  - Empty-strain omission logic (MENU-06)
affects: [04-03-product-modal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Promise.all parallel sanityFetch for multi-strain page load
    - overflow-hidden wrapper around overflow-x-auto to prevent page-level horizontal scrollbar
    - Direct CDN URL usage (product.primaryImage.url) instead of urlFor() for GROQ-projected plain URL strings
    - CSS scroll-snap (snap-x snap-proximity) with Tailwind arbitrary value scrollbar hiding

key-files:
  created:
    - src/app/(app)/menu/strain-carousel.tsx
    - src/app/(app)/menu/product-card.tsx
  modified:
    - src/app/(app)/menu/page.tsx

key-decisions:
  - "Use product.primaryImage.url directly as next/image src — GROQ projects url as plain CDN string, not a Sanity image reference; urlFor() requires a reference object and would throw at runtime"
  - "overflow-hidden wrapper around overflow-x-auto carousel prevents page-level horizontal scrollbar without disabling internal scrollability"
  - "onClick on ProductCard is an empty placeholder — modal wiring deferred to Plan 03 as specified"
  - "Dark theme (bg-gray-950) applied to menu page — appropriate for dispensary aesthetic"

patterns-established:
  - "ProductCard: button element with empty onClick for Plan 03 modal attachment"
  - "Strain badge colors: sativa=green, hybrid=purple, indica=blue"

requirements-completed: [MENU-01, MENU-02, MENU-03, MENU-06]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 4 Plan 02: Menu Carousel Layout Summary

**Three-strain Netflix-style horizontal carousel on /menu with ProductCard showing image, name, color-coded strain badge, price, THC%, and CBD% — empty strains omitted**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-02T20:30:58Z
- **Completed:** 2026-03-02T20:36:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced Phase 3 menu stub with full RSC that fetches all three strain types in parallel and renders StrainCarousel per non-empty strain
- Built StrainCarousel using CSS scroll-snap and Tailwind scrollbar hiding — no JS library, no page-level overflow
- Built ProductCard client component with primary image (with no-image fallback), name, strain type badge (color-coded by type), price as currency, THC%, CBD%

## Task Commits

Each task was committed atomically:

1. **Task 1: Menu page RSC — parallel strain fetches** - `468c585` (feat)
2. **Task 2: StrainCarousel and ProductCard components** - `0179c00` (feat)

## Files Created/Modified

- `src/app/(app)/menu/page.tsx` - RSC: parallel sanityFetch for all 3 strains, renders StrainCarousel per non-empty strain, dark theme header with user name and sign-out
- `src/app/(app)/menu/strain-carousel.tsx` - CSS scroll-snap carousel row with Tailwind scrollbar hiding, accepts typed PRODUCTS_BY_STRAIN_QUERYResult
- `src/app/(app)/menu/product-card.tsx` - Client component: next/image with fill layout, strain badge with per-type colors, price/THC/CBD display, empty onClick placeholder for Plan 03

## Decisions Made

- Used `product.primaryImage.url` directly as `<Image src>` instead of calling `urlFor()` — the GROQ query projects `"url": asset->url` which is a plain CDN URL string. `urlFor()` requires a Sanity image reference object and would fail at runtime on a plain string.
- `overflow-hidden` wrapper around the `overflow-x-auto` carousel inner div prevents the horizontal scroll from propagating to the page level (research Pitfall 7).
- ProductCard has an empty `onClick` placeholder — the modal wiring is deferred to Plan 03 per plan spec.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Menu carousel layout complete and build-verified
- ProductCard has empty onClick ready for Plan 03 modal attachment
- Plan 03 (product detail modal) can proceed immediately

## Self-Check: PASSED

- src/app/(app)/menu/page.tsx — FOUND
- src/app/(app)/menu/strain-carousel.tsx — FOUND
- src/app/(app)/menu/product-card.tsx — FOUND
- .planning/phases/04-product-display/04-02-SUMMARY.md — FOUND
- Commit 468c585 (Task 1) — FOUND
- Commit 0179c00 (Task 2) — FOUND
