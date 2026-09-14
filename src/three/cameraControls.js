/* ============================================================================
   three/cameraControls.js
   A small hand-rolled orbit/zoom controller: drag to orbit, wheel to zoom.
   There's no @react-three/fiber and no OrbitControls addon available in
   this environment, so this replaces both. It also exposes controlState
   directly so the camera-view tween in HomeOfficeSimulator.jsx can animate
   theta/phi/radius/target smoothly between preset views.
   ========================================================================== */

export function createOrbitControls(camera, canvas, initial) {
  const controlState = {
    theta: initial.theta,
    phi: initial.phi,
    radius: initial.radius,
    target: initial.target.clone(),
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

  function updateCameraFromState() {
    const { theta, phi, radius, target } = controlState;
    camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  }
  updateCameraFromState();

  const onPointerDown = (e) => {
    controlState.dragging = true;
    controlState.lastX = e.clientX;
    controlState.lastY = e.clientY;
  };
  const onPointerMove = (e) => {
    if (!controlState.dragging) return;
    const dx = e.clientX - controlState.lastX;
    const dy = e.clientY - controlState.lastY;
    controlState.lastX = e.clientX;
    controlState.lastY = e.clientY;
    controlState.theta -= dx * 0.006;
    controlState.phi = Math.min(Math.max(controlState.phi - dy * 0.006, 0.25), 1.35);
    updateCameraFromState();
  };
  const onPointerUp = () => (controlState.dragging = false);
  const onWheel = (e) => {
    e.preventDefault();
    controlState.radius = Math.min(Math.max(controlState.radius + e.deltaY * 0.01, 5), 18);
    updateCameraFromState();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  function dispose() {
    canvas.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("wheel", onWheel);
  }

  return { controlState, updateCameraFromState, dispose };
}
