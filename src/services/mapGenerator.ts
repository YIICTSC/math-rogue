

import { MapNode, NodeType } from '../types';
import { getDifficultyConfig } from '../config/difficulty';
import { getEndlessArc, getEndlessBoss } from '../data/endlessMode';

// Keep the normal Learning Rogue route length in every distributable build.
// Debug access must never change the stage structure before the player opts in.
export const MAP_HEIGHT = 15; // Number of floors including Boss
export const MAP_WIDTH = 7;   // Max width of the grid

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateDungeonMap = (difficultyLevel: number = 1, options: { endless?: boolean; visualTheme?: string; endlessChapter?: number } = {}): MapNode[] => {
  const nodes: MapNode[] = [];
  const floors: MapNode[][] = [];
  const difficulty = getDifficultyConfig(difficultyLevel);
  // Endless mode is a sequence of normal-sized chapter maps.  Keeping each
  // generated map at 15 floors preserves the route density and scroll rhythm
  // of the regular mode; the chapter counter lives in GameState instead.
  const mapHeight = MAP_HEIGHT;
  const endlessChapter = Math.max(1, options.endlessChapter ?? 1);
  const endlessBossChapter = options.endless && endlessChapter % 5 === 0;
  const endlessArc = options.endless ? getEndlessArc(options.visualTheme) : undefined;

  // Helper to create node
  const createNode = (x: number, y: number, type: NodeType): MapNode => {
    const endlessBossId = options.endless && type === NodeType.BOSS
      ? getEndlessBoss(endlessArc, endlessChapter)?.id
      : undefined;
    const idPrefix = options.endless ? `endless-${endlessChapter}-` : '';
    return {
      id: `${idPrefix}node-${y}-${x}`,
      x,
      y,
      type,
      nextNodes: [],
      completed: false,
      ...(options.endless ? { endlessChapter } : {}),
      ...(endlessBossId ? { endlessBossId } : {})
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

  // Middle floors (1 to MAP_HEIGHT - 2) use the same readable branching as a
  // normal chapter.  Bosses are chapter-end content, never an interruption in
  // the middle of a 15-floor route.
  for (let y = 1; y < mapHeight - 1; y++) {
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
            const restChance = 0.13;
            const weights = [
                { type: NodeType.COMBAT, weight: 0.45 },
                { type: NodeType.EVENT, weight: 0.15 },
                { type: NodeType.SHOP, weight: 0.12 },
                { type: NodeType.REST, weight: restChance },
                { type: NodeType.ELITE, weight: 0.13 },
                { type: NodeType.TREASURE, weight: 0.02 },
            ];
            const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);
            let cursor = r * totalWeight;
            type = NodeType.COMBAT;
            for (const entry of weights) {
                cursor -= entry.weight;
                if (cursor <= 0) {
                    type = entry.type;
                    break;
                }
            }
        }

        floorNodes.push(createNode(x, y, type));
    });
    
    floors.push(floorNodes);
    nodes.push(...floorNodes);
  }

  // Final floor: every fifth endless chapter has a boss.  Other endless
  // chapters finish with one combat node that acts as the chapter transition
  // after its reward is resolved.
  const finalNodeType = !options.endless || endlessBossChapter ? NodeType.BOSS : NodeType.COMBAT;
  const finalNode = createNode(Math.floor(MAP_WIDTH / 2), mapHeight - 1, finalNodeType);
  floors.push([finalNode]);
  nodes.push(finalNode);

  // Connect Nodes (Create Paths)
  for (let y = 0; y < mapHeight - 1; y++) {
      const currentFloor = floors[y];
      const nextFloor = floors[y + 1];

      // 1. Forward Pass: Ensure every node in Current Floor has an outgoing path
      currentFloor.forEach(curr => {
          // Find closest nodes in next floor
          const sortedCandidates = [...nextFloor].sort((a, b) => Math.abs(a.x - curr.x) - Math.abs(b.x - curr.x));
          
          if (sortedCandidates.length > 0) {
              const closest = sortedCandidates[0];
              curr.nextNodes.push(closest.id);

              const straightAhead = sortedCandidates.find(candidate => candidate.x === curr.x);
              if (straightAhead && !curr.nextNodes.includes(straightAhead.id)) {
                  curr.nextNodes.push(straightAhead.id);
              }

              // Chance for secondary connection (branching)
              if (sortedCandidates.length > 1) {
                  const second = sortedCandidates[1];
                  if (Math.abs(second.x - curr.x) <= 2 && Math.random() < 0.4 && !curr.nextNodes.includes(second.id)) {
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
