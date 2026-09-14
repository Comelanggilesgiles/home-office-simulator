import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

import "./HomeOfficeSimulator.css";

import {
  ROOM, WALL_PRESETS, FLOOR_PRESETS, ACCENT, LIGHT_PRESETS,
  OFFICE_ORIGIN, KITCHEN_ORIGIN, GRID_STEP, BOUNDS,
  FURNITURE_TYPES, SIZE_MIN, SIZE_MAX, SIZE_STEP,
  buildObstacles, isInsideObstacle,
} from "./constants.js";

import { makeWoodTexture, makeWindowSkyTexture, makeEnvCubeTexture } from "./three/helpers.js";
import { clamp01, easeOutCubic } from "./three/mathUtils.js";
import { createOrbitControls } from "./three/cameraControls.js";
import { createEntryAnimation } from "./three/entryAnimation.js";
import { createActivityRunner } from "./three/activityRunner.js";
import { createSteamPool } from "./three/effects.js";
import { createManagedFurniture } from "./three/managedFurniture.js";
import { buildCharacter } from "./three/character.js";
import { SPOTS, ACTIVITY_LABELS } from "./three/activities.js";
import {
  buildFloor, buildWalls, buildWindow, buildCurtains,
  buildPottedPlant, buildHangingPlant, buildPoster, buildPegboard, buildFloatingShelf,
  buildDrawerUnit, buildMonitor, buildLaptop, buildDesktopPC, buildKeyboardWristRest,
  buildDeskLamp, buildLShapedDesk, buildWorkChair, buildRugMesh, buildBookshelfTall, buildDecorSmall,
  buildBaseCabinet, buildBacksplash, buildSink, buildCooktop, buildCoffeeMaker, buildMug,
  buildWallCabinetWithPlates, buildFridge, buildOvalTableWithStool, buildStool, buildCuttingBoardAndPot,
} from "./three/roomBuilders.js";

/* ============================================================================
   HomeOfficeSimulator.jsx
   The React shell: owns UI state (colors, lighting, view, furniture list,
   autonomy pause) and a single imperative Three.js scene built once per
   `entryKey` (bumped by Reset). All the actual scene-building, animation,
   and behavior logic lives in the modules imported above — this file's job
   is wiring them together and rendering the control panel.
   ========================================================================== */

