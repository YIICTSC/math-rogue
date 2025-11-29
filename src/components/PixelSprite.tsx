
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
  FLIER: [
    "................",
    "................",
    "..#..........#..",
    "..##........##..",
    ".###........###.",
    ".###..####..###.",
    "..#############.",
    "..#%#%@%%@%#%#..",
    "...#%%%%%%%%#...",
    "...#%##%%##%#...",
    "....#%%%%%%#....",
    ".....#%%%%#.....",
    "......#..#......",
    "................",
    "................",
    "................"
  ],
  NOTEBOOK: [
    "................",
    ".....######.....",
    "....#%%%%%%#....",
    "....#%@%%%%#....",
    "....#%%%%%%#....",
    "....#%%%%%%#....",
    "....#%%%%%%#....",
    "....#@%%@%%#....",
    "....#%%%%%%#....",
    "....#%%%%%%#....",
    "....#%%%%%%#....",
    "....#%####%#....",
    "....#%#%%#%#....",
    ".....######.....",
    "................",
    "................"
  ],
  BACKPACK: [
    "................",
    "......####......",
    ".....#%%%%#.....",
    "....#%%%%%%#....",
    "....#%%%%%%#....",
    "...#%######%#...",
    "...#%%%%%%%%#...",
    "...#%@%%%%@%#...",
    "...#%%%%%%%%#...",
    "...#%%%%%%%%#...",
    "...#%######%#...",
    "...#%%%%%%%%#...",
    "....########....",
    "....##....##....",
    "................",
    "................"
  ],
  SHOE: [
    "................",
    "................",
    "................",
    "................",
    ".......####.....",
    ".....##%%%%#....",
    "....#%%%%%%%#...",
    "...#%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    ".#%%%%%%%%%%%%#.",
    ".#%%%%%%%%%%%%#.",
    ".##############.",
    "..############..",
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
    "..#%%####%#%#...",
    "..###########...",
    "....##....##....",
    "...####..####...",
    "..##..##.##..##.",
    "................"
  ],
  SPIDER: [
    "................",
    ".#............#.",
    ".#............#.",
    "..#...####...#..",
    "..#..#%%%%#..#..",
    "...##%@%%@%##...",
    ".....#%%%%#.....",
    "....#%%%%%%#....",
    "..##%%%%%%%%##..",
    ".#.#%%%%%%%%#.#.",
    "#..#%%%%%%%%#..#",
    "....########....",
    "....#......#....",
    "...#........#...",
    "................",
    "................"
  ],
  SNAKE: [
    "................",
    "................",
    ".......####.....",
    ".....##@%%@#....",
    "....#%%%%%#.....",
    "....#%%%%#......",
    ".....#%%%%#.....",
    "......#%%%%#....",
    ".....#%%%%#.....",
    "....#%%%%#......",
    "...#%%%%#.......",
    "..#%%%%#........",
    ".#%%%%#.........",
    ".####...........",
    "................",
    "................"
  ],
  PLANT: [
    "................",
    "......####......",
    "....##%%%%##....",
    "...#%%%%%%%%#...",
    "....#%%%%%%#....",
    ".....##%%##.....",
    ".......##.......",
    ".....######.....",
    "....#%####%#....",
    "...#%#....#%#...",
    ".......##.......",
    "......####......",
    ".....######.....",
    "....########....",
    "................",
    "................"
  ],
  EYE: [
    "................",
    "................",
    "................",
    "......####......",
    "....##%%%%##....",
    "...#%%%%%%%%#...",
    "..#%%%%%%%%%%#..",
    "..#%%%%##%%%%#..",
    "..#%%%#@#%%%%#..",
    "..#%%%%##%%%%#..",
    "..#%%%%%%%%%%#..",
    "...#%%%%%%%%#...",
    "....##%%%%##....",
    "......####......",
    ".......##.......",
    ".....##..##....."
  ],
  FLAME: [
    "................",
    ".......#........",
    "......#%#.......",
    ".....#%#%#......",
    "....#%#%#%#.....",
    "....#%#%#%#.....",
    "...#%#%#%#%#....",
    "...#%%%%%%%#....",
    "..#%%%%%%%%%#...",
    "..#%%%%%%%%%#...",
    "..#%%%%%%%%%#...",
    "...#%%%%%%%#....",
    "....#######.....",
    "................",
    "................",
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
    
    // School / Theme mapping
    if (n.includes('先生') || n.includes('用務員') || n.includes('上級生') || n.includes('不良') || n.includes('不審者')) spriteKey = 'HUMANOID';
    else if (n.includes('花子') || n.includes('亡霊') || n.includes('幽霊') || n.includes('魂')) spriteKey = 'GHOST';
    else if (n.includes('人体模型') || n.includes('ゴーレム') || n.includes('像') || n.includes('ロボ')) spriteKey = 'SKELETON';
    else if (n.includes('ミミック') || n.includes('スライム') || n.includes('塊') || n.includes('カス') || n.includes('ヘドロ')) spriteKey = 'SLIME';
    else if (n.includes('犬') || n.includes('ハムスター') || n.includes('ウサギ') || n.includes('ネズミ') || n.includes('獣')) spriteKey = 'BEAST';
    else if (n.includes('カラス') || n.includes('ハチ') || n.includes('コウモリ') || n.includes('鳥')) spriteKey = 'FLIER';
    else if (n.includes('鎧') || n.includes('三輪車') || n.includes('掃除') || n.includes('マシン')) spriteKey = 'ROBOT';
    else if (n.includes('ノート') || n.includes('宿題') || n.includes('辞書') || n.includes('本')) spriteKey = 'NOTEBOOK';
    else if (n.includes('ランドセル') || n.includes('バッグ')) spriteKey = 'BACKPACK';
    else if (n.includes('上履き') || n.includes('靴')) spriteKey = 'SHOE';
    else if (n.includes('校長') || n.includes('教頭') || n.includes('主') || n.includes('ボス') || n.includes('王')) spriteKey = 'BOSS';
    else if (n.includes('悪魔') || n.includes('狂信者') || n.includes('ピエロ')) spriteKey = 'CULTIST';
    else if (n.includes('司祭') || n.includes('妖精') || n.includes('魔道士')) spriteKey = 'WIZARD';
    else if (n.includes('蜘蛛') || n.includes('ムカデ') || n.includes('虫') || n.includes('甲虫')) spriteKey = 'SPIDER';
    else if (n.includes('蛇') || n.includes('ミミズ') || n.includes('ツチノコ')) spriteKey = 'SNAKE';
    else if (n.includes('花') || n.includes('草') || n.includes('キノコ') || n.includes('樹')) spriteKey = 'PLANT';
    else if (n.includes('目玉') || n.includes('監視') || n.includes('ドローン')) spriteKey = 'EYE';
    else if (n.includes('火の玉') || n.includes('エレメント') || n.includes('精霊')) spriteKey = 'FLAME';
    else spriteKey = 'HUMANOID';
    
    const template = SPRITE_TEMPLATES[spriteKey] || SPRITE_TEMPLATES.HUMANOID;

    // 2. Determine Palette based on Seed (Enemy ID) or Name
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Palettes: [Main, Highlight, Outline]
    const palettes = [
      ['#2E7D32', '#66BB6A', '#1B5E20'], // Green
      ['#C62828', '#EF5350', '#B71C1C'], // Red
      ['#1565C0', '#42A5F5', '#0D47A1'], // Blue
      ['#424242', '#BDBDBD', '#212121'], // Grey
      ['#6A1B9A', '#AB47BC', '#4A148C'], // Purple
      ['#5D4037', '#8D6E63', '#3E2723'], // Brown
      ['#00ACC1', '#26C6DA', '#006064'], // Cyan
      ['#F57F17', '#FBC02D', '#F57F17'], // Yellow/Orange
      ['#43A047', '#A5D6A7', '#1B5E20'], // Light Green
      ['#D81B60', '#F48FB1', '#880E4F'], // Pink
    ];

    // Force specific colors for some types
    let palette = palettes[Math.abs(hash) % palettes.length];
    
    if (n.includes('先生') || n.includes('悪魔') || n.includes('怒') || n.includes('ランドセル') || n.includes('炎')) palette = palettes[1]; // Red
    if (n.includes('スライム') || n.includes('水') || n.includes('三輪車') || n.includes('氷')) palette = palettes[2]; // Blue
    if (n.includes('カス') || n.includes('骸骨') || n.includes('模型') || n.includes('ゴーレム') || n.includes('石')) palette = palettes[3]; // Grey
    if (n.includes('花子') || n.includes('幽霊') || n.includes('毒') || n.includes('紫')) palette = palettes[4]; // Purple
    if (n.includes('犬') || n.includes('ハムスター') || n.includes('机') || n.includes('木')) palette = palettes[5]; // Brown
    if (n.includes('カラス') || n.includes('墨') || n.includes('影')) palette = ['#212121', '#424242', '#000000']; // Black
    if (n.includes('チョーク') || n.includes('ノート') || n.includes('上履き') || n.includes('雪')) palette = ['#EEEEEE', '#FFFFFF', '#BDBDBD']; // White
    if (n.includes('虫') || n.includes('草') || n.includes('森')) palette = palettes[0]; // Green
    if (n.includes('電気') || n.includes('光') || n.includes('金')) palette = palettes[7]; // Yellow

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
