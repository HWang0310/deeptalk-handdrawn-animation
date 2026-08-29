# Phase 3B Contract Runner Readiness Audit — Hand-drawn Animation

> **Status:** READINESS RESEARCH ONLY. No production code, no formal runner, no merge, no tag, no release. This document is a pre-engineering audit that maps the existing SVG-first renderer to the Core `visual-asset-plugin-contract/1` boundary so that a future implementation session can execute mechanically.

## 0. Inspected baselines

| Item | Value |
|---|---|
| Plugin repository | `HWang0310/deeptalk-handdrawn-animation` |
| Plugin baseline SHA (main) | `33422715f1627d7eaef7cc1ccbea7434b833d360` |
| Core repository | `HWang0310/deep-talk-studio` |
| Core canonical SHA (branch `agent/multi-asset-studio`) | `d1c990c25e44aa55ffc2789f7b00ee2374a198be` |
| Contract version | `visual-asset-plugin-contract/1` |
| Research branch | `agent/contract-v1-runner-readiness` |

## 1. Existing runtime/CLI

### Current CLI surface (`src/cli.js`)

The CLI is a single-entry `runCli(args, options)` function exported from `src/cli.js`. It dispatches by string command:

| Command pattern | Effect |
|---|---|
| `qa-benchmarks` / `qa-v11-benchmarks` / `qa-complex-benchmarks` / `qa-near-production` / `qa-common-brief-trial` | Runs `runQa()` across named fixture arrays, returns `{ version, total, failed, results }` |
| `render-benchmarks` / `render-v11-benchmarks` / `render-complex-benchmarks` / `render-near-production` / `render-common-brief-trial` | Calls `renderBenchmarks(scenes, version, outputRoot)` which QA-gates then calls `renderScene()` per fixture |
| `render-primitive-sheet` | Renders the primitive vocabulary fixture |
| (none or unknown) | Throws `unknown command: …` |

Key architectural facts:

- `runCli` accepts `{ outputRoot, writeOutput }` options. `outputRoot` defaults to `resolve('output')`. This is the only output isolation mechanism.
- `renderBenchmarks` pre-checks QA (`if (report.failed > 0) throw`) before rendering any scene. This is an inline gate.
- The entry point is `process.argv[1]` matched against `import.meta.url` — standard ESM pattern.
- The CLI imports from five fixture modules: `benchmarks.js`, `primitive-sheet.js`, `complex-benchmarks.js`, `near-production.js`, `common-brief-trial.js`.
- No stdin parsing, no file-based request/result protocol, no `--version` flag, no `--request`/`--result`/`--output-dir` arguments.

### How to extend without breaking existing CLI

The Contract runner must be a **separate entry point** (`src/contract-runner.js`), not a modification to `src/cli.js`. Evidence:

1. The Core `visual-asset-plugins.example.json` already specifies `"argv_prefix":["node","src/contract-runner.js"]` for this plugin — the runner path is pre-decided by Core configuration.
2. `src/cli.js` is an importable module (`export async function runCli`). The contract runner can import the same internal modules (`renderScene`, `runQa`, `compileSvg`, `validateScene`) without going through the CLI dispatcher.
3. The existing CLI tests (`test/cli.test.js`) assert that unknown commands throw. Adding contract-runner commands to the CLI would change the CLI surface and require test changes. A separate file avoids this entirely.

**Proposed boundary:**

```
src/cli.js                    — UNCHANGED, existing named-fixture CLI
src/contract-runner.js         — NEW file, Contract V1 entry point
```

The contract runner imports from existing `src/render.js`, `src/qa.js`, `src/schema.js`, `src/svg.js`, `src/composition.js`, `src/primitives.js` — all of which are already `export`-able. No internal module needs modification.

## 2. Scene/compiler/render architecture

### Pipeline (verified from source)

```
JSON scene spec
  → validateScene() [src/schema.js]
  → compileSvg(scene, timeMs) [src/svg.js]
  → rasterize(svg) via Resvg [src/render.js]
  → FFmpeg encode frames → MP4 + contact sheet [src/render.js]
  → runQa(scene) [src/qa.js]
```

### Scene model fields

