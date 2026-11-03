import {freshGrowth,normalizeGrowth,combatStats,TALENTS,RELICS,talentPoints,levelFor,type GrowthSave,type Difficulty} from './progression';
import {encounterFor} from './encounters';
import {MECHANISMS,mechanismPoints,mechanismState,type MechanismState} from './mechanisms';
import {elevationAt,canTraverseHeight,terracesFor,vistaPoint} from './elevation';
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
import { WALK_SPEED, COMBO_GRACE, weaponAction, type AttackMode } from './combat';
import {skyMap, WIND_LAUNCH, SKY_RETURN, SKY_CHEST, SKY_UPDRAFTS} from './sky';
export const W = 20, H = 14;
export type Save = WildSave & GrowthSave & {
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
    studySeconds: number;
    studyProblems: number;
    pendingTravel: {kind:'exit'|'beacon'|'launch'|'leave'|'travel';value:number}|null;
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
    openingSeen?:boolean;
    openingLine?:number;
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
    elite?:boolean;
    burn?:number;
    burnPower?:number;
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
export const fresh = (): Save => ({ ...freshWild(),...freshGrowth(), version: 1, hero: 'nagi', weaponA: 0, studySeconds: 0, studyProblems: 0, pendingTravel: null, realm: 'surface', glideAwakened: false, skyTreasures: [], puzzles: {}, unlockedTools: 0, maxChapter: 0, beacons: [], chapter: 0, room: 0, hp: 6, maxHp: 6, coins: 0, tool: 0, cleared: [], solved: [], chests: [], visited: [], quests: [], choices: [], seconds: 0, ending: false, gate: null });
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
    x.openingSeen=x.openingSeen===true;
    if(x.openingLine!==undefined)x.openingLine=Math.max(0,Math.min(6,Math.floor(Number(x.openingLine)||0)));
    x.gate = typeof x.gate === 'string' ? x.gate : null;
    x.maxChapter = Math.max(0, Math.min(11, Number(x.maxChapter ?? x.chapter) || 0));
    x.choices = Array.from({ length: 12 }, (_, i) => x.choices[i] === 0 || x.choices[i] === 1 ? x.choices[i] : null);
    x.beacons = Array.isArray(x.beacons) ? [...new Set(x.beacons.filter((v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 12))] : Array.from({ length: x.maxChapter }, (_, i) => i);
    x.unlockedTools = Math.max(0, Math.min(7, Number(x.unlockedTools ?? x.maxChapter) || 0));
    x.coins = Math.max(0, Math.min(999999, Math.floor(Number(x.coins) || 0)));
    const wild = normalizeWild(x);
    const growth=normalizeGrowth(x);
    x.hero = heroId(x.hero);
    x.studyProblems=Number.isInteger(x.studyProblems)?Math.max(0,x.studyProblems):0;
    x.studySeconds=Number.isFinite(x.studySeconds)?Math.max(0,Math.min(86400,x.studySeconds)):0;
    const pending=x.pendingTravel;
    x.pendingTravel=pending&&['exit','beacon','launch','leave','travel'].includes(pending.kind)&&Number.isInteger(pending.value)&&Math.abs(pending.value)<=11?pending:null;
    x.realm = x.realm==='sky' && (x.beacons.includes(0)||growth.cycle>0) ? 'sky' : 'surface';
    if(x.realm!=='sky'&&typeof x.gate==='string'&&x.gate.endsWith(':sky'))x.gate=null;
    x.glideAwakened = typeof x.glideAwakened==='boolean' ? x.glideAwakened : x.beacons.includes(0);
    x.skyTreasures = Array.isArray(x.skyTreasures) ? [...new Set(x.skyTreasures.filter((v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<12))] : [];
    x.weaponA = Number.isInteger(x.weaponA) && wild.ownedTools.includes(x.weaponA) ? x.weaponA : 0;
    return { ...n, ...x, ...wild,...growth, chapter: Math.max(0, Math.min(11, Math.floor(Number(x.chapter) || 0))), room: Math.max(0, Math.min(23, Math.floor(Number(x.room) || 0))), maxHp: Math.max(6, Math.min(30, Number(x.maxHp) || 6)), hp: Math.max(.5, Math.min(30, Number(x.hp) || 6)), tool: wild.ownedTools.includes(Number(x.tool)) ? Number(x.tool) : 0, seconds: Math.max(0, Number(x.seconds) || 0) };
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
    } shapeField(chapter, room, map); map[7][0] = room % 6 === 0 ? 3 : room < 8 ? 1 : 5; map[7][19] = room % 6 === 5 && room !== 23 ? 3 : room < 8 ? 1 : 5; map[0][10] = room >= 6 ? 5 : 3; map[13][10] = room < 18 ? 5 : 3; map[1][10] = map[12][10] = 5; map[6][8] = map[6][12] = map[6][10] = map[7][10] = 5; map[7][2] = map[7][17] = 5; for(const dir of [-1,1,-6,6]){const next=room+dir;const valid=next>=0&&next<24&&(dir!==-1||room%6!==0)&&(dir!==1||room%6!==5);if(room<8&&next<8&&valid){if(Math.abs(dir)===1)for(let y=1;y<H-1;y++)map[y][dir<0?0:W-1]=1;else for(let x=1;x<W-1;x++)map[dir<0?0:H-1][x]=1;}}return map; }
export class World {
    hitStop=0;
    guarding=false;
    guardAge=0;
    parrySerial=0;
    driveSerial=0;
    drive=0;
    target:Enemy|null=null;
    lastMove={x:0,y:0};
    chainCooldown=0;
    trial:{wave:number;elapsed:number}|null=null;
    links:{x:number;y:number;tx:number;ty:number;life:number}[]=[];
    lootToast:{id:string;duplicate:boolean;seconds:number}|null=null;
    floating:{x:number;y:number;text:string;color:string;life:number}[]=[];
    get stats(){return combatStats(this.s);}
    get trialKind(){return this.inSky?null:this.s.room===17?'hunt':this.s.room===21?'arena':null;}
    get atTrial(){return Boolean(this.trialKind&&!this.trial&&!this.enemies.length&&Math.hypot(this.x-10.5,this.y-6.5)<1.5);}
    attackMode:AttackMode = 'normal';
    chargeHeld=false;
    chargeTime=0;
    chargeSlot=false;
    chargeAuto=false;
    counterWindow=0;
    perfectDodge=false;
    mechanism:MechanismState=mechanismState();
    get mechanismInfo(){return this.inSky?undefined:MECHANISMS[this.s.room];}
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
        spread?:boolean;
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
    constructor(s: Save) { this.s=s;Object.assign(this.s,normalizeGrowth(s)); this.s.dishes??={};this.s.mealBuff??=null; this.s.hero = 'nagi'; this.s.weaponA ??= 0; this.s.studySeconds ??= 0;this.s.studyProblems ??= 0;this.s.pendingTravel ??= null;this.s.realm ??= 'surface'; this.s.skyTreasures ??= []; this.enter(); }
    enter() { this.resetCombatExtras();if(this.inSky){this.enterSky();return;} this.chargeHeld=false;this.chargeTime=0;this.counterWindow=0;this.mechanism=mechanismState();this.queuedSlot = null; this.comboWindow = 0; this.comboWeapon = -1; this.combo = 0; this.strikePending = false; this.notice = ''; this.moving = false; this.walk = 0; this.fx = []; this.gliding = false; this.fires = []; this.safe = { x: this.x, y: this.y }; this.hintTarget = null; this.map = roomMap(this.s.chapter, this.s.room); this.circuit = this.s.room===8 && !this.s.solved.includes(key(this.s)) ? circuitChamber(this.s.chapter * 7 + this.s.room) : null; this.ice = this.s.room === 19 && !this.s.solved.includes(key(this.s)) ? iceChamber(this.s.chapter) : null; if (this.circuit) {
        for (let y = 3; y <= 10; y++)
            for (let x = 3; x <= 16; x++)
                this.map[y][x] = 5;
    } if (this.ice) {
        for (let y = 2; y <= 10; y++)
            for (let x = 6; x <= 14; x++)
                this.map[y][x] = this.ice.walls.has(`${x - 6},${y - 2}`) ? 3 : 5;
        for (let y = 4; y <= 9; y++)
            this.map[y][4] = 5;
    } this.beam = this.s.room===11 && !this.s.solved.includes(key(this.s)) ? beamChamber(this.s.chapter + this.s.room) : null; if (this.beam) {
        for (let y = 3; y <= 10; y++)
            for (let x = 3; x <= 16; x++)
                this.map[y][x] = 5;
    } this.blocks = this.s.room===9 && !this.s.solved.includes(key(this.s)) ? blockChamber(this.s.chapter + this.s.room) : null; if (this.blocks) {
        for (let y = 3; y <= 9; y++)
            for (let x = 7; x <= 13; x++)
                this.map[y][x] = 5;
        for (const p of this.blocks.walls)
            this.map[p.y][p.x] = 3;
    } if(this.mechanismInfo&&!['blocks','circuit','beam','ice'].includes(this.mechanismInfo.kind)){
        for(let y=3;y<=10;y++)for(let x=6;x<=14;x++)this.map[y][x]=5;
        if(this.mechanismInfo.kind==='tide'&&!this.s.solved.includes(key(this.s)))for(let y=3;y<=10;y++)this.map[y][10]=2;
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
    } this.scaleEnemies();this.restorePuzzle(); this.dirty = true; }
    requestStudy(kind:'exit'|'beacon'|'launch'|'leave'|'travel',value=0){
        if(this.s.gate)return true;
        if(this.s.studySeconds<=180)return false;
        this.s.pendingTravel={kind,value};this.s.gate=key(this.s);this.cancelCombo();this.dirty=true;return true;
    }
    study(correct:number){
        if(!this.s.gate||this.s.gate!==key(this.s))return false;
        const pending=this.s.pendingTravel;
        if(!pending){const done=this.resolveGate(correct);if(done){this.s.studySeconds=0;this.s.studyProblems+=3;}return done;} // Resume older checkpoint saves.
        this.s.gate=null;this.s.pendingTravel=null;this.s.studySeconds=0;this.s.studyProblems+=3;this.dirty=true;
        this.s.hp=Math.min(this.s.maxHp,this.s.hp+Math.max(0,correct));
        if(pending.kind==='exit')this.exit(pending.value);
        else if(pending.kind==='beacon'){this.s.gate=key(this.s);this.resolveGate(1);}
        else if(pending.kind==='launch')this.launchSky();
        else if(pending.kind==='leave')this.leaveSky();
        else this.travelTo(pending.value);
        return true;
    }
    get inSky(){return this.s.realm==='sky';}
    get gliderUnlocked(){return this.s.beacons.includes(0)||this.s.cycle>0;}
    get atLaunch(){return !this.inSky&&this.s.room===0&&Math.hypot(this.x-WIND_LAUNCH.x,this.y-WIND_LAUNCH.y)<1.3;}
    get atSkyReturn(){return this.inSky&&Math.hypot(this.x-SKY_RETURN.x,this.y-SKY_RETURN.y)<1.2;}
    get atSkyChest(){return this.inSky&&Math.hypot(this.x-SKY_CHEST.x,this.y-SKY_CHEST.y)<1.4;}
    enterSky(){this.resetCombatExtras();this.chargeHeld=false;this.chargeTime=0;this.counterWindow=0;
        this.s.room=0;this.cancelCombo();this.attack=0;this.strikePending=false;this.dash=0;
        this.map=skyMap(this.s.chapter);this.blocks=null;this.beam=null;this.circuit=null;this.ice=null;
        this.shots=[];this.fires=[];this.fx=[];this.switches=[];this.walk=0;this.moving=false;this.notice='sky';this.travel=.5;
        this.x=SKY_RETURN.x;this.y=SKY_RETURN.y;this.safe={x:this.x,y:this.y};this.gliding=false;
        this.stamina=this.s.staminaMax;this.hurt=0;
        this.enemies=this.s.cleared.includes(key(this.s))?[]:[{x:17.5,y:5.8,hp:6+this.s.chapter,max:6+this.s.chapter,kind:[2,5,9,19][this.s.chapter%4],cool:2,phase:0}];
        this.scaleEnemies();if(!this.s.visited.includes(key(this.s)))this.s.visited.push(key(this.s));this.dirty=true;
    }
    launchSky(){
        if(!this.atLaunch||this.s.gate)return false;
        if(!this.gliderUnlocked){this.notice='glidelocked';return false;}
        if(this.requestStudy('launch'))return false;this.s.realm='sky';this.enter();this.gliding=true;return true;
    }
    leaveSky(){
        if(!this.inSky||this.s.gate)return false;
        if(this.requestStudy('leave'))return false;this.s.realm='surface';this.s.room=0;this.x=WIND_LAUNCH.x;this.y=WIND_LAUNCH.y;this.enter();return true;
    }
    openSkyChest(){
        if(!this.atSkyChest||this.s.gate||this.s.skyTreasures.includes(this.s.chapter))return false;
        if(this.enemies.length){this.notice='enemies';return false;}
        this.s.gate=key(this.s);this.resolveGate(1);return true;
    }
    blocked(x: number, y: number, gliding=false) { const code=this.map[Math.floor(y)]?.[Math.floor(x)]??3; return (gliding?[3]:[2,3,7]).includes(code) && (this.s.room>=8||code===7||roundedSolid(this.map,x,y,code)); }
    can(x: number, y: number) { if(!this.inSky&&!canTraverseHeight(this.s.chapter,this.s.room,this,{x,y},this.gliding))return false;return !this.blocks?.boxes.some(b => Math.floor(x) === b.x && Math.floor(y) === b.y) && x > .3 && y > .3 && x < W - .3 && y < H - .3 && !this.blocked(x,y,this.gliding); }
    enemyCan(x: number, y: number,from?:{x:number;y:number}) { if(from&&!this.inSky&&!canTraverseHeight(this.s.chapter,this.s.room,from,{x,y}))return false;return x > .5 && y > .5 && x < W - .5 && y < H - .5 && !this.blocked(x,y) && !this.blocks?.boxes.some(b => Math.floor(x) === b.x && Math.floor(y) === b.y); }
    burst(x: number, y: number, color = '#ffe6a0') { this.fx.push({ x, y, color, life: .4, max: .4, seed: this.fx.length % 7 }); if (this.fx.length > 32) this.fx.shift(); }
    move(dx: number, dy: number, dt: number) { if (this.dash > 0) {
        dx = this.dx;
        dy = this.dy;
    } if (!dx && !dy)
        return; const d = Math.hypot(dx, dy), fx = dx / d, fy = dy / d; dx /= Math.max(1, d); dy /= Math.max(1, d); if (this.dash <= 0 && this.attack <= 0) {
        this.dx = fx;
        this.dy = fy;
    } const v = (this.dash > 0 ? 10 : this.gliding ? (this.weather === 'wind' ? 5.2 : 4.2) : WALK_SPEED*this.stats.speed*(this.guarding?.5:1) * (this.s.mealBuff?.kind==='speed'?1.2:1) * (this.attack > 0 ? .55 : 1)) * dt; for (const [ax, ay] of [[dx * v, 0], [0, dy * v]]) {
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
        if (this.x > 18.55 && this.map[Math.floor(this.y)]?.[19]!==3)
            this.exit(1);
        if (this.x < 1.1 && this.map[Math.floor(this.y)]?.[0]!==3)
            this.exit(-1);
        if (this.y < 1.1 && this.map[0]?.[Math.floor(this.x)]!==3)
            this.exit(-6);
        if (this.y > 12.55 && this.map[13]?.[Math.floor(this.x)]!==3)
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
            if(this.requestStudy('beacon')){hold();return;}
            this.s.gate=key(this.s);this.resolveGate(1);return;
        }
        if(this.requestStudy('exit',dir)){hold();return;}
        if (next < 0 || next > 23)
            return;
        this.s.room = next;
        if (Math.abs(dir) === 6) {
            this.y = dir > 0 ? 1.8 : 12.2;
            this.x = room<8&&next<8?Math.max(1.5,Math.min(18.5,this.x)):10.5;
        }
        else {
            this.x = dir > 0 ? 1.8 : 18.2;
            this.y = room<8&&next<8?Math.max(1.5,Math.min(12.5,this.y)):7.5;
        }
        this.enter();
    }
    get vista(){if(this.inSky)return null;return terracesFor(this.s.chapter,this.s.room).map((t,i)=>({...vistaPoint(t),level:t.level,id:key(this.s)+':vista:'+i})).find(p=>!this.s.foraged.includes(p.id)&&Math.hypot(this.x-p.x,this.y-p.y)<.7&&elevationAt(this.s.chapter,this.s.room,this.x,this.y)>=p.level-.1)??null;}
    get npc() { return this.inSky?null:encounterFor(this.s.chapter,this.s.room); }
    get canTalk() { return Boolean(this.npc && !this.enemies.length && Math.hypot(this.x - this.npc.x, this.y - this.npc.y) < 1.6); }
    get targets() { return this.mechanismInfo?mechanismPoints(this.mechanismInfo.kind).map(p=>[p.x,p.y]):[]; }
    get weather() { if(this.inSky)return 'wind' as const;return ['clear', 'wind', 'rain'][Math.floor(this.s.seconds / 90 + this.s.chapter) % 3] as 'clear' | 'wind' | 'rain'; }
    get atHarbor() { return !this.inSky && this.s.room === 0 && Math.hypot(this.x - 2.5, this.y - 10.5) < 2; }
    get atCamp() { return !this.inSky && [0, 4].includes(this.s.room) && !this.enemies.length && Math.hypot(this.x - campPosition.x, this.y - campPosition.y) < 2.5 && (this.weather !== 'rain' || this.s.room === 0); }
    get barrel() { return !this.inSky && this.s.room === 1 && !this.s.exploded.includes(key(this.s)) ? { x: 12.5, y: 7.5 } : null; }
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
    cook(id: string) { const r = RECIPES.find(r => r.id === id); if (!r || !this.atCamp || (this.s.dishes[r.id]??0)>=999)
        return false; for (const [k, n] of Object.entries(r.cost))
        if (this.s.inventory[k as keyof Inventory] < n)
            return false; for (const [k, n] of Object.entries(r.cost))
        this.s.inventory[k as keyof Inventory] -= n; this.s.dishes[r.id]=Math.min(999,(this.s.dishes[r.id]??0)+1); this.notice = 'cooked'; this.dirty = true; return true; }
    eatDish(id:string){const r=RECIPES.find(r=>r.id===id);if(!r||(this.s.dishes[id]??0)<1||this.s.hp>=this.s.maxHp&&(!r.stamina||this.stamina>=this.s.staminaMax)&&!r.buff)return false;this.s.dishes[id]--;this.s.hp=Math.min(this.s.maxHp,this.s.hp+r.heal);if(r.stamina)this.stamina=this.s.staminaMax;if(r.buff)this.s.mealBuff={kind:r.buff,seconds:120};this.dirty=true;return true;}
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
        this.chargeHeld=false;this.chargeTime=0;
        if (slot === 'a') this.s.weaponA = weapon; else this.s.tool = weapon;
        this.queuedSlot = null; this.comboWindow = 0; this.comboWeapon = -1;
        this.dirty = true;
        return true;
    }
    swing(tool = false, continuation = false, requested:AttackMode='normal') {
        const weapon = tool ? this.s.tool : this.s.weaponA;
        if (this.guarding||this.s.gate || this.dash > 0 || !this.s.ownedTools.includes(weapon) || weapon === 6 && this.stamina < .3) return false;
        if (this.attack > 0) { this.queuedSlot = tool; return false; }
        const mode=requested!=='normal'?requested:this.gliding?'aerial':this.counterWindow>0?'counter':'normal';
        if(mode==='charged'&&this.stamina<this.stats.chargeCost+(weapon===6?.3:0)){this.notice='stamina';return false;}
        if(mode==='charged')this.stamina-=this.stats.chargeCost;
        this.attackMode=mode;this.counterWindow=0;
        this.combo = mode==='normal'&&this.comboWeapon === weapon && this.comboWindow > 0 ? (this.combo + 1) % 3 : 0;
        this.comboWeapon = weapon; this.comboWindow = 0;
        this.faceTarget();this.activeWeapon = weapon;
        this.attackDuration = mode==='charged'?.72:mode==='aerial'?.54:mode==='counter'?.26:weaponAction(weapon).durations[this.combo];
        if(mode==='aerial'&&!this.inSky&&!this.blocked(this.x,this.y,false))this.gliding=false;
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
            if(this.vista){this.s.foraged.push(this.vista.id);this.s.inventory.ore+=2;this.s.inventory.herb++;this.s.coins+=10;this.notice='vista';this.dirty=true;}
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
        if(!this.s.solved.includes(key(this.s)))this.useMechanism(weapon);
        if (!this.inSky && Math.hypot(this.x - 5.5, this.y - 9.5) < 2 && !this.s.chests.includes(key(this.s))) {
            const route = KEY_ROUTES.find(r => r.chest === this.s.room);
            if (route && !routeReady(this.s.chapter, route, this.s.cleared, this.s.solved)) {
                this.notice = 'branch';
                this.clean();
                return;
            }
            this.s.chests.push(key(this.s));
            if([2,7,10,14,18,22].includes(this.s.room))this.awardRelic(this.s.room);
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
    beginCharge(tool=false,automatic=false){if(this.s.gate||this.guarding||this.attack>0&&!automatic||this.dash>0)return false;this.chargeHeld=true;this.chargeTime=0;this.chargeSlot=tool;this.chargeAuto=automatic;return true;}
    releaseCharge(){if(!this.chargeHeld)return false;const ready=this.chargeTime>=.5;this.chargeHeld=false;this.chargeTime=0;return this.swing(this.chargeSlot,false,ready?'charged':'normal');}
    drainChannel(){for(let y=3;y<=10;y++)this.map[y][10]=5;}
    useMechanism(weapon:number){
        const info=this.mechanismInfo;if(!info||['blocks','beam','circuit','ice','balance','memory'].includes(info.kind))return;
        const m=this.mechanism,points=mechanismPoints(info.kind),i=points.findIndex(p=>Math.hypot(p.x-this.x,p.y-this.y)<1.15);
        if(i<0)return;
        let done=false;
        switch(info.kind){
          case 'forge':done=weapon===Math.min(this.s.chapter,7);if(!done)this.notice='tool';break;
          case 'bells':if(i===m.progress)m.progress++;else{m.progress=i===0?1:0;this.notice='sequence';}done=m.progress===3;break;
          case 'wind':if(i===m.progress&&(i===0?this.dx>.7:this.dy<-.7))m.progress++;else this.notice='direction';done=m.progress===2;break;
          case 'tide':if(i===0){m.progress=1;this.drainChannel();}else done=m.progress===1;break;
          case 'lens':if(i===0)m.dial=(m.dial+1)%4;else{done=m.dial===1;if(!done)this.notice='align';}break;
          case 'relay':if(i===0){m.progress=1;m.timer=8;}else done=m.progress===1&&m.timer>0;break;
          case 'pulse':{const beat=Math.floor(this.time/Math.PI);if(Math.sin(this.time*2)>.65&&m.latched!==beat){m.latched=beat;m.progress++;done=m.progress===3;}else this.notice='timing';break;}
        }
        if(done)this.markSolved();else this.rememberPuzzle();
    }
    stepMechanism(dt:number){
        const info=this.mechanismInfo;if(!info||this.s.solved.includes(key(this.s)))return;
        const m=this.mechanism;if(m.timer>0){m.timer=Math.max(0,m.timer-dt);if(!m.timer&&['balance','relay'].includes(info.kind)){m.progress=0;this.rememberPuzzle();}}
        if(!['balance','memory'].includes(info.kind))return;
        const points=mechanismPoints(info.kind),i=points.findIndex(p=>Math.hypot(p.x-this.x,p.y-this.y)<.55);
        if(i===m.latched)return;m.latched=i;if(i<0)return;
        if(info.kind==='balance'){if(i===0){m.progress=1;m.timer=4;}else if(m.progress===1&&m.timer>0)this.markSolved();}
        else{if(i===m.progress)m.progress++;else{m.progress=i===0?1:0;this.notice='sequence';}if(m.progress===3)this.markSolved();}
        this.rememberPuzzle();
    }
    strike() {
        const weapon = this.activeWeapon, profile = weaponAction(weapon), special=this.attackMode!=='normal',finisher = this.combo === 2||special;
        const damage = (this.s.mealBuff?.kind==='attack'?1.3:1) * (profile.damage + this.s.weaponRank * .5) * (this.attackMode==='charged'?2.3*this.stats.charged:this.attackMode==='counter'?1.8*this.stats.counter:finisher?1.5*(this.s.talents.includes('finish')?1.25:1):1)*this.stats.damage*(this.drive>0?1.5:1);
        if (profile.style === 'ranged') {
            const spread = this.attackMode==='charged'?[-.32,-.16,0,.16,.32]:finisher ? (weapon === 1 ? [-.14, .14] : [-.18, 0, .18]) : [0];
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
        const radial=this.attackMode==='aerial'||this.attackMode==='charged'&&['blade','heavy','guard'].includes(profile.style);
        const reach = profile.reach + (finisher && profile.reach ? (special?1:.45) : 0);
        for(const e of this.enemies) {
            const rx=e.x-this.x, ry=e.y-this.y;
            if(e.hp>0 && (this.inSky||Math.abs(elevationAt(this.s.chapter,this.s.room,this.x,this.y)-elevationAt(this.s.chapter,this.s.room,e.x,e.y))<.45) && Math.hypot(rx,ry)<reach && (radial || finisher && profile.style==='heavy' || rx*this.dx+ry*this.dy>-.2)) {
                if(special)e.exposed=2;
                if(this.guarded(e)){this.notice='bossguard';continue;}
                this.damageEnemy(e,damage);
                const nx=e.x+this.dx*(finisher?.4:.2),ny=e.y+this.dy*(finisher?.4:.2);
                if(this.enemyCan(nx,ny,e)){e.x=nx;e.y=ny;}
            }
        }
        if(this.attackMode==='charged'&&weapon===6){for(const shot of this.shots)if(!shot.friendly&&Math.hypot(shot.x-this.x,shot.y-this.y)<3){shot.friendly=true;shot.vx*=-1;shot.vy*=-1;shot.damage=damage;}}
        if(special)this.burst(this.x,this.y,this.attackMode==='counter'?'#c8ffec':'#b7dfff');
        if(weapon===4 && finisher) this.burst(this.x+this.dx,this.y+this.dy,'#ffcb80');
        this.clean();
    }
    cancelCombo() { this.queuedSlot=null; this.comboWindow=0; this.comboWeapon=-1; }
    roll() { if (this.s.gate||this.stamina < this.stats.dodgeCost || this.dash > 0)
        return;this.guarding=false;if(Math.hypot(this.lastMove.x,this.lastMove.y)>.2){const d=Math.hypot(this.lastMove.x,this.lastMove.y);this.dx=this.lastMove.x/d;this.dy=this.lastMove.y/d;} this.chargeHeld=false;this.chargeTime=0;this.perfectDodge=this.enemies.some(e=>Math.hypot(e.x-this.x,e.y-this.y)<2.5&&((e.windup||0)>0&&(e.windup||0)<.3||(e.strike||0)>0))||this.shots.some(p=>!p.friendly&&Math.hypot(p.x-this.x,p.y-this.y)<1.5);this.counterWindow=(this.perfectDodge?1.4:.8)+this.stats.counterTime;if(this.perfectDodge){this.gainEnergy(10);this.notice='perfect';this.burst(this.x,this.y,'#c8ffec');}this.cancelCombo(); this.attack=0; this.strikePending=false; this.stamina -= this.stats.dodgeCost; this.dash = .22; this.hurt = .35; for (const e of this.enemies)
        if (e.boss && this.s.chapter % 4 === 1 && Math.hypot(this.x - e.x, this.y - e.y) < 2.2)
            e.exposed = 1.5; }
    clean() {
        const defeated=this.enemies.filter(e=>e.hp<=0),oldLevel=levelFor(this.s.xp);
        for(const e of defeated){this.burst(e.x,e.y,'#a7e9dc');this.s.bestiary[e.kind]=(this.s.bestiary[e.kind]||0)+1;this.s.xp+=Math.round((e.boss?120:e.elite?60:18)*(1+this.s.cycle*.25));this.s.hp=Math.min(this.s.maxHp,this.s.hp+this.stats.heal);}
        this.enemies=this.enemies.filter(e=>e.hp>0);
        if(defeated.length){this.s.coins+=defeated.length*3;this.dirty=true;if(levelFor(this.s.xp)>oldLevel)this.notice='levelup';}
        if(!this.enemies.length&&this.trial){
            if(this.trialKind==='arena'&&this.trial.wave<3){this.trial.wave++;this.spawnTrial();return;}
            const id=`${this.s.cycle}:${this.s.chapter}:${this.s.room}`,best=`${this.s.chapter}:${this.s.room}`;
            if(!this.s.trials.includes(id)){this.s.trials.push(id);this.s.coins+=60;this.s.dust+=3;this.s.xp+=80;this.awardRelic(this.s.room+5);}
            this.s.trialBest[best]=Math.min(this.s.trialBest[best]||Infinity,this.trial.elapsed);this.trial=null;this.notice='trialwon';this.s.hp=Math.min(this.s.maxHp,this.s.hp+2);this.dirty=true;
        }
        if(!this.enemies.length&&!this.s.cleared.includes(key(this.s))){this.s.cleared.push(key(this.s));this.s.hp=Math.min(this.s.maxHp,this.s.hp+.5);this.dirty=true;}
    }
    resetCombatExtras(){this.hitStop=0;this.guarding=false;this.guardAge=0;this.target=null;this.trial=null;this.lastMove={x:0,y:0};this.floating=[];this.links=[];this.lootToast=null;this.chainCooldown=0;this.drive=0;}
    scaleEnemies(){const scale=(1+this.s.cycle*.4)*(this.s.difficulty==='heroic'?1.4:1);for(const e of this.enemies){e.hp=Math.round(e.hp*scale);e.max=e.hp;}}
    faceTarget(){if(this.target&&!this.enemies.includes(this.target))this.target=null;if(this.target&&this.dash<=0&&this.attack<=0){const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);if(d>12||d<.01){if(d>12)this.target=null;return;}this.dx=dx/d;this.dy=dy/d;}}
    lockTarget(){const list=[...this.enemies].sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y));const i=this.target?list.indexOf(this.target):-1;this.target=list[i+1]||null;this.faceTarget();}
    startGuard(){if(this.s.gate||this.dash>0||this.guarding||this.stamina<.15)return false;this.cancelCombo();this.attack=0;this.strikePending=false;this.chargeHeld=false;this.chargeTime=0;this.guarding=true;this.guardAge=0;return true;}
    gainEnergy(n:number){this.s.energy=Math.min(100,this.s.energy+n*this.stats.energy);this.dirty=true;}
    awaken(){if(this.s.gate||this.s.energy<100||this.drive>0)return false;this.s.energy=0;this.drive=this.stats.driveDuration;this.driveSerial++;this.guarding=false;this.cancelCombo();this.attack=0;this.strikePending=false;this.chargeHeld=false;this.chargeTime=0;this.hurt=Math.max(this.hurt,.5);for(const e of this.enemies)if(Math.hypot(e.x-this.x,e.y-this.y)<3.5){e.exposed=2;this.damageEnemy(e,5+this.s.weaponRank);}this.burst(this.x,this.y,'#9df7ff');this.notice='awaken';this.clean();this.dirty=true;return true;}
    damageEnemy(e:Enemy,amount:number,effects=true){
        if(e.hp<=0)return;const critical=effects&&Math.random()<this.stats.crit,damage=amount*(critical?1.6:1),dealt=Math.min(e.hp,damage);
        e.hp-=damage;e.flash=.15;if(critical||this.attackMode==='charged')this.hitStop=Math.max(this.hitStop,.035);this.burst(e.x,e.y,critical?'#ffdd80':'#bfece5');this.floating.push({x:e.x,y:e.y-1,text:(critical?'! ':'')+damage.toFixed(damage<2?1:0),color:critical?'#ffe38f':'#efffe8',life:.7});if(this.floating.length>24)this.floating.shift();this.gainEnergy(3+dealt*1.2);
        if(effects&&this.stats.burn){e.burn=3;e.burnPower=this.stats.burn;}
        if(effects&&this.stats.chain&&this.chainCooldown<=0){const next=this.enemies.find(other=>other!==e&&other.hp>0&&Math.hypot(other.x-e.x,other.y-e.y)<2.6);if(next){this.chainCooldown=.35;this.links.push({x:e.x,y:e.y,tx:next.x,ty:next.y,life:.25});this.damageEnemy(next,damage*(.35+.1*this.stats.chain),false);this.burst(next.x,next.y,'#b7d6ff');}}
    }
    awardRelic(seed:number){const relic=RELICS[(this.s.chapter*3+seed)%RELICS.length];this.lootToast={id:relic.id,duplicate:this.s.relics.includes(relic.id),seconds:3};this.burst(this.x,this.y,'#ffeaa0');if(this.s.relics.includes(relic.id)){this.s.dust++;this.notice='dust';}else{this.s.relics.push(relic.id);this.s.relicRanks[relic.id]=1;if(this.s.equippedRelics.length<2)this.s.equippedRelics.push(relic.id);this.notice='relic';}this.dirty=true;}
    equipRelic(id:string){if(!this.s.relics.includes(id))return false;const i=this.s.equippedRelics.indexOf(id);if(i>=0)this.s.equippedRelics.splice(i,1);else if(this.s.equippedRelics.length<2)this.s.equippedRelics.push(id);else this.s.equippedRelics=[this.s.equippedRelics[1],id];this.dirty=true;return true;}
    upgradeRelic(id:string){const rank=this.s.relicRanks[id]||0;if(!this.s.relics.includes(id)||rank>=3||this.s.dust<rank*3)return false;this.s.dust-=rank*3;this.s.relicRanks[id]=rank+1;this.dirty=true;return true;}
    learnTalent(id:string){const t=TALENTS.find(t=>t.id===id);if(!t||this.s.talents.includes(id)||talentPoints(this.s)<t.cost||'requires'in t&&!this.s.talents.includes(t.requires))return false;this.s.talents.push(id);this.dirty=true;return true;}
    resetTalents(){this.s.talents=[];this.dirty=true;}
    setDifficulty(value:Difficulty){if(!['story','voyage','heroic'].includes(value))return;const old=this.s.difficulty==='heroic'?1.4:1,next=value==='heroic'?1.4:1;for(const e of this.enemies){const ratio=e.hp/e.max;e.max=Math.max(1,Math.round(e.max*next/old));e.hp=e.max*ratio;}this.s.difficulty=value;this.dirty=true;}
    startTrial(){if(!this.atTrial||this.s.gate)return false;this.cancelCombo();this.attack=0;this.strikePending=false;this.chargeHeld=false;this.guarding=false;this.target=null;this.trial={wave:1,elapsed:0};this.spawnTrial();this.notice='trialstart';return true;}
    spawnTrial(){this.target=null;for(let y=3;y<=11;y++)for(let x=3;x<=16;x++)this.map[y][x]=5;const count=this.trialKind==='hunt'?1:2+(this.trial?.wave||1);this.enemies=Array.from({length:count},(_,i)=>{const hp=this.trialKind==='hunt'?18+this.s.chapter*5:4+this.s.chapter+(this.trial?.wave||1);return{x:[13.5,15.5,6.5,4.5,10.5][i],y:[4.5,8.5,4.5,8.5,10.5][i],hp,max:hp,kind:enemyKind(this.s.chapter,this.s.room,i),elite:this.trialKind==='hunt',cool:1+i*.3,phase:0};});this.scaleEnemies();}
    newVoyagePlus(){if(!this.s.ending&&this.s.beacons.length<12)return false;const previous=this.s;this.s={...fresh(),...previous,cycle:previous.cycle+1,chapter:0,room:0,hp:previous.maxHp,beacons:[],choices:[],ending:false,postgame:false,cleared:[],solved:[],chests:[],visited:[],quests:[],foraged:[],changes:{},exploded:[],puzzles:{},skyTreasures:[],charts:[],gate:null,pendingTravel:null,realm:'surface',studySeconds:0,openingSeen:true,glideAwakened:true,energy:0};this.x=2.5;this.y=7.5;this.enter();this.dirty=true;return true;}
    tick(dt: number, dx: number, dy: number) {
        dt = Math.min(.035, Math.max(0, dt));
        this.time += dt;
        if(this.s.gate)return;
        if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return;}
        if(this.s.mealBuff){this.s.mealBuff.seconds=Math.max(0,this.s.mealBuff.seconds-dt);if(!this.s.mealBuff.seconds){this.s.mealBuff=null;this.dirty=true;}}
        for(const link of this.links)link.life-=dt;this.links=this.links.filter(link=>link.life>0);
        if(this.lootToast){this.lootToast.seconds-=dt;if(this.lootToast.seconds<=0)this.lootToast=null;}this.lastMove={x:dx,y:dy};if(this.guarding)this.guardAge+=dt;this.drive=Math.max(0,this.drive-dt);this.chainCooldown=Math.max(0,this.chainCooldown-dt);if(this.trial)this.trial.elapsed+=dt;for(const f of this.floating){f.life-=dt;f.y-=dt*.4;}this.floating=this.floating.filter(f=>f.life>0);
        this.counterWindow=Math.max(0,this.counterWindow-dt);
        if(this.chargeHeld){this.chargeTime=Math.min(1,this.chargeTime+dt);if(this.chargeAuto&&this.chargeTime>=.5&&this.attack<=0&&this.dash<=0)this.releaseCharge();}
        this.stepMechanism(dt);
        this.s.seconds += dt;this.s.studySeconds+=dt;
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
            this.stamina = Math.min(this.s.staminaMax, this.stamina + dt*.4*this.stats.regen*(this.guarding?.4:1)+(this.drive>0?dt*.3:0));
        if(this.inSky && SKY_UPDRAFTS.some(p=>Math.hypot(this.x-p.x,this.y-p.y)<.7))this.stamina=Math.min(this.s.staminaMax,this.stamina+dt*.9);
        const oldX = this.x, oldY = this.y, oldRoom = key(this.s);
        this.move(dx, dy, dt);this.faceTarget();
        const distance = oldRoom === key(this.s) ? Math.hypot(this.x - oldX, this.y - oldY) : 0;
        this.moving = distance > .0001;
        if (this.moving) this.walk += distance / WALK_SPEED;
        else if (this.gliding) this.walk += dt;
        if (![2, 7].includes(this.map[Math.floor(this.y)]?.[Math.floor(this.x)]))
            this.safe = { x: this.x, y: this.y };
        for (const f of this.fires) {
            f.life -= dt;
            if(!f.spread&&f.life<3&&this.weather!=='rain'&&!this.inSky&&this.s.room<8){f.spread=true;const x=Math.floor(f.x),y=Math.floor(f.y);for(const [ox,oy]of [[1,0],[-1,0],[0,1],[0,-1]])if(this.fires.length<32&&this.map[y+oy]?.[x+ox]===6){this.alter(x+ox,y+oy,1);this.fires.push({x:x+ox+.5,y:y+oy+.5,life:5});}}
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
            if((e.burn||0)>0){e.burn=Math.max(0,(e.burn||0)-dt);e.hp-=dt*1.2*(e.burnPower||1);}if(e.hp<=0)continue;
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
            if (this.enemyCan(nx, ny,e)) {
                e.x = nx;
                e.y = ny;
            }
            if (d < .65 && this.hurt <= 0)
                this.hit(e);
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
                        this.damageEnemy(e,p.damage??3);
                    }
                        else
                            this.notice = 'bossguard';
                        p.life = 0;
                        break;
                    }
            }
            else if (this.hurt <= 0 && Math.hypot(p.x - this.x, p.y - this.y) < .45) {
                this.hit(p);
                if(!p.friendly)p.life = 0;
            }
        }
        this.shots = this.shots.filter(p => p.life > 0);
        this.clean();
    }
    hit(source?:{x:number;y:number}) {
        const facing=!source||(source.x-this.x)*this.dx+(source.y-this.y)*this.dy>-.15;
        if(this.guarding&&facing&&this.guardAge<=.18&&this.stamina>=.15){this.stamina-=.15;this.counterWindow=1.4+this.stats.counterTime;this.hurt=.3;this.parrySerial++;this.hitStop=.045;this.gainEnergy(18);if(this.stats.tideSet)this.stamina=Math.min(this.s.staminaMax,this.stamina+.25);for(const p of this.shots)if(!p.friendly&&Math.hypot(p.x-this.x,p.y-this.y)<2.5){p.friendly=true;p.vx*=-1;p.vy*=-1;p.damage=4;}for(const e of this.enemies)if(Math.hypot(e.x-this.x,e.y-this.y)<2.5)e.exposed=2;this.burst(this.x,this.y,'#d3ffff');this.notice='parry';return;}
        const blocked=this.guarding&&facing&&this.stamina>=.25;if(blocked)this.stamina-=.25;else this.guarding=false;
        this.chargeHeld=false;this.chargeTime=0;this.counterWindow=0;this.cancelCombo();this.attack=0;this.strikePending=false;this.s.hp=Math.max(0,this.s.hp-(this.s.mealBuff?.kind==='guard'?.5:1)*this.stats.guard*(this.s.difficulty==='story'?.65:this.s.difficulty==='heroic'?1.25:1)*(blocked?.25:1)); this.hurt = 1; if (this.s.hp <= 0) {
        this.s.hp = this.s.maxHp;
        this.s.coins = Math.max(0, this.s.coins - 10);
        this.x = 2.5;
        this.y = 7.5;
        this.enter();
        this.notice = 'rescue';
        this.hurt = 2;
    } }
    resolveGate(correct: number) { if (correct <= 0 || this.s.gate !== key(this.s))
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
        this.s.solved.push(k);this.s.xp+=10;
        if (this.s.room >= 8)
            this.s.spirit++;
    } delete this.s.puzzles[k]; this.notice = 'solved'; this.dirty = true; }
    rememberPuzzle() { if(this.inSky)return; if (this.s.solved.includes(key(this.s)))
        return; const p: PuzzleSnapshot = this.mechanismInfo&&!['blocks','beam','circuit','ice'].includes(this.mechanismInfo.kind)?{kind:'mechanism',type:this.mechanismInfo.kind,progress:this.mechanism.progress,dial:this.mechanism.dial}:this.blocks ? { kind: 'blocks', boxes: this.blocks.boxes.map(b => ({ ...b })) } : this.beam ? { kind: 'beam', slash: this.beam.mirrors.map(m => m.slash) } : this.circuit ? { kind: 'circuit', bits: this.circuit.bits, moves: this.circuit.moves } : this.ice ? { kind: 'ice', x: this.ice.x, y: this.ice.y, steps: this.ice.steps } : { kind: 'lights', count: this.switches.length }; const k = key(this.s); if (JSON.stringify(this.s.puzzles[k]) !== JSON.stringify(p)) {
        this.s.puzzles[k] = p;
        this.hintTarget = null;
        this.dirty = true;
    } }
    restorePuzzle() { const p = this.s.puzzles[key(this.s)]; if (!p)
        return; if(p.kind==='mechanism'&&p.type===this.mechanismInfo?.kind){this.mechanism.progress=['balance','relay'].includes(p.type)?0:p.progress;this.mechanism.dial=p.dial;if(p.type==='tide'&&p.progress)this.drainChannel();}
        if (p.kind === 'blocks' && this.blocks && p.boxes.length === this.blocks.boxes.length && new Set(p.boxes.map(b => b.x + ',' + b.y)).size === p.boxes.length && p.boxes.every(b => b.x >= 7 && b.x <= 13 && b.y >= 3 && b.y <= 9 && this.map[b.y]?.[b.x] !== 3))
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
        return false; if(this.requestStudy('travel',chapter))return false;this.s.realm='surface';this.s.chapter = chapter; this.s.maxChapter = Math.max(this.s.maxChapter, chapter); this.s.room = 0; this.x = 2.5; this.y = 7.5; this.enter(); return true; }
    questProgress(i: number) { const prefix = this.s.chapter + ':', current = i === 0 ? this.s.chests.filter(k => k.startsWith(prefix)).length : i === 1 ? this.s.cleared.filter(k => k.startsWith(prefix) && k !== prefix + '0').length : this.s.solved.filter(k => k.startsWith(prefix)).length, target = i === 1 ? 4 : 3, complete = this.s.quests.includes(prefix + i); return { current, target, complete, ready: current >= target && !complete }; }
    quest(i: number) { if (i < 0 || i > 2 || !this.questProgress(i).ready)
        return false; this.s.quests.push(this.s.chapter + ':' + i);this.s.xp+=40; this.s.maxHp = Math.min(30, this.s.maxHp + 1); this.s.hp = this.s.maxHp; this.s.coins += 40; this.dirty = true; return true; }
}
