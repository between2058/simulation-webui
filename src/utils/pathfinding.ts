import * as THREE from 'three';

// Grid-based A* pathfinding

interface GridNode {
  x: number;
  z: number;
  walkable: boolean;
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: GridNode | null;
}

export interface PathfindingGrid {
  nodes: GridNode[][];
  cellSize: number;
  width: number;
  height: number;
  offsetX: number;
  offsetZ: number;
}

// Create pathfinding grid from obstacle bounds
export function createPathfindingGrid(
  obstacles: THREE.Box3[],
  gridSize: number = 20,
  cellSize: number = 0.5,
  robotRadius: number = 0.4
): PathfindingGrid {
  const halfSize = gridSize / 2;
  const width = Math.ceil(gridSize / cellSize);
  const height = Math.ceil(gridSize / cellSize);

  const nodes: GridNode[][] = [];

  for (let x = 0; x < width; x++) {
    nodes[x] = [];
    for (let z = 0; z < height; z++) {
      const worldX = (x * cellSize) - halfSize + cellSize / 2;
      const worldZ = (z * cellSize) - halfSize + cellSize / 2;

      // Check if cell is blocked by any obstacle
      let walkable = true;

      // Create a box for the robot at this position
      const robotBox = new THREE.Box3(
        new THREE.Vector3(worldX - robotRadius, 0, worldZ - robotRadius),
        new THREE.Vector3(worldX + robotRadius, 1, worldZ + robotRadius)
      );

      for (const obstacle of obstacles) {
        if (robotBox.intersectsBox(obstacle)) {
          walkable = false;
          break;
        }
      }

      nodes[x][z] = {
        x,
        z,
        walkable,
        g: 0,
        h: 0,
        f: 0,
        parent: null,
      };
    }
  }

  return {
    nodes,
    cellSize,
    width,
    height,
    offsetX: -halfSize,
    offsetZ: -halfSize,
  };
}

// Convert world position to grid coordinates
export function worldToGrid(
  worldPos: THREE.Vector3,
  grid: PathfindingGrid
): { x: number; z: number } | null {
  const x = Math.floor((worldPos.x - grid.offsetX) / grid.cellSize);
  const z = Math.floor((worldPos.z - grid.offsetZ) / grid.cellSize);

  if (x < 0 || x >= grid.width || z < 0 || z >= grid.height) {
    return null;
  }

  return { x, z };
}

// Convert grid coordinates to world position
export function gridToWorld(
  gridX: number,
  gridZ: number,
  grid: PathfindingGrid
): THREE.Vector3 {
  const x = grid.offsetX + gridX * grid.cellSize + grid.cellSize / 2;
  const z = grid.offsetZ + gridZ * grid.cellSize + grid.cellSize / 2;
  return new THREE.Vector3(x, 0, z);
}

// Heuristic function (Manhattan distance)
function heuristic(a: GridNode, b: GridNode): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

