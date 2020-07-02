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
	this.reset();
	if (this.pose == 'walk') {
	    setObjectZRot(this.object, 'upperlegL', Math.sin(this.time * 4) / 1.5);
	    setObjectZRot(this.object, 'upperlegR', Math.sin(this.time * 4 + Math.PI) / 1.5);
	    setObjectZRot(this.object, 'shoulderL',
			  Math.sin(this.time * 3) / 2);
	    setObjectZRot(this.object, 'shoulderR',
			  Math.sin(this.time * 3 + Math.PI) / 2);

	    setObjectYRot(this.object, 'baseframe', 0);
	    setObjectYOffset(this.object, 'baseframe', 0);
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
	    
	    setObjectYRot(this.object, 'baseframe', 0);
	    setObjectYOffset(this.object, 'baseframe', 0);
	}
	if (this.pose == 'win') {
	    setObjectZRot(this.object, 'shoulderL',
			  Math.PI + Math.sin(this.time * 10) / 5);
	    setObjectZRot(this.object, 'shoulderR',
			  Math.PI + Math.sin(this.time * 10 + Math.PI) / 5);
	    
	    setObjectYRot(this.object, 'baseframe', (this.time % 10) * (2 * Math.PI) / 10);
	    setObjectYOffset(this.object, 'baseframe',
			     Math.max(0.0, Math.sin(this.time * 10) / 2));
	    // TODO
	}
	if (this.pose == 'zombie_walk') {
	    setObjectZRot(this.object, 'upperlegL', Math.sin(this.time * 4) / 1.5);
	    setObjectZRot(this.object, 'upperlegR', Math.sin(this.time * 4 + Math.PI) / 1.5);
	    setObjectZRot(this.object, 'shoulderL',
			  Math.PI/2 + Math.sin(this.time) / 4);
	    setObjectZRot(this.object, 'shoulderR',
			  Math.PI/2 + Math.sin(this.time + Math.PI) / 4);

	    setObjectYRot(this.object, 'baseframe', 0);
	    setObjectYOffset(this.object, 'baseframe', 0);
	}
	if (this.pose == 'die') {
	    // TODO
	    //console.debug(Math.min(Math.PI/2, this.time/100));
	    setObjectZRot(this.object, 'shoulderR',
			  Math.min(Math.PI, this.time * 8));
	    setObjectZRot(this.object, 'shoulderL',
			  Math.min(Math.PI, this.time * 8));
	    setObjectZRot(this.object, 'baseframe',
			  Math.min(Math.PI/2, this.time * 4));
	    setObjectYOffset(this.object, 'baseframe', 0.5);
	}

	if (this.pose == 'walk2') {
	    // Left arm
	    setObjectXRot(this.object, 'shoulderL', Math.PI/9);
	    setObjectXRot(this.object, 'forearmL', -Math.PI/4);
	    setObjectYRot(this.object, 'forearmL', Math.PI/2);
	    // Right arm
	    setObjectXRot(this.object, 'shoulderR', -Math.PI/9);
	    setObjectXRot(this.object, 'forearmR', Math.PI/4);
	    setObjectYRot(this.object, 'forearmR', -Math.PI/2);
	    // Left leg
	    setObjectZRot(this.object, 'upperlegL', Math.abs(Math.sin(this.time * 5) * 2));
	    setObjectZRot(this.object, 'lowerlegL', -Math.abs(Math.sin(this.time * 5)));
	    // Right leg
	    setObjectZRot(this.object, 'upperlegR', Math.abs(Math.sin(this.time * 5 + Math.PI/2) * 2));
	    setObjectZRot(this.object, 'lowerlegR', -Math.abs(Math.sin(this.time * 5 + Math.PI/2)));
	    // Torso
	    setObjectXRot(this.object, 'torso', Math.sin(this.time * 15) / 8);
	    setObjectZRot(this.object, 'torso', Math.sin(this.time * 10) / 10);
	    setObjectYOffset(this.object, 'baseframe',
			     Math.max(0.0, Math.sin(this.time * 20)/2));

	}
    }
    setPose(pose) {
	if (this.pose == pose) return;
	this.pose = pose;
    }

    reset() {
	setObjectZRot(this.object, 'shoulderL', 0.0);
	setObjectYRot(this.object, 'shoulderL', 0.0);
	setObjectXRot(this.object, 'shoulderL', 0.0);
	setObjectZRot(this.object, 'forearmL', 0.0);
	setObjectYRot(this.object, 'forearmL', 0.0);
	setObjectXRot(this.object, 'forearmL', 0.0);

	setObjectZRot(this.object, 'shoulderR', 0.0);
	setObjectYRot(this.object, 'shoulderR', 0.0);
	setObjectXRot(this.object, 'shoulderR', 0.0);
	setObjectZRot(this.object, 'forearmR', 0.0);
	setObjectYRot(this.object, 'forearmR', 0.0);
	setObjectXRot(this.object, 'forearmR', 0.0);
	
	setObjectZRot(this.object, 'upperlegL', 0.0);
	setObjectYRot(this.object, 'upperlegL', 0.0);
	setObjectXRot(this.object, 'upperlegL', 0.0);
	setObjectZRot(this.object, 'lowerlegL', 0.0);
	setObjectYRot(this.object, 'lowerlegL', 0.0);
	setObjectXRot(this.object, 'lowerlegL', 0.0);

	setObjectZRot(this.object, 'upperlegR', 0.0);
	setObjectYRot(this.object, 'upperlegR', 0.0);
	setObjectXRot(this.object, 'upperlegR', 0.0);
	setObjectZRot(this.object, 'lowerlegR', 0.0);
	setObjectYRot(this.object, 'lowerlegR', 0.0);
	setObjectXRot(this.object, 'lowerlegR', 0.0);

	setObjectZRot(this.object, 'baseframe', 0.0);
	setObjectYRot(this.object, 'baseframe', 0.0);
	setObjectXRot(this.object, 'baseframe', 0.0);
	setObjectYOffset(this.object, 'baseframe', 0.0);
	setObjectZRot(this.object, 'torso', 0.0);
	setObjectYRot(this.object, 'torso', 0.0);
	setObjectXRot(this.object, 'torso', 0.0);
    }
}

function setObjectYRot(object, child, val) {
    const c = object.getObjectByName(child);
    if (c) {
	c.rotation.y = val;
    }
}

function setObjectXRot(object, child, val) {
    const c = object.getObjectByName(child);
    if (c) {
	c.rotation.x = val;
    }
}

function setObjectZRot(object, child=null, val) {
    if (!child) {
	object.rotation.z = val;
    } else {
	const c = object.getObjectByName(child);
	if (c) {
	    c.rotation.z = val;
	}
    }
}

function setObjectYOffset(object, child=null, val) {
    if (!child) {
	object.position.y = val;
    } else {
	const c = object.getObjectByName(child);
	if (c) {
	    c.position.y = val;
	}
    }
    
}
