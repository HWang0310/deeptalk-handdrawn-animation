# Project State

## Current truth

- Repository: `deeptalk-handdrawn-animation`, branch `main`, public remote `https://github.com/HWang0310/deeptalk-handdrawn-animation` (main tracks `origin/main`).
- Stage: V1 SVG-first deterministic prototype has been rendered and verified locally.
- Scope: local 16:9, 3–10 second hand-drawn explainer assets; seven benchmark scene types.
- Core choice: SVG scene model and deterministic frame states; Canvas is not a V1 scene model. FFmpeg encodes local PNG frames when available.
- No DeepTalk Core source, configuration, or git state has been modified.
- Generated media is deliberately gitignored under `output/`; nested benchmark artifacts are covered by the verified `output/` rule.

## Verified external context

- Node v24, FFmpeg v9, and Python 3.14 are available locally.
- The local reference directory contains five MP4 files, research reports, transcript material, and key-frame contact sheets; it contains no implementation HTML, JavaScript, SVG, Canvas, or Remotion source.

## Verified V1 evidence

- Seven original benchmarks rendered as 1920×1080 H.264 MP4: 4s, 5s, 6s, 4s, 6s, 7s, and 8s respectively.
- `output/qa/benchmark-qa.json` reports 7 total benchmarks and 0 machine-QA failures.
- Contact sheets and final frames were visually reviewed. A floating arrowhead issue and an opaque glow covering the lantern were found, fixed under regression tests, and re-rendered.
- The current renderer is strongest on sparse diagrams, labels, relationships, process, and simple mechanisms. It does not yet provide organic stroke variation, rich illustration primitives, automated semantic composition, or reliable automatic distinction between intentional and accidental overlaps.

## Next recommendation

V1.1 should add deterministic roughened stroke variants, richer original primitive packs, collision candidates annotated at scene-spec level, and a structured human aesthetic review record.
