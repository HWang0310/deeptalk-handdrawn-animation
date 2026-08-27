# DeepTalk Hand-drawn Animation

An independent R&D repository for a local, deterministic, SVG-first hand-drawn animation renderer. It creates short 16:9 explainers from explicit JSON scene specifications, without API keys or DeepTalk Core integration.

## V1.1 input and output

Input: a local scene spec with canvas, elements, stroke/fill style, text, timed reveal order, and duration.

Output: deterministic SVG/PNG frame states, local MP4, final-frame PNG, contact sheet, and machine-QA JSON. Generated media remains under ignored `output/`.

The preserved V1 baseline is local at `output/v1/benchmarks/<benchmark-id>/`; V1.1 renders are at `output/v1.1/benchmarks/<benchmark-id>/`. Their QA evidence is at `output/v1/qa/benchmark-qa.json` and `output/v1.1/qa/benchmark-qa.json`. Side-by-side final-frame comparisons and the original primitive vocabulary sheet remain local under `output/compare/` and `output/v1.1/primitives/`.

V1.1 keeps explicit scene specifications, then adds an optional seeded organic profile, varied reveal easing/fill timing, and warning-only composition metadata. It does not use Remotion or a hand-overlay dependency.

## Development

```bash
npm install
npm test
npm run lint
npm run render:benchmarks
npm run render:v11
npm run render:primitives
npm run qa:benchmarks
npm run qa:v11
```

Read `docs/INDEX.md` for the audited evidence, architecture decision, benchmark, and QA boundaries.
