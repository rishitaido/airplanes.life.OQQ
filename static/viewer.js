// viewer.js – Three-JS model viewer (auto-feeds from models.json)
import * as THREE            from "three";
import { GLTFLoader }        from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls }     from "three/examples/jsm/controls/OrbitControls.js";

import { MeshoptDecoder }    from "meshopt_decoder";
import { KTX2Loader }        from "ktx2loader";

const wrap   = document.getElementById("three-canvas-container");
const width  = wrap.clientWidth  || 800;
const height = wrap.clientHeight || 600;

/* ---------- THREE boilerplate ---------- */
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true
});

renderer.setSize(width, height);
renderer.setClearColor(0x000000, 0);

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

/* ---------- model logic ---------- */
let currentModel = null;
const loader = new GLTFLoader();

loader.setMeshoptDecoder(MeshoptDecoder);

const ktxLoader = new KTX2Loader()
  .setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/libs/")
  .detectSupport(renderer);
loader.setKTX2Loader(ktxLoader);

/** Load a GLB file (full path). */
function loadModel(url) {
  loader.load(
    url,
    gltf => {
      if (currentModel) scene.remove(currentModel);
      currentModel = gltf.scene;
      const box = new THREE.Box3().setFromObject(currentModel);
      const size = box.getSize(new THREE.Vector3()).length();
      const scale = 4 / size;
      currentModel.scale.setScalar(scale);
      scene.add(currentModel);
    },
    undefined,
    err => console.error("GLTF error:", err)
  );
}

/* ---------- populate <select> from manifest ---------- */
async function populateSelector() {
  const select = document.getElementById("model-select");

  try {
    const res  = await fetch("/static/assets/3d/models.json");
    const list = await res.json();                 // [{id,name,path,tris,…}, …]

    // sort alphabetically
    list.sort((a, b) => a.name.localeCompare(b.name));

    list.forEach(m => {
      const opt   = document.createElement("option");
      opt.value = `/static/${m.path}`;                    
      opt.text    = `${m.name} (${m.tris} tris)`;
      select.appendChild(opt);
    });

    if (select.options.length) loadModel(select.value);

    select.addEventListener("change", () => loadModel(select.value));
  } catch (err) {
    console.error("Failed to fetch models.json:", err);
  }
}

/* ---------- render loop ---------- */
function tick() {
  requestAnimationFrame(tick);
  controls.update();
  renderer.render(scene, camera);
}

/* ---------- resize ---------- */
window.addEventListener("resize", () => {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

/* ---------- boot ---------- */
populateSelector();
tick();
