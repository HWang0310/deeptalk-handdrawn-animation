# Project State

## Current truth

- Repository: `deeptalk-handdrawn-animation`, branch `main`, public remote `https://github.com/HWang0310/deeptalk-handdrawn-animation` (main tracks `origin/main`).
- Stage: V1.2 scene-richness iteration adds explicit group/layer composition grammar and four rendered complex benchmarks.
- Scope: local 16:9, 3–10 second hand-drawn explainer assets; seven benchmark scene types.
- Core choice: SVG scene model and deterministic frame states; Canvas is not a V1 scene model. FFmpeg encodes local PNG frames when available.
- No DeepTalk Core source, configuration, or git state has been modified.
- Generated media is deliberately gitignored under `output/`; nested benchmark artifacts are covered by the verified `output/` rule.

## Verified external context

- Node v24, FFmpeg v9, and Python 3.14 are available locally.
- The local reference directory contains five MP4 files, research reports, transcript material, and key-frame contact sheets; it contains no implementation HTML, JavaScript, SVG, Canvas, or Remotion source.

## Verified V1 baseline

- Seven original benchmarks rendered as 1920×1080 H.264 MP4: 4s, 5s, 6s, 4s, 6s, 7s, and 8s respectively.
- `output/v1/qa/benchmark-qa.json` reports 7 total benchmarks and 0 machine-QA failures.
- Contact sheets and final frames were visually reviewed. A floating arrowhead issue and an opaque glow covering the lantern were found, fixed under regression tests, and re-rendered.
- The baseline's clean, uniform stroke language is deliberately retained as the control version.

## Verified V1.1 evidence

- The same seven original benchmark scenes render at the same 1920×1080 target durations under `output/v1.1/benchmarks/`; `output/v1.1/qa/benchmark-qa.json` reports 7 total scenes, 0 failures, and 0 warnings. The corresponding V1 report has 8 warnings and 0 failures; V1.1 marks the intentional lantern/glow overlap explicitly.
- Side-by-side local final frames and `output/compare/contact-sheet-v1-v11.png` were inspected. V1.1 adds a restrained second sketch pass and coordinate/width irregularity on drawing primitives while Chinese text remains unfiltered and crisp.
- `output/v1.1/primitives/primitive-vocabulary/` renders a 15-item original, composable primitive sheet: person, building, document, money bag, bulb, cloud, factory, screen, chart, emotion mark, arrow family, circle annotation, underline, cross-out, and emphasis strokes.
- V1.1 motion uses varied ease-out, ease-in-out, and linear stroke reveals; local fills enter at deliberately varied late phases; every benchmark keeps at least a 700 ms final hold.
- Composition assistance is warning-only for collision candidates, text spacing, focus-area coverage, semantic-overlap annotations, and final hold. Existing protected-edge and maximum-density rules remain hard mechanical QA, not automatic aesthetic layout.

## Current limitations and next recommendation

- The organic treatment is controlled, not a freehand simulation: curved paths can still feel geometric, duplicate strokes become too busy if amplified, and line joins remain SVG joins rather than pressure-sensitive pen behavior.
- The primitive vocabulary is intentionally icon-scale. It does not yet cover character poses, perspective scenes, or arbitrary illustrations. Hand overlay remains unimplemented because it is optional, not a V1.1 blocker.
- Keep SVG-first for the next measured iteration. Before adding Remotion, benchmark a genuinely timeline-heavy scene; before adding an overlay, test it only on a small number of assets and compare readability against the no-overlay control.
- V1.2 evidence is local at `output/v1.2/benchmarks/`: cause/mechanism/outcome, multi-actor relation, accumulation/pressure, and before/after transition. All four passed mechanical QA; composition warnings remain review candidates rather than automatic layout.
- V1.3 renders six sanitized near-production briefs under `output/v1.3/benchmarks/`; all reuse existing V1.2 grammar without new primitives or grammar extensions.
