# DeepTalk Hand-drawn Animation

An independent R&D repository for a local, deterministic, SVG-first hand-drawn animation renderer. It creates short 16:9 explainers from explicit JSON scene specifications, without API keys or DeepTalk Core integration.

## V1 input and output

Input: a local scene spec with canvas, elements, stroke/fill style, text, timed reveal order, and duration.

Output: deterministic SVG/PNG frame states, local MP4, final-frame PNG, contact sheet, and machine-QA JSON. Generated media remains under ignored `output/`.

The rendered V1 evidence is local at `output/benchmarks/<benchmark-id>/`; benchmark QA is at `output/qa/benchmark-qa.json`.

## Development

```bash
npm install
npm test
npm run lint
npm run render:benchmarks
npm run qa:benchmarks
```

Read `docs/INDEX.md` for the audited evidence, architecture decision, benchmark, and QA boundaries.
