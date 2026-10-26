import { freshWild, normalizeWild, RECIPES, forageNodes, campPosition, towerPosition, type WildSave, type Inventory } from './wild';
import { puzzleRecords, type PuzzleSnapshot } from './puzzleSave';
import { circuitChamber, circuitTargets, toggle, solveCircuit, type Circuit } from './circuitPuzzles';
import { iceChamber, slideIce, solveIce, type Ice } from './icePuzzles';
import { KEY_ROUTES, routeReady } from './campaign';
import { beamChamber, traceBeam, solveBeam, type Beam } from './beamPuzzles';
import { blockChamber, blocksSolved, type BlockState } from './blockPuzzles';
import { CHAPTERS, SAVE_KEY } from './content';
import { enemyKind, heroId, type HeroId } from './visuals';
import { stepEnemy } from './enemyAI';
import { shapeField } from './geography';
import { roundedSolid } from './rounding';
import { WALK_SPEED, COMBO_GRACE, weaponAction } from './combat';
import {skyMap, WIND_LAUNCH, SKY_RETURN, SKY_CHEST, SKY_UPDRAFTS} from './sky';
export const W = 20, H = 14;
export type Save = WildSave & {
    version: 1;
    puzzles: Record<string, PuzzleSnapshot>;
    unlockedTools: number;
    maxChapter: number;
    beacons: number[];
    chapter: number;
    room: number;
    hp: number;
    maxHp: number;
    coins: number;
    tool: number;
    weaponA: number;
    realm: 'surface' | 'sky';
    glideAwakened: boolean;
    skyTreasures: number[];
    cleared: string[];
    solved: string[];
    chests: string[];
    visited: string[];
    quests: string[];
    choices: (number | null)[];
    seconds: number;
    ending: boolean;
    gate: string | null;
    hero: HeroId;
};
export type Enemy = {
    x: number;
    y: number;
    hp: number;
    max: number;
    kind: number;
    cool: number;
    phase: number;
    boss?: boolean;
    exposed?: number;
    summoned?: boolean;
    facing?: number;
    moving?: boolean;
    windup?: number;
    strike?: number;
    aim?: number;
    flash?: number;
};
export type Shot = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    friendly: boolean;
    kind?: number;
    damage?: number;
};
export const fresh = (): Save => ({ ...freshWild(), version: 1, hero: 'nagi', weaponA: 0, realm: 'surface', glideAwakened: false, skyTreasures: [], puzzles: {}, unlockedTools: 0, maxChapter: 0, beacons: [], chapter: 0, room: 0, hp: 6, maxHp: 6, coins: 0, tool: 0, cleared: [], solved: [], chests: [], visited: [], quests: [], choices: [], seconds: 0, ending: false, gate: null });
export const key = (s: Save) => `${s.chapter}:${s.realm==='sky'?'sky':s.room}`;
export function load(): Save { try {
    const x = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!x || x.version !== 1)
        return fresh();
    const n = fresh();
    for (const k of ['cleared', 'solved', 'chests', 'visited', 'quests', 'choices'] as const)
        if (!Array.isArray(x[k]))
            return n;
    for (const k of ['cleared', 'solved', 'chests', 'visited', 'quests'])
        x[k] = [...new Set(x[k].filter((v: unknown) => typeof v === 'string'))];
    x.puzzles = puzzleRecords(x.puzzles);
    x.ending = x.ending === true;
    x.gate = typeof x.gate === 'string' ? x.gate : null;
    x.maxChapter = Math.max(0, Math.min(11, Number(x.maxChapter ?? x.chapter) || 0));
    x.choices = Array.from({ length: 12 }, (_, i) => x.choices[i] === 0 || x.choices[i] === 1 ? x.choices[i] : null);
    x.beacons = Array.isArray(x.beacons) ? [...new Set(x.beacons.filter((v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 12))] : Array.from({ length: x.maxChapter }, (_, i) => i);
    x.unlockedTools = Math.max(0, Math.min(7, Number(x.unlockedTools ?? x.maxChapter) || 0));
    x.coins = Math.max(0, Math.min(999999, Math.floor(Number(x.coins) || 0)));
    const wild = normalizeWild(x);
    x.hero = heroId(x.hero);
    x.realm = x.realm==='sky' && x.beacons.includes(0) ? 'sky' : 'surface';
    if(x.realm!=='sky'&&typeof x.gate==='string'&&x.gate.endsWith(':sky'))x.gate=null;
    x.glideAwakened = typeof x.glideAwakened==='boolean' ? x.glideAwakened : x.beacons.includes(0);
    x.skyTreasures = Array.isArray(x.skyTreasures) ? [...new Set(x.skyTreasures.filter((v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<12))] : [];
    x.weaponA = Number.isInteger(x.weaponA) && wild.ownedTools.includes(x.weaponA) ? x.weaponA : 0;
    return { ...n, ...x, ...wild, chapter: Math.max(0, Math.min(11, Math.floor(Number(x.chapter) || 0))), room: Math.max(0, Math.min(23, Math.floor(Number(x.room) || 0))), maxHp: Math.max(6, Math.min(30, Number(x.maxHp) || 6)), hp: Math.max(1, Math.min(30, Number(x.hp) || 6)), tool: wild.ownedTools.includes(Number(x.tool)) ? Number(x.tool) : 0, seconds: Math.max(0, Number(x.seconds) || 0) };
}
catch {
    return fresh();
} }
export function persist(s: Save) { try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
}
catch {
    return false;
} }
export function roomMap(chapter: number, room: number) { const map: number[][] = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => x === 0 || y === 0 || x === W - 1 || y === H - 1 ? 3 : room < 8 ? 0 : 5)); for (let y = 3; y < 11; y++)
    for (let x = 4; x < 16; x++) {
        if (y === 7 || x === 10 || x === 5 || y === 5 || y === 9)
            continue;
        const pattern = (x * 17 + y * 13 + room * 7 + chapter * 11) % 23;
        if (pattern < 3)
            map[y][x] = 3;
        else if (pattern === 4)
            map[y][x] = room % 3 === 0 ? 2 : 6;
    } shapeField(chapter, room, map); map[7][0] = room % 6 === 0 ? 3 : room < 8 ? 1 : 5; map[7][19] = room % 6 === 5 && room !== 23 ? 3 : room < 8 ? 1 : 5; map[0][10] = room >= 6 ? 5 : 3; map[13][10] = room < 18 ? 5 : 3; map[1][10] = map[12][10] = 5; map[6][8] = map[6][12] = map[6][10] = map[7][10] = 5; map[7][2] = map[7][17] = 5; return map; }
