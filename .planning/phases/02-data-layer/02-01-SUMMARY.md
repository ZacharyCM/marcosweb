---
phase: 02-data-layer
plan: 01
subsystem: database
tags: [sanity, schema, groq, studio, typescript]

# Dependency graph
requires:
  - phase: 01-setup
    provides: Sanity project connected, Studio route at /studio, environment variables configured
provides:
  - product Sanity document schema with name, strainType, price, thcPercent, cbdPercent, description, effects, and mixed media array
  - siteUser Sanity document schema with email, name, status for Phase 3 auth gate
  - schema registry (index.ts) exporting both types
  - sanity.config.ts wired to schema registry — both types appear in Studio
affects: [02-02-groq-queries, 03-auth, 04-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sanity defineType/defineField/defineArrayMember pattern for schema authoring"
    - "Mixed-type array in Sanity: image (hotspot) + file (video/* accept) in one array field"
    - "Lowercase strainType values (sativa/hybrid/indica) as filter keys for carousel queries"
    - "Schema registry pattern: schemaTypes/index.ts exports schema object, sanity.config.ts imports it"

key-files:
  created:
    - src/sanity/schemaTypes/product.ts
    - src/sanity/schemaTypes/siteUser.ts
  modified:
    - src/sanity/schemaTypes/index.ts
    - sanity.config.ts

key-decisions:
  - "siteUser omits passwordHash — Phase 3 research will determine if Auth.js handles credentials separately or Sanity stores them"
  - "strainType values are lowercase strings (sativa/hybrid/indica) — Phase 4 carousel GROQ queries will filter on these exact values"
  - "media field uses mixed array of type:image (with hotspot + alt) and type:file (with accept:video/*) — NOT type:image for videos"
  - "media.0 used in preview select — first uploaded item appears as Studio card thumbnail"
  - "effects stored as array of strings, not comma-separated string — enables per-effect filtering in Phase 4"

patterns-established:
  - "Schema authoring: use defineType/defineField/defineArrayMember throughout — never plain object literals"
  - "Mixed media: image members get hotspot:true; file members get accept restriction"
  - "Schema registry: all types imported and exported from schemaTypes/index.ts, sanity.config.ts only imports schema object"

requirements-completed: [PROD-01, PROD-02, PROD-03, PROD-04]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 2 Plan 01: Sanity Schema Definitions Summary

**Sanity product and siteUser document schemas with mixed image/file media array, registered in Studio — TypeScript compiles clean and build succeeds**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T05:02:51Z
- **Completed:** 2026-03-02T05:07:31Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- product schema with 8 fields including mixed media array (images + videos in one field) covering PROD-01 through PROD-04
- siteUser schema with email, name, status (pending/approved/denied) for Phase 3 approval flow
- Schema registry and sanity.config.ts wired so both types auto-appear in Studio's document list
- Zero TypeScript errors, production build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create product schema** - `b8bda5b` (feat)
2. **Task 2: Create siteUser schema** - `d26bf12` (feat)
3. **Task 3: Register schemas and wire into Studio config** - `a45ef24` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `src/sanity/schemaTypes/product.ts` - product document schema: name, strainType, price, thcPercent, cbdPercent, description, effects, media (mixed image+file array)
- `src/sanity/schemaTypes/siteUser.ts` - siteUser document schema: email, name, status with pending/approved/denied radio options
- `src/sanity/schemaTypes/index.ts` - schema registry importing and exporting both types
- `sanity.config.ts` - imports schema from registry, replaces inline empty array

## Decisions Made
- siteUser omits passwordHash: Phase 3 research will clarify whether Auth.js stores credentials externally or Sanity holds them; premature field removed to avoid schema churn
- strainType values lowercase: sativa, hybrid, indica — matches the filter keys Phase 4 carousel GROQ queries will use
- media uses `type: 'file'` with `options: { accept: 'video/*' }` for videos, not `type: 'image'` — prevents Sanity from attempting image processing on video assets
- effects as string array: enables individual effect-based filtering in Phase 4 versus a comma-separated string

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Both document types are now visible in the deployed Studio at /studio.

## Next Phase Readiness
- product and siteUser schemas are registered; GROQ queries in Plan 02-02 can now reference `_type == "product"` and all field names
- strainType filter values (sativa/hybrid/indica) are locked — Plan 02-02 carousel queries depend on these exact strings
- siteUser status values (pending/approved/denied) are set — Phase 3 auth gate decision logic uses these

## Self-Check: PASSED

- FOUND: src/sanity/schemaTypes/product.ts
- FOUND: src/sanity/schemaTypes/siteUser.ts
- FOUND: src/sanity/schemaTypes/index.ts
- FOUND: sanity.config.ts
- FOUND: .planning/phases/02-data-layer/02-01-SUMMARY.md
- FOUND commit: b8bda5b (Task 1 - product schema)
- FOUND commit: d26bf12 (Task 2 - siteUser schema)
- FOUND commit: a45ef24 (Task 3 - schema registration + config wiring)
- TypeScript: PASS (zero errors)
- Build: PASS (compiled successfully in 3.1min)

---
*Phase: 02-data-layer*
*Completed: 2026-03-02*
