# V1.1 Visual Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver deterministic organic SVG styling, original primitive vocabulary, composition warnings, motion refinement, and side-by-side V1/V1.1 benchmark evidence.

**Architecture:** Baseline fixtures render unchanged to `output/v1`. Derived V1.1 fixtures apply stable organic and motion profiles. The SVG compiler reads the profile, `organic.js` creates deterministic perturbations, primitives compile to existing element types, and QA emits warnings without claiming automatic aesthetic judgement.

**Tech Stack:** Node.js ESM, Node test runner, Resvg, FFmpeg.

**Spec:** `docs/superpowers/specs/2026-08-27-v11-visual-quality-design.md`

## Global Constraints

- Retain all seven V1 benchmark IDs and semantic scene contents.
- Same scene plus same seed must produce identical SVG output.
- Render locally; keep media under ignored `output/`.
- Do not modify DeepTalk Core or introduce Remotion.

---

### Task 1: Deterministic organic style profile

**Files:** Create `test/organic.test.js`, `src/organic.js`; modify `src/svg.js`, `test/svg.test.js`.

**Interfaces:** `seededValue(seed, channel, min, max) -> number`; `wobblePathData(d, seed, amplitude) -> string`; `resolveOrganic(scene, element) -> profile`.

- [x] Write tests showing same seed gives the same numeric/path output, a different seed changes it, and absent profile leaves the path unchanged; run `npm test -- test/organic.test.js` and observe module-not-found failure.
- [x] Implement stable hashing, bounded deterministic values, limited numeric-path perturbation, and inherited profile resolution; rerun until green.
- [x] Write an SVG test that requires a duplicate sketch layer for an organic path while Chinese text remains unfiltered; run it red, then apply the renderer change and run green.
- [x] Include the organic profile in the release commit.

### Task 2: Original primitive vocabulary

**Files:** Create `test/primitives.test.js`, `src/primitives.js`, `fixtures/primitive-sheet.js`.

**Interfaces:** `primitiveNames -> string[]`; `createPrimitive(name, options) -> element[]`; `primitiveSheet -> scene`.

- [x] Write a test requiring person, building, document, money bag, bulb, cloud, factory, screen, chart, emotion, arrow, annotation, underline, cross-out, and emphasis primitives; run red.
- [x] Implement only original SVG-element compositions and the local sheet scene; rerun green and validate the sheet.
- [x] Include catalog behavior in the release commit.

### Task 3: Motion profile and same-scene regression fixtures

**Files:** Modify `fixtures/benchmarks.js`, `test/benchmarks.test.js`, `src/svg.js`.

**Interfaces:** `benchmarks -> scene[]`; `v11Benchmarks -> scene[]`; `revealProgress(element, timeMs) -> {stroke, fill}`.

- [x] Write a test requiring matching V1/V1.1 IDs and distinct seeded organic/motion metadata; run red.
- [x] Derive V1.1 scenes without changing content geometry or labels; add varied easing, fill timing, and at least 600 ms final hold; rerun green.
- [x] Include regression fixtures in the release commit.

### Task 4: Composition assistance warnings

**Files:** Modify `src/qa.js`, `test/qa.test.js`, `docs/QUALITY.md`.

**Interfaces:** `runQa(scene) -> {passed, checks, findings, warnings}`.

- [x] Write tests for unannotated collision candidates, text/object spacing, focus area, semantic overlap annotation, and insufficient final hold; run red.
- [x] Implement warning-only composition assistance without auto-layout or false aesthetic claims; rerun green.
- [x] Include QA improvements in the release commit.

### Task 5: Render comparison and release evidence

**Files:** Modify `src/cli.js`, `README.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md`, `HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/BENCHMARKS.md`.

- [x] Write a CLI test for V1/V1.1 target selection; run red.
- [x] Render all V1 scenes under `output/v1/benchmarks`, V1.1 scenes under `output/v1.1/benchmarks`, plus the primitive sheet; produce local side-by-side final-frame comparison images and QA JSON.
- [x] Run full tests, lint, QA, ffprobe, visual inspection, document only observed evidence, commit, push, and verify a clean tree.
