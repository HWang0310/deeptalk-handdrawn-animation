# V1.2 Scene Richness & Semantic Composition Design

## Goal

Make the SVG-first renderer capable of readable, multi-object explanatory scenes without changing its deterministic scene model or attempting automatic semantic layout.

## Decision

V1.2 adds scene-author metadata, not a Plugin Contract. A scene may declare ordered `groups`; each group has an ID, a visual `layer` (`background`, `middle`, or `foreground`), a semantic `role` (`focal`, `support`, or `context`), and element membership through `groupId`. SVG compilation sorts draw elements by this declared layer while retaining explicit element reveal times. A group never changes an element's position.

`src/composition.js` supplies a small explicit composition grammar. A pattern receives concrete Chinese labels and fixed placement options, then returns ordinary scene elements, groups, reading order, focus area, and semantic-overlap annotations. Supported V1.2 patterns are actor-action-consequence, multi-actor relation, accumulation-pressure, and before-after transition. The pattern is a deterministic scene authoring helper, not an LLM or an automatic layout engine.

Primitive expansion stays narrow: role-person adds a human/role variant and resource-stack adds a resource bundle. Existing building, factory, document, money bag, screen, chart, cloud, emotion, arrows, and emphasis primitives supply the rest of the complex scenes. This creates families that can be composed rather than a large icon catalog.

## Scene richness and motion

The four new complex benchmark fixtures each use foreground/middle/background groups, one declared focal group, supporting objects, explicit relationships, Chinese labels, and staged reveal windows. Their narrative order is actor/action/consequence, actors/interaction/result, accumulation/pressure/bottleneck, and before/change/after. The final hold is at least 800 ms.

## Warning-only composition QA

V1.2 retains V1.1 hard mechanical validation and adds warnings only for group spacing, focal dominance, text/object competition, arrow crossings, reading-order violations, dense clusters, and final-frame overload. Warnings must never move, resize, re-time, or reinterpret a scene. Object geometry, canvas safety, duration, stroke bounds, and basic density remain mechanical failures.

## Evidence and boundaries

Render all four complex scenes to local gitignored `output/v1.2/complex-benchmarks/`, then inspect final-frame/contact-sheet evidence. Re-run V1 and V1.1 unchanged as regression controls. Keep Remotion and hand overlay deferred unless the rendered complexity proves SVG/FFmpeg inadequate. Do not modify DeepTalk Core, create a unified Plugin Contract, or integrate an Episode workflow.
