function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed, channel) {
  let value = hashSeed(`${seed}:${channel}`) || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967295;
}

export function seededValue(seed, channel, min, max) {
  return Number((min + unit(seed, channel) * (max - min)).toFixed(4));
}

export function wobblePathData(d, seed, amplitude) {
  if (!amplitude) return d;
  let index = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (token) => {
    const offset = seededValue(seed, `path:${index}`, -amplitude, amplitude);
    index += 1;
    return String(Number((Number(token) + offset).toFixed(2)));
  });
}

export function resolveOrganic(scene, element) {
  const profile = scene.style?.organic;
  if (!profile) return null;
  return {
    seed: profile.seed,
    wobble: profile.wobble,
    widthVariance: profile.widthVariance,
    duplicateSketch: profile.duplicateSketch,
  };
}
