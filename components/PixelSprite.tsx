import React, { useRef, useEffect } from 'react';

interface PixelSpriteProps {
  seed: string;
  className?: string;
  size?: number; // Internal grid size (default 16)
}

const PixelSprite: React.FC<PixelSpriteProps> = ({ seed, className, size = 16 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const pixelScale = 8;
    const border = 1;
    
    // Set Canvas Size
    canvas.width = (size + border * 2) * pixelScale;
    canvas.height = (size + border * 2) * pixelScale;
    
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawPixel = (x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect((x + border) * pixelScale, (y + border) * pixelScale, pixelScale, pixelScale);
    };

    // ENEMY: Procedural Generation (Symmetrical 16x16)
    // Seeded RNG
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const random = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };

    // Enemy Palettes (NES style)
    const palettes = [
      ['#F8F8F8', '#FC9838', '#80D010'], // Orange/Green
      ['#F8F8F8', '#3CBCFC', '#0078F8'], // Blue/LightBlue
      ['#F8F8F8', '#D32F2F', '#5D4037'], // Red/DarkBrown
      ['#F8F8F8', '#7CB342', '#33691E'], // Lime/Forest
      ['#F8F8F8', '#AB47BC', '#4A148C'], // Purple/DarkPurple
      ['#F8F8F8', '#BDBDBD', '#424242'], // Grayscale
    ];
    
    const paletteIndex = Math.floor(Math.abs(random()) * palettes.length) % palettes.length;
    const mainColor = palettes[paletteIndex][1];
    const secondaryColor = palettes[paletteIndex][2];
    const outlineColor = '#1a1a1a'; // Black outline for unification
    
    // Generate Grid (Half Width for symmetry)
    const gridW = size;
    const gridH = size;
    const halfW = Math.ceil(gridW / 2);
    const grid = new Array(gridH).fill(0).map(() => new Array(halfW).fill(0));

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < halfW; x++) {
        const r = random();
        let threshold = 0.5; 
        
        // Shape constraints for better sprites
        if (y < 2 || y > gridH - 3) threshold = 0.7; // Taper top/bottom
        if (x === 0) threshold = 0.2; // Solid center
        
        if (r > threshold) {
            // 1 = Main, 2 = Secondary, 3 = Empty (internal)
            grid[y][x] = r > threshold + 0.3 ? 2 : 1;
        }
      }
    }

    // Render with outline effect (simplified)
    const getPixel = (x: number, y: number) => {
        if (x < 0 || y < 0 || y >= gridH || x >= gridW) return 0;
        const mapX = x >= halfW ? gridW - 1 - x : x;
        return grid[y][mapX];
    };

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const val = getPixel(x, y);
        if (val > 0) {
          const color = val === 1 ? mainColor : secondaryColor;
          drawPixel(x, y, color);
        } else {
            // Check neighbors to draw outline
            // If current is empty but neighbor is solid, draw outline
            const hasNeighbor = 
                getPixel(x+1, y) > 0 || getPixel(x-1, y) > 0 ||
                getPixel(x, y+1) > 0 || getPixel(x, y-1) > 0;
            
            if (hasNeighbor) {
                drawPixel(x, y, outlineColor);
            }
        }
      }
    }
    
  }, [seed, size]);

  return <canvas ref={canvasRef} className={className} style={{ imageRendering: 'pixelated' }} />;
};

export default PixelSprite;