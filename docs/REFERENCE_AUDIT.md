# Reference Audit

## Files actually examined

The local directory `/Users/hwang/Movies/自媒体创意库/Codex动画参考` was fully inventoried. It contains five MP4 videos, five contact sheets, 91 individual extracted frames, five WAV/SRT/JSON transcript sets, and Markdown research reports. Each MP4 was inspected with `ffprobe`; contact sheets 01–05 were visually inspected. No HTML, JS, SVG, Canvas, Remotion project, or other animation source was present; therefore the references do not prove a specific implementation technology.

| Video | Verified format / duration | Most relevant evidence |
| --- | --- | --- |
| GitHub 小黑插画 | 1670×1080 AV1/AAC, 100.055s | static image/Skill workflow, not animation engine |
| 白板手绘 Skill | 1920×1080 AV1/AAC, 632.488s | SRT timing, staged image-to-video workflow |
| 一个 agent 搞定手绘动画 | 1920×1080 AV1/AAC, 267.703s | semantic storyboard, region reveal, timeline |
| 手绘动画 1.0 | 1920×1080 AV1/AAC, 324.011s | mask-based drawing illusion and deterministic rerender claim |
| 手绘动画 3.0 | 1920×1080 AV1/AAC, 487.211s | SRT-led order, allowed-mask concept, line then color |

## Observed

- Reference frames repeatedly use a light, spacious canvas, thin dark outlines, sparse accent colors, and a readable end hold.
- Explainers reveal a single concept through an ordered path, diagram, relationship, or scene rather than dumping all objects together.
- The 3.0 material explicitly presents staged review, SRT-led duration, and order-aware reveal.
- The hand overlay is visible in some frames but is not universal to all reference material.

## Inference

- A deterministic vector scene model is a natural fit for the observed explanatory grammar because it can encode reveal order and preserve Chinese text.
- A simple physical metaphor works best when the visual has one cognitive focus.

## Proposal

- V1 will use original geometric primitives, neutral palette, independent composition, and no copied characters, fixed layouts, prompts, or hand-overlay footage.
- SVG state and FFmpeg output will test which parts of the grammar can be reproduced locally; the results will not claim the same internal technology as the videos.