```javascript
{
  id: string,
  title: string,
  durationMs: number (3000–10000),
  canvas: { width: 1920, height: 1080 },
  background: string (optional, default '#fffaf0'),
  style: { organic: { seed, wobble, widthVariance, duplicateSketch } } (optional),
  motion: { finalHoldMs: number } (optional),
  groups: [{ id, layer: 'background'|'middle'|'foreground', role: 'focal'|'support'|'context' }] (optional),
  composition: { focusArea, semanticOverlaps, focalGroup, readingOrder } (optional),
  elements: [
    { id, type: 'path'|'box'|'circle'|'arrow'|'label'|'number'|'group',
      bounds: { x, y, width, height },
      reveal: { startMs, endMs, easing?, fillStart? },
      ...typeSpecificFields
    }
  ]
}
```

### Element types (from `src/svg.js` `renderShape`)

| Type | Key fields | Rendering |
|---|---|---|
| `path` | `d` (SVG path data), `stroke`, `fill`, `strokeWidth`, `fillOpacity` | `<path>` with dash-reveal, optional organic wobble |
| `box` | `x`, `y`, `width`, `height`, `rx`, `fill`, `stroke` | `<rect>` |
| `circle` | `cx`, `cy`, `r`, `fill`, `stroke` | `<circle>` |
| `arrow` | `x1`, `y1`, `x2`, `y2`, `stroke` | `<line>` with arrowhead marker at stroke ≥ 0.995 |
| `label` | `text`, `x`, `y`, `fontSize`, `fontWeight`, `color` | `<text>` with Chinese fallback font stack, no organic treatment |
| `number` | same as label | same as label |
| `group` | (no rendering) | grouping container |

### Render output (`renderScene` return value)

```javascript
{
  frames: string[],      // PNG frame file paths
  finalFrame: string,    // final-frame PNG path
  mp4: string | null,    // H.264 MP4 path (null if encode=false)
  contactSheet: string | null  // contact sheet PNG path
}
```

### QA output (`runQa` return value)

```javascript
{
  passed: boolean,
  checks: { durationInRange, boundsWithinMargin, revealOrderMonotonic,
            chineseLabelsPresent, finalFrameVisible, density,
            strokeConsistent, handOverlayRequired, compositionWarnings },
  findings: [{ code, elementId, message }],   // hard failures
  warnings: [{ code, elementId, message }]    // non-blocking
}
```

### Composition patterns (`src/composition.js`)

Four deterministic composition grammars:

| Pattern | Elements | Groups | Focus |
|---|---|---|---|
| `actor-action-consequence` | role-person + document + simple-chart + arrows + labels | context→action→outcome | outcome group |
| `multi-actor-relation` | role-person + building + role-person + arrows + labels | context→action→outcome | outcome group |
| `accumulation-pressure` | resource-stack + factory + emotion-mark + arrows + labels | context→action→outcome | outcome group |
| `before-after-transition` | document + arrow-family + screen + arrows + labels | context→action→outcome | outcome group |

Each pattern produces `{ groups, elements, focalGroup, readingOrder, focusArea, semanticOverlaps }`.

### Primitives (`src/primitives.js`)

17 composable primitives: `person`, `building`, `document`, `money-bag`, `light-bulb`, `cloud`, `factory`, `screen`, `simple-chart`, `emotion-mark`, `arrow-family`, `circle-annotation`, `underline`, `cross-out`, `emphasis-strokes`, `role-person`, `resource-stack`.

Each returns an array of scene elements (paths, boxes, circles, arrows) with deterministic geometry and reveal timing.

## 3. Suitability mapping

### Existing Common Brief Trial assessment (`fixtures/common-brief-trial.js`)

The `commonBriefAssessment` array already encodes deterministic suitability judgments:

| CB ID | Suitability | Grammar | Reason |
|---|---|---|---|
| CB01 | ABSTAIN | null | 核心判断更接近 headline；强行加对象会削弱判断 |
| CB02 | SUITABLE | actor-action-consequence | 因果传导与逐步 reveal 天然匹配 |
| CB03 | SUITABLE | accumulation-pressure | 积累、压力、阈值适合 staged explanatory scene |
| CB04 | SUITABLE | abstract-mechanism | 现有 feedback loop scene 可复用 |
| CB05 | SUITABLE | multi-actor-relation | 双方拉扯与资源关系清晰 |
| CB06 | BORDERLINE | actor-action-consequence | 隐藏机制缺少自然视觉隐喻，仅做有限结构实验 |
| CB07 | SUITABLE | before-after-transition | 规则变化前后路径适合显式顺序 |
| CB08 | SUITABLE | number-label + actor-action-consequence | 数字与机制可分阶段表达，但不是纯数字展示强项 |

### Deterministic suitability rules (from Common Brief strengths)

These are the **deterministic suitability rules** derivable from the existing evidence:

