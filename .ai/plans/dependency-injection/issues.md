# Plan Review — Resolved Issues

All issues from the initial review have been addressed in the updated plan.

## Resolved

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | High | Module-level `Map` breaks under async/concurrent SDK execution | AsyncLocalStorage with browser fallback stub. ALS scopes context per async execution chain. |
| 2 | High | `global` factories taking `factory(args)` are unsound | Global factories use `() => T` (no args). Args-dependent providers must use `executionScope`. |
| 3 | High | Lazy factory resolution during discovery sees partial args | Provider execution deferred to handler phase. `inject()` throws during middleware/init. |
| 4 | Medium | Type merge `&` produces intersection, not override semantics | Same-level duplicates forbidden (type error). Child-shadows-parent uses `Omit` for override semantics. |
| 5 | Medium | SDK clones don't match identity-based lookup | ALS handles execution scoping. CLI parameter is a type-level witness only. |
| 6 | Medium | Testing section inconsistent with current test harness API | Fixed to `new TestHarness(cli)`. Setup/teardown pattern hides ALS as implementation detail. |
| 7 | Medium | Change surface underestimated for 5th generic | AnyCLI pass as prerequisite. Full file list updated including `composable-builder.ts`. |

## Plan Inconsistencies (also fixed)

| Issue | Fix |
|-------|-----|
| `export const app = ... .forge()` invalid — `forge()` returns `Promise<TArgs>` | Example now shows `await app.forge()` as a standalone call |
| Test example missing child context for `target` | Mock now includes `target` in args and `commandChain: ['deploy']` |
| `updateConfig` provenance note | Removed — routes to existing parser config behavior, no new mechanism needed |
