# Home Office & Kitchen Simulator

A miniature, dollhouse-style 3D office and kitchen you can walk into, decorate, and watch come to life in the browser.

## What it does

Home Office & Kitchen Simulator renders a small, cutaway-style room in Three.js: a home office on one side, a kitchen on the other. A procedural character lives inside it on her own schedule, walking between the desk, the coffee maker, and the cooktop without being told to. You can repaint the walls and floor, switch between day, dusk, and night lighting, drop in and resize furniture, and save the whole layout as an image or a JSON file.

It also doubles as a learning reference for building a non-trivial Three.js scene inside React without a heavier framework layer: procedural geometry and textures instead of imported models, a hand-rolled camera controller instead of an addon, a small scripted-behavior system for the character, and a project split into focused modules instead of one large file.

## Key features

- Dollhouse-style room with no front wall or ceiling, so the whole layout is visible at once
- Autonomous character who decides on her own what to do: work at the desk, make coffee, cook, or wander
- Ten furniture types that can be added, moved, rotated, resized, and deleted
- Wall and floor color presets, plus day, dusk, and night lighting modes
- Custom orbit-and-zoom camera controls with preset Overview, Bird's-eye, and Desk-focus views
- Save the current view as a PNG image
- Save and load full room setups as JSON files
- Scripted entry animation: the room assembles itself, piece by piece, when the page loads

## Screenshot

![Home Office and Kitchen Simulator screenshot](docs/screenshot.png)

*(Replace `docs/screenshot.png` with an actual screenshot of the running app.)*

## Tech stack

- React 18
- Three.js (r128 API)
- Vite (dev server and build tool)
- Plain CSS
- JavaScript (ES modules), no TypeScript or physics/3D-model dependencies

## Install and usage

1. Clone the repository:
   ```bash
   git clone https://github.com/Comelanggilesgiles/home-office-simulator.git
   cd home-office-simulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the URL printed in the terminal (usually `http://localhost:5173`) in your browser.

5. To build a production version:
   ```bash
   npm run build
   npm run preview
   ```

## Project structure

```
index.html, vite.config.js, package.json   Project entry and build config
src/
  main.jsx, App.jsx                        App bootstrap
  HomeOfficeSimulator.jsx                  Main component: state, UI, scene wiring
  HomeOfficeSimulator.css                  Control panel and overlay styles
  constants.js                             Room size, presets, furniture registry
  three/
    mathUtils.js                           Easing and interpolation helpers
    helpers.js                             Geometry helpers and procedural textures
    cameraControls.js                      Orbit and zoom camera controller
    roomBuilders.js                        Fixed office and kitchen decor
    managedFurniture.js                    User-addable furniture builders
    character.js                           Character rig, poses, animation
    activities.js                          Waypoints and scripted activity sequences
    activityRunner.js                      Runs activities and the autonomy scheduler
    entryAnimation.js                      Intro animation timeline
    effects.js                             Steam particle effects
```

## Notes and limitations

- There is no bundled physics engine, rigged character model, or real-time reflection system. Collision handling is a simple bounding-box check, and the character is a procedurally built and animated low-poly figure, not an imported rig.
- Room setups are saved and loaded as JSON files rather than through browser storage, so they can be shared or version-controlled.