**SUITABLE conditions (all must hold):**
1. `visual_purpose` contains causal/mechanism/relationship/progressive/reveal semantics
2. `target_duration_ms` is 3000–10000 (matches scene schema)
3. `canvas` is 1920×1080
4. `language` is `zh-CN` (Chinese fallback font stack exists)
5. The opportunity can map to one of the four composition patterns (named benchmark grammars are for testing only, not production generation)

**BORDERLINE conditions:**
1. The opportunity implies a hidden/emotional mechanism without a natural visual metaphor (CB06 pattern)
2. The opportunity mixes numeric display with mechanism explanation (CB08 pattern — SUITABLE but with caveat)

**ABSTAIN conditions:**
1. The opportunity is a pure headline/judgment without natural staged objects (CB01 pattern)
2. The opportunity requires character poses, perspective scenes, or arbitrary illustrations beyond the primitive vocabulary
3. `target_duration_ms` is outside 3000–10000
4. `canvas` is not 1920×1080

### SUITABLE/BORDERLINE/ABSTAIN expression

The Contract V1 `suitability` field is exactly one of `"SUITABLE"`, `"BORDERLINE"`, `"ABSTAIN"` (from `visual_asset_plugin_contract.py` line 10). The runner's suitability response must include:

```json
{
  "contract_version": "visual-asset-plugin-contract/1",
  "request_id": "<echoed from request>",
  "opportunity_id": "<echoed from opportunity>",
  "plugin_id": "org.deeptalk.handdrawn-animation",
  "plugin_version": "<from --version>",
  "proposal_id": "prop_<deterministic-hash>",
  "operation_status": "COMPLETED",
  "suitability": "SUITABLE" | "BORDERLINE" | "ABSTAIN",
  "reason": "<short deterministic reason>"
}
```

For `FAILED`/`UNAVAILABLE`, the response includes `problem: { code, message, retryability? }` and omits `proposal_id`, `suitability`, `reason`.

## 4. Opportunity mapping

### How a Visual Opportunity translates to the existing SVG scene model

The Contract V1 Visual Opportunity payload:

```json
{
  "opportunity_id": "opp_…",
  "spoken_semantics": "The viewer-facing meaning to explain.",
  "visual_purpose": "What visual understanding should add.",
  "a_roll_window": { "start_ms": 182400, "end_ms": 190400 },
  "target_duration_ms": 7000,
  "language": "zh-CN",
  "canvas": { "width": 1920, "height": 1080 },
  "semantic_context": "…",
  "factual_context": […]
}
```

maps to a hand-drawn scene spec by the runner:

| Opportunity field | Scene spec field | Mapping rule |
|---|---|---|
| `opportunity_id` | (not in scene spec) | Used in result envelope only |
| `spoken_semantics` | `scene.title` | Becomes the title label text (truncated if needed) |
| `visual_purpose` | (not in scene spec) | Used to select composition grammar |
| `target_duration_ms` | `scene.durationMs` | Direct; must be 3000–10000. If outside range, ABSTAIN (not clamp). |
| `language` | (implicit) | Chinese fallback font stack; if not `zh-CN`, the runner must still function but may ABSTAIN |
| `canvas` | `scene.canvas` | Must be 1920×1080; otherwise ABSTAIN |
| `a_roll_window` | `scene.composition` (not directly used) | Used for `suggested_placement` in generation result |
| `semantic_context` | (not in scene spec) | May influence grammar selection |
| `factual_context` | (not in scene spec) | Not used by the runner. Provenance describes only how the asset was generated, not opportunity passthrough. |

### Grammar selection logic (proposed)

The runner translates `spoken_semantics` + `visual_purpose` to one of the four composition patterns:

| Semantic signal | Selected grammar |
|---|---|
| causal / transmission / consequence / mechanism | `actor-action-consequence` |
| pressure / accumulation / threshold / bottleneck | `accumulation-pressure` |
| relation / tension / two-party / coordination | `multi-actor-relation` |
| before/after / rule change / transition | `before-after-transition` |

If no grammar matches, the runner returns ABSTAIN.

## 5. Named fixture lookup avoidance

### Current problem

The existing CLI selects scenes by hardcoded fixture arrays (`benchmarks`, `v11Benchmarks`, `complexBenchmarks`, `nearProductionScenes`, `commonBriefCandidates`). A Contract runner must NOT do named-fixture lookup because:

