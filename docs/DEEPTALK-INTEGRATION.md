# DeepTalk Integration Boundary — Hand-drawn Animation

## Purpose

This file defines the compatibility gate that every Hand-drawn reliability or visual-quality change must pass before DeepTalk Nexus may repin Core to a new exact SHA.

The plugin may evolve its renderer and visual grammar internally. Better drawings are welcome; a result that fails to complete the DeepTalk Contract is not a successful plugin release.

## Current accepted interface

- Contract version: `visual-asset-plugin-contract/1`
- Runtime behavior baseline: `853618bdf19ae66ec393211b77d970911f53f4bc`
- Canonical runner: `node src/contract-runner.js`
- DeepTalk compatibility baseline: `HWang0310/deep-talk-studio@db172cecc60ca6b0c276ec42010b113a767bc7b3`

## Current known real-generation defect

The accepted synthetic runner baseline passes plugin-native validation, but real-A-roll Phase 6 evidence exposed a plugin-local completeness problem:

1. suitability may return `SUITABLE` for a mechanism opportunity;
2. generation may render the expected frame sequence;
3. the run can fail before producing the Contract-required final media/manifest;
4. DeepTalk Core correctly records generation failure and exposes no `READY` candidate.

Do not weaken the Contract or Core acceptance to hide this. The first optimization stage must restore reliable final media + manifest completion for valid real mechanism requests and add a regression representative of the failure.

## Non-negotiable compatibility gate

Unless DeepTalk Nexus separately approves a new versioned contract, Hand-drawn Animation must preserve:

1. independent repository ownership; DeepTalk Core does not import plugin internals;
2. `visual-asset-plugin-contract/1` request/result semantics;
3. two-stage `Suitability -> Generation` behavior;
4. completed suitability outcomes `SUITABLE | BORDERLINE | ABSTAIN`;
5. generation operation statuses `COMPLETED | FAILED | BLOCKED | UNAVAILABLE`;
6. produced candidate statuses `READY | QA_REJECTED`;
7. ordinary subprocess/file invocation through the canonical runner;
8. Core-owned request/result/output-directory boundaries;
9. complete Contract-required media/manifest artifacts before a candidate can be `READY`;
10. fail-closed path, request, dependency, and artifact validation;
11. no Codex-only, TeleAgent-only, ChatGPT-only, or other single-Agent proprietary runtime prerequisite;
12. no automatic winner selection, overlap resolution, NLE editing, or A-roll modification;
13. generated drawings remain honest explanation and do not impersonate evidence or `REAL_MATERIAL`.

If a change appears to require breaking this boundary, stop and escalate rather than silently changing it.

## Plugin-local optimization freedom

After the reliability gate is green, the project may independently evolve:

- SVG primitives and project-owned visual vocabulary;
- scene/group/layer composition grammar;
- motion rhythm and primitive combinations;
- seeded organic treatment;
- typography/readability;
- supported semantic grammar;
- deterministic render internals;
- suitability/abstention heuristics, provided Contract semantics remain compatible;
- benchmark corpus and creator-facing visual QA.

Prefer `ABSTAIN` over low-value filler when no useful grammar exists.

## Required validation before handback

Before a Plugin Curator reports a candidate runtime ready for DeepTalk review:

- regression proves the real generation-completeness defect is fixed without weakening Contract V1;
- project-native unit/integration tests and lint pass;
- relevant benchmark renders and QA pass;
- canonical runner completes a valid Contract V1 generation with final media + manifest;
- resulting Contract V1 response/artifacts validate against the approved Core compatibility baseline;
- no private episode material or machine-specific secrets are committed;
- representative visual evidence is available for Owner review if aesthetic changes are included;
- branch and remote exact SHA are available for independent review;
- any change to identity/version/runner/artifact roles/status semantics is explicitly declared.

## Handback protocol

```text
PLUGIN_OPTIMIZATION_READY
PLUGIN: Hand-drawn Animation
REPO: HWang0310/deeptalk-handdrawn-animation
BASE_SHA: <starting main SHA>
CANDIDATE_SHA: <full exact SHA>
BRANCH: <task branch>
RUNNER: node src/contract-runner.js
PHASE6_GENERATION_FIX: PASS/FAIL
CONTRACT_V1_COMPAT: PASS/FAIL
DEEPTALK_CORE_BASE: db172cecc60ca6b0c276ec42010b113a767bc7b3
CORE_INTEGRATION_CHECK: PASS/FAIL
NATIVE_VALIDATION: PASS/FAIL
OWNER_VISUAL_REVIEW: PASS/PENDING
BREAKING_CHANGE: NONE/<brief>
BLOCKER: NONE/<brief>
```

The Plugin Curator may decide plugin-local acceptance and update Hand-drawn `main`. Only DeepTalk Nexus may update the Core pin after an independent exact-SHA integration review.
