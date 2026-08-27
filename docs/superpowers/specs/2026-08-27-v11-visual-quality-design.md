# V1.1 Visual Quality Design

## Goal

Improve the perceived hand-drawn quality of the existing SVG-first renderer while keeping the same seven V1 benchmark scenes, deterministic output, local-only rendering, and explicit scene specifications.

## Decisions

V1 fixtures remain the canonical baseline. `v11Benchmarks` is a derived, same-content fixture set that adds a scene-level `organic` style profile, a stable seed, varied reveal easing/fill timing, and a defined final hold. The V1 renderer output is preserved under `output/v1/`; V1.1 renders to `output/v1.1/`.

`src/organic.js` supplies stable seeded values and controlled path-number perturbation. `src/svg.js` applies this only to draw primitives: a small deterministic coordinate wobble, per-element width variation, rounded/imperfect duplicate sketch layer, and optional endpoint displacement. Text remains unfiltered to protect Chinese readability.

`src/primitives.js` creates original, composable element arrays for common explainers. A separate primitive-sheet scene demonstrates the vocabulary; the seven regression scenes are not replaced. Composition QA adds warnings for collision candidates, text/object spacing, focus-area coverage, semantic-overlap annotations, and final hold; protected-edge and maximum-density remain hard mechanical checks. Warnings remain recommendations, not claims of aesthetic understanding.

## Error handling and QA

Unknown primitive names, invalid organic settings, and invalid semantic-overlap references are rejected by validation. Composition issues enter `warnings`, while geometry/timeline violations remain QA failures. A warning cannot silently mutate a scene.

## Testing and evidence

Tests prove seeded perturbation stability, seed divergence, clean text behavior, primitive catalog coverage, V1.1 fixture identity preservation, varied reveal timings, and QA warning behavior. Render both versions of all seven benchmarks, inspect side-by-side final-frame and contact-sheet evidence, and retain all media locally only.

## Boundaries

No DeepTalk Core modification, no plugin contract, no automatic semantic layout, no generative image dependency, and no required hand-overlay work. A hand overlay may be explored only if visual evidence indicates it is useful after the core quality work.
