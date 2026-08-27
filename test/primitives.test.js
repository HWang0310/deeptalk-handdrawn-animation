import test from 'node:test';
import assert from 'node:assert/strict';

import { createPrimitive, primitiveNames } from '../src/primitives.js';
import { primitiveSheet } from '../fixtures/primitive-sheet.js';
import { validateScene } from '../src/schema.js';

test('provides the original V1.1 primitive vocabulary needed for explainers', () => {
  assert.deepEqual(primitiveNames, [
    'person', 'building', 'document', 'money-bag', 'light-bulb', 'cloud', 'factory', 'screen',
    'simple-chart', 'emotion-mark', 'arrow-family', 'circle-annotation', 'underline', 'cross-out', 'emphasis-strokes',
  ]);
  for (const name of primitiveNames) {
    const elements = createPrimitive(name, { id: name, x: 100, y: 100, scale: 1, startMs: 0 });
    assert.ok(elements.length >= 1, `${name} must compose at least one visible element`);
    assert.ok(elements.every((element) => element.id.startsWith(`${name}-`)));
  }
});

test('builds a local primitive sheet that is a valid original render scene', () => {
  assert.equal(primitiveSheet.durationMs, 10000);
  assert.ok(primitiveSheet.elements.length > primitiveNames.length);
  assert.equal(validateScene(primitiveSheet).id, 'primitive-vocabulary');
});
