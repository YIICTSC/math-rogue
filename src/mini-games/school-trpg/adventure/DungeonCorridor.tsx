import React, { useMemo } from 'react';
import { BIOME_IDS, type Biome } from './content';
import { corridorPlanes, type Surface } from './corridor';
import { atlasUrl, atlasPosition } from './ui';
import type { Floor } from './world';

const ATLAS: Record<Surface, string> = { floor: 'floors', ceiling: 'ceilings', wall: 'walls' };

export default function DungeonCorridor({ floor, cell, direction, biome }: {
  floor: Floor;
  cell: number;
  direction: number;
  biome: Biome;
}) {
  const planes = useMemo(() => corridorPlanes(floor, cell, direction), [floor, cell, direction]);
  const position = atlasPosition(BIOME_IDS.indexOf(biome));
  return (
    <div className="sa-corridor" aria-hidden="true">
      <div className="sa-corridor-space">
        {planes.map((plane) => (
          <div key={plane.key} className="sa-corridor-plane" data-surface={plane.surface} style={{
            backgroundImage: 'url("' + atlasUrl(ATLAS[plane.surface]) + '")',
            backgroundPosition: position,
            '--shade': plane.shade,
            transform: 'translate(-50%, -50%) translate3d(' +
              [plane.x, plane.y, plane.z].map((value) => 'calc(' + value + ' * var(--tile))').join(', ') +
              ') ' + plane.rotation,
          } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
