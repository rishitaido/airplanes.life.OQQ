// viewer.js  – Three-JS model viewer
import * as THREE           from "three";
import { GLTFLoader }       from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls }    from "three/examples/jsm/controls/OrbitControls.js";

const MODEL_BASE = "/static/assets/3d/";
const wrap   = document.getElementById("three-canvas-container");
const width  = wrap.clientWidth  || 800;
const height = wrap.clientHeight || 600;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
wrap.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
camera.position.set(0, 2, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(10, 10, 10);
scene.add(dir);

let currentModel = null;
const loader = new GLTFLoader();

function loadModel(file) {
  loader.load(
    MODEL_BASE + file,
    gltf => {
      if (currentModel) scene.remove(currentModel);
      currentModel = gltf.scene;
      currentModel.scale.set(0.1, 0.1, 0.1);
      scene.add(currentModel);
    },
    undefined,
    err => console.error("GLTF error:", err)
  );
}

// initial + change handler
const select = document.getElementById("model-select");
loadModel(select.value);
select.addEventListener("change", () => loadModel(select.value));

// animate
function tick() {
  requestAnimationFrame(tick);
  controls.update();
  renderer.render(scene, camera);
}
tick();

// handle resize
window.addEventListener("resize", () => {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
