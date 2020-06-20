import * as THREE from './resources/three/build/three.module.js';

/**
 * @Class
 * Base AnimationHandler class
 */
export class AnimationHandler {
    constructor(object) {
	this.object = object;
	this.time   = 0;
    }
}

/**
 * @Class
 * TorchAnimation class. Handle animations for torches
 */
export class TorchAnimation extends AnimationHandler {
    constructor(object, timeScale, ampMult) {
	super(object);
	this.timeScale = timeScale;
	this.ampMult = ampMult;
	this.basePos  = new THREE.Vector3().copy(object.position);
    }	      
    update(deltaTime) {
	this.time += deltaTime;
	const increment = Math.sin(this.time * this.timeScale) * this.ampMult;
	this.object.position.y = this.basePos.y + increment;
	this.object.rotation.y = (this.time * this.timeScale) % (2 * Math.PI);
    }
}

/**
 * @Class
 * SkeletonAnimation class. Handle animations for skeletons.
 */
export class SkeletonAnimation extends AnimationHandler {
    constructor (object) {
	super(object);
    }
}
