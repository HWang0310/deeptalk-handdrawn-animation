# V1 / V1.1 Benchmarks

All fixtures are original, local, 16:9, Chinese-friendly, 3–10 second silent B-roll assets. They have no private Episode input and no API key requirement.

| ID | Type | Visual intent | Target duration |
| --- | --- | --- | --- |
| core-object | core object | draw a lantern from outline to glow | 4s |
| relationship | relationship | two roles exchange a clear handoff | 5s |
| causal-chain | causal chain | blockage produces a delayed consequence | 6s |
| number-label | number / label | a metric rises from 32 to 78 | 4s |
| process | process | input moves through three explicit stages | 6s |
| abstract-mechanism | abstract mechanism | feedback pressure loops into a stabilizer | 7s |
| progressive-complexity | progressive complexity | a simple map gains nodes and routes | 8s |

## Comparison questions

For every render, inspect composition, stroke feeling, reveal rhythm, Chinese readability, final-frame readability, information density, and pacing. Machine QA can flag objective constraints; a human review must judge whether the frame feels calm, focused, and explanatory.

## V1 baseline result

All seven local renders completed at their target durations and passed machine QA. Final-frame inspection confirms Chinese labels render in the local fallback font stack and all required elements become visible. The core object and number scenes have the clearest focal hierarchy; relationship, process, and causal-chain scenes make sequence especially legible; the abstract mechanism and progressive-complexity scenes prove that a loop and a small network fit the grammar without becoming crowded.

The baseline line language is clean and calm rather than deeply organic. Arrowheads and translucent fill layering required visual QA fixes during this round. This is evidence that deterministic SVG makes state defects easy to reproduce and correct, but it does not by itself create the irregularity of a human-drawn illustration.

## V1.1 same-scene regression

The seven V1.1 fixtures retain the same IDs, element geometry, labels, scene durations, and core content as V1; only deterministic style/motion/composition metadata changes. V1 renders live at `output/v1/benchmarks/`; V1.1 renders at `output/v1.1/benchmarks/`. Local final-frame pairs and `output/compare/contact-sheet-v1-v11.png` were inspected with V1 on the left and V1.1 on the right.

| Criterion | V1 baseline | V1.1 observed result |
| --- | --- | --- |
| Stroke naturalness | uniform vector outline | restrained wobble, width variation, and visible light double-sketch at original size |
| Composition / focus | same original layout | same layout; focus-area and collision candidates now become QA warnings rather than silent issues |
| Chinese readability | clear | unchanged SVG text, still clear |
| Reveal rhythm | mostly uniform | per-element linear/ease-out/ease-in-out mix and varied fill thresholds |
| Final frame | readable endpoint | same content plus a minimum 700 ms final hold |
| Information density / pacing | sparse-to-moderate | unchanged density; varied timing makes staged scenes less metronomic |

V1.1 passed 7/7 scenes with zero failures and one warning. The texture improvement is real but intentionally limited; it should not be described as a fully freehand renderer. No user selection is required to keep V1.1 as the current baseline.
