# Quality

## Machine QA can verify

- scene duration is 3–10 seconds and frame count matches the requested FPS;
- element bounds stay within the canvas with a safety margin;
- all declared labels have a non-empty text value and supported fallback font stack;
- reveal intervals are monotonic and no element precedes its configured start;
- final frame exposes every required element;
- overlap, density, stroke width, and hand-overlay obstruction risk stay within defined limits.

The current V1 implementation checks protected bounds, reveal ordering, duration, declared Chinese labels, final-frame completion, coarse density, and stroke-width range. It intentionally does not reject every bounding-box overlap: many useful diagrams require a label, path, or inner stroke to overlap a parent object. Scene-level annotations are needed before an automatic collision rule can distinguish those cases.

## Machine QA cannot decide

- whether an illustration feels convincingly hand-drawn;
- whether the chosen metaphor is insightful;
- whether composition looks balanced rather than merely non-overlapping;
- whether pacing is emotionally right for voiceover.

## Human review sheet

Rate each benchmark 1–5 for composition, stroke feeling, reveal rhythm, Chinese readability, final-frame readability, information density, and pacing. Record one concrete revision note per score below 4.
