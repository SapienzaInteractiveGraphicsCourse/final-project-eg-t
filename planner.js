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
