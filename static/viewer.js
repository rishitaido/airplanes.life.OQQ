// model-viewer.js – Three-JS scene that loads glTF / GLB assets
import * as THREE              from "three";
import { GLTFLoader }          from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls }       from "three/examples/jsm/controls/OrbitControls.js";
import { MeshoptDecoder }      from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/libs/meshopt_decoder.module.js";

const canvasWrap = document.getElementById("three-canvas-container");

// ---------- scene / camera / renderer ----------
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera   = new THREE.PerspectiveCamera(
  60,
  canvasWrap.clientWidth / canvasWrap.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);
canvasWrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ---------- simple lighting ----------
const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.2);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5, 10, 7);
scene.add(dir);

// ---------- load first model from models.json ----------
fetch("/static/assets/3d/models.json")
  .then(r => r.json())
  .then(list => {
    if (!Array.isArray(list) || list.length === 0)
      throw new Error("models.json is empty");

    loadGLB(list[0].path);              // ← load first model
    createModelPicker(list);            // ← optional drop-down
  })
  .catch(err => {
    console.error(err);
    const msg = document.createElement("p");
    msg.textContent = `Failed to load models: ${err.message}`;
    msg.style.color = "var(--accent)";
    canvasWrap.appendChild(msg);
  });

function loadGLB(url) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  loader.load(url, gltf => {
    // clear previous
    while (scene.children.find(obj => obj.name === "model"))
      scene.remove(scene.children.find(obj => obj.name === "model"));

    const obj = gltf.scene;
    obj.name  = "model";
    scene.add(obj);
  }, undefined,
    err => console.error(err)   // helpful when another extension is missing
  );
}

function createModelPicker(list) {
  const sel = document.getElementById("model-select");
  if (!sel) return;

  list.forEach((m, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = m.name ?? `Model ${idx + 1}`;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", e => loadGLB(list[e.target.value].path));
}

// ---------- resize ----------
window.addEventListener("resize", () => {
  const { clientWidth: w, clientHeight: h } = canvasWrap;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ---------- loop ----------
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();
