import test from 'node:test';
import assert from 'node:assert/strict';
import { compositionPatternNames, createCompositionPattern } from '../src/composition.js';

test('creates four deterministic explicit composition grammar fragments', () => {
  assert.deepEqual(compositionPatternNames, ['actor-action-consequence', 'multi-actor-relation', 'accumulation-pressure', 'before-after-transition']);
  for (const name of compositionPatternNames) {
    const first = createCompositionPattern(name, { id: name });
    assert.deepEqual(first, createCompositionPattern(name, { id: name }));
    assert.ok(first.groups.length >= 3);
    assert.ok(first.elements.some((element) => element.groupId === first.focalGroup));
    assert.ok(first.readingOrder.length >= 3);
  }
});
