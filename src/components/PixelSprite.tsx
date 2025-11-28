
import React, { useRef, useEffect } from 'react';

interface PixelSpriteProps {
  seed: string; // Used for color variation or fallback ID
  name?: string; // Used to determine sprite type
  className?: string;
  size?: number; // Internal grid size (fixed to 16 for this style)
}

// 16x16 Sprite Templates
// . = Empty, # = Main Color, % = Secondary/Highlight, @ = Outline/Black
const SPRITE_TEMPLATES: Record<string, string[]> = {
  SLIME: [
    "................",
    "................",
    "................",
    "................",
    "......####......",
    "....##%%%%##....",
    "...#%%%%%%%%#...",
    "..#%%%%%%%%%%#..",
    ".#%#%%%%%%%%#%#.",
    ".#%#%%%%%%%%#%#.",
    ".#%%%%%%%%%%%%#.",
    "..#%%%%%%%%%%#..",
    "...##########...",
    "................",
    "................",
    "................"
  ],
  HUMANOID: [
    "................",
    ".....####.......",
    "....#%%%%#......",
    "...#%@%%@%#.....",
    "....#%%%%#......",
    ".....####.......",
    "...#######......",
    "..#%#####%#.....",
    "..#%#####%#...#.",
    "..#%#####%#..##.",
    "...#######..###.",
    "...##...##...#..",
    "..##.....##.....",
    "..##.....##.....",
    ".##.......##....",
    "................"
  ],
  CULTIST: [
    "................",
    "......##........",
    ".....#%#........",
    "....#%@%#.......",
    "...#%%%%%#......",
    "..#%%%%%%%#.....",
    "....#%#%#.......",
    "....#%#%#.......",
    "....#####.......",
    "...#%###%#......",
    "..#%#...#%#.....",
    "..#%#...#%#.....",
    "................",
    "................",
    "................",
    "................"
  ],
  SKELETON: [
    "................",
    ".....####.......",
    "....#%%%%#......",
    "...#%@%%@%#.....",
    "....#%##%#......",
    ".....####.......",
    "....#%##%#......",
    "...#%#..#%#.....",
    "...#%#..#%#..#..",
    "....#%##%#..##..",
    "....#%##%#......",
    "...##....##.....",
    "...##....##.....",
    "..##......##....",
    "................",
    "................"
  ],
  WIZARD: [
    "......##........",
    ".....#%#........",
    "....#%@%#.......",
    "....#%@%#.......",
    "...#%%%%%#......",
    "..#%%%%%%%#.....",
    "....#%#%#.......",
    "....#%#%#.......",
    "...#%%%%%#......",
    "..#%%%%%%%#.....",
    "..#%#...#%#.....",
    "..#%#...#%#.....",
    "................",
    "................",
    "................",
    "................"
  ],
  ROBOT: [
    "................",
    ".....####.......",
    "....#%%%%#......",
    "....#@%%@#......",
    "....######......",
    ".....####.......",
    "....######......",
    "...#%####%#.....",
    "...#%####%#.....",
    "...#%####%#.....",
    "....######......",
    "....#....#......",
    "....#....#......",
    "....##..##......",
    "................",
    "................"
  ],
  GHOST: [
    "................",
    ".....####.......",
    "...##%%%%##.....",
    "..#%%%%%%%%#....",
    ".#%@%%%%%%@%#...",
    ".#%%%%%%%%%%#...",
    ".#%%%%%%%%%%#...",
    ".#%%%%%%%%%%#...",
    ".#%%%%%%%%%%#...",
    "..#%%%%%%%%#....",
    "...#%%%%%%#.....",
    "....#%##%#......",
    ".....#..#.......",
    "................",
    "................",
    "................"
  ],
  BEAST: [
    "................",
    "................",
    "..#..........#..",
    "..##........##..",
    "..#%########%#..",
    ".#%%%%%%%%%%%%#.",
    ".#%@%%%%%%%%@%#.",
    ".#%%%%%%%%%%%%#.",
    "..#%%%%%%%%%%#..",
    "..#%###%%###%#..",
    ".#%#...##...#%#.",
    ".#%#...##...#%#.",
    ".##....##....##.",
    "................",
    "................",
    "................"
  ],
  ARMOR: [
    "................",
    ".....####.......",
    "....#%%%%#......",
    "...#%@%%@%#.....",
    "....#%%%%#......",
    "....######......",
    "...########.....",
    "..##########....",
    "..##########....",
    "..##########....",
    "...########.....",
    "...##....##.....",
    "..###....###....",
    ".####....####...",
    "................",
    "................"
  ],
  BOSS: [
    "................",
    "......####......",
    "....##%%%%##....",
    "...#%%%%%%%%#...",
    "..#%@%%%%%%@%#..",
    "..#%%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    "....###%%###....",
    "...#%#%##%#%#...",
    "..#%#%####%#%#..",
    "..#%#%####%#%#..",
    "..###########...",
    "....##....##....",
    "...####..####...",
    "..##..##.##..##.",
    "................"
  ]
};

