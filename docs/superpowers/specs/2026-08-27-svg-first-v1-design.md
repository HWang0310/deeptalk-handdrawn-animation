# SVG-first Hand-drawn Animation V1 Design

## Goal

Prove that a standalone local renderer can create original, repeatable, visually coherent hand-drawn explanatory animation assets without a video model, DeepTalk Core integration, or a hand-overlay requirement.

## Scope

The project accepts local scene fixtures and emits SVG frame states, PNG frames, MP4 assets, contact sheets, and QA evidence for seven benchmarks. It deliberately excludes prose-to-scene planning, a universal plugin contract, episode production, auto-editing, and arbitrary complex illustrations.

## Architecture

`schema.js` validates an explicit scene model. `svg.js` compiles a time-specific scene into SVG using dash-reveal and fill timing. `render.js` uses Resvg to rasterize frames and FFmpeg to encode MP4. `qa.js` assesses bounds, timing, visible final state, text declarations, density, and stroke rules. Fixtures are executable benchmark definitions.

## Error handling

Invalid scene data is rejected before rasterization: missing IDs, bad time intervals, out-of-range duration, unknown primitive, absent text, or unsafe bounds. Encoding failure preserves frames and returns the FFmpeg error. QA always reports failures as evidence; it does not silently adjust the scene.

## Testing

Node's built-in test runner will drive schema validation, SVG reveal state, Chinese text escaping, QA findings, benchmark coverage, and local render output. Tests are written and observed failing before each corresponding production module.

## Constraints

- 1920×1080 virtual 16:9 canvas; 3–10 seconds; fixed 12 FPS preview encoding.
- Local only; no API key; no external images; no image generation in the render loop.
- Generated media is gitignored.
- DeepTalk Core is read-only and remains unmodified.
