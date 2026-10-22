// wave-wall-reveal.js
// Interactive diagram: the Brushed Metal Wave Wall is always visible and shiny.
// Moving the mouse UP fades the rest of the model in; moving it DOWN fades it out.
// Both .glb files were exported from the same Rhino file at the same origin, so they
// line up automatically when loaded at position (0,0,0). No Draco decoder is needed.
//
// Requires three.js r160 or newer loaded through an import map (see the HTML snippet
// at the bottom of this file).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DEFAULTS = {
  containerId: 'wave-wall-diagram', // the <div> the canvas is created inside
  wallUrl: './wave_wall.glb',       // always visible, never faded
  restUrl: './stair_rest.glb',      // fades with mouse Y
  trackArea: 'container',           // 'container' = mouse Y measured inside the div, 'window' = whole page
  minReveal: 0.0,                   // 0 = rest fully disappears at the bottom; 0.1 = leaves a ghost
  smoothing: 0.08,                  // 0.02 slow and floaty, 0.2 snappy
  background: 0xffffff,             // page background colour, or null for transparent canvas
  allowOrbit: true,                 // drag to rotate, wheel to zoom
  autoRotate: false,
};

export async function initWaveWallDiagram(userConfig = {}) {
  const cfg = { ...DEFAULTS, ...userConfig };
  const container = document.getElementById(cfg.containerId);
  if (!container) throw new Error(`No element with id "${cfg.containerId}"`);

  // --- renderer / scene / camera -------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: cfg.background === null });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';

  const scene = new THREE.Scene();
  if (cfg.background !== null) scene.background = new THREE.Color(cfg.background);

  // Image-based lighting. This is what makes the brushed metal read as metal;
  // without an environment the wall would render almost black.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.001, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = cfg.allowOrbit;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = cfg.autoRotate;
  controls.autoRotateSpeed = 0.6;

  // --- load both models ----------------------------------------------------------
  const loader = new GLTFLoader();
  const [wall, rest] = await Promise.all([loader.loadAsync(cfg.wallUrl), loader.loadAsync(cfg.restUrl)]);
  scene.add(wall.scene);
  scene.add(rest.scene);

  // --- prepare the fading set ----------------------------------------------------
  // Clone each material once (shared between meshes) so the wall is never affected,
  // and remember the authored opacity so glass stays glassy instead of jumping to 1.
  const clones = new Map();
  const fadeMats = [];
  const fadeMeshes = [];
  rest.scene.traverse((o) => {
    if (!o.isMesh) return;
    fadeMeshes.push(o);
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const replaced = mats.map((m) => {
      if (!clones.has(m)) {
        const c = m.clone();
        c.transparent = true;
        c.userData.baseOpacity = m.opacity;
        c.userData.baseDepthWrite = m.depthWrite;
        clones.set(m, c);
        fadeMats.push(c);
      }
      return clones.get(m);
    });
    o.material = Array.isArray(o.material) ? replaced : replaced[0];
  });

  function applyReveal(t) {
    const full = t >= 0.999;
    for (const m of fadeMats) {
      m.opacity = m.userData.baseOpacity * t;
      // Turning depth-write off while partially transparent avoids the flickery
      // "inside-out" look you get when many overlapping transparent meshes sort badly.
      m.depthWrite = full ? m.userData.baseDepthWrite : false;
    }
    const visible = t > 0.005;
    for (const mesh of fadeMeshes) mesh.visible = visible;
  }

  // --- frame the camera on the combined model ------------------------------------
  const box = new THREE.Box3().setFromObject(wall.scene).union(new THREE.Box3().setFromObject(rest.scene));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const dist = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.5;
  camera.position.set(center.x + dist * 0.55, center.y + dist * 0.35, center.z + dist * 0.75);
  camera.near = dist / 100;
  camera.far = dist * 100;
  controls.target.copy(center);
  controls.minDistance = dist * 0.3;
  controls.maxDistance = dist * 3;
  controls.update();

  // --- mouse / touch Y drives the reveal -----------------------------------------
  let target = 0;   // where the mouse says we should be (0 = wall only, 1 = everything)
  let current = 0;  // smoothed value actually applied this frame

  function updateFromClientY(clientY) {
    let top, height;
    if (cfg.trackArea === 'window') {
      top = 0; height = window.innerHeight;
    } else {
      const r = container.getBoundingClientRect();
      top = r.top; height = r.height;
    }
    const y = THREE.MathUtils.clamp((clientY - top) / height, 0, 1);
    target = cfg.minReveal + (1 - cfg.minReveal) * (1 - y); // top of area = 1, bottom = 0
  }
  window.addEventListener('pointermove', (e) => updateFromClientY(e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { if (e.touches[0]) updateFromClientY(e.touches[0].clientY); }, { passive: true });

  // --- resize --------------------------------------------------------------------
  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // --- render loop ---------------------------------------------------------------
  applyReveal(current);
  renderer.setAnimationLoop(() => {
    current += (target - current) * cfg.smoothing;
    if (Math.abs(target - current) < 0.0005) current = target;
    applyReveal(current);
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    scene, camera, renderer, controls,
    setReveal(t) { target = THREE.MathUtils.clamp(t, 0, 1); }, // drive it from scroll or a slider instead
    dispose() { renderer.setAnimationLoop(null); renderer.dispose(); },
  };
}

/* ------------------------------------------------------------------------------
HTML to embed it. Put wave_wall.glb, stair_rest.glb and wave-wall-reveal.js next
to the HTML file (or change the URLs to wherever they are hosted).

<div id="wave-wall-diagram" style="width:100%;height:80vh;"></div>

<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
  }
}
</script>
<script type="module">
  import { initWaveWallDiagram } from './wave-wall-reveal.js';
  initWaveWallDiagram({
    wallUrl: './wave_wall.glb',
    restUrl: './stair_rest.glb',
    trackArea: 'container',   // or 'window'
  });
</script>
------------------------------------------------------------------------------ */
