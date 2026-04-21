# Frontend Root Test Harness

This folder contains the initial automated test harness for the root frontend (`index.html`).

## Run

```powershell
npm run test:frontend-root
```

## Current coverage

- Smoke checks for root frontend anchors in `index.html`.
- Pure-function unit tests for markdown scalar normalization.
- Round-trip parsing/serialization tests for markdown project format.
- Invalid-input parsing tests.
- Compatibility test against current `proyectos.md`.
- Pure-function unit tests for constants/validation normalization and duplicate detection.
- Pure-function unit tests for metrics aggregation and bucket level thresholds.

## Extracted pure modules

- `src/frontend-root/pure/constants.js`
- `src/frontend-root/pure/validation.js`
- `src/frontend-root/pure/metrics.js`

## Next test targets

- Maintainer UX state transition tests.
