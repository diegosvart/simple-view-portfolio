# Frontend Root Test Harness

This folder contains the initial automated test harness for the root frontend (`index.html`).

## Run

```powershell
npm run test:frontend-root
```

## Current coverage

- Smoke checks for root frontend anchors in `index.html`.
- Pure-function unit tests for markdown scalar normalization.
- Pure-function unit tests for constants/validation normalization and duplicate detection.

## Extracted pure modules

- `src/frontend-root/pure/constants.js`
- `src/frontend-root/pure/validation.js`

## Next test targets

- Parsing/serialization round-trip tests.
- Metrics aggregation tests.
- Maintainer UX state transition tests.
