---
phase: 02-data-layer
plan: "02"
subsystem: database
tags: [sanity, groq, typegen, typescript, queries]

# Dependency graph
requires:
  - phase: 02-data-layer/02-01
    provides: product and siteUser Sanity schema types (strainType, effects, media fields)
provides:
  - All GROQ queries as named defineQuery exports in src/sanity/lib/queries.ts
  - Auto-generated sanity.types.ts with typed result types for all 4 queries and 13 schema types
  - TypeGen pipeline configured in sanity.cli.ts
  - tsconfig.json updated to include generated types file
affects:
  - 03-auth (ALL_SITE_USERS_QUERY, siteUser types available)
  - 04-frontend (ALL_PRODUCTS_QUERY, PRODUCTS_BY_STRAIN_QUERY, typed fetch calls)

# Tech tracking
tech-stack:
  added: [groq (defineQuery), sanity typegen CLI]
  patterns: [defineQuery for all GROQ queries (TypeGen compatibility), asset->url dereference in media projections, named export pattern for queries]

key-files:
  created:
    - src/sanity/lib/queries.ts
    - sanity.types.ts
  modified:
    - sanity.cli.ts
    - tsconfig.json
    - .gitignore

key-decisions:
  - "TypeGen naming convention uses variable name as type suffix (ALL_PRODUCTS_QUERYResult not AllProductsQueryResult) — this is the correct output"
  - "sanity.cli.ts typegen block does not accept 'enabled' property — the block's presence enables TypeGen; removed enabled:true to satisfy TypeScript"
  - "schema.json is generated at runtime and gitignored — not committed"

patterns-established:
  - "All GROQ queries use defineQuery(...) from 'groq' package (not next-sanity) — required for TypeGen to detect named exports"
  - "Media projections always use asset->url dereference — never return raw _ref objects to consumers"
  - "Query file is GROQ-only — no urlFor calls; those belong in image.ts for frontend image transforms"

requirements-completed: [PROD-01, PROD-04]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 2 Plan 02: Typed GROQ Queries and TypeGen Pipeline Summary

**Four GROQ queries with asset->url media resolution, fully typed by Sanity TypeGen across 13 schema types — zero TypeScript errors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T05:09:49Z
- **Completed:** 2026-03-02T05:11:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `src/sanity/lib/queries.ts` with all four GROQ queries using `defineQuery` — TypeGen-compatible
- Ran TypeGen pipeline (schema extract + typegen generate): 13 schema types and 4 GROQ queries typed
- `sanity.types.ts` generated at project root with `ALL_PRODUCTS_QUERYResult`, `PRODUCT_BY_ID_QUERYResult`, `PRODUCTS_BY_STRAIN_QUERYResult`, `ALL_SITE_USERS_QUERYResult`
- `tsconfig.json` updated to include `sanity.types.ts`; `sanity.cli.ts` configured with typegen block
- `schema.json` added to `.gitignore` (generated file)
- `npx tsc --noEmit` exits with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Write typed GROQ queries** - `0896e24` (feat)
2. **Task 2: Run TypeGen pipeline and update config files** - `eece7e2` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/sanity/lib/queries.ts` - All four GROQ queries as named defineQuery exports
- `sanity.types.ts` - Auto-generated TypeScript types for 13 schema types and 4 query results
- `sanity.cli.ts` - Added typegen config block (path, generates, overloadClientMethods)
- `tsconfig.json` - Added sanity.types.ts to include array
- `.gitignore` - Added schema.json entry

## Query Reference

| Export | Purpose | Returns |
|--------|---------|---------|
| `ALL_PRODUCTS_QUERY` | Full product list with resolved media URLs | `ALL_PRODUCTS_QUERYResult` (Array) |
| `PRODUCT_BY_ID_QUERY` | Single product by `_id` with media URLs | `PRODUCT_BY_ID_QUERYResult` (object or null) |
| `PRODUCTS_BY_STRAIN_QUERY` | Card-level fields filtered by `strainType` | `PRODUCTS_BY_STRAIN_QUERYResult` (Array) |
| `ALL_SITE_USERS_QUERY` | Site users for Phase 3 approval workflow | `ALL_SITE_USERS_QUERYResult` (Array) |

## Decisions Made
- TypeGen naming convention uses the variable name as type suffix (`ALL_PRODUCTS_QUERYResult` not `AllProductsQueryResult`) — this is the correct Sanity TypeGen output behavior
- `sanity.cli.ts` typegen block does not accept an `enabled` property — the presence of the block itself enables TypeGen
- `schema.json` is generated at build time and should not be committed (gitignored)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid `enabled` property from typegen config**
- **Found during:** Task 2 (Run TypeGen pipeline and update config files)
- **Issue:** The plan specified `enabled: true` in the `typegen` block of `sanity.cli.ts`, but the TypeScript type for `defineCliConfig` does not include an `enabled` property — caused `tsc --noEmit` to fail with TS2353
- **Fix:** Removed `enabled: true`; the typegen block's presence is sufficient to enable TypeGen
- **Files modified:** `sanity.cli.ts`
- **Verification:** `npx tsc --noEmit` exits with zero errors after removal
- **Committed in:** `eece7e2` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in plan spec vs. actual Sanity CLI type definition)
**Impact on plan:** Necessary fix; TypeGen still ran successfully and produced correct output.

## Issues Encountered
- Sanity TypeGen uses `ALL_PRODUCTS_QUERYResult` (uppercase, matches variable name) not `AllProductsQueryResult` (camelCase) — the plan's verification grep used camelCase names which returned no matches. Actual type names confirmed by direct inspection; all 4 are present.

## User Setup Required
None - no external service configuration required. TypeGen ran against the existing Sanity project and schema.

## Next Phase Readiness
- Phase 3 (auth) can use `ALL_SITE_USERS_QUERY` and `ALL_SITE_USERS_QUERYResult` for the owner approval workflow
- Phase 4 (frontend) can use `ALL_PRODUCTS_QUERY`, `PRODUCTS_BY_STRAIN_QUERY`, and their result types for typed `sanityFetch` calls
- All media URLs are resolved at query time (asset->url) — no additional URL resolution needed in components

---
*Phase: 02-data-layer*
*Completed: 2026-03-02*

## Self-Check: PASSED

- FOUND: src/sanity/lib/queries.ts
- FOUND: sanity.types.ts
- FOUND: sanity.cli.ts
- FOUND: tsconfig.json
- FOUND: .planning/phases/02-data-layer/02-02-SUMMARY.md
- FOUND commit: 0896e24 (feat(02-02): add typed GROQ queries using defineQuery)
- FOUND commit: eece7e2 (feat(02-02): run TypeGen pipeline, update sanity.cli.ts and tsconfig)
