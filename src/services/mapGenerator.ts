

import { MapNode, NodeType } from '../types';

export const MAP_HEIGHT = 15; // Number of floors including Boss
export const MAP_WIDTH = 7;   // Max width of the grid

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateDungeonMap = (): MapNode[] => {
  const nodes: MapNode[] = [];
  const floors: MapNode[][] = [];

  // Helper to create node
  const createNode = (x: number, y: number, type: NodeType): MapNode => {
    return {
      id: `node-${y}-${x}`,
      x,
      y,
      type,
      nextNodes: [],
      completed: false
    };
  };

  // Floor 0: Start (Multiple entry points)
  const startNodes: MapNode[] = [];
  const startNodeCount = getRandomInt(3, 4);
  const startPositions = new Set<number>();
  
  // Try to spread start positions out a bit
  while (startPositions.size < startNodeCount) {
    startPositions.add(getRandomInt(0, MAP_WIDTH - 1));
  }
  Array.from(startPositions).sort((a, b) => a - b).forEach(x => startNodes.push(createNode(x, 0, NodeType.START)));
  floors.push(startNodes);
  nodes.push(...startNodes);

  // Middle Floors (1 to MAP_HEIGHT - 2)
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    const floorNodes: MapNode[] = [];
    const nodeCount = getRandomInt(3, 4);
    
    const positions = new Set<number>();
    while (positions.size < nodeCount) {
        positions.add(getRandomInt(0, MAP_WIDTH - 1));
    }

    const sortedPositions = Array.from(positions).sort((a, b) => a - b);

    sortedPositions.forEach(x => {
        let type = NodeType.COMBAT;
        const r = Math.random();
        
        // Floor specific logic
        if (y === 1) {
             type = NodeType.COMBAT; // Early floors mainly combat
        } else if (y === 7) {
            type = NodeType.TREASURE; // Guaranteed treasure mid-way
        } else if (y === 9) {
            type = NodeType.ELITE; // Guaranteed elite
        } else if (y === MAP_HEIGHT - 2) {
             type = NodeType.REST; // Rest before boss
        } else {
             // General Random
            if (r < 0.45) type = NodeType.COMBAT;
            else if (r < 0.60) type = NodeType.EVENT;
            else if (r < 0.72) type = NodeType.SHOP;
            else if (r < 0.85) type = NodeType.REST;
            else if (r < 0.98) type = NodeType.ELITE;
            else type = NodeType.TREASURE; // Rare random treasure
        }

        floorNodes.push(createNode(x, y, type));
    });
    
    floors.push(floorNodes);
    nodes.push(...floorNodes);
  }

  // Final Floor: Boss
  const bossNode = createNode(Math.floor(MAP_WIDTH / 2), MAP_HEIGHT - 1, NodeType.BOSS);
  floors.push([bossNode]);
  nodes.push(bossNode);

  // Connect Nodes (Create Paths)
  for (let y = 0; y < MAP_HEIGHT - 1; y++) {
      const currentFloor = floors[y];
      const nextFloor = floors[y + 1];

      // 1. Forward Pass: Ensure every node in Current Floor has an outgoing path
      currentFloor.forEach(curr => {
          // Find closest nodes in next floor
          const sortedCandidates = [...nextFloor].sort((a, b) => Math.abs(a.x - curr.x) - Math.abs(b.x - curr.x));
          
          if (sortedCandidates.length > 0) {
              const closest = sortedCandidates[0];
              curr.nextNodes.push(closest.id);

              // Chance for secondary connection (branching)
              if (sortedCandidates.length > 1) {
                  const second = sortedCandidates[1];
                  if (Math.abs(second.x - curr.x) <= 2 && Math.random() < 0.4) {
                      curr.nextNodes.push(second.id);
                  }
              }
          }
      });

      // 2. Backward Pass: Ensure every node in Next Floor has an incoming path (No orphans)
      nextFloor.forEach(next => {
          const hasParent = currentFloor.some(curr => curr.nextNodes.includes(next.id));
          
          if (!hasParent) {
              // Force connection from closest parent in current floor
              const closestParent = [...currentFloor].sort((a, b) => Math.abs(a.x - next.x) - Math.abs(b.x - next.x))[0];
              
              if (closestParent) {
                  if (!closestParent.nextNodes.includes(next.id)) {
                      closestParent.nextNodes.push(next.id);
                  }
              }
          }
      });
  }

  return nodes;
};
