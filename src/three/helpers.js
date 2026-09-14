/* ============================================================================
   three/helpers.js
   Reusable, presentation-agnostic Three.js helpers:
     - geometry builders (rounded slabs, ellipse slabs, box/place/material
       shortcuts) used by every static and dynamic mesh in the scene
     - procedural canvas textures (wood, tile, plaid, pegboard, sky, contact
       shadow, environment cube) since no external image/HDRI assets are
       available in this environment
   Nothing here is React- or scene-graph-aware beyond building/returning
   Object3D-compatible geometry, materials and meshes.
   ========================================================================== */

import * as THREE from "three";
import { ACCENT, ROOM } from "../constants.js";

export function roundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2, rr = Math.min(r, w / 2, h / 2);
  shape.moveTo(x, y + rr);
  shape.lineTo(x, y + h - rr);
  shape.quadraticCurveTo(x, y + h, x + rr, y + h);
  shape.lineTo(x + w - rr, y + h);
  shape.quadraticCurveTo(x + w, y + h, x + w, y + h - rr);
  shape.lineTo(x + w, y + rr);
  shape.quadraticCurveTo(x + w, y, x + w - rr, y);
  shape.lineTo(x + rr, y);
  shape.quadraticCurveTo(x, y, x, y + rr);
  return shape;
}
export function makeRoundedSlab(width, depthZ, thickness, radius, segments = 3) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(width, depthZ, radius), {
    depth: thickness, bevelEnabled: false, curveSegments: segments,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(-Math.PI / 2);
  return geo;
}
export function makeEllipseSlab(radiusX, radiusZ, thickness, segments = 40) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radiusX, radiusZ, 0, Math.PI * 2, false, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: segments });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(-Math.PI / 2);
  return geo;
}
export function box(w, h, d, mat_) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat_);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
/* set position on any Object3D and return it, so builders can chain
   creation + placement in one expression (Object3D.position must be
   mutated via .set()/.x/.y/.z, not reassigned) */
export function place(o, x = 0, y = 0, z = 0) {
  o.position.set(x, y, z);
  return o;
}
export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.75,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    envMapIntensity: opts.envMapIntensity ?? 1,
    polygonOffset: !!opts.polygonOffset,
    polygonOffsetFactor: opts.polygonOffsetFactor ?? -1,
    polygonOffsetUnits: opts.polygonOffsetUnits ?? -1,
  });
}

/* --- procedural textures (no external image assets are available) --- */

export function makeWoodTexture(c1, c2) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = c1; ctx.fillRect(0, 0, 256, 256);
  const plankH = 26;
  for (let y = 0; y < 256; y += plankH) {
    ctx.fillStyle = (y / plankH) % 2 === 0 ? c1 : c2;
    ctx.fillRect(0, y, 256, plankH - 2);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.beginPath(); ctx.moveTo(0, y + plankH - 2); ctx.lineTo(256, y + plankH - 2); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(0,0,0,0.04)";
      const yy = y + 4 + i * 7;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.bezierCurveTo(64, yy + 2, 192, yy - 2, 256, yy); ctx.stroke();
    }
  }
  // cheap baked ambient-occlusion: darken the perimeter slightly
  const vg = ctx.createRadialGradient(128, 128, 90, 128, 128, 190);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ROOM.width / 2.2, ROOM.depth / 2.2);
  return tex;
}
export function makeTileTexture(grout, tile) {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = grout; ctx.fillRect(0, 0, 128, 128);
  const cell = 32, gap = 3;
  for (let y = 0; y < 128; y += cell)
    for (let x = 0; x < 128; x += cell) {
      const shade = 1 - Math.random() * 0.08;
      ctx.fillStyle = tile; ctx.globalAlpha = shade;
      ctx.fillRect(x + gap / 2, y + gap / 2, cell - gap, cell - gap);
      ctx.globalAlpha = 1;
    }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1.4);
  return tex;
}
export function makePlaidTexture(base, lineA, lineB) {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = base; ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = lineA; ctx.lineWidth = 6;
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }
  ctx.strokeStyle = lineB; ctx.lineWidth = 2;
  for (let i = -128; i < 256; i += 32) { ctx.beginPath(); ctx.moveTo(i + 10, 0); ctx.lineTo(i + 10, 128); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.6, 1.2);
  return tex;
}
export function makePegboardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = ACCENT.mint; ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let y = 12; y < 128; y += 18)
    for (let x = 12; x < 128; x += 18) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  return new THREE.CanvasTexture(canvas);
}
export function makeWindowSkyTexture(topColor, bottomColor, stars) {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, topColor); grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
  if (stars) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 30; i++) ctx.fillRect(Math.random() * 64, Math.random() * 40, 1, 1);
  }
  return new THREE.CanvasTexture(canvas);
}
/* cheap "contact shadow" decal used under furniture/character for grounding,
   standing in for real ambient occlusion / soft shadow catchers */
export function makeContactShadow(radiusX, radiusZ = radiusX, strength = 0.35) {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, `rgba(0,0,0,${strength})`); grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radiusX * 2, radiusZ * 2), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.003;
  return mesh;
}
/* static environment cube used for subtle IBL sheen on metal/glass so
   faucets, knobs and screens don't look flat-shaded (a real-time
   reflection probe isn't available, so this is a fixed approximation) */
export function makeEnvCubeTexture() {
  const size = 32;
  const specs = [
    ["#cfe3f5", "#9fb6cf"], ["#cfe3f5", "#9fb6cf"],
    ["#ffffff", "#dbe9f7"], ["#5a5f6e", "#33363f"],
    ["#cfe3f5", "#9fb6cf"], ["#cfe3f5", "#9fb6cf"],
  ];
  const faces = specs.map(([a, b]) => {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    return c;
  });
  const tex = new THREE.CubeTexture(faces);
  tex.needsUpdate = true;
  return tex;
}
