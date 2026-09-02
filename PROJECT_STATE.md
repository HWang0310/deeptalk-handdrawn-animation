---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '071784dd-d76e-4249-8cdb-eacbd9ab518a'
  PropagateID: '071784dd-d76e-4249-8cdb-eacbd9ab518a'
  ReservedCode1: '86393322-a311-49b4-8bf4-e23fb67b7e05'
  ReservedCode2: '86393322-a311-49b4-8bf4-e23fb67b7e05'
---

# Project State

> Current operational truth. GitHub remote and exact reviewed SHAs override chat or local workspace claims.

## Identity

| Field | Current truth |
| --- | --- |
| Repository | `HWang0310/deeptalk-handdrawn-animation` |
| Stable branch | `main` |
| Runtime behavior baseline | `853618bdf19ae66ec393211b77d970911f53f4bc` |
| Stage | Contract V1 runner `ACCEPTED / IMPLEMENTED_UNRELEASED`; real-generation reliability fix is the next gate before broad visual optimization |
| Canonical runner | `node src/contract-runner.js` |
| Product boundary | Independent Hand-drawn Animation plugin; DeepTalk Core is a separate consumer and may repin only after Nexus integration review |
| Renderer choice | Local deterministic SVG-first scene model with FFmpeg/resvg-based artifact generation |

## Governance

- `main` represents the latest plugin-local accepted stable runtime plus governance-only updates.
- New engineering work starts from `main` on an isolated task branch and follows the current `HWang0310/engineering-journal` standards.
- `AGENTS.md` defines mandatory bootstrap and project-specific rules.
- `docs/DEEPTALK-INTEGRATION.md` is the non-negotiable DeepTalk compatibility gate.
- Plugin-local acceptance never updates DeepTalk Core automatically. The plugin returns an exact SHA to DeepTalk Nexus for independent integration review.

## Verified renderer baseline

- Local deterministic 1920×1080 H.264 benchmark rendering is established across the V1/V1.1/V1.2/V1.3 benchmark families.
- The renderer uses explicit SVG scene/frame states; generated media is local and gitignored.
- The current primitive vocabulary contains 17 registered items, including role/person and resource-stack variants.
- The accepted validation correction keeps the complete primitive sheet inside the unchanged 1920×1080 canvas with existing scale and hard bounds QA.
- Plugin-native validation at the accepted runtime baseline included unit tests, real Contract integration tests, lint, primitive-sheet rendering, benchmark rendering, and QA.

## Contract V1 runtime

- `src/contract-runner.js` owns the standalone `visual-asset-plugin-contract/1` boundary.
- It implements strict request validation, dynamic suitability, proposal/candidate identity, output-root containment, deterministic scene binding, atomic result writing, and fail-closed dependency/path behavior.
- DeepTalk Phase 5 synthetic integration accepted this exact runtime baseline.

## Current real-generation blocker

Limited real-A-roll Phase 6 owner-visible evidence exposed a plugin-local generation-completeness defect that synthetic validation did not reveal:

- a real mechanism opportunity can return `SUITABLE`;
- generation can render a frame sequence (the observed run produced 91 frames);
- the operation can fail before completing the Contract-required final media/manifest;
- DeepTalk Core correctly records generation failure and exposes no `READY` candidate.

This is the next mandatory engineering gate. Do **not** weaken Contract V1, Core acceptance, or artifact requirements to turn the failure into a false PASS.

## Required next sequence

### Stage 1 — reliability first

- reproduce the real generation-completeness failure with a sanitized dynamic Contract V1 request representative of the Phase 6 shape;
- add a failing regression;
- complete final media + manifest generation for valid mechanism requests;
- preserve fail-closed behavior and all existing path/primitive-sheet QA;
- pass native tests/lint/render/QA and DeepTalk compatibility checks.

### Stage 2 — visual quality after reliability PASS

- improve expressiveness/readability of project-owned primitives and compositions;
- improve motion rhythm and primitive combinations;
- expand supported semantic grammar carefully;
- prefer `ABSTAIN` over filler when no useful grammar exists;
- provide creator-visible before/after media/contact sheets for Owner review.

## Current next gate

Start an independent Hand-drawn Curator session from repository Recovery Issue #1. The first formal implementation task must address the real generation-completeness blocker before broad aesthetic optimization is accepted. Any new runtime handed back to DeepTalk requires an exact SHA, native validation, Contract V1 compatibility, and an independent DeepTalk Nexus integration review.
