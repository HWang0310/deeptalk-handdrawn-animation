# V1.2 Scene Richness & Semantic Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic composition grammar and four readable complex hand-drawn benchmark scenes.

**Architecture:** Scene groups retain explicit positions and reveal times. `composition.js` creates ordinary existing elements plus group metadata; the renderer respects declared layers, and QA only emits visual-risk warnings. Complex fixtures use the same SVG → Resvg → FFmpeg pipeline as V1/V1.1.

**Tech Stack:** Node.js ESM, Node test runner, Resvg, FFmpeg.

**Spec:** `docs/superpowers/specs/2026-08-27-v12-scene-richness-design.md`

## Global Constraints

- Preserve V1 and V1.1 fixtures and rerun them as regression controls.
- Keep scene specifications explicit and deterministic; no LLM layout or auto-repositioning.
- Render media locally under ignored `output/`.
- Do not modify DeepTalk Core, add Remotion, add an Episode workflow, or create a Plugin Contract.

---

### Task 1: Scene group metadata and layer ordering

**Files:** Modify `src/schema.js`, `src/svg.js`; modify `test/schema.test.js`, `test/svg.test.js`.

**Interfaces:** `scene.groups -> [{id, layer, role}]`; `element.groupId -> string`; `compileSvg(scene, timeMs) -> string`.

- [ ] Add a failing schema test that rejects a duplicate group ID and an element that names an unknown group.
- [ ] Run `node --test test/schema.test.js` and observe the expected missing validation failure.
- [ ] Validate group IDs, layers (`background|middle|foreground`), roles (`focal|support|context`), and group references without changing element geometry.
- [ ] Add a failing SVG test where a foreground element declared earlier than a background element still renders after it.
- [ ] Sort SVG drawing order by declared layer with stable original-order tie breaking; run relevant tests green.

### Task 2: Composition grammar and selected primitive expansion

**Files:** Create `src/composition.js`, `test/composition.test.js`; modify `src/primitives.js`, `test/primitives.test.js`.

**Interfaces:** `compositionPatternNames -> string[]`; `createCompositionPattern(name, options) -> scene fragment`; `createPrimitive('role-person'|'resource-stack', options) -> element[]`.

- [ ] Write failing tests requiring the four named composition patterns, deterministic fragments, group/role metadata, and selected new primitive family coverage.
- [ ] Run `node --test test/composition.test.js test/primitives.test.js` and observe module/primitive failures.
- [ ] Implement role-person and resource-stack as original ordinary SVG compositions.
- [ ] Implement four pattern builders that return groups, elements, `focusArea`, `readingOrder`, and explicit reveal order.
- [ ] Rerun tests green and validate every generated fragment against schema after it is embedded in a scene.

### Task 3: Warning-only complex composition QA

**Files:** Modify `src/qa.js`, `test/qa.test.js`.

**Interfaces:** `runQa(scene) -> {passed, checks, findings, warnings}`; `checks.compositionWarnings -> number`.

- [ ] Write failing QA tests for group spacing, weak focal dominance, text/object competition, arrow crossing, reading-order violation, dense cluster, and final-frame overload.
- [ ] Run `node --test test/qa.test.js` and observe each new warning is absent.
- [ ] Implement geometry-only candidate checks; never mutate the scene and never turn these composition checks into failures.
- [ ] Rerun QA tests green and verify V1/V1.1 still have no failures.

### Task 4: Complex benchmark fixtures and deterministic render targets

**Files:** Create `fixtures/complex-benchmarks.js`; modify `src/cli.js`, `package.json`, `test/cli.test.js`, `test/benchmarks.test.js`.

**Interfaces:** `complexBenchmarks -> scene[]`; CLI `qa-complex-benchmarks`, `render-complex-benchmarks`; outputs `output/v1.2/complex-benchmarks/<id>/`.

- [ ] Write failing tests requiring the four IDs: `cause-mechanism-outcome`, `multi-actor-relation`, `accumulation-pressure`, and `before-after-transition`.
- [ ] Run the focused tests and observe missing fixture/command failures.
- [ ] Build the four original scenes from the composition grammar with at least three groups, a focal group, Chinese labels, staged motion, and 800 ms final hold.
- [ ] Add CLI targets and rerun tests green.

### Task 5: Render review, regressions, documentation, and release

**Files:** Modify `README.md`, `PROJECT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md`, `HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/BENCHMARKS.md`, `docs/QUALITY.md`, `docs/INDEX.md`.

- [ ] Render V1, V1.1, V1.2 complex benchmarks, and generate a local complex contact sheet/final-frame review evidence.
- [ ] Run `npm test`, `npm run lint`, all three QA commands, `ffprobe`, `git diff --check`, and inspect actual rendered frames.
- [ ] Document only observed richness/readability results and limitations; update project memory/roadmap/changelog/handoff.
- [ ] Commit, push `origin/main`, verify the remote HEAD matches local HEAD, and confirm a clean working tree.
