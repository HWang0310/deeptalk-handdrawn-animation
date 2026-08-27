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
