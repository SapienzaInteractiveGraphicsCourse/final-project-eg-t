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
    constructor (object, pose = 'idle', seed=0) {
	super(object);
	this.time += seed;
	this.pose = pose;
    }
    update(deltaTime) {
	this.time += deltaTime;
	if (this.pose == 'walk') {
	    setObjectZRot(this.object, 'upperlegL', Math.sin(this.time * 4) / 1.5);
	    setObjectZRot(this.object, 'upperlegR', Math.sin(this.time * 4 + Math.PI) / 1.5);
	    setObjectZRot(this.object, 'shoulderL',
			  Math.sin(this.time * 3) / 2);
	    setObjectZRot(this.object, 'shoulderR',
			  Math.sin(this.time * 3 + Math.PI) / 2);
	}
	if (this.pose == 'idle') {
	    setObjectZRot(this.object, 'head',
			  Math.sin(this.time /2)/7);
	    setObjectYRot(this.object, 'torso',
			  Math.cos(this.time) / 15);
	    setObjectZRot(this.object, 'shoulderL',
			  Math.sin(this.time) / 9);
	    setObjectZRot(this.object, 'shoulderR',
			  Math.sin(this.time + Math.PI) / 9);

	    setObjectZRot(this.object, 'upperlegL', 0.0);
	    setObjectZRot(this.object, 'upperlegR', 0.0);
	}
	if (this.pose == 'win') {
	    // TODO
	}
	if (this.pose == 'zombie_walk') {
	    setObjectZRot(this.object, 'upperlegL', Math.sin(this.time * 4) / 1.5);
	    setObjectZRot(this.object, 'upperlegR', Math.sin(this.time * 4 + Math.PI) / 1.5);
	    setObjectZRot(this.object, 'shoulderL',
			  Math.PI/2 + Math.sin(this.time) / 4);
	    setObjectZRot(this.object, 'shoulderR',
			  Math.PI/2 + Math.sin(this.time + Math.PI) / 4);
	}
    }
    setPose(pose) {
	this.pose = pose;
    }
}

function setObjectYRot(object, child, val) {
    const c = object.getObjectByName(child);
    if (c) {
	c.rotation.y = val;
    }
}

function setObjectZRot(object, child, val) {
    const c = object.getObjectByName(child);
    if (c) {
	c.rotation.z = val;
    }
}
