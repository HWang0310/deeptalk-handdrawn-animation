---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '14099b6e-969c-4189-950b-67a57e78d1a4'
  PropagateID: '14099b6e-969c-4189-950b-67a57e78d1a4'
  ReservedCode1: '659fcb5e-d4ac-49f3-99a1-3ecdc498a76c'
  ReservedCode2: '659fcb5e-d4ac-49f3-99a1-3ecdc498a76c'
---

# Fresh Agent Bootstrap

## Mission

Build and evaluate a standalone, local, deterministic SVG-first renderer for short hand-drawn animation assets. This repository is not connected to DeepTalk Core in V1.

## Non-negotiable boundaries

- Do not modify `/Users/hwang/Movies/Program/DeepTalk/deep-talk-studio`.
- Do not create a cross-plugin contract or Episode-production workflow.
- Do not copy a reference video's characters, fixed composition, prompts, or hand-overlay footage.
- Keep generated MP4, PNG, contact sheets, and QA evidence local and gitignored.
- Keep all claims about references classified as Observed, Inference, or Proposal.

## Working rules

1. Read `PROJECT_STATE.md`, `HANDOFF.md`, and `docs/INDEX.md` before making changes.
2. Preserve deterministic rendering: a fixture plus renderer version must recreate the same SVG and frame sequence.
3. Add a failing Node test before production behavior changes, then run it red and green.
4. Run `npm test`, `npm run lint`, benchmark rendering, and QA before committing.
5. Update `PROJECT_STATE.md` with only verified current facts and append historical decisions to `HANDOFF.md`.

## Renderer boundary

Input is a local JSON scene specification. Output is SVG frame states, raster PNG frames, a local MP4, and machine-QA evidence. Chinese labels stay as SVG text and are checked with an installed local fallback-font stack.