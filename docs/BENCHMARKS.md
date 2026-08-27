# V1 Benchmarks

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

## V1 rendered comparison

All seven local renders completed at their target durations and passed machine QA. Final-frame inspection confirms Chinese labels render in the local fallback font stack and all required elements become visible. The core object and number scenes have the clearest focal hierarchy; relationship, process, and causal-chain scenes make sequence especially legible; the abstract mechanism and progressive-complexity scenes prove that a loop and a small network fit the grammar without becoming crowded.

The renderer’s current line language is clean and calm rather than deeply organic: every stroke is still a uniform 8 px vector line. Arrowheads and translucent fill layering required visual QA fixes during this round. This is evidence that deterministic SVG makes state defects easy to reproduce and correct, but it does not by itself create the irregularity of a human-drawn illustration.
