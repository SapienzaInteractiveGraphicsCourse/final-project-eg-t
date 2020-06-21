import * as THREE from './resources/three/build/three.module.js';

/**
 * @Class
 * Base Planner Class
 */
export class Planner {
    constructor(object) {
	this.object = object;
    }
}

/**
 * @Class
 * RandomWalk Planner
 */
export class RandomWalker extends Planner {
    constructor(object, step) {
	super(object);
	this.step = step;
    }
    update(time) {
	const rnStep = noise.perlin3(this.object.position.x,
				     this.object.position.z,
				     time);
	this.object.rotateOnAxis(new THREE.Vector3(0, 1, 0), rnStep * this.step * 2);
	this.object.translateOnAxis(new THREE.Vector3(1, 0, 0), Math.random() * this.step);
    }
}

export class HumanPlanner extends Planner {
    constructor(object, document, speed, helper) {
	super(object);
	document.addEventListener("keydown", (event) => {
	    const keyCode = event.which;
	    if(keyCode == 87) {
		object.translateOnAxis(new THREE.Vector3(1, 0, 0), speed);
	    } else if (keyCode == 83) {
		object.translateOnAxis(new THREE.Vector3(1, 0, 0), -speed);
	    } else if (keyCode == 65) {
		object.rotation.set(object.rotation.x,
				    object.rotation.y + speed,
				    object.rotation.z);
	    } else if (keyCode == 68) {
		object.rotation.set(object.rotation.x,
				    object.rotation.y - speed,
				    object.rotation.z);
	    }
	}, false);
	this.helper = helper;
    }
    update(time) {
	const posHelper = new THREE.Vector3().copy(this.object.position).setY(2);
	const dirHelper = new THREE.Vector3(1, 0, 0);
	const rotationMatrix = new THREE.Matrix4().extractRotation(this.object.matrix);
	dirHelper.applyMatrix4(rotationMatrix);
	this.helper.position.copy(posHelper);
	this.helper.setDirection(dirHelper);
	//this.helper.setLength(dirHelper.length);
	return;
    }
}

function getChairDir (object, chair) {
    const source = new THREE.Vector3().copy(object.position);
    const dest = new THREE.Vector3().copy(chair.position);
    dest.sub(source).setY(0);
    return dest;
}

function getChairDist(object, chair) {
    return getChairDir(object, chair).length();
}

function worldToLocalRotation(sVec, worldMatrix) {
    const iRot = new THREE.Matrix4().extractRotation(worldMatrix);
    iRot.getInverse(iRot);
    return new THREE.Vector3().copy(sVec).applyMatrix4(iRot);
}

export class ChairFinder extends Planner {
    constructor(object, chairs, speed, aspeed) {
	super(object);
	this.chairs = chairs;
	this.speed  = speed;
	this.aspeed = aspeed; // angular speed
	this.winner = false;
    }
    update(time) {
	// Stop if won
	if (this.winner) return;
	// Find closest available chair
	let minDist = Infinity;
	let tChair  = null;
	for (let i = 0; i < this.chairs.length; ++i) {
	    if (this.chairs[i].unit.touched) continue;
	    let cDist = getChairDist(this.object, this.chairs[i]);
	    if (cDist < minDist) {
		minDist = cDist;
		tChair  = this.chairs[i];
	    }
	}
	if (tChair) {
	    // Compute the angle to rotate towards the chair
	    const oDir = getChairDir(this.object, tChair).normalize();
	    const oDirLocal = worldToLocalRotation(oDir, this.object.matrix);
	    
	    let astep = new THREE.Vector3(1, 0, 0).angleTo(oDirLocal);
	    // TODO: Find better way to get angle between X-local and oDirLocal
	    // https://answers.unity.com/questions/24983/how-to-calculate-the-angle-between-two-vectors.html
	    astep = Math.max(-this.aspeed, Math.min(astep, this.aspeed)); // clamp astep
	    this.object.rotation.set(this.object.rotation.x,
				     this.object.rotation.y + astep,
				     this.object.rotation.z);
	    
	    // Look at the chair and move towards it
	    this.object.translateOnAxis(new THREE.Vector3(1,0,0), this.speed);
	}
	
    }
}
