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
var aspect = window.innerWidth / window.innerHeight;
const near   = 5;
const far    = 1000;
const d      = 6;
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
var collisions    = []; // Current collisions to be resolved.

const chairs      = []; // List of chairs available

const models = {
    'simguy': {
	file:'simguy/simguy.gltf'
    },
    'map': {
	file:'map/map.gltf'
    },
    'chair': {
	file:'chair/chair.gltf'
    },
    'skeleton': {
	file:'skeleton/scene.gltf'
    }
}

const units = {
    'map1': {model:'map', onLoad:onMapLoaded},
    'chair1':{model:'chair', onLoad:onChairLoaded, onQuery:onChairQuery},
    'chair2':{model:'chair', onLoad:onChairLoaded, onQuery:onChairQuery},
    'chair3':{model:'chair', onLoad:onChairLoaded, onQuery:onChairQuery},
    'chair4':{model:'chair', onLoad:onChairLoaded, onQuery:onChairQuery},
    'guy1': {
	model:       'skeleton',
	mesh:        'baseframe',
	onLoad:      onGuyLoaded,
	position:    new THREE.Vector3(5, 0, 3),
	scale:       Math.max(0.2, Math.random() * 0.5),
	plan:        'ai_hard'
	
    },
    'guy2': {
	model:       'skeleton',
	mesh:        'baseframe',
	onLoad:      onGuyLoaded,
	position:    new THREE.Vector3(3, 0, -7),
	scale:       Math.max(0.2, Math.random() * 0.5),
	plan:        'ai_hard'
    },
    'guy3': {
	model:       'skeleton',
	mesh:        'baseframe',
	onLoad:      onGuyLoaded,
	position:    new THREE.Vector3(1, 0, 5),
	scale:       Math.max(0.2, Math.random() * 0.5),
	plan:        'human'
    },
    'guy4': {
	model:       'skeleton',
	mesh:        'baseframe',
	onLoad:      onGuyLoaded,
	position:    new THREE.Vector3(-3, 0, -3),
	scale:       Math.max(0.2, Math.random() * 0.5),
	plan:        'ai_easy'
    },
    'guy5': {
	model:       'skeleton',
	mesh:        'baseframe',
	onLoad:      onGuyLoaded,
	position:    new THREE.Vector3(-2, 0, 6),
	scale:       Math.max(0.2, Math.random() * 0.5),
	plan:        'ai_easy'
    }
    
};

