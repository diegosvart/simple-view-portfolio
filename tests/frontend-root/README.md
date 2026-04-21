# Frontend Root Test Harness

This folder contains the initial automated test harness for the root frontend (`index.html`).

## Run

```powershell
npm run test:frontend-root
```

## Current coverage

- Smoke checks for root frontend anchors in `index.html`.
- Pure-function unit tests for markdown scalar normalization.

## Next test targets

- Parsing/serialization round-trip tests.
- Validation and duplicate detection tests.
- Metrics aggregation tests.
- Maintainer UX state transition tests.
