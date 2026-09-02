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

# DeepTalk Hand-drawn Animation — Engineering Protocol

## Mandatory bootstrap

At the beginning of every Curator or engineering task:

1. Read the current `HWang0310/engineering-journal` default branch as the cross-project engineering standard source. At minimum follow its `NEW-SESSION-BOOTSTRAP.md` reading order and inherit the Curator/Axiom/Mason/Rivet model, Task ID lifecycle, GitHub-native handoff, exact-SHA review, one-writer/worktree isolation, and restricted-content hard gate.
2. Record the engineering-journal remote exact SHA used for important new phases.
3. Inspect this repository remote/current branch, `git status --short --branch`, current HEAD, and recent commits.
4. Read `PROJECT_STATE.md` for current operational truth.
5. Read `README.md`, `docs/INDEX.md`, and `docs/DEEPTALK-INTEGRATION.md`.
6. Consult `HANDOFF.md` for historical decisions/evidence, not as a substitute for current state.

## Roles and task lifecycle

- Curator owns project management, architecture coordination, task decomposition, technical decisions, Agent routing, exact-SHA Review, acceptance, and merge decisions.
- Mason/Rivet are the default implementation engineers for clear, verifiable work. Axiom is reserved for deep architecture, difficult debugging, high-risk runtime/Contract work, and high-risk review.
- Formal engineering work uses a unique Task ID and follows the lifecycle defined by `engineering-journal`.
- GitHub remote exact SHA is engineering truth. Agent self-report does not equal acceptance.
- Default to one Writer. Parallel Writers require isolated branches/worktrees, no shared mutable state, and no overlapping critical files.

## Mission and boundaries

- This repository owns the independent local deterministic SVG-first Hand-drawn Animation plugin. It is not DeepTalk Core.
- Do not modify `HWang0310/deep-talk-studio` from this plugin project. Core is a read-only compatibility reference during plugin work.
- Do not silently redesign the cross-plugin Contract or Episode-production workflow from this repository.
- Do not copy a reference video's characters, fixed composition, prompts, or hand-overlay footage.
- Keep generated MP4, PNG, contact sheets, and QA evidence local and gitignored unless a reviewed task explicitly authorizes a small non-private evidence artifact.
- No credentials, private episode material, machine-specific secrets, or proxy settings belong in Git.
- The restricted-content hard gate from `engineering-journal` applies to all source, docs, tests, fixtures, prompts, issues, commits, and generated project-controlled material.

## Working rules

- Preserve deterministic rendering: a fixture plus renderer/dependency version must recreate the same SVG/frame plan.
- Add a failing Node test before production behavior changes, run it red, implement minimally, then run it green.
- Run `npm test`, `npm run lint`, relevant benchmark rendering, and QA before commit/handback.
- Keep `PROJECT_STATE.md` to verified current facts; use `HANDOFF.md` for chronological history.
- Chinese labels stay as SVG text and must remain readable under the local fallback-font stack.
- Prefer `ABSTAIN` over filler when no useful hand-drawn grammar matches the opportunity.
- Plugin optimization is successful only if the resulting exact SHA remains insertable into DeepTalk through `docs/DEEPTALK-INTEGRATION.md`.

## Current reliability priority

Real-A-roll Phase 6 evidence exposed a plugin-local generation-completeness defect: a mechanism opportunity can be judged `SUITABLE` and render a frame sequence, yet fail to complete the Contract-required final media/manifest. Do not weaken Core acceptance or Contract semantics to hide this. Fix reliable final media/manifest completion before broad aesthetic optimization is considered complete.

Before handback, run project-native tests/lint/render/QA, `git diff --check`, restricted-content review, and return branch + remote exact SHA.
