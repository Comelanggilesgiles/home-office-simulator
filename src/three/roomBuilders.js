/* ============================================================================
   three/roomBuilders.js
   Every fixed piece of the diorama: the office half (desk, monitor, laptop,
   PC tower, keyboard/wrist rest, lamp, drawer units, posters, pegboard,
   floating shelves, rug, window, curtains, plants, bookshelf, wall clock)
   and the kitchen half (base cabinets, backsplash, sink, cooktop, coffee
   maker, mug, wall cabinet with plates, fridge, oval table + stool, cutting
   board). A few builders here (buildWorkChair, buildPottedPlant,
   buildRugMesh) are also reused by three/managedFurniture.js so the
   user-addable versions match the fixed decor's style.
   ========================================================================== */

import * as THREE from "three";
import { ACCENT, ROOM, WALL_PRESETS } from "../constants.js";
import {
  box, mat, place, makeRoundedSlab, makeEllipseSlab,
  makeWoodTexture, makeTileTexture, makePlaidTexture,
  makePegboardTexture, makeWindowSkyTexture, makeContactShadow,
} from "./helpers.js";

export function buildFloor(width, depth) {
  const m = mat("#d9b382", { roughness: 0.85 });
  m.map = makeWoodTexture("#d9b382", "#c9a06e");
  const meshFloor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), m);
  meshFloor.position.y = -0.055; // unified floor mesh, lowered 5mm to avoid clipping
  meshFloor.receiveShadow = true;
  return meshFloor;
}

export function buildWalls() {
  const group = new THREE.Group();
  const h = ROOM.height, w = ROOM.width, d = ROOM.depth;
  const officeWallMat = mat(WALL_PRESETS[0].hex, { polygonOffset: true });
  const kitchenWallMat = mat(ACCENT.coralWall, { polygonOffset: true });
  const sideMat = mat(ACCENT.coralWall, { polygonOffset: true });

  const backOffice = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.58, h), officeWallMat);
  backOffice.position.set(-w * 0.21, h / 2, -d / 2);
  backOffice.receiveShadow = true;
  group.add(backOffice);

  const backKitchen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.42, h), kitchenWallMat);
  backKitchen.position.set(w * 0.29, h / 2, -d / 2);
  backKitchen.receiveShadow = true;
  group.add(backKitchen);

  const side = new THREE.Mesh(new THREE.PlaneGeometry(d, h), sideMat);
  side.rotation.y = -Math.PI / 2;
  side.position.set(w / 2, h / 2, 0);
  side.receiveShadow = true;
  group.add(side);

  group.userData.officeWallMats = [officeWallMat];
  group.userData.kitchenWallMats = [kitchenWallMat, sideMat];
  return group;
}

export function buildWindow() {
  const g = new THREE.Group();
  g.add(box(2.1, 1.7, 0.12, mat("#efe6d2")));
  const skyTex = makeWindowSkyTexture("#1b2350", "#3c3660", true);
  const glassMat = new THREE.MeshBasicMaterial({ map: skyTex });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), glassMat);
  glass.position.z = 0.07;
  g.add(glass);
  const mullionMat = mat("#efe6d2");
  const vBar = box(0.06, 1.4, 0.1, mullionMat); vBar.position.z = 0.08; g.add(vBar);
  const hBar = box(1.8, 0.06, 0.1, mullionMat); hBar.position.z = 0.08; g.add(hBar);
  const blind = box(2.1, 0.22, 0.14, mat("#e8dcc0")); blind.position.y = 1.05; g.add(blind);
  g.userData.glassMat = glassMat;
  return g;
}

export function buildCurtains() {
  const g = new THREE.Group();
  const curtainMat = mat("#e7d7c6", { roughness: 0.9 });
  const left = box(0.35, 2.1, 0.06, curtainMat); left.position.set(-1.25, -0.15, 0.1);
  const right = left.clone(); right.position.x = 1.25;
  g.add(left, right);
  const rod = box(2.9, 0.05, 0.05, mat("#8a7256", { metalness: 0.4 })); rod.position.y = 0.95; g.add(rod);
  g.userData.sway = [left, right]; // animated by idle-motion system
  return g;
}

