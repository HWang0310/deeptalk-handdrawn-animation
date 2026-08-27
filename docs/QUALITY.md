# Quality

## Machine QA can verify

- scene duration is 3–10 seconds and frame count matches the requested FPS;
- element bounds stay within the canvas with a safety margin;
- all declared labels have a non-empty text value and supported fallback font stack;
- reveal intervals are monotonic and no element precedes its configured start;
- final frame exposes every required element;
- overlap, density, stroke width, and hand-overlay obstruction risk stay within defined limits.

The current V1.1 implementation checks protected bounds, reveal ordering, duration, declared Chinese labels, final-frame completion, coarse density, and stroke-width range. It intentionally does not reject every bounding-box overlap: many useful diagrams require a label, path, or inner stroke to overlap a parent object. Scene-level `composition.semanticOverlaps` annotations identify known deliberate object pairs; unknown IDs are rejected by schema validation.

V1.1 additionally emits non-blocking warnings for unannotated object collision candidates, close text/object spacing, poor focus-area coverage, and a final hold below 600 ms. Protected-edge and maximum-density violations remain hard mechanical findings. Warnings are evidence for review, never automatic scene edits and never a claim that the machine understands intent.

## Machine QA cannot decide

- whether an illustration feels convincingly hand-drawn;
- whether the chosen metaphor is insightful;
- whether composition looks balanced rather than merely non-overlapping;
- whether pacing is emotionally right for voiceover.

## Human review sheet

Rate each benchmark 1–5 for composition, stroke feeling, reveal rhythm, Chinese readability, final-frame readability, information density, and pacing. Record one concrete revision note per score below 4.

For a regression, compare V1 and V1.1 of the same scene side-by-side; do not replace a difficult benchmark. The current local review found the V1.1 texture visible but restrained, preserved text readability, and no final-frame regression. A user aesthetic vote is optional only if a future choice between stronger texture and cleaner geometry becomes material.