1. The Contract V1 opportunity is a dynamic JSON payload, not a fixture ID.
2. The Core adapter sends `--request`, `--result`, `--output-dir` file paths — no fixture name.
3. The runner must translate the opportunity to a scene spec programmatically.

### Proposed solution

The contract runner builds a scene spec **deterministically from the opportunity payload**:

1. Parse the request JSON from `--request` path.
2. Extract `spoken_semantics`, `visual_purpose`, `target_duration_ms`, `canvas`, `language`.
3. Select a composition grammar by keyword matching on `spoken_semantics` + `visual_purpose`.
4. Call `createCompositionPattern(grammar, { id: opportunity_id })` to get elements/groups.
5. Assemble the scene spec:
   ```javascript
   const fragment = createCompositionPattern(grammar, { id: opportunity.opportunity_id });
   const scene = {
     id: opportunity.opportunity_id,
     title: opportunity.spoken_semantics.substring(0, 40),
      durationMs: opportunity.target_duration_ms,  // must be 3000–10000; suitability ABSTAINs if outside
     canvas: opportunity.canvas,
     style: { organic: { seed: `contract:${opportunity.opportunity_id}`, wobble: 1.8, widthVariance: 0.16, duplicateSketch: true } },
     motion: { finalHoldMs: 900 },
     groups: fragment.groups,
     composition: { focusArea: fragment.focusArea, semanticOverlaps: fragment.semanticOverlaps, focalGroup: fragment.focalGroup, readingOrder: fragment.readingOrder },
     elements: [
       { id: `${opportunity.opportunity_id}-title`, type: 'label', text: opportunity.spoken_semantics.substring(0, 40), ... },
       ...fragment.elements
     ]
   };
   ```
6. This is the same pattern used by `fixtures/near-production.js` and `fixtures/common-brief-trial.js` — proving it works.

For the **first dynamic synthetic case** (question 6), the recommended grammar is `actor-action-consequence` because:
- It is the most-tested composition pattern (used by CB02, CB06, and four near-production briefs).
- It exercises role-person, document, simple-chart primitives and all three group layers.
- It has the clearest deterministic element set.

## 6. Generation pipeline: scene compile → SVG → frames → FFmpeg MP4 → QA → Contract Result

### Full proposed pipeline

```
1. Read --request JSON → parse opportunity
2. Build scene spec (as described in §4)
3. validateScene(scene)                    [src/schema.js]
4. runQa(scene)                             [src/qa.js]
   → if hard findings: return QA_REJECTED candidate
5. renderScene(scene, { outputDir, fps: 12, encode: true })  [src/render.js]
   → compileSvg per frame → PNG rasterize → FFmpeg MP4 + contact sheet
6. Compute SHA-256 of MP4
7. Build manifest JSON (plugin-native)
8. Build QA report JSON (from runQa result)
9. Assemble Contract V1 generation result:
   {
     contract_version, request_id, opportunity_id, proposal_id,
     plugin_id, plugin_version, operation_status: "COMPLETED",
     candidate: {
       candidate_id, asset_family: "HANDDRAWN_SVG",
       candidate_status: "READY" | "QA_REJECTED",
       duration_ms, suggested_placement,
       artifacts: [
         { role: "PRIMARY_MEDIA", uri: "local-runner://<mp4-filename>", media_type: "video/mp4", sha256, duration_ms },
         { role: "PREVIEW", uri: "local-runner://contact-sheet.png", media_type: "image/png" },
         { role: "MANIFEST", uri: "local-runner://manifest.json", media_type: "application/json" },
         { role: "QA_REPORT", uri: "local-runner://qa.json", media_type: "application/json" }
       ],
       qa: { status: "PASSED" | "FAILED", summary },
       provenance: { origin: "plugin-generated", source_ref: "handdrawn-svg/v1" },
       plugin_metadata: {}
     }
   }
10. Write result JSON atomically to --result path
```

This pipeline reuses the existing `renderScene` function unchanged. The only new code is the request parsing, scene assembly, and result envelope construction.

## 7. proposal_id / candidate_id deterministic inputs

### proposal_id design

`proposal_id` is created during the suitability stage and must be deterministic for the same opportunity + plugin combination.

**Proposed format:**

```
prop_<sha256(
  opportunity_id
  + spoken_semantics
  + visual_purpose
  + target_duration_ms
  + canvas.width + canvas.height
  + language
  + plugin_id
  + plugin_version
  + contract_version
  + compiler_semantics_tag   // e.g. "handdrawn-svg/v1"
)[:24]>
```

