
import React, { useRef, useEffect } from 'react';

interface PixelSpriteProps {
  seed: string;
  name: string;
  className?: string;
  size?: number; // Internal grid size (default 16)
}

const PixelSprite: React.FC<PixelSpriteProps> = ({ seed, name, className, size = 16 }) => {
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

    // --- RNG ---
    let hash = 0;
    const seedString = seed || name || 'default';
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const random = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };

    // --- Palettes ---
    const palettes = [
      ['#F8F8F8', '#FC9838', '#80D010'], // Orange/Green (Nature)
      ['#F8F8F8', '#D32F2F', '#5D4037'], // Red/DarkRed (Aggressive)
      ['#F8F8F8', '#3CBCFC', '#0078F8'], // Blue/LightBlue (Ice/Water)
      ['#F8F8F8', '#BDBDBD', '#424242'], // Grayscale (Metal/Stone)
      ['#F8F8F8', '#AB47BC', '#4A148C'], // Purple (Magic/Poison)
      ['#F8F8F8', '#8D6E63', '#5D4037'], // Brown (Earth/Beast)
      ['#212121', '#424242', '#000000'], // Dark (Shadow)
      ['#FFF176', '#FBC02D', '#F57F17'], // Yellow (Electric/Light)
    ];

    // --- Synthesis / Color Logic ---
    let shapeSeed = seedString;
    let colorKeySource = name || seedString;

    // Check for synthesis ref format "shape|color"
    if (seedString.includes('|')) {
        const parts = seedString.split('|');
        shapeSeed = parts[0];
        colorKeySource = parts[1];
        // Reset hash for shape generation based on shape part
        hash = 0;
        for (let i = 0; i < shapeSeed.length; i++) {
            hash = shapeSeed.charCodeAt(i) + ((hash << 5) - hash);
        }
    }

    let palette = palettes[Math.abs(hash) % palettes.length];
    
    // Apply theme colors based on the color source key
    const c = colorKeySource;
    if (c.includes('先生') || c.includes('悪魔') || c.includes('怒') || c.includes('ランドセル') || c.includes('炎') || c.includes('リンゴ') || c.includes('HEART') || c.includes('DIAMOND')) palette = palettes[1]; // Red
    else if (c.includes('スライム') || c.includes('水') || c.includes('三輪車') || c.includes('氷') || c.includes('SPADE') || c.includes('MATH')) palette = palettes[2]; // Blue
    else if (c.includes('カス') || c.includes('骸骨') || c.includes('模型') || c.includes('ゴーレム') || c.includes('石') || c.includes('STEEL') || c.includes('STONE')) palette = palettes[3]; // Grey
    else if (c.includes('花子') || c.includes('幽霊') || c.includes('毒') || c.includes('紫') || c.includes('WILD')) palette = palettes[4]; // Purple
    else if (c.includes('犬') || c.includes('ハムスター') || c.includes('机') || c.includes('木')) palette = palettes[5]; // Brown
    else if (c.includes('カラス') || c.includes('墨') || c.includes('影') || c.includes('上級生') || c.includes('不良')) palette = palettes[6]; // Black
    else if (c.includes('チョーク') || c.includes('ノート') || c.includes('上履き') || c.includes('雪') || c.includes('GLASS')) palette = ['#EEEEEE', '#FFFFFF', '#BDBDBD']; // White
    else if (c.includes('虫') || c.includes('草') || c.includes('森') || c.includes('CLUB')) palette = palettes[0]; // Green
    else if (c.includes('電気') || c.includes('光') || c.includes('金') || c.includes('GOLD') || c.includes('MULT')) palette = palettes[7]; // Yellow

    const mainColor = palette[1]; // Mid tone
    const secondaryColor = palette[2]; // Dark tone
    const highlightColor = palette[0]; // Light tone
    const outlineColor = '#1a1a1a';

    // Generate Grid (Half Width for symmetry)
    const gridW = size;
    const gridH = size;
    const halfW = Math.ceil(gridW / 2);
    const grid = new Array(gridH).fill(0).map(() => new Array(halfW).fill(0));

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < halfW; x++) {
        const r = random();
        let threshold = 0.5; 
        
        // Shape constraints
        if (y < 2 || y > gridH - 3) threshold = 0.7; // Taper top/bottom
        if (x === 0) threshold = 0.2; // Solid center
        if (x > halfW - 2) threshold = 0.8; // Taper sides
        
        if (r > threshold) {
            // 1 = Main, 2 = Secondary
            grid[y][x] = r > threshold + 0.3 ? 2 : 1;
        }
      }
    }

    // Render
    const getPixel = (x: number, y: number) => {
        if (x < 0 || y < 0 || y >= gridH || x >= gridW) return 0;
        const mapX = x >= halfW ? gridW - 1 - x : x;
        return grid[y][mapX];
    };

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const val = getPixel(x, y);
        if (val > 0) {
          drawPixel(x, y, val === 1 ? mainColor : secondaryColor);
          // Highlight top/left
          if (getPixel(x, y-1) === 0 && val === 1) {
              // drawPixel(x, y, highlightColor); // Optional highlight logic
          }
        } else {
            // Outline
            const hasNeighbor = 
                getPixel(x+1, y) > 0 || getPixel(x-1, y) > 0 ||
                getPixel(x, y+1) > 0 || getPixel(x, y-1) > 0;
            
            if (hasNeighbor) {
                drawPixel(x, y, outlineColor);
            }
        }
      }
    }
    
  }, [seed, name, size]);

  return <canvas ref={canvasRef} className={className} style={{ imageRendering: 'pixelated' }} />;
};

export default PixelSprite;
