/* Opera stair 3D viewer — three.js module, mounts into #stair3d */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const host = document.getElementById("stair3d");
if (host) boot(host);

function boot(host) {
  const canvas = host.querySelector("canvas");
  const status = host.querySelector(".st-status");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = null; // static backdrop image sits behind the transparent canvas
  // studio HDR-like environment: this is what makes the brushed-metal wave wall reflect
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.001, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.enablePan = true;

  // key / fill / rim — warm key raking across the wall, cool fill, bright rim to catch the ridges
  const key = new THREE.DirectionalLight("#fff4e6", 2.2); key.castShadow = true;
  const fill = new THREE.DirectionalLight("#dbe9f5", 0.9);
  const rim = new THREE.DirectionalLight("#ffffff", 1.6);
  const hemi = new THREE.HemisphereLight("#ffffff", "#c8d4dc", 0.5);
  scene.add(key, fill, rim, hemi);

  const group = new THREE.Group(); scene.add(group);
  let bounds = null, radius = 1, center = new THREE.Vector3();

  // absolute model coordinates (Rhino export units), aimed against LJC's reference captures
  const views = {
    lobby:   { pos: [-0.05, 0.07, 0.62], tgt: [-0.13, 0.22, 0.28] },
    climb:   { pos: [-0.07, 0.09, 0.42], tgt: [-0.14, 0.24, 0.24] },
    landing: { pos: [-0.09, 0.22, 0.30], tgt: [-0.19, 0.27, 0.24] },
    axon:    { pos: [-0.95, 0.75, 1.05], tgt: [-0.13, 0.22, 0.33] },
    above:   { pos: [-0.13, 0.62, 0.40], tgt: [-0.13, 0.15, 0.27] }
  };
  // user-saved cameras (Shift+click a camera button) override the defaults
  try { const saved = JSON.parse(localStorage.getItem("ljc.stairViews") || "{}"); Object.keys(saved).forEach((k) => { if (views[k]) views[k] = saved[k]; }); } catch (e) {}
  let flyFrom = null, flyTo = null, flyT = 0, flyTgtFrom = null, flyTgtTo = null;

  function goView(name, instant) {
    const v = views[name] || views.lobby;
    const p = new THREE.Vector3().fromArray(v.pos), t = new THREE.Vector3().fromArray(v.tgt);
    if (instant) { camera.position.copy(p); controls.target.copy(t); controls.update(); return; }
    flyFrom = camera.position.clone(); flyTo = p; flyTgtFrom = controls.target.clone(); flyTgtTo = t; flyT = 0;
  }

  new GLTFLoader().load("img/opera_stair.glb?v=2", (gltf) => {
    const root = gltf.scene;
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const m = o.material; if (!m) return;
      const n = (m.name || "").toLowerCase();
      if (n.includes("wave wall")) { m.metalness = 0.92; m.roughness = 0.28; m.envMapIntensity = 1.6; m.side = THREE.DoubleSide; o.userData.wave = true; }
      else if (n.includes("stainless")) { m.metalness = 0.95; m.roughness = 0.22; m.envMapIntensity = 1.3; }
      else if (n.includes("mullion") || n.includes("painted steel")) { m.envMapIntensity = 0.8; }
      else if (n.includes("glass")) { m.transparent = true; m.opacity = 0.28; m.roughness = 0.05; m.metalness = 0; m.envMapIntensity = 1.2; m.depthWrite = false; }
      else if (n.includes("terrazzo")) { m.roughness = 0.35; m.metalness = 0; m.envMapIntensity = 0.7; }
      else { m.envMapIntensity = 0.5; }
      m.needsUpdate = true;
    });
    group.add(root);
    bounds = new THREE.Box3().setFromObject(root);
    bounds.getCenter(center); radius = bounds.getSize(new THREE.Vector3()).length() * 0.5;
    // shadow-casting ground plate just under the model
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(radius * 8, radius * 8), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = bounds.min.y - radius * 0.002; ground.receiveShadow = true; scene.add(ground);
    key.position.set(center.x + radius * 1.2, bounds.max.y + radius * 1.4, center.z + radius * 1.6); key.target.position.copy(center); scene.add(key.target);
    key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = sc.bottom = -radius * 1.6; sc.right = sc.top = radius * 1.6; sc.near = 0.001; sc.far = radius * 8; key.shadow.bias = -0.0004; key.shadow.normalBias = radius * 0.004;
    fill.position.set(center.x - radius * 1.8, bounds.max.y + radius * 0.4, center.z + radius * 0.8);
    rim.position.set(center.x - radius * 0.6, bounds.max.y + radius * 1.1, center.z - radius * 1.8);
    camera.near = radius * 0.01; camera.far = radius * 40; camera.updateProjectionMatrix();
    controls.minDistance = radius * 0.05; controls.maxDistance = radius * 6;
    // auto-frame: three-quarter view from the front-right, slightly above eye level
    camera.position.set(center.x + radius * 1.1, bounds.min.y + radius * 0.9, center.z + radius * 1.5); controls.target.set(center.x, bounds.min.y + radius * 0.45, center.z); controls.update();
    if (status) status.textContent = "";
    host.classList.add("ready");
  }, (ev) => { if (status && ev.total) status.textContent = "Loading model · " + Math.round(ev.loaded / ev.total * 100) + "%"; },
  (err) => { if (status) status.textContent = "Model could not be loaded"; console.error(err); });

  function size() { const r = host.getBoundingClientRect(); if (!r.width || !r.height) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
  let sizeRaf = null; new ResizeObserver(() => { if (sizeRaf) return; sizeRaf = requestAnimationFrame(() => { sizeRaf = null; size(); }); }).observe(host); size();

  let spin = true, running = false, raf = null;
  const spinBtn = host.querySelector("[data-spin]");
  controls.addEventListener("start", () => { spin = false; });
  function frame() {
    if (!running) { raf = null; return; }
    if (flyTo) { flyT = Math.min(1, flyT + 0.022); const e = 1 - Math.pow(1 - flyT, 3); camera.position.lerpVectors(flyFrom, flyTo, e); controls.target.lerpVectors(flyTgtFrom, flyTgtTo, e); if (flyT >= 1) flyTo = null; }
    else if (spin && bounds && !matchMedia("(prefers-reduced-motion: reduce)").matches) { controls.autoRotate = true; controls.autoRotateSpeed = 0.35; } 
    if (!spin || flyTo) controls.autoRotate = false;
    controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(frame);
  }
  const scope = host.closest(".sheet") || document;
  const viewBtns = scope.querySelectorAll("[data-view]");
  viewBtns.forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); if (!bounds) return; spin = false; if (spinBtn) spinBtn.classList.remove("on");
    if (e.shiftKey) { views[b.dataset.view] = { pos: camera.position.toArray().map((n) => +n.toFixed(4)), tgt: controls.target.toArray().map((n) => +n.toFixed(4)) }; try { const s = JSON.parse(localStorage.getItem("ljc.stairViews") || "{}"); s[b.dataset.view] = views[b.dataset.view]; localStorage.setItem("ljc.stairViews", JSON.stringify(s)); } catch (err) {} b.classList.add("saved"); setTimeout(() => b.classList.remove("saved"), 900); viewBtns.forEach((x) => x.classList.toggle("on", x === b)); return; }
    viewBtns.forEach((x) => x.classList.toggle("on", x === b)); goView(b.dataset.view); }));
  if (spinBtn) spinBtn.addEventListener("click", (e) => { e.stopPropagation(); spin = !spin; spinBtn.classList.toggle("on", spin); });

  // only render while the sheet is on screen
  window.stairViewer = {
    start() { if (!running) { running = true; size(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; },
    view: goView,
    set(pos, tgt) { camera.position.fromArray(pos); controls.target.fromArray(tgt); controls.update(); renderer.render(scene, camera); },
    views() { return views; },
    get() { return { pos: camera.position.toArray().map(n => +n.toFixed(3)), tgt: controls.target.toArray().map(n => +n.toFixed(3)) }; },
    info() { const w = new THREE.Box3(); group.traverse((o) => { if (o.isMesh && o.userData.wave) w.expandByObject(o); }); return { bounds: [bounds.min.toArray(), bounds.max.toArray()], wave: [w.min.toArray(), w.max.toArray()] }; }
  };
  const sheet = host.closest(".sheet");
  const io = new IntersectionObserver((es) => { es.forEach((en) => { if (en.isIntersecting && (!sheet || sheet.classList.contains("on") || !document.documentElement.classList.contains("deck"))) window.stairViewer.start(); else window.stairViewer.stop(); }); }, { threshold: 0.05 });
  io.observe(host);
  if (sheet) new MutationObserver(() => { if (sheet.classList.contains("on")) window.stairViewer.start(); else window.stairViewer.stop(); }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
}
