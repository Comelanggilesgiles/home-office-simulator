/* ============================================================================
   three/effects.js
   Lightweight visual effects. Currently just a pooled steam/puff sprite
   system used by the coffee-pouring and cooking activities, kept separate
   so new ambient effects (dust motes, sparkles, etc) have an obvious home
   that isn't the main component file.
   ========================================================================== */

import * as THREE from "three";

export function createSteamPool(scene, count = 10) {
  const canvas = document.createElement("canvas");
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const steamTex = new THREE.CanvasTexture(canvas);

  const pool = [];
  for (let i = 0; i < count; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0, depthWrite: false })
    );
    sprite.scale.set(0.15, 0.2, 1);
    scene.add(sprite);
    pool.push({ sprite, life: 0, active: false });
  }

  function spawn(worldPos) {
    const p = pool.find((s) => !s.active);
    if (!p) return;
    p.active = true;
    p.life = 0;
    p.sprite.position.copy(worldPos);
    p.sprite.material.opacity = 0.6;
  }

  function update(dt) {
    pool.forEach((s) => {
      if (!s.active) return;
      s.life += dt;
      s.sprite.position.y += dt * 0.35;
      s.sprite.material.opacity = Math.max(0, 0.6 - s.life * 0.5);
      s.sprite.scale.setScalar(0.15 + s.life * 0.1);
      if (s.life > 1.2) {
        s.active = false;
        s.sprite.material.opacity = 0;
      }
    });
  }

  return { spawn, update };
}