Example: `prop_a1b2c3d4e5f6a7b8c9d0e1f2`

This ensures:
- Same opportunity + same plugin + same plugin version always produces the same `proposal_id`.
- Material opportunity content (not just the ID) is bound — two opportunities with different `spoken_semantics` or `visual_purpose` produce different IDs.
- Plugin version is bound — a plugin upgrade produces a new `proposal_id`.
- Compiler semantics are bound — changes to SVG compilation or composition grammar produce a new `proposal_id`.
- Different plugins produce different `proposal_id` values (no collision).
- No random UUID (deterministic, replayable).
- The `proposal_id` is echoed in the generation request and generation result.

### candidate_id design

`candidate_id` is created during the generation stage and must be deterministic for the same proposal + scene + render settings.

**Proposed format:**

```
cand_<sha256(
  proposal_id
  + scene.id
  + scene.durationMs
  + scene.canvas.width + scene.canvas.height
  + fps
  + organic_seed
  + composition_grammar
  + plugin_version
  + render_engine_tag   // e.g. "resvg+ffmpeg-h264"
  + ffmpeg_flags_tag    // normalized encoding flags
)[:24]>
```

Example: `cand_f1e2d3c4b5a6e7f8d9c0b1a2`

This ensures:
- Same proposal + same scene + same render settings always produces the same `candidate_id`.
- Canvas dimensions, composition grammar, and render engine are bound — changes to any of these produce a different `candidate_id`.
- FFmpeg encoding flags are bound — changes to encoding parameters produce a different `candidate_id`.
- A different organic seed or duration produces a different `candidate_id`.
- Replayable: a second run with the same inputs produces the same `candidate_id`.

Both IDs are non-empty text strings matching the Contract V1 `_identifier` rule (non-empty string).

## 8. output-dir isolation

### Current support

`renderScene(scene, { outputDir })` creates the following under `outputDir`:

```
<outputDir>/
  frames/
    frame-00000.png
    frame-00001.png
    ...
  final-frame.png
  <scene.id>.mp4
  contact-sheet.png
```

The Core adapter (`visual_plugin_adapter.py`) creates a job directory structure:

```
<job_root>/<request_id>/
  request.json
  result.json
  output/          ← passed as --output-dir
  stdout.log
  stderr.log
```

The runner receives `--output-dir` as an absolute path and writes all artifacts there. The `local-runner://` URI scheme in artifacts resolves relative to this directory.

**Assessment:** Output isolation is **naturally supported**. The runner only needs to use the supplied `--output-dir` for all file output. No additional isolation code is needed.

## 9. Atomic result implementation

### Requirement

The Contract V1 requires the runner to write exactly one result JSON to the `--result` path. The Core adapter reads this file only after the process exits with code 0.

### Proposed implementation

```javascript
import { writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

async function writeResultAtomic(resultPath, result) {
  const tmpPath = resultPath + '.tmp';
  await writeFile(tmpPath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  await rename(tmpPath, resultPath);  // atomic on POSIX
}
```

`os.replace` (Node.js `fs.rename`) is atomic on POSIX filesystems. This is the same pattern used by the Core fake runner (`visual_asset_plugin_fakes.py` line 64–66):

```python
temporary = result_path.with_suffix(".tmp")
temporary.write_text(json.dumps(response, ...), encoding="utf-8")
os.replace(temporary, result_path)
```

## 10. plugin --version design

### Requirement

The Core adapter calls `plugin_version_command` (configured as `["node", "src/contract-runner.js", "--version"]`) and expects a single-line version string on stdout.

### Proposed design

The contract runner's `--version` handler:

```javascript
if (args[0] === '--version') {
  process.stdout.write('handdrawn-animation-contract/0.1.0\n');
  process.exit(0);
}
```

**Version string:** `handdrawn-animation-contract/0.1.0`

This is distinct from the `package.json` version (`0.1.0`) to clearly identify the contract runner. The version is plugin-owned and advances independently of the contract version.

The Core adapter validates:
1. The version string is non-empty.
2. The version string has no newlines.
3. The version string in the result JSON matches the resolved version.

## 11. manifest / QA artifacts reuse

### Current manifest/QA output

The existing CLI writes QA reports via `writeReport()` to `<outputRoot>/<version>/qa/benchmark-qa.json`. The contract runner needs a different output structure under the Core-supplied `--output-dir`.

### Proposed artifact files (all under --output-dir)

