# Architecture

## Decision

V1 uses declarative JSON scene specifications compiled to SVG at a requested frame time. Every element has an identifier, bounded geometry, style, reveal window, and optional fill phase. The renderer therefore has a deterministic scene state at every time `t`; an SVG rasterizer writes PNGs and FFmpeg encodes them into a local MP4.

```text
scene fixture JSON
  -> schema validation
  -> SVG frame compiler at t
  -> PNG rasterizer
  -> FFmpeg MP4/contact sheet
  -> machine QA JSON + human review sheet
```

## Model comparison

| Model | Visual quality | Stability / Chinese | QA / repeatability | Cost / V1 decision |
| --- | --- | --- | --- | --- |
| SVG deterministic drawing | High for diagrams and stylized primitives | High | High | selected |
| Canvas procedural drawing | Medium–high | Medium | Medium | later experiment |
| Remotion composition | High for complex sequencing | High | High | defer dependency |
| Still image + mask/reveal | Medium | text risk | Medium | adapter only |
| Hybrid SVG + approved still | Potentially high | SVG protects text | Medium | V2 candidate |

## Element rules

- A scene has a 1920×1080 virtual canvas, off-white background, and duration from 3 to 10 seconds.
- Draw primitives include paths, boxes, circles, arrows, labels, numbers, and grouped containers.
- Each element's stroke is exposed through `stroke-dashoffset`; fill opacity begins only after the configured line phase.
- Chinese is SVG `<text>` using a local fallback stack. The renderer records text bounds for QA; it never asks an image model to spell labels.
- No external API, randomness, or external image asset is required for V1.

## Known boundary

This system cannot make rich, organic character illustrations from an arbitrary prompt. V1 prioritizes readable explanatory grammar over illustration fidelity. Optional approved raster backgrounds can be added later, after independent QA.
