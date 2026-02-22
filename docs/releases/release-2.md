# FiceCal MCP Release 2 (v0.2.0)

## Summary

This release aligns MCP runtime economics with FiceCal calculator behavior and hardens parity guarantees.

## Included updates

### Runtime parity and economics logic

- Added deterministic integer-range economic scan:
  - `scanEconomicRange(arpu, maxN, model)`
- Added shared cost helper:
  - `totalCostAtClients(n, model)`
- Switched break-even and strategic recommendation context to deterministic scan results.
- Fixed unit mismatch risk by using minimum **unit** cost context for strategic guidance.
- Aligned zero-infra CCER handling to `Infinity` semantics.
- Applied finite-only CCER penalty logic in health scoring.
- Allowed zero-value cost inputs (`devPerClient=0`, `infraTotal=0`) consistently in model derivation paths.

### Packaging and docs

- Updated MCP package version to `0.2.0` in `server/package.json`.
- Added/updated `.readthedocs.yaml` for docs build automation.
- Updated README with official FiceCal naming and Release 2 bundle notes.

## Validation

Executed in `server/`:

- `npm run check`
- `npm run test`
- `npm run test:parity`

All passed for Release 2 cut.

## Companion release

- Product companion release: `ficecal-v2.0.0` in `duksh/finops-calculator`.
