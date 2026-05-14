import React, { useEffect, useState } from 'react';
import { AttackEffectKey } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { ATTACK_EFFECT_COLUMNS, ATTACK_EFFECTS } from '../data/attackEffects';

interface AttackEffectSpriteProps {
    effectKey: AttackEffectKey;
    size?: number;
    className?: string;
    paused?: boolean;
    loop?: boolean;
    playToken?: number;
    style?: React.CSSProperties;
}

const AttackEffectSprite: React.FC<AttackEffectSpriteProps> = ({
    effectKey,
    size = 160,
    className = '',
    paused = false,
    loop = true,
    playToken = 0,
    style
}) => {
    const definition = ATTACK_EFFECTS[effectKey];
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        if (paused) {
            setFrame(0);
            return;
        }
        setFrame(0);
        const timer = window.setInterval(() => {
            setFrame(current => {
                if (loop) return (current + 1) % definition.frames;
                return Math.min(current + 1, definition.frames - 1);
            });
        }, definition.frameMs);
        return () => window.clearInterval(timer);
    }, [definition.frameMs, definition.frames, effectKey, loop, paused, playToken]);

    const shouldUseFittedStrip = effectKey === 'wind' || effectKey === 'plant' || effectKey === 'graduation';
    // Legacy attack strips still use a slight zoom to hide old edge bleed. Newly recut strips are already fitted.
    const zoom = shouldUseFittedStrip ? 1 : 1.3;
    const bgWidth = size * ATTACK_EFFECT_COLUMNS * zoom;
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
                backgroundImage: `url(${assetUrl(`sprites/attack-vfx-${effectKey}.webp`)})`,
                backgroundSize: `${bgWidth}px ${bgHeight}px`,
                backgroundPosition: `${posX}px ${posY}px`,
                ...style
            }}
            aria-label={definition.label}
        />
    );
};

export default AttackEffectSprite;
