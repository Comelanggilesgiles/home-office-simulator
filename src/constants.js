/* ============================================================================
   constants.js
   All static configuration: room dimensions, color presets, lighting
   presets, the manageable-furniture registry, and the lightweight
   collision-obstacle helpers used by furniture placement + pathing.
   Nothing here touches Three.js scene objects directly, so it's safe to
   import from anywhere (React component, builders, activities, etc).
   ========================================================================== */

import * as THREE from "three";

export const ROOM = { width: 10, depth: 8, height: 4.4 };

export const WALL_PRESETS = [
  { name: "Cream", hex: "#f1e8d8" },
  { name: "Warm Sand", hex: "#e8d9bd" },
  { name: "Soft Sage", hex: "#dfe6d6" },
  { name: "Powder Blue", hex: "#dbe6ec" },
  { name: "Blush", hex: "#f0dcd6" },
  { name: "Charcoal", hex: "#3a3a42" },
];

export const FLOOR_PRESETS = [
  { name: "Light Maple", hex: "#d9b382" },
  { name: "Honey Oak", hex: "#c9974f" },
  { name: "Ash Grey", hex: "#b9b3a8" },
  { name: "Walnut", hex: "#7a5233" },
  { name: "Bleached Pine", hex: "#e8d9bd" },
  { name: "Espresso", hex: "#4a3627" },
];

export const ACCENT = {
  mint: "#8fd6c4",
  mintDark: "#6cc0ac",
  lavender: "#b7a8d9",
  coral: "#e3806b",
  coralWall: "#e0a08f",
  butterYellow: "#f3d773",
  orangeTile: "#e28a4d",
  cobalt: "#2f5aa8",
  white: "#f3f2ee",
};

export const LIGHT_PRESETS = {
  day: {
    bg: "#bcd6e8", fog: "#bcd6e8",
    ambient: { color: "#ffffff", intensity: 0.8 },
    sun: { color: "#fff6df", intensity: 1.1 },
    lampBoost: 0.15, windowGlow: "#bfe3ff",
  },
  dusk: {
    bg: "#3c3660", fog: "#3c3660",
    ambient: { color: "#8b7bb8", intensity: 0.45 },
    sun: { color: "#ff9d6c", intensity: 0.55 },
    lampBoost: 0.7, windowGlow: "#e08a5c",
  },
  night: {
    bg: "#12142a", fog: "#12142a",
    ambient: { color: "#3a4270", intensity: 0.28 },
    sun: { color: "#5867b0", intensity: 0.18 },
    lampBoost: 1, windowGlow: "#141a3a",
  },
};

// World-space offsets of the two functional zones (used by builders +
// activity waypoints so everything stays in sync if the layout changes).
export const OFFICE_ORIGIN = new THREE.Vector3(-2.1, 0, 0);
export const KITCHEN_ORIGIN = new THREE.Vector3(2.6, 0, 0);

export const GRID_STEP = 0.5;
export const BOUNDS = {
  minX: -ROOM.width / 2 + 0.4, maxX: ROOM.width / 2 - 0.4,
  minZ: -ROOM.depth / 2 + 0.4, maxZ: ROOM.depth / 2 - 0.4,
};

// Registry of user-manageable furniture. Add a new entry here + a builder
// case in three/managedFurniture.js and it automatically appears in the
// "Add furniture" panel.
export const FURNITURE_TYPES = [
  { id: "desk", label: "Desk" },
  { id: "chair", label: "Work Chair" },
  { id: "shelf", label: "Bookshelf" },
  { id: "plant", label: "Houseplant" },
  { id: "lamp", label: "Floor Lamp" },
  { id: "rug", label: "Rug" },
  { id: "cart", label: "Kitchen Cart" },
  { id: "table", label: "Side Table" },
  { id: "sofa", label: "Armchair" },
  { id: "cabinet", label: "Storage Cabinet" },
];

export const SIZE_MIN = 0.6, SIZE_MAX = 1.8, SIZE_STEP = 0.15;

/* Static obstacle zones used for lightweight collision checks (furniture
   placement + character walking). Add a box here for any new fixed piece
   that should block placement/pathing. */
export function buildObstacles() {
  return [
    { minX: OFFICE_ORIGIN.x - 2.3, maxX: OFFICE_ORIGIN.x + 1.6, minZ: -4, maxZ: -2.6 }, // office desk wall
    { minX: KITCHEN_ORIGIN.x - 1.3, maxX: KITCHEN_ORIGIN.x + 2.3, minZ: -4, maxZ: -2.9 }, // kitchen counters
    { minX: KITCHEN_ORIGIN.x - 0.7, maxX: KITCHEN_ORIGIN.x + 0.9, minZ: -1.3, maxZ: 0.2 }, // dining table
  ];
}
export function isInsideObstacle(x, z, obstacles, pad = 0.15) {
  return obstacles.some(
    (o) => x > o.minX - pad && x < o.maxX + pad && z > o.minZ - pad && z < o.maxZ + pad
  );
}
