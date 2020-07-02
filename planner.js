import * as THREE from './resources/three/build/three.module.js';
import * as ANIM from './animation.js';
import * as COLL from './collision.js';

/**
 * @Class
 * Base Planner Class
 */
export class Planner {
    constructor(object, animationHandler) {
	this.object = object;
	this.animationHandler = animationHandler;
	this.winner = false;
	this.die = false;
	this.time = 0
    }

    reset() {
	this.winner = false;
    }

    onDie() {
	this.die = true;
	this.dieTime = this.time;
	this.animationHandler.time = 0;
	this.animationHandler.setPose('die');
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
	const rnStep = noise.perlin2(this.object.position.x,
				     this.object.position.z,
				     time);
	this.object.rotateOnAxis(new THREE.Vector3(0, 1, 0), rnStep * this.step / 2);
	this.object.translateOnAxis(new THREE.Vector3(1, 0, 0), Math.random() * this.step);
    }
}

export class HumanPlanner extends Planner {
    constructor(object, document, speed, helper=null, animationHandler=null) {
	super(object, animationHandler);
	this.speed = speed;
	this.aspeed = speed / 2;
	this.currentSpeed = 0.0;
	this.currentASpeed = 0.0;
	this.keyPressed = {};
	document.addEventListener('keydown', (event) => {
	    this.keyPressed[event.key] = true;
	});
	document.addEventListener('keyup', (event) => {
	    delete this.keyPressed[event.key];
	});
	this.helper = helper;
    }
    update(time) {
	this.time = time;
	if (this.die) {
	    this.animationHandler.setPose('die');
	    return;
	}
	if (this.keyPressed['w']) {
	    this.currentSpeed = this.speed;
	    this.animationHandler.setPose('walk2');
	} else if (this.keyPressed['s']) {
	    this.currentSpeed = -this.speed;
	    this.animationHandler.setPose('walk');
	}
	if (this.keyPressed['a']) {
	    this.currentASpeed = this.aspeed;
	} else if (this.keyPressed['d']) {
	    this.currentASpeed = -this.aspeed;
	}
	if (this.currentSpeed == 0.0) {
	    // Stop if won
	    if (this.winner)
		this.animationHandler.setPose('win');
	    else
		this.animationHandler.setPose('idle');
	}
	this.object.rotateY(this.currentASpeed);
	this.object.translateOnAxis(new THREE.Vector3(1, 0, 0), this.currentSpeed);
	this.currentSpeed = 0.0;
	this.currentASpeed = 0.0;

	
	
	if (this.helper) {
	    const posHelper = new THREE.Vector3().copy(this.object.position).setY(2);
	    const dirHelper = new THREE.Vector3(1, 0, 0);
	    const rotationMatrix = new THREE.Matrix4().extractRotation(this.object.matrix);    
	    dirHelper.applyMatrix4(rotationMatrix);
	    this.helper.position.copy(posHelper);
	    this.helper.setDirection(dirHelper);
	    this.helper.setLength(dirHelper.length);
	}	
    }

    onChairCollision(collision) {
	const chair = collision.tobject.unit;
	if (chair.onQuery) {
	    if (chair.onQuery(chair)) {
		this.winner = true;
	    }
	}
    }

    onDie() {
	super.onDie();
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
    constructor(object, gstate, speed, aspeed, helper=null, animationHandler=null) {
	super(object, animationHandler);
	this.state  = gstate;
	this.chairs = gstate.chairs;
	this.speed  = speed;
	this.aspeed = aspeed; // angular speed
	this.helper = helper;
    }
    update(time) {
	this.time = time;
	// Stop is died
	if (this.die) {
	    this.animationHandler.setPose('die');
	    return;
	}
	// Stop if won
	if (this.winner) {
	    this.animationHandler.setPose('win');
	    return;
	}
	this.animationHandler.setPose('idle');
	if (this.state.state == 0) {
	    // Random walk
	    const rnStep = noise.perlin3(this.object.position.x,
					 this.object.position.z,
					 time);
	    this.object.rotateY(rnStep * this.aspeed * 5);
	    this.object.translateOnAxis(new THREE.Vector3(1,0,0), this.speed);
	    this.animationHandler.setPose('walk2');
	} else if (this.state.state == 1) {
	    // Chair finder
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

		
		// Compute angle from local forward (1 0 0) to oDirLocal
		// https://answers.unity.com/questions/24983/how-to-calculate-the-angle-between-two-vectors.html
		// Use local right-pointing vector to estimate oDirLocal direction
		let refForward = new THREE.Vector3(1, 0, 0);
		let refRight   = new THREE.Vector3(0, 0, 1);
		let asign = Math.sign(refRight.dot(oDirLocal));
		let angle = new THREE.Vector3(1, 0, 0).angleTo(oDirLocal);
		let astep = asign * angle;		
		
		astep = Math.max(-this.aspeed, Math.min(astep, this.aspeed)); // clamp astep
		this.object.rotateY(-astep);
		
		// Look at the chair and move towards it
		this.object.translateOnAxis(new THREE.Vector3(1,0,0),
					    Math.max(0.0, new THREE.Vector3(1,0,0).dot(oDirLocal)) * this.speed);
	    }
	    this.animationHandler.setPose('zombie_walk');	
	}
    }

    onCollision(collision) {
	if (this.state.state == 0) {
	    // Reflect trajectory on normal if random walking
	    const object = collision.object;
	    const target = collision.tobject;	
	    const iNormL = COLL.computeLocalCollisionNormal(object, collision.bbox,
							    collision.ibbox);
	    // Helpers
	    const newDir = new THREE.Vector3(1,0,0).reflect(iNormL);
	    object.rotation.set(object.rotation.x,
				object.rotation.y + new THREE.Vector3(1,0,0).angleTo(newDir),
				object.rotation.z);
	}
	
    }

    onChairCollision(collision) {
	if (this.winner) return;
	const chair = collision.tobject.unit;
	if (chair.onQuery) {
	    if (chair.onQuery(chair)) {
		this.winner = true;
	    }
	}
    }
    
    die() {
	super.die();
    }
    
}				  
