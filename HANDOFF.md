# Handoff

## 2026-08-27 — V1 approved

The user approved an independent `deeptalk-handdrawn-animation` repository using SVG as the primary scene and drawing representation. Canvas/FFmpeg may support rasterization and encoding; Remotion is not a V1 core dependency. Hand overlays are explicitly optional, not a hard requirement. V1 must render and compare seven distinct benchmark types. DeepTalk Core remains frozen and untouched.

## 2026-08-27 — V1 local evidence

The finished prototype uses seven original JSON benchmark fixtures: core object, relationship, causal chain, number/label, process, abstract mechanism, and progressive complexity. It renders declarative SVG scene states with dash-reveal and fill timing, rasterizes via Resvg, then encodes local 12 FPS H.264 MP4 with FFmpeg. All seven scenes passed current machine QA and were visually reviewed through contact sheets and final frames.

The repository is public at `https://github.com/HWang0310/deeptalk-handdrawn-animation`; its `main` branch tracks `origin/main`.

Two real visual defects were detected through that review: arrowheads were visible before the associated stroke, and a lantern glow hid the main object. Both were fixed with tests and re-rendered. Remaining limitations: strokes are too uniform to look fully organic, diagrams are intentionally sparse, automatic collision QA cannot infer whether overlaps are semantically intended, and no hand overlay or arbitrary illustrative asset pipeline exists in V1.

## 2026-08-27 — V1.1 visual-quality iteration complete

V1.1 retains the V1 fixtures as its control and derives a same-content seven-scene set under `v11Benchmarks`. The drawing layer alone reads the optional `style.organic` profile: a stable seed drives minor path-number perturbation, a per-element width variation, and a low-opacity duplicate sketch layer. The same scene and seed produce the same SVG/frame output. Text is deliberately excluded from this treatment so Chinese labels remain legible.

The repository now includes a first original vocabulary of 15 composable primitives plus a rendered sheet: person, building, document, money bag, light bulb, cloud, factory, screen, simple chart, emotion mark, arrow family, circle annotation, underline, cross-out, and emphasis strokes. No reference-video graphic was copied.

Composition assistance is deliberately narrow. QA warns about unannotated object collision candidates, small text/object spacing, missed focus areas, and short final holds; protected-edge and maximum-density rules remain hard mechanical QA. `composition.semanticOverlaps` lets a scene declare a deliberate pair; schema validation rejects unknown annotation IDs. Warnings never alter a scene or claim semantic/aesthetic understanding.

V1 uses `output/v1/`; V1.1 uses `output/v1.1/`. Both local QA reports contain 7 scenes and 0 failures (V1 has 8 warnings; V1.1 has 0 after explicitly annotating the intentional lantern/glow overlap). Side-by-side comparison frames and a contact sheet are local in `output/compare/`. The visual inspection found V1.1 visibly less mechanically uniform at original size, while preserving Chinese and final-frame readability. The change is intentionally restrained, so a no-overlay baseline remains a credible option. No user aesthetic choice is required for this iteration. Hand overlay remains an optional, unimplemented experiment. DeepTalk Core was not modified.

## 2026-08-27 — V1.2 scene richness

V1.2 adds explicit group/layer/role metadata and four deterministic composition patterns. Four richer original scenes render locally under `output/v1.2/benchmarks/`; V1/V1.1 remain regression controls. Scene QA remains warning-only for composition candidates, and no scene is auto-rearranged. DeepTalk Core remains untouched.

## 2026-09-02 — DT-HD-CV1-002 primitive-sheet validation correction

The Contract V1 accepted pin exposed a plugin-local fixture regression: adding `role-person` and `resource-stack` raised the vocabulary to 17 items, while the primitive sheet still used a fixed five-column layout whose fourth row crossed the protected 1920×1080 bounds. Existing hard machine QA correctly rejected the sheet.

The correction retains all 17 primitives, the 1920×1080 canvas, the existing 0.82 primitive scale, and all QA rules. A minimal deterministic six-column/three-row grid keeps primitives and Chinese labels visible inside the protected canvas margin. New tests require complete `primitiveNames` coverage, one readable label per primitive, `runQa(primitiveSheet).passed === true`, and zero bounds-overflow findings, so a future vocabulary addition cannot silently move a row outside the canvas.

All repository validation gates passed after the correction: 77 unit tests, 14 real integration tests, lint, the primitive-sheet render, and the V1, V1.1, V1.2, V1.3, and common-brief render/QA suites. Original-resolution review found no clipping or unreadable labels. No Contract schema, runner semantics, dependency, lockfile, Core source/configuration, or Core pin changed.