const gameState = {
    state: 0,
    chairs: chairs,
    onUpdate: function () {
	if (this.state == 1) {
	    const winFlag = checkWinningCondition();
	    if (winFlag) {
		endGame();
	    }
	}
	
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
	    // Add loopback reference from Object3D to unit element
	    u.scene.unit = u;
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

function onChairLoaded(object) {
    enableShadows(object);
    object.position.set((Math.random() - 0.5) * 10,
			0,
			(Math.random() - 0.5) * 10);
    object.rotation.set(0,
			Math.random() * 2 * Math.PI,
			0);
    createObjectBBox(object, false);
    chairs.push(object);
}

function onGuyLoaded(object) {
    //console.log(object);
    enableShadows(object);
    const bbox = createObjectBBox(object, true);
    
    // Add random seed [0, 1000] for animation offset
    // Install animation handler
    const mixer = new ANIM.SkeletonAnimation(object, 'idle', Math.floor(Math.random() * 1000));
    object.unit.animationMixer = mixer;
    animations.push(mixer);
    // Add planner if needed
    if (object.unit.plan) {
	let planner;
	if (object.unit.plan == 'human') {
	    planner = new PLAN.HumanPlanner(object, document, 0.05, null, mixer);

	} else if (object.unit.plan == 'ai_easy') {
	    planner = new PLAN.ChairFinder(object, gameState, 0.05, 0.03, null, mixer);
	}
	else if (object.unit.plan == 'ai_hard') {
	    planner = new PLAN.ChairFinder(object, gameState, 0.07, 0.05, null, mixer);
	}
	object.unit.planner = planner;
	planners.push(planner);
    }
}

function onChairQuery(chair) {
    if (gameState.state != 1) return false;
    if (chair.touched) return false;
    chair.touched = true;
    return true;
}

function handleChairCollision(chair) {
    chair.unit.touched = true;
    // check winning conditions
    if (checkWinningCondition()) endGame();
}

function checkWinningCondition() {
    if (gameState.state == 2) return false;
    let availableChairs = chairs.length;
    for (const chair of chairs) {
	if (chair.unit.touched)
	    availableChairs--;
    }
    if (!availableChairs) {
	return true;
    }
    return false;
}

function endGame() {
    // set phase 2 as temporary
    gameState.state = 2;
    let winner = null;
    let looser = null;
    for (const u in units) {
	const unit = units[u];
	if (unit.model == 'skeleton') {
	    if (unit.planner) {
		if (!unit.planner.winner &&
		    !unit.planner.die) {
		    looser = unit;
		} else {
		    // reset winning characters
		    unit.planner.reset();
		    winner = unit;
		}
	    }
	}
    }
    // kill non winning characters
    console.log(looser);
    looser.planner.onDie();
    // clean up units list.
    setTimeout(() => {
	removeObject(looser.scene, true, true);
	// remove one of the chairs
	const removedChair = chairs.shift();
	removeObject(removedChair);
	// reset chairs
	for (const c of chairs) {
	    c.unit.touched = false;
	}
	if (chairs.length > 0) {
	    // Reset to phase 0
	    gameState.state = 0;
	    // Update baseTime
	    baseTime = currentTime;
	    // Generate new phase0Length
	    phase0Length = Math.floor(Math.random() * 5000 + 7000);
	} else {
	    // Close the game
	    winner.planner.winner = true;
	    console.log("Game has ended.");
	}    
    }, 1500);		    
}

function removeObject(object, removeBB=true, isDynamic=false) {    
    // Remove dbboxes/cbboxes entry
    if (removeBB) {
	let bbox = null;
	if (isDynamic) {
	    // search in dbboxes
	    for (let bb of dbboxes) {
		if (bb.object == object) {
		    bbox = bb;
		    const idx = dbboxes.indexOf(bb);
		    dbboxes.splice(idx, 1);
		}
	    }
	} else {
	    // search in cbboxes
	    for (let bb of cbboxes) {
		if (bb.object == object) {
		    bbox = bb;
		    const idx = cbboxes.indexOf(bb);
		    cbboxes.splice(idx, 1);
		}
	    }
	}
	// Remove object's bounding box
	if (bbox) {
	    scene.remove(bbox.bbox);
	}
    }
    
    // Dispose object properties
    if (object.geometry)
	object.geometry.dispose();
    if (object.material)
	object.material.dispose();
    // Remove object from scene
    scene.remove(object);

}

function createObjectBBox(object, isDynamic) {
    const bbox = new THREE.Box3().setFromObject(object);
    if (isDynamic) dbboxes.push({object, bbox});
    else cbboxes.push({object, bbox});
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
    scene.add(new THREE.AmbientLight( 0x202020 ));
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

var currentTime = 0;
var baseTime = 0;
var phase0Length = Math.floor(Math.random() * 5000 + 7000);


function render(time) {
    requestAnimationFrame(render);
    currentTime = time;
    if ((currentTime - baseTime) > phase0Length && !gameState.state)
	gameState.state = 1;
    
    // Update dynamic bboxes and check collisions
    for (let i = 0; i < dbboxes.length; ++i) {
	COLL.updateBBox(dbboxes[i]); // Update bounding box
	for( let j = 0; j < cbboxes.length; ++j) {
	    const ibbox = COLL.checkCollision(dbboxes[i], cbboxes[j]);
	    if (ibbox) collisions.push(ibbox);
	}
    }
    // Resolve collisions
    for (let i = 0; i < collisions.length; ++i) {
	const collision = collisions[i];
	COLL.evalCollision(collision.object, collision.bbox, collision.ibbox);
	// Check if unit has onCollision()
	const object = collision.object;
	const target = collision.tobject;
	if (target.unit) {
	    if (target.unit.model == 'chair') {
		if (object.unit.planner.onChairCollision) {
		    object.unit.planner.onChairCollision(collision);
		    gameState.onUpdate();
		}
	    }
	}
	
	if (object.unit.planner.onCollision) {
	    object.unit.planner.onCollision(collision)
	}
    }
    // Clean resolved collisions
    collisions = [];
    
    // get the time elapsed since the last frame
    var deltaTime = clock.getDelta();
    for (let i = 0; i < animations.length; ++i) {
	animations[i].update(deltaTime);
    }
    for (let i = 0; i < planners.length; ++i) {
	planners[i].update(deltaTime);
    }
    renderer.render(scene, camera);
    
}


function main() {
    initRenderer();
    initCamera();
    initScene();
    loadModels();
    //const controls  = new OrbitControls(camera, renderer.domElement);
    //controls.update();

    function onWindowResize() {
	aspect = window.innerWidth / window.innerHeight;

	camera.bottom = -d;
	camera.up = d;
	camera.left = -d * aspect;
	camera.right = d * aspect;

	
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize( window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize);
    render();
}

main();