// Get neighbors of a node
function getNeighbors(node: GridNode, grid: PathfindingGrid): GridNode[] {
  const neighbors: GridNode[] = [];
  const directions = [
    { x: 0, z: -1 },  // North
    { x: 1, z: 0 },   // East
    { x: 0, z: 1 },   // South
    { x: -1, z: 0 },  // West
    { x: 1, z: -1 },  // NE
    { x: 1, z: 1 },   // SE
    { x: -1, z: 1 },  // SW
    { x: -1, z: -1 }, // NW
  ];

  for (const dir of directions) {
    const newX = node.x + dir.x;
    const newZ = node.z + dir.z;

    if (newX >= 0 && newX < grid.width && newZ >= 0 && newZ < grid.height) {
      const neighbor = grid.nodes[newX][newZ];
      if (neighbor.walkable) {
        // For diagonal movement, check if we can actually move diagonally
        if (dir.x !== 0 && dir.z !== 0) {
          // Check adjacent cells for diagonal movement
          const adj1 = grid.nodes[node.x + dir.x]?.[node.z];
          const adj2 = grid.nodes[node.x]?.[node.z + dir.z];
          if (!adj1?.walkable || !adj2?.walkable) {
            continue; // Can't move diagonally if blocked
          }
        }
        neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
}

// A* pathfinding algorithm
export function findPath(
  start: THREE.Vector3,
  end: THREE.Vector3,
  grid: PathfindingGrid
): THREE.Vector3[] | null {
  const startGrid = worldToGrid(start, grid);
  const endGrid = worldToGrid(end, grid);

  if (!startGrid || !endGrid) {
    return null;
  }

  const startNode = grid.nodes[startGrid.x][startGrid.z];
  const endNode = grid.nodes[endGrid.x][endGrid.z];

  if (!startNode.walkable || !endNode.walkable) {
    return null;
  }

  // Reset all nodes
  for (let x = 0; x < grid.width; x++) {
    for (let z = 0; z < grid.height; z++) {
      grid.nodes[x][z].g = 0;
      grid.nodes[x][z].h = 0;
      grid.nodes[x][z].f = 0;
      grid.nodes[x][z].parent = null;
    }
  }

  const openList: GridNode[] = [startNode];
  const closedSet = new Set<GridNode>();

  startNode.g = 0;
  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.h;

  while (openList.length > 0) {
    // Find node with lowest f cost
    let currentIndex = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[currentIndex].f) {
        currentIndex = i;
      }
    }

    const current = openList[currentIndex];

    // Check if we've reached the goal
    if (current === endNode) {
      // Reconstruct path
      const path: THREE.Vector3[] = [];
      let node: GridNode | null = current;

      while (node) {
        path.unshift(gridToWorld(node.x, node.z, grid));
        node = node.parent;
      }

      // Smooth the path
      return smoothPath(path, grid);
    }

    // Move current from open to closed
    openList.splice(currentIndex, 1);
    closedSet.add(current);

    // Check neighbors
    const neighbors = getNeighbors(current, grid);

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor)) {
        continue;
      }

      // Calculate tentative g score
      const isDiagonal = neighbor.x !== current.x && neighbor.z !== current.z;
      const moveCost = isDiagonal ? 1.414 : 1;
      const tentativeG = current.g + moveCost;

      const inOpenList = openList.includes(neighbor);

      if (!inOpenList || tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;

        if (!inOpenList) {
          openList.push(neighbor);
        }
      }
    }
  }

  // No path found
  return null;
}

// Smooth the path by removing unnecessary waypoints
function smoothPath(path: THREE.Vector3[], grid: PathfindingGrid): THREE.Vector3[] {
  if (path.length <= 2) {
    return path;
  }

  const smoothed: THREE.Vector3[] = [path[0]];

  let current = 0;
  while (current < path.length - 1) {
    let furthest = current + 1;

    // Find the furthest point we can reach directly
    for (let i = path.length - 1; i > current + 1; i--) {
      if (hasLineOfSight(path[current], path[i], grid)) {
        furthest = i;
        break;
      }
    }

    smoothed.push(path[furthest]);
    current = furthest;
  }

  return smoothed;
}

// Check if there's a clear line of sight between two points
function hasLineOfSight(
  from: THREE.Vector3,
  to: THREE.Vector3,
  grid: PathfindingGrid
): boolean {
  const distance = from.distanceTo(to);
  const steps = Math.ceil(distance / (grid.cellSize * 0.5));
  const direction = new THREE.Vector3().subVectors(to, from).normalize();

  for (let i = 0; i <= steps; i++) {
    const point = new THREE.Vector3()
      .copy(from)
      .addScaledVector(direction, (distance * i) / steps);

    const gridPos = worldToGrid(point, grid);
    if (!gridPos || !grid.nodes[gridPos.x][gridPos.z].walkable) {
      return false;
    }
  }

  return true;
}

// Visualize the grid for debugging
export function getGridVisualization(grid: PathfindingGrid): {
  walkable: THREE.Vector3[];
  blocked: THREE.Vector3[];
} {
  const walkable: THREE.Vector3[] = [];
  const blocked: THREE.Vector3[] = [];

  for (let x = 0; x < grid.width; x++) {
    for (let z = 0; z < grid.height; z++) {
      const worldPos = gridToWorld(x, z, grid);
      if (grid.nodes[x][z].walkable) {
        walkable.push(worldPos);
      } else {
        blocked.push(worldPos);
      }
    }
  }

  return { walkable, blocked };
}
