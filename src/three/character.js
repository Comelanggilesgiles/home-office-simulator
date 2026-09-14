/* ============================================================================
   three/character.js
   The procedural, low-poly jointed figure (deliberately toy-like, matching
   the diorama's aesthetic — there's no rigged/mocapped avatar asset
   available in this environment) plus its animation system:
     - POSES: named target joint rotations (stand / sit)
     - applyPose: smoothly blends the rig toward a named pose
     - applyLoop: layers a looping action (typing / pouring / stirring) on
       top of the current pose while a scripted activity step is playing
     - applyWalkCycle: procedural leg/arm swing while the character is
       walking toward a waypoint
   ========================================================================== */

import * as THREE from "three";
import { mat, box, place, makeContactShadow } from "./helpers.js";
import { lerp } from "./mathUtils.js";

export function buildCharacter() {
  const skinMat = mat("#e8b98a", { roughness: 0.6 });
  const shirtMat = mat("#5c7fb8", { roughness: 0.8 });
  const pantsMat = mat("#3a3a42", { roughness: 0.8 });
  const hairMat = mat("#3a2a1e", { roughness: 0.6 });
  const shoeMat = mat("#2c2c2c", { roughness: 0.5 });

  const root = new THREE.Group();
  root.name = "character";

  const hips = new THREE.Group();
  hips.position.y = 0.86;
  root.add(hips);

  hips.add(place(box(0.32, 0.42, 0.19, shirtMat), 0, 0.24, 0));

  const neck = new THREE.Group();
  neck.position.y = 0.46;
  hips.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), skinMat);
  head.position.y = 0.12; neck.add(head);
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.125, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hairMesh.position.y = 0.16; neck.add(hairMesh);
  [-0.045, 0.045].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), mat("#2a2a2a"));
    eye.position.set(x, 0.13, 0.11); neck.add(eye);
  });

  function buildArm(sign) {
    const shoulder = new THREE.Group();
    shoulder.position.set(sign * 0.19, 0.42, 0);
    hips.add(shoulder);
    const upper = box(0.08, 0.26, 0.08, shirtMat); upper.position.y = -0.13; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.26; shoulder.add(elbow);
    const lower = box(0.07, 0.24, 0.07, skinMat); lower.position.y = -0.12; elbow.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat); hand.position.y = -0.26; elbow.add(hand);
    return { shoulder, elbow, hand };
  }
  function buildLeg(sign) {
    const hip = new THREE.Group(); hip.position.set(sign * 0.09, 0, 0); hips.add(hip);
    const upper = box(0.1, 0.4, 0.1, pantsMat); upper.position.y = -0.2; hip.add(upper);
    const knee = new THREE.Group(); knee.position.y = -0.4; hip.add(knee);
    const lower = box(0.09, 0.42, 0.09, pantsMat); lower.position.y = -0.21; knee.add(lower);
    const foot = box(0.1, 0.06, 0.16, shoeMat); foot.position.set(0, -0.44, 0.03); knee.add(foot);
    return { hip, knee, foot };
  }

  const rig = {
    hips, armL: buildArm(-1), armR: buildArm(1), legL: buildLeg(-1), legR: buildLeg(1),
  };

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  root.add(makeContactShadow(0.32, 0.24, 0.3));
  root.userData.rig = rig;
  root.userData.baseHipY = hips.position.y;
  return root;
}

/* Named poses as target local rotations (radians). Add a new key here and
   it becomes usable by any activity step of type 'pose' / 'loop'. */
export const POSES = {
  stand: { legL: 0, legR: 0, armL: 0.06, armR: -0.06, hipDrop: 0 },
  sit: { legHipX: -1.35, legKneeX: 1.5, armL: -0.15, armR: -0.15, hipDrop: 0.34 },
};

export function applyPose(rig, pose, alpha) {
  const l = lerp; // local alias so the joint-update lines below stay compact
  rig.hips.position.y = l(rig.hips.position.y, (rig.root_baseHipY ?? 0.86) - (pose.hipDrop || 0), alpha);
  [rig.legL, rig.legR].forEach((leg) => {
    leg.hip.rotation.x = l(leg.hip.rotation.x, pose.legHipX ?? 0, alpha);
    leg.knee.rotation.x = l(leg.knee.rotation.x, pose.legKneeX ?? 0, alpha);
  });
  rig.armL.shoulder.rotation.x = l(rig.armL.shoulder.rotation.x, pose.armL ?? 0, alpha);
  rig.armR.shoulder.rotation.x = l(rig.armR.shoulder.rotation.x, pose.armR ?? 0, alpha);
  rig.armL.elbow.rotation.x = l(rig.armL.elbow.rotation.x, 0, alpha);
  rig.armR.elbow.rotation.x = l(rig.armR.elbow.rotation.x, 0, alpha);
}

/* looping "activity" animations layered on top of the base pose while a
   scripted step is in progress (typing / pouring / stirring) */
export function applyLoop(rig, name, t) {
  if (name === "type") {
    rig.armL.shoulder.rotation.x = -1.15 + Math.sin(t * 9) * 0.05;
    rig.armR.shoulder.rotation.x = -1.15 + Math.sin(t * 9 + 1.4) * 0.05;
    rig.armL.elbow.rotation.x = -1.0;
    rig.armR.elbow.rotation.x = -1.0;
  } else if (name === "pour") {
    rig.armR.shoulder.rotation.x = -1.3 + Math.sin(t * 2) * 0.1;
    rig.armR.elbow.rotation.x = -0.9;
    rig.armL.shoulder.rotation.x = -0.3;
  } else if (name === "stir") {
    rig.armR.shoulder.rotation.x = -1.1;
    rig.armR.elbow.rotation.x = -0.6 + Math.sin(t * 5) * 0.35;
    rig.armR.shoulder.rotation.z = Math.cos(t * 5) * 0.15;
  }
}

export function applyWalkCycle(rig, t, speedScale) {
  const swing = Math.sin(t * 7 * speedScale) * 0.55;
  rig.legL.hip.rotation.x = swing;
  rig.legR.hip.rotation.x = -swing;
  rig.legL.knee.rotation.x = Math.max(0, -swing) * 0.9;
  rig.legR.knee.rotation.x = Math.max(0, swing) * 0.9;
  rig.armL.shoulder.rotation.x = -swing * 0.5;
  rig.armR.shoulder.rotation.x = swing * 0.5;
  rig.hips.position.y = (rig.root_baseHipY ?? 0.86) + Math.abs(Math.sin(t * 14 * speedScale)) * 0.015;
}
