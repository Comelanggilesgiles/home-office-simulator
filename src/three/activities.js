/* ============================================================================
   three/activities.js
   The character is autonomous: she isn't puppeted by buttons, she picks
   one of these activities herself (see the scheduler in
   HomeOfficeSimulator.jsx) and runs it to completion before choosing the
   next one. Waypoints (SPOTS) are derived from the room-zone origins so
   they stay correct if the layout constants ever change. Add a new
   activity by adding a SPOTS entry (if needed) and an ACTIVITIES entry —
   the runner only understands three step "types": walk / pose / loop.
   ========================================================================== */

import * as THREE from "three";
import { OFFICE_ORIGIN, KITCHEN_ORIGIN } from "../constants.js";

export const SPOTS = {
  park: new THREE.Vector3(0, 0, 1.6),
  desk: new THREE.Vector3(OFFICE_ORIGIN.x - 0.6, 0, OFFICE_ORIGIN.z - 3.2),
  coffee: new THREE.Vector3(KITCHEN_ORIGIN.x - 0.7, 0, KITCHEN_ORIGIN.z - 3.05),
  cooktop: new THREE.Vector3(KITCHEN_ORIGIN.x + 0.4, 0, KITCHEN_ORIGIN.z - 3.05),
  windowSpot: new THREE.Vector3(OFFICE_ORIGIN.x - 1.3, 0, -2.2),
  center: new THREE.Vector3(0.3, 0, -0.4),
};

/* Add a new key here (plus SPOTS entries if needed) to script a new
   activity — the runner below only understands three step "types". */
export const ACTIVITIES = {
  work: [
    { type: "walk", to: SPOTS.desk },
    { type: "pose", name: "sit", duration: 0.5 },
    { type: "loop", name: "type", duration: 6 },
    { type: "pose", name: "stand", duration: 0.5 },
    { type: "walk", to: SPOTS.park },
  ],
  coffee: [
    { type: "walk", to: SPOTS.coffee },
    { type: "loop", name: "pour", duration: 3, effect: "fillMug" },
    { type: "walk", to: SPOTS.park },
  ],
  cook: [
    { type: "walk", to: SPOTS.cooktop },
    { type: "loop", name: "stir", duration: 5, effect: "fillPan" },
    { type: "walk", to: SPOTS.park },
  ],
  wander: [
    { type: "walk", to: SPOTS.center },
    { type: "walk", to: SPOTS.windowSpot },
    { type: "walk", to: SPOTS.park },
  ],
};

export const ACTIVITY_LABELS = {
  work: "Working at the desk",
  coffee: "Making coffee",
  cook: "Cooking dinner",
  wander: "Wandering around",
};