| File | Content | Contract role |
|---|---|---|
| `media.mp4` | H.264 MP4 from `renderScene` | `PRIMARY_MEDIA` |
| `contact-sheet.png` | Contact sheet from `renderScene` | `PREVIEW` |
| `manifest.json` | Plugin-native manifest: scene spec, render settings, frame count, fps, organic seed | `MANIFEST` |
| `qa.json` | QA report from `runQa()`: findings, warnings, checks | `QA_REPORT` |

### Manifest content (proposed)

```json
{
  "manifest_version": "handdrawn-asset-manifest/1",
  "scene_id": "<opportunity_id>",
  "scene_title": "<spoken_semantics truncated>",
  "composition_grammar": "actor-action-consequence",
  "duration_ms": 9000,
  "fps": 12,
  "frame_count": 108,
  "canvas": { "width": 1920, "height": 1080 },
  "organic_profile": { "seed": "contract:<opportunity_id>", "wobble": 1.8, "widthVariance": 0.16, "duplicateSketch": true },
  "render_version": "handdrawn-animation-contract/0.1.0",
  "primitives_used": ["role-person", "document", "simple-chart", "arrow"],
  "groups": ["context", "action", "outcome"]
}
```

### QA report content (proposed)

```json
{
  "qa_version": "handdrawn-qa/1",
  "scene_id": "<opportunity_id>",
  "passed": true,
  "findings": [],
  "warnings": [...],
  "checks": { durationInRange: true, boundsWithinMargin: true, ... }
}
```

Both reuse the existing `runQa()` output shape directly — no new QA logic needed.

## 12. Ordinary fast tests vs dedicated real render tests

### Current test structure

All tests in `test/` use `node --test` (Node.js built-in test runner). The render test (`test/render.test.js`) uses `fps: 2, encode: false` — it rasterizes 6 PNG frames but does NOT invoke FFmpeg. This keeps ordinary tests fast.

### Proposed separation

| Test type | Location | Rendering | FFmpeg |
|---|---|---|---|
| Ordinary fast unit tests | `test/*.test.js` (existing) | None or `encode: false` | No |
| Contract runner unit tests | `test/contract-runner.test.js` (new) | None — tests request parsing, scene assembly, result envelope | No |
| Contract runner integration test | `test/contract-runner-integration.test.js` (new) | Full `renderScene` with `encode: true` | Yes |
| Deterministic MP4 test | `test/mp4-determinism.test.js` (new, optional) | Two full renders, compare SHA-256 | Yes |

**Rule:** Ordinary `npm test` must not invoke FFmpeg. Integration tests should be separately invokable:

```json
{
  "scripts": {
    "test": "node --test",
    "test:integration": "node --test test/contract-runner-integration.test.js"
  }
}
```

This preserves the existing fast-test guarantee.

## 13. Fresh-run MP4 binary determinism assessment

### Current evidence

1. **SVG determinism:** `test/svg.test.js` line 50–56 proves `compileSvg(organic, 2400) === compileSvg(organic, 2400)` for the same scene and seed. This is verified.
2. **PNG determinism:** Resvg is a deterministic rasterizer — same SVG input produces identical PNG bytes. This is assumed from the Resvg library's deterministic design but NOT explicitly tested for byte equality.
3. **MP4 determinism:** FFmpeg H.264 encoding with the same input frames and same arguments should produce the same MP4. However, FFmpeg may embed timestamps or metadata. The current command uses `-movflags +faststart` which restructures the moov atom but should be deterministic for the same input.

### Gaps

- No existing test compares two MP4 files byte-for-byte.
- No existing test verifies that two full `renderScene` calls with the same inputs produce identical MP4 SHA-256 hashes.
- FFmpeg encoding time/temperature throttling is not controlled.
- The `generatedAt` timestamp in the QA report is non-deterministic (`new Date().toISOString()` in `cli.js` line 16) — but this is in the CLI wrapper, not in `runQa()` itself. The contract runner should NOT include timestamps.

### Assessment

**Fresh-run MP4 binary determinism evidence is INSUFFICIENT.** The SVG layer is proven deterministic, but the MP4 layer lacks byte-equality proof. The implementation phase must add a dedicated determinism test that:

1. Renders the same scene twice to separate output directories.
2. Computes SHA-256 of both MP4 files.
3. Asserts the hashes are equal.
4. If they differ, investigates FFmpeg flags (`-fflags +genpts`, `-avoid_negative_ts make_zero`, removing metadata).

**Gate status: OPEN.** MP4 binary determinism remains an open gate for the implementation phase. This document does not close it.