export class World {
    moving = false;
    walk = 0;
    combo = 0;
    comboWindow = 0;
    comboWeapon = -1;
    queuedSlot: boolean | null = null;
    attackDuration = .3;
    activeWeapon = 0;
    attackSerial = 0;
    strikePending = false;
    fx: { x: number; y: number; life: number; max: number; color: string; seed: number }[] = [];
    s: Save;
    x = 2.5;
    y = 7.5;
    dx = 1;
    dy = 0;
    attack = 0;
    hurt = 0;
    dash = 0;
    stamina = 1;
    gliding = false;
    safe = { x: 2.5, y: 7.5 };
    fires: {
        x: number;
        y: number;
        life: number;
    }[] = [];
    enemies: Enemy[] = [];
    shots: Shot[] = [];
    blocks: BlockState | null = null;
    beam: Beam | null = null;
    circuit: Circuit | null = null;
    ice: Ice | null = null;
    pushCooldown = 0;
    hintTarget: {
        x: number;
        y: number;
    } | null = null;
    map: number[][] = [];
    switches: number[] = [];
    notice = '';
    travel = 0;
    effect = 0;
    kills = 0;
    dirty = false;
    time = 0;
    constructor(s: Save) { this.s = s; this.s.hero = 'nagi'; this.s.weaponA ??= 0; this.s.realm ??= 'surface'; this.s.skyTreasures ??= []; this.enter(); }
    enter() { if(this.inSky){this.enterSky();return;} this.queuedSlot = null; this.comboWindow = 0; this.comboWeapon = -1; this.combo = 0; this.strikePending = false; this.notice = ''; this.moving = false; this.walk = 0; this.fx = []; this.gliding = false; this.fires = []; this.safe = { x: this.x, y: this.y }; this.hintTarget = null; this.map = roomMap(this.s.chapter, this.s.room); this.circuit = [8, 12, 14].includes(this.s.room) && !this.s.solved.includes(key(this.s)) ? circuitChamber(this.s.chapter * 7 + this.s.room) : null; this.ice = this.s.room === 19 && !this.s.solved.includes(key(this.s)) ? iceChamber(this.s.chapter) : null; if (this.circuit) {
        for (let y = 3; y <= 10; y++)
            for (let x = 3; x <= 16; x++)
                this.map[y][x] = 5;
    } if (this.ice) {
        for (let y = 2; y <= 10; y++)
            for (let x = 6; x <= 14; x++)
                this.map[y][x] = this.ice.walls.has(`${x - 6},${y - 2}`) ? 3 : 5;
        for (let y = 4; y <= 9; y++)
            this.map[y][4] = 5;
    } this.beam = [11, 15, 18, 22].includes(this.s.room) && !this.s.solved.includes(key(this.s)) ? beamChamber(this.s.chapter + this.s.room) : null; if (this.beam) {
        for (let y = 3; y <= 10; y++)
            for (let x = 3; x <= 16; x++)
                this.map[y][x] = 5;
    } this.blocks = this.s.room >= 8 && [9, 13, 16, 20].includes(this.s.room) && !this.s.solved.includes(key(this.s)) ? blockChamber(this.s.chapter + this.s.room) : null; if (this.blocks) {
        for (let y = 3; y <= 9; y++)
            for (let x = 7; x <= 13; x++)
                this.map[y][x] = 5;
        for (const p of this.blocks.walls)
            this.map[p.y][p.x] = 3;
    } if (this.s.room < 8) {
        for (const p of [...forageNodes, campPosition, towerPosition])
            this.map[Math.floor(p.y)][Math.floor(p.x)] = 0;
    } for (const [k, v] of Object.entries(this.s.changes)) {
        const prefix = key(this.s) + ':';
        if (k.startsWith(prefix)) {
            const [x, y] = k.slice(prefix.length).split(',').map(Number);
            if (x > 0 && x < W - 1 && y > 0 && y < H - 1)
                this.map[y][x] = v;
        }
    } if(this.s.room===0){for(let y=3;y<=5;y++)for(let x=14;x<=16;x++)this.map[y][x]=0;} this.shots = []; this.switches = []; this.attack = 0; this.travel = .5; this.enemies = []; if (!this.s.visited.includes(key(this.s)))
        this.s.visited.push(key(this.s)); if (!this.s.cleared.includes(key(this.s)) && this.s.room > 0) {
        const boss = this.s.room === 23;
        for (let i = 0; i < (boss ? 1 : 2 + this.s.room % 3); i++)
            this.enemies.push({ x: boss ? 10.5 : [16.5, 15.5, 5.5, 3.5][i], y: boss ? 4.5 : [7.5, 11.5, 11.5, 9.5][i], hp: boss ? 24 + this.s.chapter * 6 : 3 + Math.floor(this.s.chapter / 2), max: boss ? 24 + this.s.chapter * 6 : 3 + Math.floor(this.s.chapter / 2), boss, kind: enemyKind(this.s.chapter, this.s.room, i), cool: i * .5 + 1, phase: 0 });
    } this.restorePuzzle(); this.dirty = true; }
    get inSky(){return this.s.realm==='sky';}
    get gliderUnlocked(){return this.s.beacons.includes(0);}
    get atLaunch(){return !this.inSky&&this.s.room===0&&Math.hypot(this.x-WIND_LAUNCH.x,this.y-WIND_LAUNCH.y)<1.3;}
    get atSkyReturn(){return this.inSky&&Math.hypot(this.x-SKY_RETURN.x,this.y-SKY_RETURN.y)<1.2;}
    get atSkyChest(){return this.inSky&&Math.hypot(this.x-SKY_CHEST.x,this.y-SKY_CHEST.y)<1.4;}
    enterSky(){
        this.s.room=0;this.cancelCombo();this.attack=0;this.strikePending=false;this.dash=0;
        this.map=skyMap(this.s.chapter);this.blocks=null;this.beam=null;this.circuit=null;this.ice=null;
        this.shots=[];this.fires=[];this.fx=[];this.switches=[];this.walk=0;this.moving=false;this.notice='sky';this.travel=.5;
        this.x=SKY_RETURN.x;this.y=SKY_RETURN.y;this.safe={x:this.x,y:this.y};this.gliding=false;
        this.stamina=this.s.staminaMax;this.hurt=0;
        this.enemies=this.s.cleared.includes(key(this.s))?[]:[{x:17.5,y:5.8,hp:6+this.s.chapter,max:6+this.s.chapter,kind:[2,5,9,19][this.s.chapter%4],cool:2,phase:0}];
        if(!this.s.visited.includes(key(this.s)))this.s.visited.push(key(this.s));this.dirty=true;
    }
    launchSky(){
        if(!this.atLaunch||this.s.gate)return false;
        if(!this.gliderUnlocked){this.notice='glidelocked';return false;}
        this.s.realm='sky';this.enter();this.gliding=true;return true;
    }
    leaveSky(){
        if(!this.inSky||this.s.gate)return false;
        this.s.realm='surface';this.s.room=0;this.x=WIND_LAUNCH.x;this.y=WIND_LAUNCH.y;this.enter();return true;
    }
    openSkyChest(){
        if(!this.atSkyChest||this.s.gate||this.s.skyTreasures.includes(this.s.chapter))return false;
        if(this.enemies.length){this.notice='enemies';return false;}
        this.s.gate=key(this.s);this.notice='skytreasure';this.dirty=true;return true;
    }
    blocked(x: number, y: number, gliding=false) { const code=this.map[Math.floor(y)]?.[Math.floor(x)]??3; return (gliding?[3]:[2,3,7]).includes(code) && (this.s.room>=8||code===7||roundedSolid(this.map,x,y,code)); }
    can(x: number, y: number) { return !this.blocks?.boxes.some(b => Math.floor(x) === b.x && Math.floor(y) === b.y) && x > .3 && y > .3 && x < W - .3 && y < H - .3 && !this.blocked(x,y,this.gliding); }
    enemyCan(x: number, y: number) { return x > .5 && y > .5 && x < W - .5 && y < H - .5 && !this.blocked(x,y) && !this.blocks?.boxes.some(b => Math.floor(x) === b.x && Math.floor(y) === b.y); }
    burst(x: number, y: number, color = '#ffe6a0') { this.fx.push({ x, y, color, life: .4, max: .4, seed: this.fx.length % 7 }); if (this.fx.length > 32) this.fx.shift(); }
    move(dx: number, dy: number, dt: number) { if (this.dash > 0) {
        dx = this.dx;
        dy = this.dy;
    } if (!dx && !dy)
        return; const d = Math.hypot(dx, dy), fx = dx / d, fy = dy / d; dx /= Math.max(1, d); dy /= Math.max(1, d); if (this.dash <= 0 && this.attack <= 0) {
        this.dx = fx;
        this.dy = fy;
    } const v = (this.dash > 0 ? 10 : this.gliding ? (this.weather === 'wind' ? 5.2 : 4.2) : WALK_SPEED * (this.attack > 0 ? .55 : 1)) * dt; for (const [ax, ay] of [[dx * v, 0], [0, dy * v]]) {
        const nx = this.x + ax + Math.sign(ax) * .22, ny = this.y + ay + Math.sign(ay) * .22;
        if (this.blocks && this.pushCooldown <= 0) {
            const box = this.blocks.boxes.find(b => b.x === Math.floor(nx) && b.y === Math.floor(ny));
            if (box && this.can(box.x + .5 + Math.sign(ax), box.y + .5 + Math.sign(ay))) {
                box.x += Math.sign(ax);
                box.y += Math.sign(ay);
                this.pushCooldown = .22;
                if (blocksSolved(this.blocks)) {
                    this.markSolved();
                    this.notice = 'solved';
                    this.dirty = true;
                }
            }
        }
        if (this.can(nx, ny)) {
            this.x += ax;
            this.y += ay;
        }
    } this.rememberPuzzle(); if (this.travel <= 0) {
        if (this.x > 18.55)
            this.exit(1);
        if (this.x < 1.1)
            this.exit(-1);
        if (this.y < 1.1)
            this.exit(-6);
        if (this.y > 12.55)
            this.exit(6);
    } }
    exit(dir: number) {
        if(this.inSky){this.x=Math.min(18.4,Math.max(1.2,this.x));this.y=Math.min(12.4,Math.max(1.2,this.y));return;}
        const room = this.s.room, next = room + dir;
        if ((dir === 1 && room % 6 === 5 && room !== 23) || (dir === -1 && room % 6 === 0) || next < 0 || next > 23 && room !== 23) {
            this.x = Math.min(18.4, Math.max(1.2, this.x));
            this.y = Math.min(12.4, Math.max(1.2, this.y));
            return;
        }
        const advancing = !this.s.visited.includes(`${this.s.chapter}:${next}`);
        const hold = () => { this.x = Math.min(18.4, Math.max(1.2, this.x)); this.y = Math.min(12.4, Math.max(1.2, this.y)); };
        if (next === 23 && (!this.s.ownedTools.includes(Math.min(7, this.s.chapter)) || ![17, 19, 21].every(r => this.s.chests.includes(`${this.s.chapter}:${r}`)))) {
            this.notice = 'keys';
            hold();
            return;
        }
        if (room === 23 && dir === 1) {
            if (this.enemies.length) {
                this.notice = 'enemies';
                hold();
                return;
            }
            this.s.gate = key(this.s);
            this.notice = 'beacon';
            hold();
            this.dirty = true;
            return;
        }
        if (advancing && !this.enemies.length && room % 4 === 3 && !this.s.solved.includes('study:' + key(this.s))) {
            this.s.gate = key(this.s);
            hold();
            this.dirty = true;
            return;
        }
        if (next < 0 || next > 23)
            return;
        this.s.room = next;
        if (Math.abs(dir) === 6) {
            this.y = dir > 0 ? 1.8 : 12.2;
            this.x = 10.5;
        }
        else {
            this.x = dir > 0 ? 1.8 : 18.2;
            this.y = 7.5;
        }
        this.enter();
    }
    get npc() { return !this.inSky && [0, 4, 12, 20].includes(this.s.room) ? this.s.room >= 8 ? { x: 3.5, y: 2.5 } : { x: 8.2, y: 4.5 } : null; }
    get canTalk() { return Boolean(this.npc && !this.enemies.length && Math.hypot(this.x - this.npc.x, this.y - this.npc.y) < 1.6); }
    get targets() { if(this.inSky)return [];return this.s.room % 4 === 0 ? [[8.5, 6.5], [12.5, 6.5], [10.5, 6.5]] : this.s.room % 4 === 1 ? [[8.5, 6.5], [12.5, 6.5]] : [[10.5, 6.5]]; }
    get weather() { if(this.inSky)return 'wind' as const;return ['clear', 'wind', 'rain'][Math.floor(this.s.seconds / 90 + this.s.chapter) % 3] as 'clear' | 'wind' | 'rain'; }
    get atHarbor() { return !this.inSky && this.s.room === 0 && Math.hypot(this.x - 2.5, this.y - 10.5) < 2; }
    get atCamp() { return !this.inSky && [0, 4].includes(this.s.room) && !this.enemies.length && Math.hypot(this.x - campPosition.x, this.y - campPosition.y) < 2.5 && (this.weather !== 'rain' || this.s.room === 0); }
    get barrel() { return !this.inSky && this.s.room < 8 && this.s.room % 2 === 1 && !this.s.exploded.includes(key(this.s)) ? { x: 12.5, y: 7.5 } : null; }
    get endingKind() { return this.s.beacons.length === 12 && this.s.quests.length >= 18 && this.s.choices.filter(Boolean).length >= 6 ? 'community' : 'restore'; }
    toggleGlide() { if (this.gliding) {
        this.land();
        return true;
    } if(!this.gliderUnlocked){this.notice='glidelocked';return false;} if(this.s.gate)return false; if (this.stamina < .15)
        return false; this.gliding = true; return true; }
    land() { this.gliding = false; const tile = this.map[Math.floor(this.y)]?.[Math.floor(this.x)]; if (tile === 2 || tile === 7) {
        this.x = this.safe.x;
        this.y = this.safe.y;
        this.notice = 'landed';
    } }
    alter(x: number, y: number, tile: number) { if (this.inSky || this.s.room >= 8 || x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1)
        return false; this.map[y][x] = tile; this.s.changes[key(this.s) + ':' + x + ',' + y] = tile; this.dirty = true; return true; }
    detonate() { const b = this.barrel; if (!b)
        return; this.s.exploded.push(key(this.s)); for (const e of this.enemies)
        if (Math.hypot(e.x - b.x, e.y - b.y) < 3)
            e.hp -= 8; if (Math.hypot(this.x - b.x, this.y - b.y) < 1.7 && this.hurt <= 0)
        this.hit(); for (let y = Math.floor(b.y) - 1; y <= Math.floor(b.y) + 1; y++)
        for (let x = Math.floor(b.x) - 1; x <= Math.floor(b.x) + 1; x++)
            if (this.map[y]?.[x] === 3)
                this.alter(x, y, 5); this.fires.push({ ...b, life: 3 }); this.dirty = true; this.clean(); }
    cook(id: string) { const r = RECIPES.find(r => r.id === id); if (!r || !this.atCamp)
        return false; for (const [k, n] of Object.entries(r.cost))
        if (this.s.inventory[k as keyof Inventory] < n)
            return false; for (const [k, n] of Object.entries(r.cost))
        this.s.inventory[k as keyof Inventory] -= n; this.s.inventory[r.output]++; this.notice = 'cooked'; this.dirty = true; return true; }
    eat(kind: 'meal' | 'tonic') { if (this.s.inventory[kind] < 1 || kind === 'meal' && this.s.hp >= this.s.maxHp || kind === 'tonic' && this.stamina >= this.s.staminaMax && this.s.hp >= this.s.maxHp)
        return false; this.s.inventory[kind]--; if (kind === 'meal')
        this.s.hp = Math.min(this.s.maxHp, this.s.hp + 6);
    else {
        this.stamina = this.s.staminaMax;
        this.s.hp = Math.min(this.s.maxHp, this.s.hp + 1);
    } this.dirty = true; return true; }
    improve(kind: 'heart' | 'stamina' | 'weapon') { if (!this.atCamp)
        return false; if (kind === 'weapon') {
        if (this.s.inventory.ore < 5 || this.s.weaponRank >= 3)
            return false;
        this.s.inventory.ore -= 5;
        this.s.weaponRank++;
    }
    else {
        if (this.s.spirit < 4 || kind === 'heart' && this.s.maxHp >= 30 || kind === 'stamina' && this.s.staminaMax >= 2.5)
            return false;
        this.s.spirit -= 4;
        if (kind === 'heart') {
            this.s.maxHp++;
            this.s.hp = this.s.maxHp;
        }
        else {
            this.s.staminaMax = Math.min(2.5, this.s.staminaMax + .25);
            this.stamina = this.s.staminaMax;
        }
    } this.dirty = true; return true; }
    canTravel(chapter: number) { return Number.isInteger(chapter) && chapter >= 0 && chapter < 12 && !this.s.gate && (chapter === 0 || this.s.beacons.includes(0)) && (chapter === 0 || this.s.room === 0 || this.s.charts.includes(chapter)); }
    guarded(e: Enemy) { return Boolean(e.boss && (this.s.chapter % 4 === 0 ? e.phase % 4 < 2 : this.s.chapter % 4 === 1 ? (e.exposed || 0) <= 0 : this.s.chapter % 4 === 3 ? e.phase % 5 < 1.5 : false)); }
    equip(slot: 'a' | 'b', weapon: number) {
        if (!Number.isInteger(weapon) || !this.s.ownedTools.includes(weapon) || weapon < 0 || weapon > 7) return false;
        if (slot === 'a') this.s.weaponA = weapon; else this.s.tool = weapon;
        this.queuedSlot = null; this.comboWindow = 0; this.comboWeapon = -1;
        this.dirty = true;
        return true;
    }
    swing(tool = false, continuation = false) {
        const weapon = tool ? this.s.tool : this.s.weaponA;
        if (this.s.gate || this.dash > 0 || !this.s.ownedTools.includes(weapon) || weapon === 6 && this.stamina < .3) return false;
        if (this.attack > 0) { this.queuedSlot = tool; return false; }
        this.combo = this.comboWeapon === weapon && this.comboWindow > 0 ? (this.combo + 1) % 3 : 0;
        this.comboWeapon = weapon; this.comboWindow = 0;
        this.activeWeapon = weapon;
        this.attackDuration = weaponAction(weapon).durations[this.combo];
        this.attack = this.attackDuration;
        this.effect = weapon + 1;
        this.strikePending = true;
        this.attackSerial++;
        if (weapon === 6) { this.hurt = Math.max(this.hurt, this.attackDuration + .15); this.stamina -= .3; }
        // Queued follow-ups cannot toggle a mirror or plate a second time.
        if (continuation) return true;
        if (this.beam) {
            const m = this.beam.mirrors.find(m => Math.hypot(this.x - m.x - .5, this.y - m.y - .5) < 1.3);
            if (m) {
                m.slash = !m.slash;
                if (traceBeam(this.beam).solved) {
                    this.markSolved();
                    this.notice = 'solved';
                    this.dirty = true;
                }
            }
        }
        if (this.circuit) {
            const index = circuitTargets.findIndex(p => Math.hypot(p.x - this.x, p.y - this.y) < .8);
            if (index >= 0) {
                this.circuit.bits = toggle(this.circuit.bits, index);
                this.circuit.moves++;
                if (this.circuit.bits === 65535) {
                    this.markSolved();
                    this.notice = 'solved';
                    this.dirty = true;
                }
            }
        }
        if (this.ice && Math.hypot(this.x - 4.5, this.y - 6.5) < 2) {
            const dx = Math.abs(this.dx) >= Math.abs(this.dy) ? Math.sign(this.dx) : 0, dy = dx ? 0 : Math.sign(this.dy);
            slideIce(this.ice, dx, dy);
            if (this.ice.x === this.ice.goal.x && this.ice.y === this.ice.goal.y) {
                this.markSolved();
                this.notice = 'solved';
                this.dirty = true;
            }
        }
        if (!this.inSky && this.s.room < 8) {
            const node = forageNodes.findIndex(p => Math.hypot(this.x - p.x, this.y - p.y) < 1.2);
            if (node >= 0) {
                const k = key(this.s) + ':' + node;
                if (!this.s.foraged.includes(k)) {
                    this.s.foraged.push(k);
                    const ingredient = (['apple', 'mushroom', 'herb'] as const)[(this.s.chapter + this.s.room + node) % 3];
                    this.s.inventory[ingredient]++;
                    this.notice = 'foraged';
                    this.dirty = true;
                }
            }
            if (this.s.room === 0 && Math.hypot(this.x - towerPosition.x, this.y - towerPosition.y) < 1.3 && !this.s.charts.includes(this.s.chapter)) {
                this.s.charts.push(this.s.chapter);
                this.notice = 'mapped';
                this.dirty = true;
            }
            const b = this.barrel;
            if (b && Math.hypot(this.x - b.x, this.y - b.y) < 1.8)
                this.detonate();
            if (weapon === 4) {
                const x = Math.floor(this.x + this.dx), y = Math.floor(this.y + this.dy);
                if (this.map[y]?.[x] === 3 && this.alter(x, y, 5)) {
                    this.s.inventory.ore++;
                    this.notice = 'mined';
                }
            }
            if (weapon === 2 && this.weather !== 'rain')
                this.fires.push({ x: this.x + this.dx, y: this.y + this.dy, life: 5 });
        }
        const target = this.blocks || this.beam || this.circuit || this.ice ? undefined : this.targets[this.switches.length];
        if (target && Math.hypot(this.x - target[0], this.y - target[1]) < 1.2) {
            const required = Math.min(this.s.chapter, 7);
            if (this.s.room < 8 || this.s.room === 23 || (this.s.room % 4 === 2 ? weapon === required : this.s.room % 4 === 3 ? Math.sin(this.time * 2) > .2 : !tool)) {
                this.switches.push(this.switches.length);
                if (this.switches.length >= this.targets.length) {
                    if (!this.s.solved.includes(key(this.s)))
                        this.markSolved();
                    this.notice = 'solved';
                    this.dirty = true;
                }
            }
            else
                this.notice = this.s.room % 4 === 3 ? 'timing' : 'tool';
        }
        if (!this.inSky && Math.hypot(this.x - 5.5, this.y - 9.5) < 2 && !this.s.chests.includes(key(this.s))) {
            const route = KEY_ROUTES.find(r => r.chest === this.s.room);
            if (route && !routeReady(this.s.chapter, route, this.s.cleared, this.s.solved)) {
                this.notice = 'branch';
                this.clean();
                return;
            }
            this.s.chests.push(key(this.s));
            this.s.coins += 15;
            this.s.hp = Math.min(this.s.maxHp, this.s.hp + 2);
            this.notice = 'chest';
            if (this.s.room === 10 && !this.s.ownedTools.includes(Math.min(7, this.s.chapter))) {
                this.s.tool = Math.min(7, this.s.chapter);
                this.s.ownedTools.push(this.s.tool);
                this.s.unlockedTools = Math.max(this.s.unlockedTools, this.s.tool);
                this.notice = 'newtool';
            }
            this.dirty = true;
        }
        this.rememberPuzzle();
        this.clean();
        return true;
    }
    strike() {
        const weapon = this.activeWeapon, profile = weaponAction(weapon), finisher = this.combo === 2;
        const damage = (profile.damage + this.s.weaponRank * .5) * (finisher ? 1.5 : 1);
        if (profile.style === 'ranged') {
            const spread = finisher ? (weapon === 1 ? [-.14, .14] : [-.18, 0, .18]) : [0];
            const aim = Math.atan2(this.dy, this.dx);
            for (const offset of spread) this.shots.push({x:this.x,y:this.y,vx:Math.cos(aim+offset)*8,vy:Math.sin(aim+offset)*8,life:1.5,friendly:true,kind:weapon,damage});
        }
        if (weapon === 3 && Math.hypot(this.x - 10.5, this.y - 6.5) > 4) {
            let destination = { x:this.x, y:this.y };
            for (let i=.25;i<= (finisher?5:2.5);i+=.25) {
                const nx=this.x+this.dx*i, ny=this.y+this.dy*i;
                if (this.map[Math.floor(ny)]?.[Math.floor(nx)]===3) break;
                if(this.can(nx,ny)) destination={x:nx,y:ny};
            }
            this.x=destination.x; this.y=destination.y;
        }
        const reach = profile.reach + (finisher && profile.reach ? .45 : 0);
        for(const e of this.enemies) {
            const rx=e.x-this.x, ry=e.y-this.y;
            if(e.hp>0 && Math.hypot(rx,ry)<reach && (finisher && profile.style==='heavy' || rx*this.dx+ry*this.dy>-.2)) {
                if(this.guarded(e)){this.notice='bossguard';continue;}
                e.hp-=damage; e.flash=.15; this.burst(e.x,e.y);
                const nx=e.x+this.dx*(finisher?.4:.2),ny=e.y+this.dy*(finisher?.4:.2);
                if(this.enemyCan(nx,ny)){e.x=nx;e.y=ny;}
            }
        }
        if(weapon===4 && finisher) this.burst(this.x+this.dx,this.y+this.dy,'#ffcb80');
        this.clean();
    }
    cancelCombo() { this.queuedSlot=null; this.comboWindow=0; this.comboWeapon=-1; }
    roll() { if (this.stamina < .7 || this.dash > 0)
        return; this.cancelCombo(); this.attack=0; this.strikePending=false; this.stamina -= .7; this.dash = .22; this.hurt = .35; for (const e of this.enemies)
        if (e.boss && this.s.chapter % 4 === 1 && Math.hypot(this.x - e.x, this.y - e.y) < 2.2)
            e.exposed = 1.5; }
    clean() { const before = this.enemies.length; for (const e of this.enemies) if (e.hp <= 0) this.burst(e.x, e.y, '#a7e9dc'); this.enemies = this.enemies.filter(e => e.hp > 0); if (before > this.enemies.length) {
        this.s.coins += (before - this.enemies.length) * 3;
        this.dirty = true;
    } if (!this.enemies.length && !this.s.cleared.includes(key(this.s))) {
        this.s.cleared.push(key(this.s));
        this.s.hp = Math.min(this.s.maxHp, this.s.hp + .5);
        this.dirty = true;
    } }
    tick(dt: number, dx: number, dy: number) {
        dt = Math.min(.035, Math.max(0, dt));
        this.time += dt;
        this.s.seconds += dt;
        for (const p of this.fx) p.life -= dt;
        this.fx = this.fx.filter(p => p.life > 0);
        this.pushCooldown = Math.max(0, this.pushCooldown - dt);
        if (this.attack > 0) {
            this.attack = Math.max(0, this.attack - dt);
            if (this.strikePending && this.attack <= this.attackDuration * .58) { this.strikePending=false; this.strike(); }
            if (this.attack === 0) {
                this.comboWindow = COMBO_GRACE;
                const queued=this.queuedSlot; this.queuedSlot=null;
                if(queued!==null) this.swing(queued,true);
            }
        } else {
            this.comboWindow=Math.max(0,this.comboWindow-dt);
            if(this.comboWindow===0) this.comboWeapon=-1;
        }
        this.hurt = Math.max(0, this.hurt - dt);
        this.dash = Math.max(0, this.dash - dt);
        this.travel -= dt;
        if (this.gliding) {
            this.stamina = Math.max(0, this.stamina - dt * .25);
            if (!this.inSky && [0, 4].includes(this.s.room) && (this.weather !== 'rain' || this.s.room === 0) && Math.hypot(this.x - campPosition.x, this.y - campPosition.y) < 2)
                this.stamina = Math.min(this.s.staminaMax, this.stamina + dt * .4);
            if (this.stamina <= 0)
                this.land();
        }
        else
            this.stamina = Math.min(this.s.staminaMax, this.stamina + dt * .4);
        if(this.inSky && SKY_UPDRAFTS.some(p=>Math.hypot(this.x-p.x,this.y-p.y)<1.1))this.stamina=Math.min(this.s.staminaMax,this.stamina+dt*.9);
        const oldX = this.x, oldY = this.y, oldRoom = key(this.s);
        this.move(dx, dy, dt);
        const distance = oldRoom === key(this.s) ? Math.hypot(this.x - oldX, this.y - oldY) : 0;
        this.moving = distance > .0001;
        if (this.moving) this.walk += distance / WALK_SPEED;
        else if (this.gliding) this.walk += dt;
        if (![2, 7].includes(this.map[Math.floor(this.y)]?.[Math.floor(this.x)]))
            this.safe = { x: this.x, y: this.y };
        for (const f of this.fires) {
            f.life -= dt;
            if (this.weather === 'rain')
                f.life = 0;
            if (this.gliding && Math.hypot(f.x - this.x, f.y - this.y) < 2)
                this.stamina = Math.min(this.s.staminaMax, this.stamina + dt * .4);
            for (const e of this.enemies)
                if (Math.hypot(e.x - f.x, e.y - f.y) < .8)
                    e.hp -= dt * 2;
            if (this.s.room < 8) {
                const x = Math.floor(f.x), y = Math.floor(f.y);
                if (this.map[y]?.[x] === 6)
                    this.alter(x, y, 1);
            }
        }
        this.fires = this.fires.filter(f => f.life > 0);
        if (this.s.gate)
            return;
        for (const e of this.enemies) {
            if (e.hp <= 0)
                continue;
            e.flash = Math.max(0, (e.flash || 0) - dt);
            if (!e.boss) { stepEnemy(this, e, dt); continue; }
            const d = Math.hypot(this.x - e.x, this.y - e.y) || 1;
            const speed = e.boss ? .65 + .3 * Number(e.hp < e.max / 2) : .7 + e.kind * .08;
            e.phase += dt;
            e.cool -= dt;
            e.exposed = Math.max(0, (e.exposed || 0) - dt);
            e.strike = Math.max(0, (e.strike || 0) - dt);
            e.facing = this.x < e.x ? -1 : 1;
            if (e.boss && this.s.chapter % 4 === 2 && e.phase % 5 < dt) {
                const points = [[6.5, 7.5], [14.5, 7.5], [10.5, 4.5]], p = points[Math.floor(e.phase / 5) % 3];
                if (this.enemyCan(p[0], p[1])) {
                    e.x = p[0];
                    e.y = p[1];
                }
            }
            if (e.boss && !e.summoned && e.hp < e.max / 2) {
                e.summoned = true;
                for (let i = 0; i < 2; i++)
                    this.enemies.push({ x: 6 + i * 8, y: 7.5, hp: 4 + this.s.chapter, max: 4 + this.s.chapter, kind: enemyKind(this.s.chapter, this.s.room, i), cool: 1 + i, phase: 0, boss: false });
            }
            const nx = e.x + (this.x - e.x) / d * dt * speed, ny = e.y + (this.y - e.y) / d * dt * speed;
            if (this.enemyCan(nx, ny)) {
                e.x = nx;
                e.y = ny;
            }
            if (d < .65 && this.hurt <= 0)
                this.hit();
            if (e.cool < 0 && (e.boss || e.kind % 3 === 2)) {
                e.strike = .32;
                e.cool = e.boss ? (e.hp < e.max / 2 ? .9 : 1.6) : 3;
                const pattern = this.s.chapter % 6, n = e.boss ? [3, 6, 5, 8, 4, 2][pattern] : 1;
                for (let i = 0; i < n; i++) {
                    const aim = Math.atan2(this.y - e.y, this.x - e.x), a = n === 1 ? aim : pattern === 0 || pattern === 2 ? aim + (i - (n - 1) / 2) * .22 : pattern === 4 ? i * Math.PI / 2 : e.phase + i * Math.PI * 2 / n;
                    this.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, life: 3, friendly: false });
                }
            }
        }
        for (const p of this.shots) {
            if (p.friendly && p.kind === 1 && p.life < .75) {
                const d = Math.hypot(this.x - p.x, this.y - p.y) || 1;
                p.vx = (this.x - p.x) / d * 8;
                p.vy = (this.y - p.y) / d * 8;
                if (d < .4)
                    p.life = 0;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (!this.can(p.x, p.y))
                p.life = 0;
            if (p.friendly) {
                const b = this.barrel;
                if (b && Math.hypot(p.x - b.x, p.y - b.y) < .6) {
                    this.detonate();
                    p.life = 0;
                }
                if (p.kind === 2 && this.weather !== 'rain' && this.s.room < 8 && this.map[Math.floor(p.y)]?.[Math.floor(p.x)] === 6) {
                    this.alter(Math.floor(p.x), Math.floor(p.y), 1);
                    this.fires.push({ x: p.x, y: p.y, life: 4 });
                }
                for (const e of this.enemies)
                    if (Math.hypot(p.x - e.x, p.y - e.y) < .7) {
                        if (p.kind === 1)
                            e.exposed = 2.5;
                    if (!this.guarded(e)) {
                        e.hp -= p.damage ?? 3;
                        e.flash = .15;
                        this.burst(e.x, e.y);
                    }
                        else
                            this.notice = 'bossguard';
                        p.life = 0;
                        break;
                    }
            }
            else if (this.hurt <= 0 && Math.hypot(p.x - this.x, p.y - this.y) < .45) {
                this.hit();
                p.life = 0;
            }
        }
        this.shots = this.shots.filter(p => p.life > 0);
        this.clean();
    }
    hit() { this.cancelCombo(); this.attack=0; this.strikePending=false; this.s.hp--; this.hurt = 1; if (this.s.hp <= 0) {
        this.s.hp = this.s.maxHp;
        this.s.coins = Math.max(0, this.s.coins - 10);
        this.x = 2.5;
        this.y = 7.5;
        this.enter();
        this.notice = 'rescue';
        this.hurt = 2;
    } }
    study(correct: number) { if (correct <= 0 || this.s.gate !== key(this.s))
        return false; const k = key(this.s); if (!this.s.solved.includes('study:' + k))
        this.s.solved.push('study:' + k); this.s.gate = null; this.s.hp = Math.min(this.s.maxHp, this.s.hp + 2);
        if(this.inSky){
            if(!this.s.skyTreasures.includes(this.s.chapter)){this.s.skyTreasures.push(this.s.chapter);this.s.coins+=60;this.s.spirit+=2;this.s.inventory.tonic++;}
            this.notice='skyreward';this.dirty=true;return true;
        }
        if (this.s.room === 23 && !this.s.beacons.includes(this.s.chapter)) {
        this.s.beacons.push(this.s.chapter);
        this.s.coins += 100;
        this.s.maxHp = Math.min(30, this.s.maxHp + 1);
        this.s.hp = this.s.maxHp;
        if (this.s.chapter === 11)
            this.s.ending = true;
        else {
            this.s.maxChapter = 11;
            this.s.chapter = 0;
            this.s.room = 0;
            this.x = 2.5;
            this.y = 7.5;
            this.enter();
            this.notice = this.s.glideAwakened?'charted':'glider';
        }
    } this.dirty = true; return true; }
    hint(): {
        kind: 'done' | 'general' | 'reset' | 'ice' | 'beam' | 'circuit';
        index?: number;
    } { if (this.s.solved.includes(key(this.s)))
        return { kind: 'done' }; if (this.circuit) {
        const solution = solveCircuit(this.circuit.bits);
        if (solution?.length) {
            const index = solution[0];
            this.hintTarget = circuitTargets[index];
            return { kind: 'circuit', index: index + 1 };
        }
    } if (this.beam) {
        const solution = solveBeam(this.beam);
        if (solution) {
            const index = this.beam.mirrors.findIndex((m, i) => m.slash !== solution[i]);
            if (index >= 0) {
                this.hintTarget = { x: this.beam.mirrors[index].x + .5, y: this.beam.mirrors[index].y + .5 };
                return { kind: 'beam', index: index + 1 };
            }
        }
    } if (this.ice) {
        const solution = solveIce(this.ice);
        return solution?.length ? { kind: 'ice', index: solution[0] } : { kind: 'reset' };
    } return { kind: 'general' }; }
    markSolved() { const k = key(this.s); if (!this.s.solved.includes(k)) {
        this.s.solved.push(k);
        if (this.s.room >= 8)
            this.s.spirit++;
    } delete this.s.puzzles[k]; this.notice = 'solved'; this.dirty = true; }
    rememberPuzzle() { if(this.inSky)return; if (this.s.solved.includes(key(this.s)))
        return; const p: PuzzleSnapshot = this.blocks ? { kind: 'blocks', boxes: this.blocks.boxes.map(b => ({ ...b })) } : this.beam ? { kind: 'beam', slash: this.beam.mirrors.map(m => m.slash) } : this.circuit ? { kind: 'circuit', bits: this.circuit.bits, moves: this.circuit.moves } : this.ice ? { kind: 'ice', x: this.ice.x, y: this.ice.y, steps: this.ice.steps } : { kind: 'lights', count: this.switches.length }; const k = key(this.s); if (JSON.stringify(this.s.puzzles[k]) !== JSON.stringify(p)) {
        this.s.puzzles[k] = p;
        this.hintTarget = null;
        this.dirty = true;
    } }
    restorePuzzle() { const p = this.s.puzzles[key(this.s)]; if (!p)
        return; if (p.kind === 'blocks' && this.blocks && p.boxes.length === this.blocks.boxes.length && new Set(p.boxes.map(b => b.x + ',' + b.y)).size === p.boxes.length && p.boxes.every(b => b.x >= 7 && b.x <= 13 && b.y >= 3 && b.y <= 9 && this.map[b.y]?.[b.x] !== 3))
        this.blocks.boxes = p.boxes.map(b => ({ ...b })); if (p.kind === 'beam' && this.beam && p.slash.length === 4)
        this.beam.mirrors.forEach((m, i) => m.slash = p.slash[i]); if (p.kind === 'circuit' && this.circuit) {
        this.circuit.bits = p.bits;
        this.circuit.moves = p.moves;
    } if (p.kind === 'ice' && this.ice && p.x >= 0 && p.x < 9 && p.y >= 0 && p.y < 9 && !this.ice.walls.has(p.x + ',' + p.y)) {
        this.ice.x = p.x;
        this.ice.y = p.y;
        this.ice.steps = p.steps;
    } if (p.kind === 'lights' && !this.blocks && !this.beam && !this.circuit && !this.ice)
        this.switches = Array.from({ length: Math.min(p.count, this.targets.length) }, (_, i) => i); }
    resetPuzzle() { if (this.s.solved.includes(key(this.s)))
        return false; delete this.s.puzzles[key(this.s)]; this.x = 2.5; this.y = 7.5; this.enter(); return true; }
    startNew() { this.s = fresh(); this.x = 2.5; this.y = 7.5; this.dx = 1; this.dy = 0; this.stamina = 1; this.hurt = 0; this.dash = 0; this.time = 0; this.enter(); }
    buyHeal() { if (this.s.room !== 0 || this.s.coins < 20 || this.s.hp >= this.s.maxHp || this.s.gate)
        return false; this.s.coins -= 20; this.s.hp = this.s.maxHp; this.dirty = true; return true; }
    travelTo(chapter: number) { if (!this.canTravel(chapter))
        return false; this.s.realm='surface';this.s.chapter = chapter; this.s.maxChapter = Math.max(this.s.maxChapter, chapter); this.s.room = 0; this.x = 2.5; this.y = 7.5; this.enter(); return true; }
    questProgress(i: number) { const prefix = this.s.chapter + ':', current = i === 0 ? this.s.chests.filter(k => k.startsWith(prefix)).length : i === 1 ? this.s.cleared.filter(k => k.startsWith(prefix) && k !== prefix + '0').length : this.s.solved.filter(k => k.startsWith(prefix)).length, target = i === 1 ? 4 : 3, complete = this.s.quests.includes(prefix + i); return { current, target, complete, ready: current >= target && !complete }; }
    quest(i: number) { if (i < 0 || i > 2 || !this.questProgress(i).ready)
        return false; this.s.quests.push(this.s.chapter + ':' + i); this.s.maxHp = Math.min(30, this.s.maxHp + 1); this.s.hp = this.s.maxHp; this.s.coins += 40; this.dirty = true; return true; }
}
