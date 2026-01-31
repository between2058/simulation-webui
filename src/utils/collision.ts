import * as THREE from 'three';

// Simple AABB collision detection
export interface BoundingBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface CollisionResult {
  collided: boolean;
  normal?: THREE.Vector3;
  depth?: number;
  point?: THREE.Vector3;
}

// Create bounding box from mesh
export function createBoundingBox(mesh: THREE.Object3D): BoundingBox {
  const box = new THREE.Box3().setFromObject(mesh);
  return {
    min: box.min,
    max: box.max,
  };
}

// Check AABB collision between two boxes
export function checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

// Check sphere-sphere collision
export function checkSphereCollision(
  posA: THREE.Vector3,
  radiusA: number,
  posB: THREE.Vector3,
  radiusB: number
): CollisionResult {
  const distance = posA.distanceTo(posB);
  const combinedRadius = radiusA + radiusB;

  if (distance < combinedRadius) {
    const normal = new THREE.Vector3().subVectors(posA, posB).normalize();
    const depth = combinedRadius - distance;
    const point = new THREE.Vector3().addVectors(
      posB,
      normal.clone().multiplyScalar(radiusB)
    );

    return {
      collided: true,
      normal,
      depth,
      point,
    };
  }

  return { collided: false };
}

// Check ray-plane collision (for ground collision)
export function checkGroundCollision(
  position: THREE.Vector3,
  groundHeight: number = 0
): CollisionResult {
  if (position.y < groundHeight) {
    return {
      collided: true,
      normal: new THREE.Vector3(0, 1, 0),
      depth: groundHeight - position.y,
      point: new THREE.Vector3(position.x, groundHeight, position.z),
    };
  }

  return { collided: false };
}

// Collision world manager
export class CollisionWorld {
  private staticColliders: THREE.Box3[] = [];
  private dynamicColliders: Map<string, THREE.Box3> = new Map();

  addStaticCollider(box: THREE.Box3): void {
    this.staticColliders.push(box);
  }

  addDynamicCollider(id: string, box: THREE.Box3): void {
    this.dynamicColliders.set(id, box);
  }

  updateDynamicCollider(id: string, box: THREE.Box3): void {
    this.dynamicColliders.set(id, box);
  }

  removeDynamicCollider(id: string): void {
    this.dynamicColliders.delete(id);
  }

  checkCollision(box: THREE.Box3, excludeId?: string): THREE.Box3 | null {
    // Check against static colliders
    for (const staticBox of this.staticColliders) {
      if (box.intersectsBox(staticBox)) {
        return staticBox;
      }
    }

    // Check against dynamic colliders
    for (const [id, dynamicBox] of this.dynamicColliders) {
      if (id !== excludeId && box.intersectsBox(dynamicBox)) {
        return dynamicBox;
      }
    }

    return null;
  }

  // Raycast for pathfinding and obstacle detection
  raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 100
  ): { distance: number; point: THREE.Vector3 } | null {
    const ray = new THREE.Ray(origin, direction.normalize());
    let closestHit: { distance: number; point: THREE.Vector3 } | null = null;

    for (const box of this.staticColliders) {
      const point = new THREE.Vector3();
      if (ray.intersectBox(box, point)) {
        const distance = origin.distanceTo(point);
        if (distance <= maxDistance) {
          if (!closestHit || distance < closestHit.distance) {
            closestHit = { distance, point: point.clone() };
          }
        }
      }
    }

    return closestHit;
  }

  clear(): void {
    this.staticColliders = [];
    this.dynamicColliders.clear();
  }
}

// Singleton collision world instance
export const collisionWorld = new CollisionWorld();