## 14. Chrome/Remotion dependencies

### Current state

This plugin has **NO Chrome or Remotion dependency**. The render pipeline uses:
- `@resvg/resvg-js` (Rust SVG rasterizer, bundled native binary) — the only external dependency.
- `ffmpeg` (system binary, invoked via `spawn`).

### Integration characteristics

No Chrome/Remotion means:
1. No browser version drift — Resvg is a pinned npm package.
2. No headless Chrome startup/timeout risk.
3. Simpler CI/CD — only Node.js + FFmpeg needed.
4. Faster cold-start — no browser launch overhead.
5. Smaller attack surface for Core subprocess supervision.

### Hidden risks

1. **Resvg native binary:** `@resvg/resvg-js` includes a pre-built native binary. If the target platform changes (e.g., from macOS to Linux), the correct native binary must be present. This is an npm install concern, not a runtime concern.
2. **FFmpeg version sensitivity:** Different FFmpeg versions may produce different H.264 output. The runner should document the expected FFmpeg version (v9 per `PROJECT_STATE.md`).
3. **Font availability:** Chinese text rendering depends on local fonts (`PingFang SC`, `Noto Sans CJK SC`, `Microsoft YaHei`). On a system without these fonts, Chinese labels may fall back to a generic sans-serif. The runner should detect font availability and return UNAVAILABLE if no CJK font is found.

## 15. What to implement vs what NOT to refactor

### MUST implement (new files)

| File | Purpose |
|---|---|
| `src/contract-runner.js` | Contract V1 entry point: `--version`, `--request`, `--result`, `--output-dir` |
| `test/contract-runner.test.js` | Unit tests for request parsing, scene assembly, result envelope, suitability, generation |
| `test/contract-runner-integration.test.js` | Full pipeline integration test with real FFmpeg |
| `test/fixtures/contract-v1/` | Synthetic opportunity JSON fixtures for testing |

### MUST NOT refactor (existing files)

| File | Reason |
|---|---|
| `src/cli.js` | Existing CLI surface must remain unchanged |
| `src/render.js` | `renderScene` API is the stable render boundary |
| `src/svg.js` | SVG compiler is the deterministic scene state boundary |
| `src/schema.js` | Scene validation is the schema boundary |
| `src/qa.js` | QA logic is the quality boundary |
| `src/organic.js` | Organic styling is the deterministic wobble boundary |
| `src/composition.js` | Composition patterns are the grammar boundary |
| `src/primitives.js` | Primitives are the visual vocabulary boundary |
| `fixtures/*.js` | Existing fixtures are regression controls |
| `test/*.test.js` | Existing tests are regression controls |
| `package.json` | Existing scripts/dependencies must remain (only ADD new scripts) |

### Allowed modifications (minimal)

| File | Change |
|---|---|
| `package.json` | Add `"test:integration"` script only. Do NOT change existing scripts or dependencies. |

## 16. Phase 3B implementation expected files

### Exact file list

| # | File | Type | Lines (est.) |
|---|---|---|---|
| 1 | `src/contract-runner.js` | NEW | ~200 |
| 2 | `test/contract-runner.test.js` | NEW | ~150 |
| 3 | `test/contract-runner-integration.test.js` | NEW | ~80 |
| 4 | `test/fixtures/contract-v1/suitability-request.json` | NEW fixture | ~10 |
| 5 | `test/fixtures/contract-v1/generation-request.json` | NEW fixture | ~12 |
| 6 | `package.json` | MODIFY (add script) | +1 line |

### `src/contract-runner.js` structure (proposed)

```javascript
// Entry point for Contract V1 runner
// Supports: --version, --request <path> --result <path> --output-dir <path>

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

import { validateScene } from './schema.js';
import { runQa } from './qa.js';
import { renderScene } from './render.js';
import { createCompositionPattern, compositionPatternNames } from './composition.js';

const PLUGIN_ID = 'org.deeptalk.handdrawn-animation';
const PLUGIN_VERSION = 'handdrawn-animation-contract/0.1.0';
const CONTRACT_VERSION = 'visual-asset-plugin-contract/1';

// --version handler
// --request/--result/--output-dir handler:
//   1. Parse request
//   2. If suitability: assess and return suitability response
//   3. If generation: build scene, render, QA, return candidate
```

## 17. Test plan

### Unit tests (no rendering)

