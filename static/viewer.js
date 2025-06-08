/*  model-viewer.js – upgraded
 *  ▸ Handles Meshopt *and* Draco / KTX2 compression
 *  ▸ Auto-frames the camera around every new model
 *  ▸ Adds a touch more ambient light so dark PBR assets aren’t black
 */
import * as THREE                 from "three";
import { GLTFLoader }             from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader }            from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader }            from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder }         from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls }          from "three/examples/jsm/controls/OrbitControls.js";

const canvasWrap = document.getElementById("three-canvas-container");

/* ─── scene / camera / renderer ───────────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
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

/* ─── lighting ───────────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));             // new fill
const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.3);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(5, 10, 7);
scene.add(dir);

/* ─── GLTF loader helpers ────────────────────────────────────── */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/libs/draco/"
);

const ktx2Loader = new KTX2Loader()
  .setTranscoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/libs/basis/"
  )
  .detectSupport(renderer);

/* auto-frame util ------------------------------------------------ */
function frameObject(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());

  camera.near = size / 100;
  camera.far = size * 100;
  camera.updateProjectionMatrix();

  controls.maxDistance = size * 10;
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(size / 2, size / 3, size / 2));
  controls.update();
}

/* ─── load + display glb --------------------------------------- */
function loadGLB(url) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.setDRACOLoader(dracoLoader);
  loader.setKTX2Loader(ktx2Loader);

  loader.load(
    url,
    (gltf) => {
      // remove previous model
      scene.getObjectByName("model")?.removeFromParent();

      const obj = gltf.scene;
      obj.name = "model";
      scene.add(obj);

      frameObject(obj);
    },
    undefined,
    (err) => console.error("GLB load error:", err)
  );
}

/* ─── dropdown helper ------------------------------------------ */
function createModelPicker(list) {
  const sel = document.getElementById("model-select");
  if (!sel) return;

  list.forEach((m, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = m.name ?? `Model ${idx + 1}`;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", (e) => loadGLB(list[e.target.value].path));
}

/* ─── fetch model list + boot ▲ -------------------------------- */
fetch("/static/assets/3d/models.json")
  .then((r) => r.json())
  .then((list) => {
    if (!Array.isArray(list) || !list.length)
      throw new Error("models.json is empty");

    loadGLB(list[0].path);
    createModelPicker(list);
  })
  .catch((err) => {
    console.error(err);
    const msg = document.createElement("p");
    msg.textContent = `Failed to load models: ${err.message}`;
    msg.style.color = "var(--accent)";
    canvasWrap.appendChild(msg);
  });

/* ─── resize ---------------------------------------------------- */
window.addEventListener("resize", () => {
  const { clientWidth: w, clientHeight: h } = canvasWrap;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

/* ─── render loop ---------------------------------------------- */
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();