export function buildPottedPlant(scale = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.17 * scale, 0.3 * scale, 12), mat(ACCENT.lavender));
  pot.position.y = 0.15 * scale;
  g.add(pot);
  const leaves = new THREE.Group();
  const leafMat = mat("#3f7a52");
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07 * scale, 0.55 * scale, 6), leafMat);
    const ang = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(ang) * 0.1 * scale, 0.55 * scale, Math.sin(ang) * 0.1 * scale);
    leaf.rotation.z = Math.cos(ang) * 0.35; leaf.rotation.x = Math.sin(ang) * 0.35;
    leaves.add(leaf);
  }
  g.add(leaves);
  g.userData.sway = leaves;
  g.add(makeContactShadow(0.3 * scale));
  return g;
}
export function buildHangingPlant() {
  const g = new THREE.Group();
  const bracket = box(0.05, 0.05, 0.3, mat("#8a7256")); bracket.position.z = 0.15; g.add(bracket);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), mat("#c9b98f"));
  rope.position.set(0, -0.25, 0.3); g.add(rope);
  const swing = new THREE.Group();
  swing.position.set(0, -0.55, 0.3);
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), mat(ACCENT.mint));
  swing.add(pot);
  const vineMat = mat("#4a8a5c");
  for (let i = 0; i < 5; i++) {
    const v = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.28, 5), vineMat);
    v.position.set((Math.random() - 0.5) * 0.2, -0.17 - Math.random() * 0.1, (Math.random() - 0.5) * 0.2);
    v.rotation.x = Math.PI;
    swing.add(v);
  }
  g.add(swing);
  g.userData.sway = swing;
  return g;
}
export function buildPoster(color) {
  const g = new THREE.Group();
  g.add(box(0.58, 0.78, 0.03, mat("#5c4a38")));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), mat(color, { polygonOffset: true, roughness: 0.6 }));
  art.position.z = 0.02;
  g.add(art);
  return g;
}
export function buildPegboard() {
  const m = new THREE.MeshStandardMaterial({ map: makePegboardTexture(), polygonOffset: true, polygonOffsetFactor: -1 });
  return new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), m);
}
export function buildFloatingShelf() {
  const g = new THREE.Group();
  g.add(box(1.1, 0.06, 0.28, mat("#8a6a45")));
  const bookColors = ["#e3806b", "#8fd6c4", "#b7a8d9", "#f3d773", "#4a8a5c"];
  let x = -0.4;
  for (let i = 0; i < 5; i++) {
    const w = 0.06 + Math.random() * 0.03, h = 0.16 + Math.random() * 0.08;
    const bk = box(w, h, 0.2, mat(bookColors[i % bookColors.length]));
    bk.position.set(x, 0.03 + h / 2, 0); g.add(bk); x += w + 0.02;
  }
  const plantPot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.1, 8), mat(ACCENT.mint));
  plantPot.position.set(0.4, 0.08, 0); g.add(plantPot);
  return g;
}
export function buildDrawerUnit() {
  const g = new THREE.Group();
  const body = box(0.5, 0.75, 0.5, mat(ACCENT.lavender)); body.position.y = 0.375; g.add(body);
  const knobMat = mat("#6a5a8a", { metalness: 0.5, roughness: 0.4, envMapIntensity: 1.4 });
  for (let i = 0; i < 3; i++) {
    const line = box(0.42, 0.01, 0.01, mat("#8a7ab0")); line.position.set(0, 0.18 + i * 0.24, 0.255); g.add(line);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), knobMat); knob.position.set(0, 0.13 + i * 0.24, 0.26); g.add(knob);
  }
  return g;
}
export function buildMonitor() {
  const g = new THREE.Group();
  const stand = box(0.08, 0.18, 0.08, mat("#2c2c2c")); stand.position.y = 0.09; g.add(stand);
  const base = box(0.22, 0.02, 0.14, mat("#2c2c2c")); base.position.y = 0.02; g.add(base);
  g.add(place(box(0.56, 0.34, 0.03, mat("#232323", { metalness: 0.3, envMapIntensity: 1.2 })), 0, 0.35, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.29), mat("#5fd8ff", { emissive: "#3fb8ff", emissiveIntensity: 0.9 }));
  screen.position.set(0, 0.35, 0.017); g.add(screen);
  g.userData.screenMat = screen.material;
  return g;
}
export function buildLaptop() {
  const g = new THREE.Group();
  const baseM = mat("#e7e4dc");
  g.add(box(0.34, 0.02, 0.24, baseM));
  const lid = box(0.34, 0.02, 0.22, baseM); lid.position.set(0, 0.12, -0.11); lid.rotation.x = -1.15; g.add(lid);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.17), mat("#7fd8ff", { emissive: "#4fc0ff", emissiveIntensity: 0.7 }));
  screen.position.set(0, 0.135, -0.098); screen.rotation.x = -1.15; g.add(screen);
  g.userData.screenMat = screen.material;
  return g;
}
export function buildDesktopPC() {
  const g = new THREE.Group();
  g.add(place(box(0.18, 0.42, 0.42, mat("#f2f1ec")), 0, 0.21, 0));
  const rgbStrip = box(0.02, 0.36, 0.02, mat("#ff5fd8", { emissive: "#ff5fd8", emissiveIntensity: 1 }));
  rgbStrip.position.set(0.09, 0.21, 0.15); g.add(rgbStrip);
  g.userData.rgbMat = rgbStrip.material;
  return g;
}
export function buildKeyboardWristRest() {
  const g = new THREE.Group();
  g.add(box(0.42, 0.02, 0.15, mat("#e9e7e0")));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.13), mat("#ff6fd8", { emissive: "#ff6fd8", emissiveIntensity: 0.8 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.011; g.add(glow);
  g.userData.rgbMat = glow.material;
  const rest = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), mat("#f4f2fb"));
  rest.scale.set(2.2, 0.5, 0.9); rest.position.set(0, 0.005, 0.13); g.add(rest);
  return g;
}
export function buildDeskLamp() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 12), mat(ACCENT.mint)));
  const pole = box(0.02, 0.32, 0.02, mat(ACCENT.mint)); pole.position.y = 0.17; pole.rotation.z = 0.15; g.add(pole);
  const arm = box(0.02, 0.22, 0.02, mat(ACCENT.mint)); arm.position.set(0.11, 0.33, 0); arm.rotation.z = -0.9; g.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 12, 1, true), mat(ACCENT.mintDark, { side: THREE.DoubleSide }));
  shade.position.set(0.19, 0.42, 0); shade.rotation.z = Math.PI; g.add(shade);
  const bulbLight = new THREE.PointLight(0xfff2c9, 0, 1.4); bulbLight.position.set(0.19, 0.38, 0); g.add(bulbLight);
  g.userData.light = bulbLight;
  return g;
}
export function buildLShapedDesk() {
  const g = new THREE.Group();
  const topMat = mat("#c99a5b", { roughness: 0.45, envMapIntensity: 0.6 });
  const legMat = mat("#6a5a45", { metalness: 0.3, roughness: 0.5 });
  const mainTop = new THREE.Mesh(makeRoundedSlab(1.9, 0.75, 0.05, 0.03), topMat); mainTop.position.y = 0.72; g.add(mainTop);
  const sideTop = new THREE.Mesh(makeRoundedSlab(0.75, 1.1, 0.05, 0.03), topMat); sideTop.position.set(-1.15, 0.72, 0.68); g.add(sideTop);
  [[-0.9, -0.32], [0.9, -0.32], [-1.45, 1.15]].forEach(([x, z]) => {
    const leg = box(0.05, 0.7, 0.05, legMat); leg.position.set(x, 0.35, z); g.add(leg);
  });
  g.add(makeContactShadow(1.1, 0.9));
  return g;
}
export function buildWorkChair() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(makeRoundedSlab(0.42, 0.4, 0.07, 0.05), mat("#3a3a3a")); seat.position.y = 0.46; g.add(seat);
  const back = new THREE.Mesh(makeRoundedSlab(0.4, 0.06, 0.5, 0.05), mat("#3a3a3a"));
  back.position.set(0, 0.72, -0.19); back.rotation.x = Math.PI / 2; g.add(back);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat("#8a8a8a", { metalness: 0.6, envMapIntensity: 1.3 }));
  post.position.y = 0.26; g.add(post);
  const baseStar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 5), mat("#2c2c2c")); baseStar.position.y = 0.05; g.add(baseStar);
  return g;
}
export function buildRugMesh(width, depth, colorA, colorB, colorC) {
  const m = new THREE.MeshStandardMaterial({ map: makePlaidTexture(colorA, colorB, colorC), polygonOffset: true, polygonOffsetFactor: -1, roughness: 0.95 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), m);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/* --- kitchen --- */
export function buildBaseCabinet(width) {
  const g = new THREE.Group();
  const body = box(width, 0.85, 0.55, mat(ACCENT.butterYellow)); body.position.y = 0.425; g.add(body);
  const nDrawers = Math.max(1, Math.round(width / 0.5)), dw = width / nDrawers;
  for (let i = 0; i < nDrawers; i++) {
    const x = -width / 2 + dw / 2 + i * dw;
    g.add(place(box(dw - 0.04, 0.01, 0.01, mat("#c9a94a")), x, 0.6, 0.276));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), mat("#8a6a2c", { metalness: 0.6, roughness: 0.3, envMapIntensity: 1.4 }));
    knob.position.set(x, 0.53, 0.28); g.add(knob);
  }
  const counter = box(width + 0.06, 0.05, 0.6, mat("#efe9df")); counter.position.y = 0.875; g.add(counter);
  return g;
}
export function buildBacksplash(width, height) {
  const m = new THREE.MeshStandardMaterial({ map: makeTileTexture("#b85e2e", ACCENT.orangeTile), polygonOffset: true, polygonOffsetFactor: -1 });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), m);
}
export function buildSink() {
  const g = new THREE.Group();
  const basin = box(0.5, 0.08, 0.4, mat("#cfd3d6", { metalness: 0.6, roughness: 0.3, envMapIntensity: 1.5 })); basin.position.y = 0.9; g.add(basin);
  const faucet = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 16, Math.PI), mat("#9aa0a6", { metalness: 0.7, envMapIntensity: 1.5 }));
  faucet.position.set(0, 1.0, -0.15); faucet.rotation.z = Math.PI; g.add(faucet);
  const spout = box(0.015, 0.14, 0.015, mat("#9aa0a6", { metalness: 0.7, envMapIntensity: 1.5 })); spout.position.set(0, 0.95, -0.24); g.add(spout);
  return g;
}
export function buildCooktop() {
  const g = new THREE.Group();
  g.add(place(box(0.5, 0.02, 0.42, mat("#1c1c1c", { roughness: 0.3, envMapIntensity: 1.2 })), 0, 0.9, 0));
  [-0.13, 0.13].forEach((x) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.09, 20), mat("#3a3a3a", { side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.912, 0); g.add(ring);
  });
  // pan sitting on the left ring, ready to be "used" by the cook activity
  const pan = new THREE.Group();
  const panBody = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), mat("#3a3a3a", { metalness: 0.5, envMapIntensity: 1.2 }));
  pan.add(panBody);
  const handle = box(0.16, 0.015, 0.02, mat("#2a2a2a")); handle.position.set(0.15, 0, 0); pan.add(handle);
  const contents = new THREE.Mesh(new THREE.CircleGeometry(0.075, 16), mat("#c9863f", { transparent: true, opacity: 0 }));
  contents.rotation.x = -Math.PI / 2; contents.position.y = 0.017; pan.add(contents);
  pan.position.set(-0.13, 0.93, 0);
  g.add(pan);
  g.userData.panContents = contents.material;
  return g;
}
export function buildCoffeeMaker() {
  const g = new THREE.Group();
  g.add(place(box(0.18, 0.32, 0.16, mat(ACCENT.cobalt)), 0, 0.9 + 0.16, 0));
  const carafe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 10), mat("#2a2a2a", { transparent: true, opacity: 0.85 }));
  carafe.position.y = 0.9 + 0.07; g.add(carafe);
  return g;
}
export function buildMug() {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.06, 12), mat(ACCENT.white)); cup.position.y = 0.9 + 0.03; g.add(cup);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 10), mat(ACCENT.coral));
  ring.position.set(0.033, 0.9 + 0.03, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.028, 12), mat("#5a3620", { transparent: true, opacity: 0 }));
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.9 + 0.059; g.add(coffee);
  g.userData.fillMat = coffee.material;
  return g;
}
export function buildWallCabinetWithPlates() {
  const g = new THREE.Group();
  g.add(box(0.9, 0.55, 0.28, mat(ACCENT.butterYellow)));
  g.add(place(box(0.82, 0.015, 0.24, mat("#c9a94a")), 0, -0.02, 0));
  [ACCENT.coral, ACCENT.white, ACCENT.mint].forEach((c, i) => {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16), mat(c));
    plate.rotation.z = Math.PI / 2; plate.position.set(-0.28 + i * 0.28, 0.06, 0.08); g.add(plate);
  });
  return g;
}
export function buildFridge() {
  const g = new THREE.Group();
  const bodyGeo = makeRoundedSlab(0.7, 0.6, 1.7, 0.06); bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, mat(ACCENT.mint)); body.position.y = 0.85; g.add(body);
  g.add(place(box(0.72, 0.02, 0.02, mat("#5fae98")), 0, 1.15, 0));
  const handleMat = mat("#d8d8d8", { metalness: 0.6, envMapIntensity: 1.4 });
  g.add(place(box(0.03, 0.35, 0.04, handleMat), 0.3, 1.35, 0.31));
  g.add(place(box(0.03, 0.3, 0.04, handleMat), 0.3, 0.75, 0.31));
  g.add(makeContactShadow(0.45, 0.4));
  return g;
}
export function buildOvalTableWithStool() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(makeEllipseSlab(0.55, 0.38, 0.05), mat(ACCENT.coral)); top.position.y = 0.72; g.add(top);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.65, 10), mat("#6a5a45")); pole.position.y = 0.375; g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20), mat("#6a5a45")); foot.position.y = 0.04; g.add(foot);
  g.add(makeContactShadow(0.65, 0.5));
  return g;
}
export function buildStool() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 16), mat(ACCENT.mint)); seat.position.y = 0.5; g.add(seat);
  const legMat = mat("#6a5a45");
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const leg = box(0.03, 0.5, 0.03, legMat);
    leg.position.set(Math.cos(ang) * 0.14, 0.24, Math.sin(ang) * 0.14);
    leg.rotation.z = Math.cos(ang) * 0.1; leg.rotation.x = Math.sin(ang) * -0.1;
    g.add(leg);
  }
  return g;
}
/* small extra decor pieces added for this richer version */
export function buildBookshelfTall() {
  const g = new THREE.Group();
  const frame = mat("#7a5a3a");
  g.add(place(box(0.9, 1.8, 0.32, frame), 0, 0.9, 0));
  const shelfColors = ["#e3806b", "#8fd6c4", "#b7a8d9", "#f3d773"];
  for (let row = 0; row < 4; row++) {
    let x = -0.36;
    for (let i = 0; i < 5; i++) {
      const w = 0.05 + Math.random() * 0.03, h = 0.28 + Math.random() * 0.1;
      const bk = box(w, h, 0.24, mat(shelfColors[(row + i) % shelfColors.length]));
      bk.position.set(x, 0.1 + row * 0.42 + h / 2, 0.02); g.add(bk); x += w + 0.015;
    }
  }
  return g;
}
export function buildCuttingBoardAndPot() {
  const g = new THREE.Group();
  const board = box(0.3, 0.02, 0.2, mat("#c9a06e")); board.position.y = 0.91; g.add(board);
  const veg = ["#8bbf5a", "#e3806b", "#f3d773"];
  veg.forEach((c, i) => {
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), mat(c));
    v.position.set(-0.08 + i * 0.08, 0.93, 0);
    v.scale.y = 0.6;
    g.add(v);
  });
  const knife = box(0.14, 0.008, 0.02, mat("#c9c9c9", { metalness: 0.7, envMapIntensity: 1.3 }));
  knife.position.set(0.1, 0.925, -0.06); knife.rotation.y = 0.3; g.add(knife);
  return g;
}
export function buildDecorSmall() {
  const g = new THREE.Group();
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 20), mat("#efe6d2"));
  clock.rotation.x = Math.PI / 2; g.add(clock);
  const hand = box(0.09, 0.012, 0.005, mat("#3a3a3a")); hand.position.z = 0.011; g.add(hand);
  return g;
}
