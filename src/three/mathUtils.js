/* ============================================================================
   mathUtils.js
   Small pure functions used by the animation systems (character poses,
   entry-animation timeline, camera tweens). No Three.js or React deps.
   ========================================================================== */

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

export const lerp = (a, b, t) => a + (b - a) * t;

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeOutBack = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
