/* ============================================================================
   three/entryAnimation.js
   The "dollhouse assembles itself" intro sequence: floor unfolds, walls
   stand up, desk/cabinets/fridge/table bounce into place, posters/shelves
   pop in one after another, the monitor/laptop/lamp light up, and finally
   the character fades in. Kept out of the component so the timeline can be
   tuned or reused without touching scene-setup code.
   ========================================================================== */

import { clamp01, easeOutCubic, easeOutBack } from "./mathUtils.js";

const ENTRY_DURATION = 2.6;
const CHAR_ENTRY_DELAY = 2.1;
const CHAR_ENTRY_DUR = 0.5;

/**
 * @param {Object} scene
 * @param {THREE.Mesh} scene.floorMesh
 * @param {THREE.Group} scene.wallsGroup
 * @param {THREE.Group} scene.character
 * @param {{obj:THREE.Object3D, type:'bounce'|'pop'|'fade', delay:number, dur:number}[]} scene.animatedItems
 * @param {THREE.Group} scene.monitor  - expects .userData.screenMat
 * @param {THREE.Group} scene.laptop   - expects .userData.screenMat
 * @param {THREE.Group} scene.lamp     - expects .userData.light
 * @param {() => number} scene.getLampBoost - current lighting preset's lampBoost
 */
export function createEntryAnimation({ floorMesh, wallsGroup, character, animatedItems, monitor, laptop, lamp, getLampBoost }) {
  animatedItems.forEach((item) => {
    item.obj.userData._entryBase = item.obj.scale.clone();
    item.obj.scale.set(0.001, 0.001, 0.001);
  });
  floorMesh.scale.y = 0.001;
  wallsGroup.rotation.x = Math.PI / 2;
  character.scale.set(0.001, 0.001, 0.001);

  let done = false;

  /** Call once per frame with total elapsed seconds. Returns true once done. */
  function update(elapsed) {
    if (done) return true;

    const p = clamp01(elapsed / ENTRY_DURATION);
    if (p < 1) {
      floorMesh.scale.y = 0.001 + easeOutCubic(clamp01((elapsed - 0.05) / 0.35)) * 0.999;
      wallsGroup.rotation.x = (Math.PI / 2) * (1 - easeOutCubic(clamp01((elapsed - 0.25) / 0.5)));

      animatedItems.forEach((item) => {
        const local = clamp01((elapsed - item.delay) / item.dur);
        const base = item.obj.userData._entryBase;
        const s = item.type === "fade" ? easeOutCubic(local) : easeOutBack(local);
        const sMin = item.type === "fade" ? 0.05 : 0.001;
        item.obj.scale.set(base.x * Math.max(s, sMin), base.y * Math.max(s, sMin), base.z * Math.max(s, sMin));
      });

      const glowP = clamp01((elapsed - 2.0) / 0.5);
      monitor.userData.screenMat.emissiveIntensity = 0.9 * glowP;
      laptop.userData.screenMat.emissiveIntensity = 0.7 * glowP;
      lamp.userData.light.intensity = 0.9 * glowP * getLampBoost();

      const charP = easeOutBack(clamp01((elapsed - CHAR_ENTRY_DELAY) / CHAR_ENTRY_DUR));
      character.scale.set(Math.max(charP, 0.001), Math.max(charP, 0.001), Math.max(charP, 0.001));
      return false;
    }

    // snap everything to its final resting state exactly once
    done = true;
    floorMesh.scale.y = 1;
    wallsGroup.rotation.x = 0;
    animatedItems.forEach((item) => item.obj.scale.copy(item.obj.userData._entryBase));
    character.scale.set(1, 1, 1);
    monitor.userData.screenMat.emissiveIntensity = 0.9;
    laptop.userData.screenMat.emissiveIntensity = 0.7;
    lamp.userData.light.intensity = 0.9 * getLampBoost();
    return true;
  }

  return { update, isDone: () => done };
}
