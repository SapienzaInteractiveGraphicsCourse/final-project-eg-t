import * as THREE from './resources/three/build/three.module.js';

export function updateBBox(dbbox) {
    dbbox.bbox.setFromObject(dbbox.object);
}

export function checkCollision(dbbox, cbbox) {
    if (dbbox.bbox.intersectsBox(cbbox.bbox)) {
	// Intersection happened, return intersection bbox
	const ibbox = new THREE.Box3().copy(cbbox.bbox).intersect(dbbox.bbox);
	return {object:dbbox.object, // First object involved (dynamic bbox)
		bbox:  dbbox.bbox,   // First bbox   involved
		ibbox: ibbox,        // Intersection bbox
		tobject: cbbox.object}; // Second object involved (static bbox)
    } else {
	return null;
    }	
}

export function computeLocalCollisionNormal(object, obbox, ibbox) {
    const iCenter = new THREE.Vector3();
    const oCenter = new THREE.Vector3();
    ibbox.getCenter(iCenter);
    obbox.getCenter(oCenter);
    // Invert rotation matrix to get world -> local transform
    const iRot    = new THREE.Matrix4().extractRotation(object.matrix);
    iRot.getInverse(iRot);
    const iNormL  = new THREE.Vector3(oCenter).sub(iCenter).setY(0).normalize();
    return iNormL;
}

export function evalCollision(object, obbox, ibbox) {
    const iSize = new THREE.Vector3();
    const iCenter = new THREE.Vector3();
    const oCenter = new THREE.Vector3();
    ibbox.getSize(iSize);
    ibbox.getCenter(iCenter);
    iSize.setY(0);
    obbox.getCenter(oCenter);
    // Escape direction
    const eDir  = new THREE.Vector3().copy(oCenter).sub(iCenter).setY(0).normalize();
    const eDist = new THREE.Vector3().copy(iSize).projectOnVector(eDir);
    // Rotation matrix
    const rMat  = new THREE.Matrix4().extractRotation(object.matrix);
    // Invert matrix to obtain world to local transform
    rMat.getInverse(rMat);
    // Transform the eDir vector into object space and apply translation.
    object.translateOnAxis(eDir.applyMatrix4(rMat), eDist.length());
}