export default function HomeOfficeSimulator() {
  const mountRef = useRef(null);
  const threeRef = useRef({});
  const fileInputRef = useRef(null);
  const objMapRef = useRef(new Map());
  const nextId = useRef(1);

  const [view, setView] = useState("overview");
  const [wallColor, setWallColor] = useState(WALL_PRESETS[0].hex);
  const [floorColor, setFloorColor] = useState(FLOOR_PRESETS[0].hex);
  const [lighting, setLighting] = useState("dusk");
  const [furniture, setFurniture] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [entryKey, setEntryKey] = useState(0);
  const [scanlineVisible, setScanlineVisible] = useState(true);
  const [activity, setActivity] = useState(null);
  const [blockedFlash, setBlockedFlash] = useState(false);
  const [autonomyPaused, setAutonomyPaused] = useState(false);

  /* ---------------------------- scene setup (once per entryKey) --------------------------- */
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth, height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(LIGHT_PRESETS.dusk.bg);
    scene.fog = new THREE.Fog(LIGHT_PRESETS.dusk.fog, 9, 22);
    scene.environment = makeEnvCubeTexture();

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    const canvas = renderer.domElement;

    // ---- lights ----
    const ambient = new THREE.AmbientLight(LIGHT_PRESETS.dusk.ambient.color, LIGHT_PRESETS.dusk.ambient.intensity);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(LIGHT_PRESETS.dusk.sun.color, LIGHT_PRESETS.dusk.sun.intensity);
    sun.position.set(-4, 6, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, far: 20 });
    scene.add(sun, sun.target);
    const fillLight = new THREE.PointLight(0xffffff, 0.15, 12);
    fillLight.position.set(2, 3, 3);
    scene.add(fillLight);

    // ---- static room (floor, walls) ----
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);
    const floorMesh = buildFloor(ROOM.width, ROOM.depth);
    roomGroup.add(floorMesh);
    const wallsGroup = buildWalls();
    roomGroup.add(wallsGroup);

    // ---- office zone ----
    const officeGroup = new THREE.Group();
    officeGroup.position.copy(OFFICE_ORIGIN);
    roomGroup.add(officeGroup);

    const rug = buildRugMesh(2.6, 2.2, "#8fd6c4", "#5fae98", "#e3806b");
    rug.position.set(0.3, 0, 1.6); officeGroup.add(rug);
    const desk = buildLShapedDesk(); desk.position.set(-1.1, 0, -3.55); officeGroup.add(desk);
    const monitor = buildMonitor(); monitor.position.set(-1.5, 0.72, -3.7); officeGroup.add(monitor);
    const laptop = buildLaptop(); laptop.position.set(-0.55, 0.72, -3.55); laptop.rotation.y = 0.3; officeGroup.add(laptop);
    const pc = buildDesktopPC(); pc.position.set(-1.85, 0, -3.15); officeGroup.add(pc);
    const kbwr = buildKeyboardWristRest(); kbwr.position.set(-1.45, 0.72, -3.35); officeGroup.add(kbwr);
    const lamp = buildDeskLamp(); lamp.position.set(-0.4, 0.72, -3.85); officeGroup.add(lamp);
    const drawer1 = buildDrawerUnit(); drawer1.position.set(-2.05, 0, -3.9); officeGroup.add(drawer1);
    const drawer2 = buildDrawerUnit(); drawer2.position.set(1.15, 0, -3.75); officeGroup.add(drawer2);
    const bookshelf = buildBookshelfTall(); bookshelf.position.set(1.9, 0, -3.65); officeGroup.add(bookshelf);
    const posterColors = [ACCENT.coral, ACCENT.mint, ACCENT.lavender];
    const posters = posterColors.map((c, i) => {
      const p = buildPoster(c); p.position.set(1.0 + i * 0.7, 3.1, -3.98); officeGroup.add(p); return p;
    });
    const pegboard = buildPegboard(); pegboard.position.set(-1.35, 2.55, -3.97); officeGroup.add(pegboard);
    const shelfA = buildFloatingShelf(); shelfA.position.set(0.6, 3.15, -3.9); officeGroup.add(shelfA);
    const shelfB = buildFloatingShelf(); shelfB.position.set(0.6, 2.65, -3.9); officeGroup.add(shelfB);
    const win = buildWindow(); win.position.set(-2.4, 2.6, -3.93); officeGroup.add(win);
    const curtains = buildCurtains(); curtains.position.set(-2.4, 2.6, -3.85); officeGroup.add(curtains);
    const windowPlant = buildPottedPlant(0.9); windowPlant.position.set(-3.15, 0, -3.6); officeGroup.add(windowPlant);
    const hangingPlant = buildHangingPlant(); hangingPlant.position.set(-3.35, ROOM.height, -2.6); officeGroup.add(hangingPlant);
    const wallClock = buildDecorSmall(); wallClock.position.set(1.4, 2.6, -3.97); officeGroup.add(wallClock);
    const chairStatic = buildWorkChair(); chairStatic.position.set(-1.0, 0, -2.55); officeGroup.add(chairStatic);

    // ---- kitchen zone ----
    const kitchenGroup = new THREE.Group();
    kitchenGroup.position.copy(KITCHEN_ORIGIN);
    roomGroup.add(kitchenGroup);
    const cab1 = buildBaseCabinet(1.4); cab1.position.set(-0.3, 0, -3.7); kitchenGroup.add(cab1);
    const cab2 = buildBaseCabinet(1.1); cab2.position.set(1.55, 0, -3.7); kitchenGroup.add(cab2);
    const backsplash = buildBacksplash(2.6, 0.6); backsplash.position.set(0.6, 1.2, -3.97); kitchenGroup.add(backsplash);
    const sink = buildSink(); sink.position.set(-0.6, 0, -3.7); kitchenGroup.add(sink);
    const cooktop = buildCooktop(); cooktop.position.set(0.4, 0, -3.7); kitchenGroup.add(cooktop);
    const cuttingBoard = buildCuttingBoardAndPot(); cuttingBoard.position.set(-1.0, 0, -3.6); kitchenGroup.add(cuttingBoard);
    const coffee = buildCoffeeMaker(); coffee.position.set(1.9, 0, -3.65); kitchenGroup.add(coffee);
    const mug = buildMug(); mug.position.set(1.65, 0, -3.6); kitchenGroup.add(mug);
    const wallCab = buildWallCabinetWithPlates(); wallCab.position.set(0.5, 2.1, -3.95); kitchenGroup.add(wallCab);
    const fridge = buildFridge(); fridge.position.set(1.85, 0, -3.35); kitchenGroup.add(fridge);
    const table = buildOvalTableWithStool(); table.position.set(0.1, 0, -0.6); kitchenGroup.add(table);
    const stool = buildStool(); stool.position.set(0.85, 0, -0.2); kitchenGroup.add(stool);

    // ---- managed (user-addable) furniture layer ----
    const managedGroup = new THREE.Group();
    scene.add(managedGroup);

    // ---- character ----
    const character = buildCharacter();
    character.position.copy(SPOTS.park);
    scene.add(character);
    const rig = character.userData.rig;
    rig.root_baseHipY = character.userData.baseHipY;

    // ---- effects: steam puffs used by the coffee/cook activities ----
    const steamPool = createSteamPool(scene, 10);

    // ---- lightweight collision obstacles (furniture placement + pathing) ----
    const obstacles = buildObstacles();

    // ---- camera orbit/zoom controls ----
    const orbit = createOrbitControls(camera, canvas, {
      theta: Math.PI * 0.22, phi: Math.PI * 0.35, radius: 11,
      target: new THREE.Vector3(0, 1.1, -0.3),
    });

    // ---- click-to-select managed furniture (raycast against managedGroup only) ----
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let downPos = null;
    const onSelectDown = (e) => (downPos = { x: e.clientX, y: e.clientY });
    const onSelectUp = (e) => {
      if (!downPos) return;
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      downPos = null;
      if (moved > 4) return;
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(managedGroup.children, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj.parent && obj.parent !== managedGroup) obj = obj.parent;
        threeRef.current.onSelectFromScene?.(obj.userData.id ?? null);
      }
    };
    canvas.addEventListener("pointerdown", onSelectDown);
    canvas.addEventListener("pointerup", onSelectUp);

    // ---- resize ----
    const handleResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    // ---- entry animation (floor unfolds, walls stand up, decor bounces in) ----
    const animatedItems = [
      { obj: officeGroup, type: "fade", delay: 0.55, dur: 0.35 },
      { obj: kitchenGroup, type: "fade", delay: 0.6, dur: 0.35 },
      { obj: desk, type: "bounce", delay: 0.55, dur: 0.4 },
      { obj: cab1, type: "bounce", delay: 0.55, dur: 0.4 },
      { obj: cab2, type: "bounce", delay: 0.58, dur: 0.4 },
      ...posters.map((p, i) => ({ obj: p, type: "pop", delay: 0.85 + i * 0.06, dur: 0.25 })),
      { obj: pegboard, type: "pop", delay: 0.82, dur: 0.25 },
      { obj: shelfA, type: "pop", delay: 0.88, dur: 0.25 },
      { obj: shelfB, type: "pop", delay: 0.94, dur: 0.25 },
      { obj: wallCab, type: "pop", delay: 0.86, dur: 0.25 },
      { obj: bookshelf, type: "bounce", delay: 0.6, dur: 0.35 },
      { obj: fridge, type: "bounce", delay: 0.62, dur: 0.35 },
      { obj: table, type: "bounce", delay: 0.65, dur: 0.35 },
    ];
    const entryAnim = createEntryAnimation({
      floorMesh, wallsGroup, character, animatedItems, monitor, laptop, lamp,
      getLampBoost: () => LIGHT_PRESETS[threeRef.current.lighting || "dusk"].lampBoost,
    });

    // ---- activity runner: she decides on her own what to do (see module doc) ----
    const activityRunner = createActivityRunner({
      character, rig,
      effects: {
        fillMug: () => { mug.userData.fillMat.opacity = 0.9; },
        fillPan: () => { cooktop.userData.panContents.opacity = 0.85; },
      },
      steamSpawnPoints: {
        pour: () => mug.getWorldPosition(new THREE.Vector3()),
        stir: () => cooktop.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(-0.13, 0.06, 0)),
      },
      onSteamSpawn: (pos) => steamPool.spawn(pos),
      onActivityChange: (name) => threeRef.current.onActivityChange?.(name),
    });

    // ---- render loop ----
    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf;

    function tick() {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      // RGB hue-cycling accents (keyboard glow strip, PC tower strip)
      const hue = (elapsed * 0.08) % 1;
      const rgbColor = new THREE.Color().setHSL(hue, 0.85, 0.6);
      [kbwr, pc].forEach((o) => { o.userData.rgbMat.color.copy(rgbColor); o.userData.rgbMat.emissive.copy(rgbColor); });

      // idle sway: curtains, plants
      const swayT = elapsed * 1.4;
      curtains.userData.sway.forEach((m, i) => (m.rotation.z = Math.sin(swayT + i) * 0.03));
      [windowPlant, hangingPlant].forEach((p) => { if (p.userData.sway) p.userData.sway.rotation.z = Math.sin(swayT * 0.7 + p.position.x) * 0.05; });

      const entryDone = entryAnim.update(elapsed);
      threeRef.current.entryDone = entryDone;

      if (entryDone) {
        // subtle screen glow pulse, once the intro has finished lighting them
        const pulse = 0.85 + Math.sin(elapsed * 2) * 0.08;
        monitor.userData.screenMat.emissiveIntensity = 0.9 * pulse;
        laptop.userData.screenMat.emissiveIntensity = 0.7 * pulse;
        activityRunner.update(dt, elapsed);
      }

      // camera view tween (Overview / Bird's-eye / Desk focus)
      const cs = threeRef.current.camTween;
      if (cs) {
        cs.t = clamp01(cs.t + dt / cs.dur);
        const e = easeOutCubic(cs.t);
        orbit.controlState.theta = THREE.MathUtils.lerp(cs.fromTheta, cs.toTheta, e);
        orbit.controlState.phi = THREE.MathUtils.lerp(cs.fromPhi, cs.toPhi, e);
        orbit.controlState.radius = THREE.MathUtils.lerp(cs.fromRadius, cs.toRadius, e);
        orbit.controlState.target.lerpVectors(cs.fromTarget, cs.toTarget, e);
        orbit.updateCameraFromState();
        if (cs.t >= 1) threeRef.current.camTween = null;
      }

      steamPool.update(dt);
      renderer.render(scene, camera);
    }
    tick();

    threeRef.current = {
      ...threeRef.current,
      scene, camera, renderer, wallsGroup, floorMesh, managedGroup,
      controlState: orbit.controlState,
      ambient, sun, lampLight: lamp.userData.light, windowGlassMat: win.userData.glassMat,
      officeWallMats: wallsGroup.userData.officeWallMats, kitchenWallMats: wallsGroup.userData.kitchenWallMats,
      lighting: "dusk", entryDone: false, obstacles,
      startActivity: activityRunner.startActivity,
      stopActivity: activityRunner.stopActivity,
      setAutonomyEnabled: activityRunner.setAutonomyEnabled,
    };

    setTimeout(() => setScanlineVisible(false), 500);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      orbit.dispose();
      canvas.removeEventListener("pointerdown", onSelectDown);
      canvas.removeEventListener("pointerup", onSelectUp);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey]);

  /* ---- wall / floor color sync ---- */
  useEffect(() => {
    const t = threeRef.current;
    if (!t.officeWallMats) return;
    t.officeWallMats.forEach((m) => m.color.set(wallColor));
  }, [wallColor]);

  useEffect(() => {
    const t = threeRef.current;
    if (!t.floorMesh) return;
    const c = new THREE.Color(floorColor).offsetHSL(0, 0, -0.08);
    t.floorMesh.material.map = makeWoodTexture(floorColor, "#" + c.getHexString());
    t.floorMesh.material.color.set(floorColor);
    t.floorMesh.material.needsUpdate = true;
  }, [floorColor]);

  /* ---- lighting preset sync ---- */
  useEffect(() => {
    const t = threeRef.current;
    if (!t.scene) return;
    const preset = LIGHT_PRESETS[lighting];
    t.lighting = lighting;
    t.scene.background = new THREE.Color(preset.bg);
    t.scene.fog.color.set(preset.fog);
    t.ambient.color.set(preset.ambient.color);
    t.ambient.intensity = preset.ambient.intensity;
    t.sun.color.set(preset.sun.color);
    t.sun.intensity = preset.sun.intensity;
    if (t.lampLight && t.entryDone) t.lampLight.intensity = 0.9 * preset.lampBoost;
    if (t.windowGlassMat) {
      const tex = makeWindowSkyTexture(
        lighting === "day" ? "#7fc1e8" : lighting === "dusk" ? "#3c3660" : "#0c0f22",
        lighting === "day" ? "#dff0fb" : lighting === "dusk" ? "#e08a5c" : "#141a3a",
        lighting !== "day"
      );
      t.windowGlassMat.map = tex; t.windowGlassMat.needsUpdate = true;
    }
  }, [lighting]);

  /* ---- view / camera toggle ---- */
  const flyTo = useCallback((theta, phi, radius, target) => {
    const t = threeRef.current;
    if (!t.controlState) return;
    t.camTween = {
      t: 0, dur: 1.1,
      fromTheta: t.controlState.theta, toTheta: theta,
      fromPhi: t.controlState.phi, toPhi: phi,
      fromRadius: t.controlState.radius, toRadius: radius,
      fromTarget: t.controlState.target.clone(), toTarget: target,
    };
  }, []);
  const setViewMode = useCallback((mode) => {
    setView(mode);
    if (mode === "birdseye") flyTo(Math.PI * 0.22, 0.55, 13, new THREE.Vector3(0, 0.2, -1));
    else if (mode === "desk") flyTo(-0.35, 1.0, 5.5, new THREE.Vector3(-3.2, 0.9, -3.2));
    else flyTo(Math.PI * 0.22, Math.PI * 0.35, 11, new THREE.Vector3(0, 1.1, -0.3));
  }, [flyTo]);

  /* ---- managed furniture sync (position/rotation/scale + selection highlight) ---- */
  useEffect(() => {
    const t = threeRef.current;
    if (!t.managedGroup) return;
    const group = t.managedGroup, map = objMapRef.current;
    for (const [id, obj] of map.entries()) if (!furniture.find((f) => f.id === id)) { group.remove(obj); map.delete(id); }
    furniture.forEach((f) => {
      let obj = map.get(f.id);
      if (!obj) { obj = createManagedFurniture(f.type); obj.userData.id = f.id; group.add(obj); map.set(f.id, obj); }
      obj.position.set(f.x, 0, f.z);
      obj.rotation.y = f.rot;
      obj.scale.setScalar(f.scale ?? 1);
      const isSelected = f.id === selectedId;
      obj.traverse((o) => {
        if (o.isMesh) {
          o.material.emissive = o.material.emissive || new THREE.Color(0);
          if (isSelected) {
            o.userData._origEmissive = o.userData._origEmissive || o.material.emissive.clone();
            o.material.emissive.set(0xffd76a);
            o.material.emissiveIntensity = Math.max(o.material.emissiveIntensity, 0.25);
          } else if (o.userData._origEmissive) o.material.emissive.copy(o.userData._origEmissive);
        }
      });
    });
  }, [furniture, selectedId]);
  useEffect(() => { threeRef.current.onSelectFromScene = (id) => setSelectedId(id); }, []);
  useEffect(() => { threeRef.current.onActivityChange = (name) => setActivity(name); }, []);

  /* ---- furniture UI actions ---- */
  const flashBlocked = () => { setBlockedFlash(true); setTimeout(() => setBlockedFlash(false), 250); };

  const addFurniture = (type) => {
    const id = nextId.current++;
    const offset = (furniture.length % 5) * 0.35;
    const x = BOUNDS.minX + 1.2 + offset, z = BOUNDS.maxZ - 1.2;
    if (isInsideObstacle(x, z, threeRef.current.obstacles || [])) { flashBlocked(); return; }
    setFurniture((f) => [...f, { id, type, x, z, rot: 0, scale: 1 }]);
    setSelectedId(id);
  };
  const moveSelected = (dx, dz) => {
    setFurniture((f) =>
      f.map((item) => {
        if (item.id !== selectedId) return item;
        const nx = Math.min(Math.max(item.x + dx, BOUNDS.minX), BOUNDS.maxX);
        const nz = Math.min(Math.max(item.z + dz, BOUNDS.minZ), BOUNDS.maxZ);
        if (isInsideObstacle(nx, nz, threeRef.current.obstacles || [])) { flashBlocked(); return item; }
        return { ...item, x: nx, z: nz };
      })
    );
  };
  const rotateSelected = () => setFurniture((f) => f.map((item) => (item.id === selectedId ? { ...item, rot: item.rot + Math.PI / 2 } : item)));
  const resizeSelected = (delta) =>
    setFurniture((f) =>
      f.map((item) =>
        item.id === selectedId
          ? { ...item, scale: Math.min(SIZE_MAX, Math.max(SIZE_MIN, +((item.scale ?? 1) + delta).toFixed(2))) }
          : item
      )
    );
  const deleteSelected = () => { setFurniture((f) => f.filter((item) => item.id !== selectedId)); setSelectedId(null); };

  /* ---- autonomy pause/resume (she picks her own activities otherwise) ---- */
  const toggleAutonomy = () => {
    const next = !autonomyPaused;
    setAutonomyPaused(next);
    threeRef.current.setAutonomyEnabled?.(!next);
  };

  /* ---- reset / save image / save+load setup ---- */
  const handleReset = () => {
    setFurniture([]); setSelectedId(null); setActivity(null); setAutonomyPaused(false);
    setWallColor(WALL_PRESETS[0].hex); setFloorColor(FLOOR_PRESETS[0].hex);
    setLighting("dusk"); setView("overview"); setScanlineVisible(true);
    threeRef.current.entryDone = false;
    setEntryKey((k) => k + 1);
  };
  const handleSaveImage = () => {
    const t = threeRef.current;
    if (!t.renderer) return;
    t.renderer.render(t.scene, t.camera);
    const url = t.renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a"); a.href = url; a.download = "diorama.png"; a.click();
  };
  const handleExportSetup = () => {
    const payload = { wallColor, floorColor, lighting, furniture };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "room-setup.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImportSetup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.wallColor) setWallColor(data.wallColor);
        if (data.floorColor) setFloorColor(data.floorColor);
        if (data.lighting) setLighting(data.lighting);
        if (Array.isArray(data.furniture)) {
          nextId.current = Math.max(1, ...data.furniture.map((f) => f.id + 1));
          setFurniture(data.furniture);
        }
      } catch {
        flashBlocked();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const selectedItem = furniture.find((f) => f.id === selectedId);

  /* ================================ render ================================ */
  return (
    <div className="dio-root">
      <div className={"dio-canvas-wrap" + (blockedFlash ? " blocked" : "")} ref={mountRef}>
        {scanlineVisible && <div className="dio-scanlines" />}
      </div>

      <button className="dio-panel-toggle" onClick={() => setPanelOpen((v) => !v)}>
        {panelOpen ? "Hide controls" : "Show controls"}
      </button>

      {panelOpen && (
        <div className="dio-panel">
          <section className="dio-section">
            <h3>View</h3>
            <div className="dio-row">
              <button className={view === "overview" ? "active" : ""} onClick={() => setViewMode("overview")}>Overview</button>
              <button className={view === "birdseye" ? "active" : ""} onClick={() => setViewMode("birdseye")}>Bird's-eye</button>
              <button className={view === "desk" ? "active" : ""} onClick={() => setViewMode("desk")}>Desk focus</button>
            </div>
          </section>

          <section className="dio-section">
            <h3>Lighting</h3>
            <div className="dio-row">
              {["day", "dusk", "night"].map((l) => (
                <button key={l} className={lighting === l ? "active" : ""} onClick={() => setLighting(l)}>{l[0].toUpperCase() + l.slice(1)}</button>
              ))}
            </div>
          </section>

          <section className="dio-section">
            <h3>Wall color</h3>
            <div className="dio-swatches">
              {WALL_PRESETS.map((p) => (
                <button key={p.hex} title={p.name} className={"dio-swatch" + (wallColor === p.hex ? " active" : "")} style={{ background: p.hex }} onClick={() => setWallColor(p.hex)} />
              ))}
            </div>
          </section>

          <section className="dio-section">
            <h3>Floor color</h3>
            <div className="dio-swatches">
              {FLOOR_PRESETS.map((p) => (
                <button key={p.hex} title={p.name} className={"dio-swatch" + (floorColor === p.hex ? " active" : "")} style={{ background: p.hex }} onClick={() => setFloorColor(p.hex)} />
              ))}
            </div>
          </section>

          <section className="dio-section">
            <h3>She's living her own life in here</h3>
            <p className="dio-status">
              <span className="dio-status-dot" style={{ opacity: autonomyPaused ? 0.35 : 1 }} />
              {autonomyPaused
                ? "Paused"
                : activity
                ? ACTIVITY_LABELS[activity] || activity
                : "Deciding what to do next…"}
            </p>
            <div className="dio-row">
              <button onClick={toggleAutonomy}>{autonomyPaused ? "Let her be" : "Freeze her"}</button>
            </div>
            <p className="dio-hint">She wanders, works at the desk, makes coffee and cooks on her own — no buttons needed.</p>
          </section>

          <section className="dio-section">
            <h3>Add furniture</h3>
            <div className="dio-row wrap">
              {FURNITURE_TYPES.map((f) => (<button key={f.id} onClick={() => addFurniture(f.id)}>+ {f.label}</button>))}
            </div>
          </section>

          {furniture.length > 0 && (
            <section className="dio-section">
              <h3>Placed items</h3>
              <ul className="dio-list">
                {furniture.map((f) => (
                  <li key={f.id} className={f.id === selectedId ? "active" : ""} onClick={() => setSelectedId(f.id)}>
                    {FURNITURE_TYPES.find((t) => t.id === f.type)?.label}
                  </li>
                ))}
              </ul>
              {selectedItem && (
                <div className="dio-item-controls">
                  <div className="dio-dpad">
                    <button onClick={() => moveSelected(0, -GRID_STEP)}>▲</button>
                    <div className="dio-dpad-mid">
                      <button onClick={() => moveSelected(-GRID_STEP, 0)}>◀</button>
                      <button onClick={rotateSelected} title="Rotate 90°">⟳</button>
                      <button onClick={() => moveSelected(GRID_STEP, 0)}>▶</button>
                    </div>
                    <button onClick={() => moveSelected(0, GRID_STEP)}>▼</button>
                  </div>
                  <div className="dio-size-row">
                    <button onClick={() => resizeSelected(-SIZE_STEP)} disabled={(selectedItem.scale ?? 1) <= SIZE_MIN} title="Shrink">−</button>
                    <span className="dio-size-label">{Math.round((selectedItem.scale ?? 1) * 100)}%</span>
                    <button onClick={() => resizeSelected(SIZE_STEP)} disabled={(selectedItem.scale ?? 1) >= SIZE_MAX} title="Grow">+</button>
                  </div>
                  <button className="dio-delete" onClick={deleteSelected}>Delete item</button>
                </div>
              )}
            </section>
          )}

          <section className="dio-section dio-row">
            <button className="dio-secondary" onClick={handleReset}>Reset</button>
            <button className="dio-secondary" onClick={handleExportSetup}>Save setup</button>
          </section>
          <section className="dio-section dio-row">
            <button className="dio-secondary" onClick={() => fileInputRef.current?.click()}>Load setup</button>
            <button className="dio-primary" onClick={handleSaveImage}>Save image</button>
          </section>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImportSetup} />
        </div>
      )}
    </div>
  );
}
