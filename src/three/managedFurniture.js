/* ============================================================================
   three/managedFurniture.js
   Builders for the 10 user-addable furniture types (desk, chair, shelf,
   plant, lamp, rug, cart, table, sofa, cabinet). These are intentionally
   simpler/smaller than the fixed decor in roomBuilders.js — they're meant
   to be dropped in, moved, rotated, resized and deleted freely — but three
   of them (chair, plant, rug) reuse the exact fixed-decor builders so they
   match the room's style.
   ========================================================================== */

import * as THREE from "three";
import { ACCENT } from "../constants.js";
import { box, mat, makeRoundedSlab } from "./helpers.js";
import { buildWorkChair, buildPottedPlant, buildRugMesh } from "./roomBuilders.js";

export function createManagedFurniture(type) {
  let g;
  switch (type) {
      case "desk": {
        g = new THREE.Group();
        const top = new THREE.Mesh(makeRoundedSlab(1.1, 0.55, 0.05, 0.03), mat("#c99a5b"));
        top.position.y = 0.72; g.add(top);
        [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]].forEach(([x, z]) => {
          const leg = box(0.05, 0.7, 0.05, mat("#6a5a45")); leg.position.set(x, 0.35, z); g.add(leg);
        });
        break;
      }
      case "chair": g = buildWorkChair(); break;
      case "shelf": {
        g = new THREE.Group();
        const boardM = box(0.9, 0.05, 0.3, mat("#8a6a45")); boardM.position.y = 1.3; g.add(boardM);
        [-0.4, 0.4].forEach((x) => { const s = box(0.04, 1.3, 0.04, mat("#5c4a38")); s.position.set(x, 0.65, 0.1); g.add(s); });
        break;
      }
      case "plant": g = buildPottedPlant(1.3); break;
      case "lamp": {
        g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 16), mat("#3a3a3a")));
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), mat("#3a3a3a")); pole.position.y = 0.66; g.add(pole);
        const shade = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 16, 1, true), mat(ACCENT.mintDark, { side: THREE.DoubleSide, emissive: "#fff2c9", emissiveIntensity: 0.15 }));
        shade.position.y = 1.35; g.add(shade);
        const light = new THREE.PointLight(0xfff2c9, 0.6, 2.5); light.position.y = 1.28; g.add(light);
        break;
      }
      case "rug": g = new THREE.Group(); g.add(buildRugMesh(1.4, 1.0, "#8fd6c4", "#5fae98", "#e3806b")); break;
      case "cart": {
        g = new THREE.Group();
        const body = box(0.5, 0.6, 0.35, mat(ACCENT.white)); body.position.y = 0.45; g.add(body);
        const shelfM = box(0.46, 0.02, 0.31, mat("#d8d8d8")); shelfM.position.y = 0.3; g.add(shelfM);
        [[-0.2, -0.13], [0.2, -0.13], [-0.2, 0.13], [0.2, 0.13]].forEach(([x, z]) => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), mat("#2c2c2c"));
          wheel.rotation.z = Math.PI / 2; wheel.position.set(x, 0.05, z); g.add(wheel);
        });
        break;
      }
      case "table": {
        g = new THREE.Group();
        const top = new THREE.Mesh(makeRoundedSlab(0.55, 0.55, 0.04, 0.04), mat(ACCENT.coral));
        top.position.y = 0.5; g.add(top);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.46, 10), mat("#6a5a45"));
        post.position.y = 0.27; g.add(post);
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 16), mat("#6a5a45"));
        foot.position.y = 0.025; g.add(foot);
        break;
      }
      case "sofa": {
        g = new THREE.Group();
        const seatMat = mat(ACCENT.lavender, { roughness: 0.9 });
        const seat = new THREE.Mesh(makeRoundedSlab(0.62, 0.5, 0.22, 0.06), seatMat);
        seat.position.y = 0.24; g.add(seat);
        const back = new THREE.Mesh(makeRoundedSlab(0.62, 0.14, 0.42, 0.06), seatMat);
        back.position.set(0, 0.46, -0.18); g.add(back);
        [-1, 1].forEach((s) => {
          const arm = new THREE.Mesh(makeRoundedSlab(0.12, 0.5, 0.3, 0.05), seatMat);
          arm.position.set(s * 0.29, 0.34, 0); g.add(arm);
        });
        [[-0.24, -0.18], [0.24, -0.18], [-0.24, 0.18], [0.24, 0.18]].forEach(([x, z]) => {
          const leg = box(0.03, 0.13, 0.03, mat("#5c4a38")); leg.position.set(x, 0.065, z); g.add(leg);
        });
        break;
      }
      case "cabinet": {
        g = new THREE.Group();
        const body = box(0.6, 0.9, 0.4, mat(ACCENT.butterYellow)); body.position.y = 0.45; g.add(body);
        for (let i = 0; i < 2; i++) {
          const doorLine = box(0.008, 0.82, 0.008, mat("#c9a94a"));
          doorLine.position.set(0, 0.46, 0.201); g.add(doorLine);
          const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mat("#8a6a2c", { metalness: 0.6, envMapIntensity: 1.3 }));
          knob.position.set(i === 0 ? -0.03 : 0.03, 0.46, 0.205); g.add(knob);
        }
        const top = box(0.64, 0.03, 0.44, mat("#efe9df")); top.position.y = 0.915; g.add(top);
        break;
      }
      default: g = new THREE.Group();
  }

  g.userData.type = type;
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
