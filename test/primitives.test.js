import test from 'node:test';
import assert from 'node:assert/strict';

import { createPrimitive, primitiveNames } from '../src/primitives.js';
import { primitiveSheet } from '../fixtures/primitive-sheet.js';
import { runQa } from '../src/qa.js';
import { validateScene } from '../src/schema.js';

test('provides the original V1.1 primitive vocabulary needed for explainers', () => {
  assert.deepEqual(primitiveNames, [
    'person', 'building', 'document', 'money-bag', 'light-bulb', 'cloud', 'factory', 'screen',
    'simple-chart', 'emotion-mark', 'arrow-family', 'circle-annotation', 'underline', 'cross-out', 'emphasis-strokes', 'role-person', 'resource-stack',
  ]);
  for (const name of primitiveNames) {
    const elements = createPrimitive(name, { id: name, x: 100, y: 100, scale: 1, startMs: 0 });
    assert.ok(elements.length >= 1, `${name} must compose at least one visible element`);
    assert.ok(elements.every((element) => element.id.startsWith(`${name}-`)));
  }
});

test('adds selected role and resource family primitives for scene composition', () => {
  assert.ok(primitiveNames.includes('role-person'));
  assert.ok(primitiveNames.includes('resource-stack'));
  assert.ok(createPrimitive('role-person', { id: 'role', x: 40, y: 40 }).length > 1);
  assert.ok(createPrimitive('resource-stack', { id: 'resource', x: 40, y: 40 }).length > 1);
});

test('builds a local primitive sheet that is a valid original render scene', () => {
  assert.equal(primitiveSheet.durationMs, 10000);
  assert.ok(primitiveSheet.elements.length > primitiveNames.length);
  assert.equal(validateScene(primitiveSheet).id, 'primitive-vocabulary');
});

test('primitive sheet covers every registered primitive and its readable label', () => {
  for (const name of primitiveNames) {
    assert.ok(
      primitiveSheet.elements.some((element) => element.id.startsWith(`${name}-`) && element.id !== `${name}-label`),
      `${name} must appear on the primitive sheet`,
    );
    assert.ok(
      primitiveSheet.elements.some((element) => element.id === `${name}-label` && element.text?.trim()),
      `${name} must keep a readable primitive-sheet label`,
    );
  }
});

test('primitive sheet keeps the complete vocabulary inside hard canvas bounds', () => {
  const qa = runQa(primitiveSheet);
  const boundsOverflow = qa.findings.filter((finding) => finding.code === 'bounds-overflow');

  assert.deepEqual(boundsOverflow, [], 'adding a primitive must not silently push the final row outside the canvas');
  assert.equal(qa.checks.boundsWithinMargin, true);
  assert.equal(qa.passed, true);
});
