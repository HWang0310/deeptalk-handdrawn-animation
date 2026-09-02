# DeepTalk Hand-drawn Animation

An independent local, deterministic, SVG-first hand-drawn visual plugin. It creates short 16:9 explainers from explicit scene/Contract requests without API keys and keeps DeepTalk Core as a separate consumer rather than an imported runtime dependency.

## Current Accepted Runtime

- Contract: `visual-asset-plugin-contract/1`
- Runtime behavior baseline: `853618bdf19ae66ec393211b77d970911f53f4bc`
- Canonical runner: `node src/contract-runner.js`
- Status: `ACCEPTED / IMPLEMENTED_UNRELEASED`
- DeepTalk compatibility reference: `HWang0310/deep-talk-studio` accepted Phase 5 baseline `db172cecc60ca6b0c276ec42010b113a767bc7b3`

Repository governance rule: `main` represents the latest plugin-local accepted stable runtime. New optimization/fix work starts from `main` on an isolated task branch. Plugin-local acceptance does **not** authorize DeepTalk Core to repin automatically; DeepTalk Nexus performs a separate integration review.

See [docs/DEEPTALK-INTEGRATION.md](docs/DEEPTALK-INTEGRATION.md) before any renderer, Contract-runner, or quality change.

## Current reliability blocker

Synthetic Contract validation passes at the accepted runtime baseline, but the limited real-A-roll Phase 6 owner demo exposed a plugin-local generation-completeness defect:

- suitability can return `SUITABLE` for a mechanism opportunity;
- generation can render a frame sequence;
- the run can stop before completing the Contract-required final media/manifest;
- DeepTalk Core correctly treats that operation as generation failure and exposes no `READY` candidate.

This must be fixed **without weakening Contract V1 or Core acceptance** before broad aesthetic optimization is considered complete.

## Renderer input and output

The underlying renderer uses a local scene spec with canvas, elements, stroke/fill style, text, timed reveal order, and duration.

Renderer output includes deterministic SVG/PNG frame states, local MP4, final-frame PNG, contact sheet, and machine-QA JSON. Generated media remains under ignored `output/` or task-local ignored artifact roots.

The renderer supports the preserved V1/V1.1/V1.2/V1.3 benchmark families and the current 17-item primitive vocabulary. V1.1 adds an optional seeded organic profile, varied reveal easing/fill timing, and warning-only composition metadata. It does not require Remotion or a hand-overlay dependency.

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
node src/contract-runner.js --version
```

Read [PROJECT_STATE.md](PROJECT_STATE.md), [docs/INDEX.md](docs/INDEX.md), and [docs/DEEPTALK-INTEGRATION.md](docs/DEEPTALK-INTEGRATION.md) for current truth, evidence, and DeepTalk compatibility requirements.