| Test | Asserts |
|---|---|
| `--version` outputs single-line version | `PLUGIN_VERSION` on stdout, exit 0 |
| Suitability request → SUITABLE response | `operation_status: COMPLETED`, `suitability: SUITABLE`, `proposal_id` deterministic |
| Suitability request → ABSTAIN response | For headline-only opportunity |
| Suitability request → BORDERLINE response | For hidden-mechanism opportunity |
| Generation request → READY candidate | `candidate_status: READY`, `qa.status: PASSED`, artifacts present |
| Generation request → QA_REJECTED candidate | When `runQa` returns findings |
| `proposal_id` determinism | Same opportunity → same `proposal_id` |
| `candidate_id` determinism | Same proposal + scene → same `candidate_id` |
| Atomic result writing | `.tmp` → rename, result file exists after exit |
| Missing `--request` | Exit non-zero, stderr message |
| Invalid request JSON | Exit non-zero, stderr message |

### Integration tests (with FFmpeg)

| Test | Asserts |
|---|---|
| Full pipeline: request → scene → render → MP4 → QA → result | `candidate_status: READY`, MP4 file exists, `sha256` matches, `ffprobe` reads duration |
| Deterministic MP4: two runs, same inputs | SHA-256 of both MP4s are equal |
| Contact sheet generation | `contact-sheet.png` exists, > 1000 bytes |

### Regression (existing tests must pass)

```bash
npm test  # all existing tests unchanged
```

## 18. Risks and blockers

| Risk | Severity | Mitigation |
|---|---|---|
| MP4 binary non-determinism | HIGH (OPEN GATE) | Add dedicated determinism test; if it fails, add FFmpeg flags (`-fflags +genpts`, strip metadata) |
| CJK font availability on CI | MEDIUM | Detect fonts at startup; return UNAVAILABLE if missing. Document font requirement. |
| Resvg native binary on Linux CI | MEDIUM | Pin `@resvg/resvg-js` version; verify npm install on target platform |
| `spoken_semantics` → grammar mapping ambiguity | MEDIUM | Use conservative keyword matching; default to ABSTAIN if no match |
| `target_duration_ms` outside 3000–10000 | LOW | Return ABSTAIN with reason |
| FFmpeg not installed | LOW | Detect at startup; return UNAVAILABLE |
| Contract V1 validation drift | LOW | Contract is frozen at `visual-asset-plugin-contract/1`; no drift expected |

## 19. Implementation recommendation

### Verdict: READY_FOR_IMPLEMENTATION

The hand-drawn animation plugin is ready for Contract V1 runner implementation:

1. **Low dependency surface:** No Chrome, no Remotion, only Resvg + FFmpeg.
2. **Stable internal APIs:** `renderScene`, `runQa`, `validateScene`, `compileSvg`, `createCompositionPattern` are all exported and composable.
3. **Existing composition grammar:** Four deterministic patterns that directly map to opportunity semantics.
4. **Existing suitability evidence:** Common Brief Trial already encodes SUITABLE/BORDERLINE/ABSTAIN judgments.
5. **Deterministic scene assembly:** `createCompositionPattern(grammar, { id })` produces the same elements every time.
6. **Output isolation:** `renderScene` already accepts `outputDir` parameter.
7. **No refactoring needed:** All new code goes in one new file (`src/contract-runner.js`).

### Recommended implementation sequence

1. Add `src/contract-runner.js` with `--version` handler.
2. Add suitability stage: parse request → assess → write response.
3. Add generation stage: parse request → build scene → render → QA → write response.
4. Add unit tests (`test/contract-runner.test.js`).
5. Add integration test (`test/contract-runner-integration.test.js`).
6. Add MP4 determinism test.
7. Run `npm test` to verify no regression.
8. Run integration test to verify full pipeline.
9. Pin the commit SHA and report to Core.

### No-production-code confirmation

This research document does not implement any production code. No source file in `src/` was modified. No fixture was modified. No test was modified. Only this document was added.

### Core/other plugin untouched

- `deep-talk-studio` repository: read-only inspection only, at canonical SHA `d1c990c25e44aa55ffc2789f7b00ee2374a198be` on branch `agent/multi-asset-studio` (not Core main). No file was modified.
- `deeptalk-mg` repository: not inspected in this session.
- `deeptalk-illustrated-metaphor` repository: not inspected in this session.

### No merge/tag/release

- This branch `agent/contract-v1-runner-readiness` will not be merged to `main`.
- No tag will be created.
- No GitHub Release will be created.
- The branch contains only this document under `docs/plans/`.

### Clean tree

After committing this document, the working tree will be clean. No source code, fixture, or test file is modified.
