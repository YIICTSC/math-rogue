
import React, { useRef, useEffect } from 'react';

interface PixelSpriteProps {
  seed: string; // Used for color variation or fallback ID
  name?: string; // Used to determine sprite type. If format is "Shape|Color", splits them.
  className?: string;
  size?: number; // Internal grid size (fixed to 16 for this style)
}

// 16x16 Sprite Templates
// . = Empty, # = Main Color, % = Secondary/Highlight, @ = Outline/Black
const SPRITE_TEMPLATES: Record<string, string[]> = {
  // --- EXISTING TEMPLATES ---
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
  // NEW: Pompadour Hairstyle for "Senior/Delinquent"
  SENIOR: [
    "....######......",
    "...########.....",
    ".....#%%%%#.....",
    "....#%@%%@%#....",
    ".....#%%%%#.....",
    "......####......",
    ".....##..##.....",
    "....#%####%#....",
    "...#%######%#...",
    "...#%##..##%#...",
    "...####..####...",
    "...##......##...",
    "..##........##..",
    "..##........##..",
    ".##..........##.",
    "................"
  ],
  // NEW: Long Hair for "Hanako/Girl"
  GIRL: [
    ".....######.....",
    "....########....",
    "...##%@%%@%##...",
    "...##%%%%%%##...",
    "...###%%%%###...",
    "..####%%%%####..",
    "..#..######..#..",
    ".....#%##%#.....",
    "....#%####%#....",
    "....#%####%#....",
    "....########....",
    ".....##..##.....",
    ".....##..##.....",
    "....##....##....",
    "................",
    "................"
  ],
  // NEW: Holding a Stick/Book for "Teacher"
  TEACHER: [
    "................",
    "......####......",
    ".....#%%%%#.....",
    "....#%@%@%%#....",
    ".....#%%%%#.....",
    "......####......",
    ".....##..##.....",
    "....#%####%#....",
    "....#%####%#....",
    "...#%#####%#....",
    "...##########...",
    "..##.##..##.....",
    ".....##..##.....",
    ".....##..##.....",
    "....##....##....",
    "...##..........."],
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
  ],
  SWORD: [
    "................",
    "......#.........",
    ".....#%#........",
    ".....#%#........",
    "....#%#.........",
    "....#%#.........",
    "...#%#..........",
    "...#%#..........",
    "..#%#...........",
    ".#####..........",
    "#%###%#.........",
    ".#####..........",
    "...#%#..........",
    "....#...........",
    "................",
    "................"
  ],
  SHIELD: [
    "................",
    "................",
    "....########....",
    "...#%%%%%%%%#...",
    "..#%%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    "..#%%%%%%%%%%#..",
    "...#%%%%%%%%#...",
    "...#%%%%%%%%#...",
    "....#%%%%%%#....",
    ".....#%%%%#.....",
    "......#%#.......",
    ".......#........",
    "................"
  ],
  POTION: [
    "................",
    ".......###......",
    ".......#%#......",
    ".......#%#......",
    "......#%#%#.....",
    ".....#%%%%%#....",
    ".....#%%%%%#....",
    "....#%%%%%%%#...",
    "....#%%%%%%%#...",
    "....#%%%%%%%#...",
    "....#%%%%%%%#...",
    ".....#%%%%%#....",
    "......#####.....",
    "................",
    "................",
    "................"
  ],
  BAT: [
    "................",
    "................",
    "................",
    "................",
    "..#..........#..",
    ".#%#........#%#.",
    ".#%#...##...#%#.",
    ".#%#..#%#%..#%#.",
    "..#%##%%%%##%#..",
    "...#%%%%%%%%#...",
    "....#%%%%%%#....",
    ".....#%##%#.....",
    "......#..#......",
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

    // --- LOGIC UPDATE: Handle Composite Names (Shape|Color) ---
    // If name contains '|', it splits: Part 1 = Shape Template, Part 2 = Color Seed Source
    const nameParts = name.split('|');
    const shapeKeySource = nameParts[0]; // "SNAKE", "先生", etc.
    const colorKeySource = nameParts.length > 1 ? nameParts[1] : (seed || name); // If split, use part 2, else use seed/name

    // 1. Determine Sprite Type based on Shape Source
    let spriteKey = 'HUMANOID';
    const n = shapeKeySource;
    
    // School / Theme mapping
    if (n.includes('上級生') || n.includes('不良') || n.includes('不審者') || n.includes('番長')) spriteKey = 'SENIOR';
    else if (n.includes('花子') || n.includes('少女') || n.includes('マネージャー')) spriteKey = 'GIRL';
    else if (n.includes('先生') || n.includes('教頭') || n.includes('校長') || n.includes('顧問') || n.includes('医者')) spriteKey = 'TEACHER';
    else if (n.includes('用務員') || n.includes('PTA') || n.includes('大人')) spriteKey = 'HUMANOID'; // Default humanoid
    else if (n.includes('亡霊') || n.includes('幽霊') || n.includes('魂') || n.includes('影')) spriteKey = 'GHOST';
    else if (n.includes('人体模型') || n.includes('ゴーレム') || n.includes('像') || n.includes('ロボ')) spriteKey = 'SKELETON';
    else if (n.includes('ミミック') || n.includes('スライム') || n.includes('塊') || n.includes('カス') || n.includes('ヘドロ')) spriteKey = 'SLIME';
    else if (n.includes('犬') || n.includes('ハムスター') || n.includes('ウサギ') || n.includes('ネズミ') || n.includes('獣')) spriteKey = 'BEAST';
    else if (n.includes('カラス') || n.includes('ハチ') || n.includes('鳥')) spriteKey = 'FLIER';
    else if (n.includes('コウモリ')) spriteKey = 'BAT';
    else if (n.includes('鎧') || n.includes('三輪車') || n.includes('掃除') || n.includes('マシン')) spriteKey = 'ROBOT';
    else if (n.includes('ノート') || n.includes('宿題') || n.includes('辞書') || n.includes('本')) spriteKey = 'NOTEBOOK';
    else if (n.includes('ランドセル') || n.includes('バッグ')) spriteKey = 'BACKPACK';
    else if (n.includes('上履き') || n.includes('靴')) spriteKey = 'SHOE';
    else if (n.includes('ボス') || n.includes('王') || n.includes('古龍')) spriteKey = 'BOSS';
    else if (n.includes('悪魔') || n.includes('狂信者') || n.includes('ピエロ')) spriteKey = 'CULTIST';
    else if (n.includes('司祭') || n.includes('妖精') || n.includes('魔道士')) spriteKey = 'WIZARD';
    else if (n.includes('蜘蛛') || n.includes('ムカデ') || n.includes('虫') || n.includes('甲虫')) spriteKey = 'SPIDER';
    else if (n.includes('蛇') || n.includes('ミミズ') || n.includes('ツチノコ')) spriteKey = 'SNAKE';
    else if (n.includes('花') || n.includes('草') || n.includes('キノコ') || n.includes('樹')) spriteKey = 'PLANT';
    else if (n.includes('目玉') || n.includes('監視') || n.includes('ドローン')) spriteKey = 'EYE';
    else if (n.includes('火の玉') || n.includes('エレメント') || n.includes('精霊')) spriteKey = 'FLAME';
    else if (n.includes('盾') || n.includes('守り')) spriteKey = 'SHIELD';
    else if (n.includes('剣') || n.includes('刃') || n.includes('ナイフ') || n.includes('包丁')) spriteKey = 'SWORD';
    else if (n.includes('薬') || n.includes('瓶')) spriteKey = 'POTION';
    
    // Fallback if specific sprite key was passed directly (e.g. from synthesis result)
    if (SPRITE_TEMPLATES[shapeKeySource]) spriteKey = shapeKeySource;

    const template = SPRITE_TEMPLATES[spriteKey] || SPRITE_TEMPLATES.HUMANOID;

    // 2. Determine Palette based on Color Source
    let hash = 0;
    for (let i = 0; i < colorKeySource.length; i++) {
      hash = colorKeySource.charCodeAt(i) + ((hash << 5) - hash);
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

    // Force specific colors for some types (Only if not synthesized)
    let palette = palettes[Math.abs(hash) % palettes.length];
    
    // Only apply theme colors if we are NOT using a composite key (which implies specific color override)
    if (nameParts.length === 1) {
        const c = colorKeySource;
        if (c.includes('先生') || c.includes('悪魔') || c.includes('怒') || c.includes('ランドセル') || c.includes('炎') || c.includes('リンゴ')) palette = palettes[1]; // Red
        else if (c.includes('スライム') || c.includes('水') || c.includes('三輪車') || c.includes('氷')) palette = palettes[2]; // Blue
        else if (c.includes('カス') || c.includes('骸骨') || c.includes('模型') || c.includes('ゴーレム') || c.includes('石')) palette = palettes[3]; // Grey
        else if (c.includes('花子') || c.includes('幽霊') || c.includes('毒') || c.includes('紫')) palette = palettes[4]; // Purple
        else if (c.includes('犬') || c.includes('ハムスター') || c.includes('机') || c.includes('木')) palette = palettes[5]; // Brown
        else if (c.includes('カラス') || c.includes('墨') || c.includes('影') || c.includes('上級生') || c.includes('不良')) palette = ['#212121', '#424242', '#000000']; // Black
        else if (c.includes('チョーク') || c.includes('ノート') || c.includes('上履き') || c.includes('雪')) palette = ['#EEEEEE', '#FFFFFF', '#BDBDBD']; // White
        else if (c.includes('虫') || c.includes('草') || c.includes('森')) palette = palettes[0]; // Green
        else if (c.includes('電気') || c.includes('光') || c.includes('金')) palette = palettes[7]; // Yellow
    }

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
