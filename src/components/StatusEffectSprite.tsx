import React, { useEffect, useState } from 'react';
import { StatusEffectKey } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { STATUS_EFFECT_COLUMNS, STATUS_EFFECTS } from '../data/statusEffects';

interface StatusEffectSpriteProps {
    effectKey: StatusEffectKey;
    size?: number;
    className?: string;
    paused?: boolean;
    loop?: boolean;
    playToken?: number;
    style?: React.CSSProperties;
}

const StatusEffectSprite: React.FC<StatusEffectSpriteProps> = ({
    effectKey,
    size = 160,
    className = '',
    paused = false,
    loop = true,
    playToken = 0,
    style
}) => {
    const definition = STATUS_EFFECTS[effectKey];
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        if (paused) {
            setFrame(0);
            return;
        }
        setFrame(0);
        const timer = window.setInterval(() => {
            setFrame(current => loop ? (current + 1) % definition.frames : Math.min(current + 1, definition.frames - 1));
        }, definition.frameMs);
        return () => window.clearInterval(timer);
    }, [definition.frameMs, definition.frames, effectKey, loop, paused, playToken]);

    // Status frames are pre-trimmed and centered, so keep a 1:1 frame fit.
    const zoom = 1;
    const bgWidth = size * STATUS_EFFECT_COLUMNS * zoom;
    const bgHeight = size * zoom;
    
    // Offset the position to keep the sprite centered while zoomed
    const offsetX = (size * zoom - size) / 2;
    const offsetY = (size * zoom - size) / 2;
    const posX = -(frame * size * zoom) - offsetX;
    const posY = -offsetY;

    return (
        <div
            className={`pointer-events-none bg-no-repeat image-render-auto ${className}`}
            style={{
                width: size,
                height: size,
                backgroundImage: `url(${assetUrl(`sprites/status-vfx-${effectKey}.webp`)})`,
                backgroundSize: `${bgWidth}px ${bgHeight}px`,
                backgroundPosition: `${posX}px ${posY}px`,
                ...style
            }}
            aria-hidden="true"
        />
    );
};

export default StatusEffectSprite;
