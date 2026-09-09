---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '7617cf7d-3695-484f-b81b-291381041f6f'
  PropagateID: '7617cf7d-3695-484f-b81b-291381041f6f'
  ReservedCode1: 'd632913c-8e4b-4e45-b6fc-d1578eb4a164'
  ReservedCode2: 'd632913c-8e4b-4e45-b6fc-d1578eb4a164'
---

# Project State

> Current operational truth. GitHub remote and exact reviewed SHAs override chat or local workspace claims.

## Identity

| Field | Current truth |
| --- | --- |
| Repository | `HWang0310/deeptalk-handdrawn-animation` |
| Stable branch | `main` |
| Runtime behavior baseline | `853618bdf19ae66ec393211b77d970911f53f4bc` |
| Stage | Contract V1 runner `ACCEPTED / IMPLEMENTED_UNRELEASED`; Stage 1 reliability fix accepted and pending DeepTalk Nexus integration review |
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

### Root cause (DT-HD-CV1-003, established 2026-09-09)

DeepTalk Core uses `subprocess.Popen(timeout=120, start_new_session=True)` to run the plugin. When the timeout fires, Core sends SIGTERM to the entire process group via `os.killpg()`. The Node process had **no SIGTERM handler**, so it exited immediately (default behavior) without writing `result.json` — even though frames had already been rendered to disk. Core correctly recorded this as a `non_zero_exit` generation failure with no `READY` candidate.

The original Phase 6 evidence is consistent with this mechanism:
- 91 frames were rendered (frame rasterization completed before timeout);
- the operation failed before completing the Contract-required final media/manifest (ffmpeg was interrupted by the same SIGTERM);
- DeepTalk Core correctly records generation failure and exposes no `READY` candidate.

### Fix (accepted on `fix/dt-hd-cv1-003-generation-completeness`)

1. **try/catch** around render → encode → manifest/QA → candidate assembly in `runGeneration()`: catches non-signal render-pipeline errors (ffmpeg non-zero exit, resvg error, disk-full) and returns a valid `FAILED` envelope instead of exit 1 with no result.
2. **SIGTERM/SIGINT signal handler** in `runContract()`: when Core's timeout kills the process group, the handler writes a `FAILED` result.json (code `terminated`) synchronously via `writeFileSync`/`renameSync`, then calls `process.exit(0)` — ensuring Core sees exit 0 with a valid Contract V1 result instead of signal death.

Both fixes are covered by regression tests in `test/reliability-regression.test.js`.

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

Stage 1 reliability fix is accepted plugin-local and pending DeepTalk Nexus integration review. Stage 2 visual quality work may proceed after Nexus repins. Any new runtime handed back to DeepTalk requires an exact SHA, native validation, Contract V1 compatibility, and an independent DeepTalk Nexus integration review.