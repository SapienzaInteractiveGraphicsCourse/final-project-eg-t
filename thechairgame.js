import * as THREE from './resources/three/build/three.module.js';
import {GLTFLoader} from './resources/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from './resources/three/examples/jsm/controls/OrbitControls.js';
import {SkeletonUtils} from './resources/three/examples/jsm/utils/SkeletonUtils.js';
import * as ANIM from './animation.js';
import * as PLAN from './planner.js';
import * as COLL from './collision.js';

/**
 * Parameters
 */
// Camera
const aspect = window.innerWidth / window.innerHeight;
const near   = 5;
const far    = 1000;
const d      = 11;
// Scene
const backgroundColor = 0x281E5D; // indigo
const colorPotion     = 0xB8FF70;
const colorFlame      = 0xFC8A17;
const flameDistance   = 14;

/**
 * Define scope-related objects
 */
// Base objects
const container = document.getElementById('container');
const renderer  = new THREE.WebGLRenderer();
const camera    = new THREE.OrthographicCamera(-d * aspect, d*aspect, d, -d, near, far);
const scene     = new THREE.Scene();
const clock     = new THREE.Clock();

// Custom objects
const animations = [];
const planners   = [];

const cbboxes     = []; // Static bounding boxes  (Map, chair related)
const dbboxes     = []; // Dynamic bounding boxes (guys related)
var collisions  = []; // Current collisions to be resolved.

const models = {
    'simguy': {
	file:'simguy/simguy.gltf'
    },
    'map': {
	file:'map/map.gltf'
    }/*,
    chair: {
	file:'simguy/simguy.gltf'
    }
     */
}

const units = {
    'map1': {model:'map', onLoad:onMapLoaded},
    'guy1': {
	model:'simguy',
	mesh:'baseframe',
	onLoad:onGuyLoad,
	position: new THREE.Vector3(5, 0, 3),
	scale: 0.3
    },
    'guy2': {
	model:'simguy',
	mesh:'baseframe',
	onLoad:onGuyLoad,
	position: new THREE.Vector3(-3, 0, -5),
	scale: 0.3
    },
    'guy3': {
	model:'simguy',
	mesh:'baseframe',
	onLoad:onGuyLoad,
	position: new THREE.Vector3(-3, 0, 4),
	scale: 0.3
    },
    'guy4': {
	model:'simguy',
	mesh:'baseframe',
	onLoad:onGuyLoad,
	position: new THREE.Vector3(-3, 0, -5),
	scale: 0.3
    },
    'guy5': {
	model:'simguy',
	mesh:'baseframe',
	onLoad:onGuyLoad,
	position: new THREE.Vector3(-3, 0, 4),
	scale: 0.3
    } 
};

function loadModel(model, onLoadComplete) {
    const loader = new GLTFLoader();
    const path   = './resources/models/' + model.file;
    loader.load(path, (gltf) => {
	const root = gltf.scene;
	model.scene = root;
	onLoadComplete();
    });
}

function loadModels() {
    let loadedModels = 0;
    for (let m in models) {
	loadModel(models[m], () => {
	    loadedModels++;
	    if (loadedModels == Object.keys(models).length) {
		console.log('Loaded ', loadedModels, ' models.');
		loadUnits();
	    }
	});
    }
}

function getModelByName(m) {
    for (let i in models) {
	if (m == i) return models[i];
    }
    return null;
}

function loadUnits() {
    for( let i in units) {
	const u = units[i];
	if (!u.model) continue;	// Cannot load model
	// Cannot load model
	const m = getModelByName(u.model);
	if (m) {
	    const mesh = m.scene.getObjectByName(u.mesh);
	    if (mesh) {
		u.scene = new THREE.Object3D().add(mesh.clone());
	    } else {
		u.scene = m.scene.clone();
	    }
	    scene.add(u.scene);
	    // Process the unit specifications, if available
	    if (u.position) {
		u.scene.position.copy(u.position);
	    }
	    if (u.scale) {
		u.scene.scale.set(u.scale, u.scale, u.scale);
	    }
	    
	    if (u.onLoad) {
		u.onLoad(u.scene);
	    }
	}
    }
    console.log('All units are succesfully instantiated.');
    
}

function onMapLoaded(scene) {
    enableShadows(scene);
    initMapLights(scene);
    initMapObjectBBox(scene);
    
}