const PixelSprite: React.FC<PixelSpriteProps> = ({ seed, name = "", className, size = 16 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const pixelScale = 8; // Scale up 16x16 to 128x128
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

    // 1. Determine Sprite Type based on Name
    let spriteKey = 'HUMANOID';
    const n = name;
    if (n.includes('スライム') || n.includes('霧') || n.includes('魂')) spriteKey = 'SLIME';
    else if (n.includes('狂信者')) spriteKey = 'CULTIST';
    else if (n.includes('選ばれし者')) spriteKey = 'CULTIST';
    else if (n.includes('骸骨') || n.includes('亡霊')) spriteKey = 'SKELETON';
    else if (n.includes('コウモリ') || n.includes('蜘蛛') || n.includes('キメラ') || n.includes('植物') || n.includes('マウ') || n.includes('虫')) spriteKey = 'BEAST';
    else if (n.includes('幽霊') || n.includes('精霊') || n.includes('ウィスプ')) spriteKey = 'GHOST';
    else if (n.includes('鎧') || n.includes('騎士') || n.includes('ガーゴイル') || n.includes('ガーディアン')) spriteKey = 'ARMOR';
    else if (n.includes('司祭') || n.includes('魔道士') || n.includes('メイジ')) spriteKey = 'WIZARD';
    else if (n.includes('ブロンズ') || n.includes('オートマトン') || n.includes('オーブ')) spriteKey = 'ROBOT';
    else if (n.includes('ボス') || n.includes('心臓') || n.includes('タイム') || n.includes('目覚め')) spriteKey = 'BOSS';
    
    const template = SPRITE_TEMPLATES[spriteKey] || SPRITE_TEMPLATES.HUMANOID;

    // 2. Determine Palette based on Seed (Enemy ID) or Name
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Palettes: [Main, Highlight, Outline]
    const palettes = [
      ['#2E7D32', '#66BB6A', '#1B5E20'], // Green (Goblin)
      ['#C62828', '#EF5350', '#B71C1C'], // Red (Demon)
      ['#1565C0', '#42A5F5', '#0D47A1'], // Blue (Slime)
      ['#424242', '#BDBDBD', '#212121'], // Grey (Skeleton/Armor)
      ['#6A1B9A', '#AB47BC', '#4A148C'], // Purple (Magic)
      ['#5D4037', '#8D6E63', '#3E2723'], // Brown (Beast)
      ['#00ACC1', '#26C6DA', '#006064'], // Cyan (Cultist)
    ];

    // Force specific colors for some types
    let palette = palettes[Math.abs(hash) % palettes.length];
    if (n.includes('スライム') && n.includes('酸')) palette = ['#7CB342', '#AED581', '#33691E']; // Lime
    if (n.includes('スライム')) palette = palettes[2]; // Blue
    if (n.includes('狂信者')) palette = palettes[6]; // Cyan
    if (n.includes('オーク') || n.includes('ゴブリン')) palette = palettes[0]; // Green
    if (n.includes('骸骨')) palette = palettes[3]; // Grey
    if (n.includes('血') || n.includes('強盗')) palette = palettes[1]; // Red
    if (n.includes('司祭') || n.includes('魔道士')) palette = palettes[4]; // Purple

    const mainColor = palette[0];
    const highlightColor = palette[1];
    const outlineColor = '#000000'; // Always black for contrast

    // 3. Render
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const char = template[y][x];
        if (char === '.') continue;
        
        let color = mainColor;
        if (char === '%') color = highlightColor;
        if (char === '@') color = outlineColor;
        
        drawPixel(x, y, color);
      }
    }
    
  }, [seed, name, size]);

  return <canvas ref={canvasRef} className={className} style={{ imageRendering: 'pixelated' }} />;
};

export default PixelSprite;
