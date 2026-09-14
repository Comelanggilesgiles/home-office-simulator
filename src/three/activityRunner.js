/* ============================================================================
   three/activityRunner.js
   Drives the character through a scripted ACTIVITIES sequence (walk / pose /
   loop steps) AND decides, on her own, what to do next once she's idle —
   she isn't puppeted by UI buttons. The only thing the outside world can do
   is pause/resume that autonomy or ask what she's currently doing.
   Deliberately decoupled from concrete room meshes: callers pass small
   "effects" and "steamSpawnPoints" callback maps instead of object refs, so
   this module doesn't need to know a mug or a cooktop exists.
   ========================================================================== */

import * as THREE from "three";
import { ACTIVITIES } from "./activities.js";
import { POSES, applyPose, applyLoop, applyWalkCycle } from "./character.js";

/**
 * @param {Object} opts
 * @param {THREE.Group} opts.character
 * @param {Object} opts.rig - character.userData.rig
 * @param {Record<string, () => void>} [opts.effects] - keyed by step.effect (e.g. fillMug, fillPan)
 * @param {Record<string, () => THREE.Vector3>} [opts.steamSpawnPoints] - keyed by loop step name
 * @param {(pos: THREE.Vector3) => void} [opts.onSteamSpawn]
 * @param {(name: string|null) => void} [opts.onActivityChange] - fired when she starts/stops something
 */
export function createActivityRunner({
  character, rig, effects = {}, steamSpawnPoints = {}, onSteamSpawn, onActivityChange,
}) {
  const runner = { name: null, stepIndex: 0, stepElapsed: 0 };
  const autonomy = { enabled: true, timer: 0, cooldown: 1.5 + Math.random() * 2, last: null };
  const activityNames = Object.keys(ACTIVITIES);

  function startActivity(name) {
    runner.name = name;
    runner.stepIndex = 0;
    runner.stepElapsed = 0;
    onActivityChange?.(name);
  }

  function stopActivity() {
    runner.name = null;
    onActivityChange?.(null);
  }

  function pickAndStartActivity() {
    const options = activityNames.filter((n) => n !== autonomy.last);
    const pick = options[Math.floor(Math.random() * options.length)];
    autonomy.last = pick;
    startActivity(pick);
  }

  /** Call once per frame once the entry animation has finished. */
  function update(dt, elapsed) {
    if (runner.name) {
      const steps = ACTIVITIES[runner.name];
      const step = steps[runner.stepIndex];
      if (!step) {
        stopActivity();
        applyPose(rig, POSES.stand, 0.1);
        return;
      }

      if (step.type === "walk") {
        const dir = new THREE.Vector3().subVectors(step.to, character.position);
        dir.y = 0;
        const dist = dir.length();
        if (dist > 0.06) {
          dir.normalize();
          const speed = 1.6;
          character.position.addScaledVector(dir, Math.min(speed * dt, dist));
          const targetAngle = Math.atan2(dir.x, dir.z);
          character.rotation.y = THREE.MathUtils.lerp(character.rotation.y, targetAngle, 0.15);
          applyWalkCycle(rig, elapsed, 1);
        } else {
          runner.stepElapsed = 0;
          runner.stepIndex++;
        }
      } else if (step.type === "pose") {
        applyPose(rig, POSES[step.name], 0.12);
        runner.stepElapsed += dt;
        if (runner.stepElapsed >= step.duration) { runner.stepElapsed = 0; runner.stepIndex++; }
      } else if (step.type === "loop") {
        applyPose(rig, step.name === "type" ? POSES.sit : POSES.stand, 0.1);
        applyLoop(rig, step.name, elapsed);
        runner.stepElapsed += dt;
        if (step.effect && runner.stepElapsed > step.duration * 0.5) effects[step.effect]?.();
        if (Math.random() < 0.06) {
          const getPoint = steamSpawnPoints[step.name];
          if (getPoint) onSteamSpawn?.(getPoint());
        }
        if (runner.stepElapsed >= step.duration) { runner.stepElapsed = 0; runner.stepIndex++; }
      }
      return;
    }

    // idle: hold a resting pose and, if autonomy is enabled, decide what's next
    applyPose(rig, POSES.stand, 0.05);
    if (!autonomy.enabled) return;
    autonomy.timer += dt;
    if (autonomy.timer >= autonomy.cooldown) {
      autonomy.timer = 0;
      autonomy.cooldown = 2.5 + Math.random() * 4;
      pickAndStartActivity();
    }
  }

  function setAutonomyEnabled(enabled) {
    autonomy.enabled = enabled;
    if (!enabled) stopActivity();
  }

  return { update, startActivity, stopActivity, setAutonomyEnabled };
}