function onGuyLoad(object) {
    console.log(object);
    enableShadows(object);
    const bbox = createObjectBBox(object, true);
    
    planners.push(new PLAN.RandomWalker(object, 0.1));
    //planners.push(new PLAN.HumanPlanner(object, document, 0.05, frameHelper));    
}

function createObjectBBox(object, isDynamic) {
    const bbox = new THREE.Box3().setFromObject(object);
    if (isDynamic) dbboxes.push({object, bbox});
    else cbboxes.push(bbox);
    //scene.add(new THREE.Box3Helper(bbox));
    return bbox;
}

function enableShadows(scene) {
    scene.traverse( (object) => {
	if (object.isMesh) {
	    function shouldCast(obj) {
		const matName = obj.material.name;
		const blackList = ['torch', 'torch_stick', 'torch_ring'];
		if (blackList.includes(matName)) {
		    return false;
		}
		return true;
	    }
	    if (shouldCast(object)) {
		object.castShadow = true;
		object.receiveShadow = true;
	    }
	}
    });
}


/**
 * Initalizing functions
 */
function initRenderer() {
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);
}
function initCamera() {
    camera.position.set(20, 20, -20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}
function initScene() {
    scene.background = new THREE.Color(backgroundColor);
}

function initMapLights(mapScene) {
    add_pointLight([0, 2, 0], colorPotion, 1, 8);
    const lightPositions = [
	[-6.5, 3.4, -5.5],
	[6.5, 3.4, 7],
	[-3, 3.4, 7],
	[10, 3.4, -10]
    ];
    for (let i = 0; i < lightPositions.length; ++i) {
	let torchLight;
	if (i == lightPositions.length - 1) {
	    // Last light, decrease brightness
	    torchLight = add_pointLight(lightPositions[i], colorFlame, 0.4,
					flameDistance);
	} else {
	    torchLight = add_pointLight(lightPositions[i], colorFlame, 1.5,
					flameDistance);
	}
	// Install the light into torch animationHandler
	animations.push(new ANIM.TorchAnimation(torchLight, 5, 0.05));
    }
    
    function add_pointLight(position, color, intensity, distance) {
	const light = new THREE.PointLight(color, intensity);
	light.castShadow = true;
	light.distance = distance;
	// Helper
	//const helper = new THREE.PointLightHelper(light);
	//scene.add(helper);
	//<------
	light.position.set(position[0], position[1], position[2]);
	scene.add(light);
	return light;
    }	      
}

/**
 * Compute Bounding Boxes for the map
 */
function initMapObjectBBox(scene) {
    const blackList = [
	'floor',
	'Plane005',
	'Plane',
	'firepit',
	'potatoes',
	'hole',
	'Scene'
    ];
    scene.traverse( (object) => {
	if (!blackList.includes(object.name)) {
	    createObjectBBox(object, false);
	    
	}
    });
    
}

/**
 * Rendering function
 */
function render() {
    requestAnimationFrame(render);
    // Update dynamic bboxes and check collisions
    for (let i = 0; i < dbboxes.length; ++i) {
	COLL.updateBBox(dbboxes[i]); // Update bounding box
	for( let j = 0; j < cbboxes.length; ++j) {
	    const ibbox = COLL.checkCollision(dbboxes[i], cbboxes[j]);
	    if (ibbox) collisions.push(ibbox);
	}
    }
    // Resolve collisions
    //if (collisions.length > 0) console.log('Found ', collisions.length, ' collisions.');
    for (let i = 0; i < collisions.length; ++i) {
	const collision = collisions[i];
	COLL.evalCollision(collision.object, collision.bbox, collision.ibbox);	
    }
    // Clean resolved collisions
    collisions = [];
    
    // get the time elapsed since the last frame
    var deltaTime = clock.getDelta();
    for (let i = 0; i < animations.length; ++i) {
	animations[i].update(deltaTime);
    }
    for (let i = 0; i < planners.length; ++i) {
	planners[i].update(clock.getElapsedTime());
    }
    renderer.render(scene, camera);
    
}


function main() {
    initRenderer();
    initCamera();
    initScene();
    loadModels();
    const controls  = new OrbitControls(camera, renderer.domElement);
    controls.update();
    render();
}

main();

