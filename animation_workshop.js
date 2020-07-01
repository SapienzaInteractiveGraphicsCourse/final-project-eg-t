import * as THREE from './resources/three/build/three.module.js';
import {GLTFLoader} from './resources/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from './resources/three/examples/jsm/controls/OrbitControls.js';


// Camera
const aspect = window.innerWidth / window.innerHeight;
const near   = 5;
const far    = 1000;
const d      = 11;

// Base objects
const container = document.getElementById('container');
const renderer  = new THREE.WebGLRenderer();
const camera    = new THREE.OrthographicCamera(-d * aspect, d*aspect, d, -d, near, far);
const scene     = new THREE.Scene();
const gui       = new dat.GUI();
const guiParams = {
    zShoulderR : 0,
    zShoulderL : 0,
    zForearmR  : 0,
    zForearmL  : 0,
    zUpperLegL : 0,
    zUpperLegR : 0,
    storeKeyframe : function () {
	console.log('Pressed button.');
    }
};



var simguy;

function main() {
    // Init renderer
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
    // Init Scene
    scene.background = new THREE.Color(0xAAAAAA);

    // Init camera
    camera.position.set(20, 20, -20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // Loader
    const loader = new GLTFLoader();
    loader.load('./resources/models/simguy/simguy.gltf', (gltf) => {
	const root = gltf.scene;
	const mesh = root.getObjectByName('baseframe');
	simguy = new THREE.Object3D().add(mesh.clone());
	scene.add(simguy);
	console.log(simguy);
	initGUI();
	render();
    });

    // Add global light
    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);
    var elapsedTime = 0;
    function render() {
	requestAnimationFrame(render);
	handleBody(simguy, guiParams);
	controls.update();
	elapsedTime++;
	renderer.render(scene, camera);
    }
    
}

function handleBody(object, params) {
    if (params.zShoulderR) {
	setChildZRot(object, 'shoulderR', params.zShoulderR);
    }
    if (params.zShoulderL) {
	setChildZRot(object, 'shoulderL', params.zShoulderL);
    }
    if (params.zForearmR) {
	setChildZRot(object, 'forearmR', params.zForearmR);
    }
    if (params.zForearmL) {
	setChildZRot(object, 'forearmL', params.zForearmL);
    }
    if (params.zUpperLegR) {
	setChildZRot(object, 'upperlegR', params.zUpperLegR);
    }
    if (params.zUpperLegL) {
	setChildZRot(object, 'upperlegL', params.zUpperLegL);
    }
}

function setChildZRot(object, part, val) {
    const child = object.getObjectByName(part);
    if (child) {
	child.rotation.z = val;
    }
}

function setChildYRot(object, part, val) {
    const child = object.getObjectByName(part);
    if (child) {
	child.rotation.y = val;
    }
}

function initGUI() {
    gui.add(guiParams, 'zShoulderR').min(-Math.PI/2).max(Math.PI/2).step(0.1);
    gui.add(guiParams, 'zShoulderL').min(-Math.PI/2).max(Math.PI/2).step(0.1);
    gui.add(guiParams, 'zForearmR').min(-Math.PI/2).max(Math.PI/2).step(0.1);
    gui.add(guiParams, 'zForearmL').min(-Math.PI/2).max(Math.PI/2).step(0.1);
    gui.add(guiParams, 'zUpperLegR').min(-Math.PI/2).max(Math.PI/2).step(0.1);
    gui.add(guiParams, 'zUpperLegL').min(-Math.PI/2).max(Math.PI/2).step(0.1);
    gui.add(guiParams, 'storeKeyframe');
}





main();
