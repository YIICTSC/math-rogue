import { minimumAnswerers, MAX_ANSWERERS, MAX_SHOW_QUESTIONS, PARTY_CATEGORIES, MODES, type Actor, type Answer, type InkStroke, type Player, type Round, type ShowAction, type ShowError, type ShowQuestion, type ShowView, type ShowWorld } from './types';
import { checkWolfWinner, nightActors, startWolves, wolfAction } from './wolf';

const key = () => crypto.randomUUID();
const owns = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const finiteInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
export function cleanName(name: unknown): string {
  return typeof name === 'string' ? name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 20) : '';
}
export function normalizeAnswer(text: string): string {
  // Keep mathematical punctuation: 1.5 must never match 15, and 5! must not match 5.
  return text.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s、。,]/g, '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
}
export function numericAnswer(text: string): number | null {
  const s = text.normalize('NFKC').replace(/[,\s]/g, '').trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s); return Number.isFinite(n) && Math.abs(n) <= 1e15 ? n : null;
}
export function validInk(ink: unknown): ink is InkStroke[] {
  if (!Array.isArray(ink) || ink.length > 80) return false;
  let points = 0;
  for (const s of ink) {
    if (!s || !finiteInt(s.c, 0, 5) || !finiteInt(s.w, 2, 20) || !Array.isArray(s.p) || s.p.length < 2 || s.p.length % 2 || s.p.some((n: unknown) => !finiteInt(n, 0, 1000))) return false;
    points += s.p.length / 2;
  }
  return points <= 1800;
}
export function validQuestion(q: unknown): q is ShowQuestion {
  if (!q || typeof q !== 'object') return false;
  const v = q as ShowQuestion;
  return typeof v.id === 'string' && v.id.length > 0 && v.id.length <= 300 && typeof v.prompt === 'string' && v.prompt.trim().length > 0 && v.prompt.length <= 12000 &&
    typeof v.answer === 'string' && v.answer.length <= 3000 && Array.isArray(v.aliases) && v.aliases.length <= 12 && v.aliases.every(a => typeof a === 'string' && a.length <= 3000) &&
    Array.isArray(v.options) && v.options.length <= 6 && v.options.every(a => typeof a === 'string' && a.length > 0 && a.length <= 3000) &&
    ['TEXT', 'FLIP', 'CHOICE'].includes(v.format) && (v.format !== 'CHOICE' || (v.options.length >= 2 && new Set(v.options).size === v.options.length && (v.options.includes(v.answer) || (v.opinion === true && v.answer === '')))) &&
    (v.category === undefined || PARTY_CATEGORIES.slice(1).includes(v.category)) &&
    (v.party === undefined || typeof v.party === 'boolean') && (v.opinion === undefined || typeof v.opinion === 'boolean') && (v.freeDraw === undefined || typeof v.freeDraw === 'boolean') && (v.difficulty === undefined || ['EASY','NORMAL','HARD'].includes(v.difficulty)) &&
    finiteInt(v.seconds, 10, 600) && finiteInt(v.points, 10, 1000) &&
    (v.passage === undefined || (typeof v.passage === 'string' && v.passage.length <= 16000)) &&
    (v.audioPrompt === undefined || (typeof v.audioPrompt?.text === 'string' && v.audioPrompt.text.length <= 3000 && ['ja-JP', 'en-US', 'en-GB'].includes(v.audioPrompt.lang || 'ja-JP'))) &&
    new TextEncoder().encode(JSON.stringify(v)).length <= 48000;
}
export function validBank(bank: unknown): bank is ShowQuestion[] {
  return Array.isArray(bank) && bank.length >= 1 && bank.length <= MAX_SHOW_QUESTIONS && bank.every(validQuestion) && new Set(bank.map(q => q.id)).size === bank.length && new TextEncoder().encode(JSON.stringify(bank)).length <= 256000;
}
export function validBankForMode(mode: typeof MODES[number], bank: ShowQuestion[]) {
  return validBank(bank) && (mode !== 'DRAW' || bank.every(q => q.freeDraw || !!q.answer.trim())) && bank.every(q => (!q.freeDraw || mode==='DRAW') && (!q.opinion || ['NEAREST','DRAW','CONSENSUS','MAJORITY','WOLF','VOTE'].includes(mode)));
}
export function matchesPartyPlan(q: ShowQuestion, plan: ShowWorld['plan']) {
  return !q.party || ((!plan.partyLevel || plan.partyLevel==='ALL' || q.difficulty===plan.partyLevel) && (!plan.partyCategory || plan.partyCategory==='ALL' || q.category===plan.partyCategory));
}
export function createShow(title = 'みんなでクイズ', now = Date.now()): ShowWorld {
  return { revision: 1, title, mode: 'STANDARD', teamCount: 2, phase: 'lobby', players: {}, bank: [], index: 0, round: null, accepting: true, hostConnected: true, createdAt: now, wolf: null, overview: false, plan: { order: 'RANDOM', limit: 0, shuffleChoices: true, autoAdvance: true }, queue: [] };
}
export function addAnswerer(w: ShowWorld, id: string, name: unknown): ShowError | null {
  if (owns(w.players, id)) { w.players[id].connected = true; w.revision++; return null; }
  if (!cleanName(name)) return 'NAME';
  if (!w.accepting || w.phase === 'finished') return 'CLOSED';
  if (Object.keys(w.players).length >= MAX_ANSWERERS) return 'FULL';
  const sizes = Array.from({ length: w.teamCount }, (_, i) => Object.values(w.players).filter(p => p.team === i).length);
  w.players[id] = { id, name: cleanName(name), connected: true, score: 0, lives: 3, team: sizes.indexOf(Math.min(...sizes)) };
  w.revision++; return null;
}
export function disconnectAnswerer(w: ShowWorld, id: string) { if (owns(w.players, id) && w.players[id].connected) { w.players[id].connected = false; w.revision++; } }
export function hostConnection(w: ShowWorld, connected: boolean, now = Date.now()) {
  if (w.hostConnected === connected) return;
  w.hostConnected = connected;
  if (!connected && w.phase === 'open' && w.round && !w.round.paused) { w.round.remaining = Math.max(0, w.round.deadline - now); w.round.paused = true; }
  w.revision++;
}
function shuffle<T>(values: T[]) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function prepare(w: ShowWorld) {
  const queueIndex = w.wolf ? w.index % w.queue.length : w.index;
  const source = w.bank[w.queue[queueIndex]];
  const q = source && structuredClone(source);
  if (!q) { w.phase = 'finished'; return; }
  if (q.party) {
    if (w.mode === 'DRAW') {q.format='FLIP';q.freeDraw=!!w.plan.drawFree;if(q.freeDraw){q.answer='';q.aliases=[];}}
    else if(w.mode==='NEAREST') q.format='TEXT';
    else q.format=w.plan.partyFormat||q.format;
  }
  if (w.plan.shuffleChoices && q.format === 'CHOICE') q.options = shuffle(q.options);
  w.phase = 'ready';
  w.round = { id: key(), index: w.index, mode: w.mode, question: q, eligible: [], answers: {}, revealed: [], showAnswer: false, showJudgments: false,
    grades: {}, awards: {}, startLives: {}, deadline: 0, remaining: q.seconds * 1000, paused: false, artist: null,
    buzzer: null, buzzOrder: [], locked: [], votes: {}, consensus: null };
}
export function tickShow(w: ShowWorld, now = Date.now()) {
  if (w.phase === 'open' && w.round && !w.round.paused && now >= w.round.deadline && !(w.round.question.freeDraw && !w.round.question.answer)) {
    act(w, {id:'host',role:'host'}, {type:'close',roundId:w.round.id}, now, true);
  }
  const r = w.round;
  if (!r || w.plan.autoAdvance === false || w.autoPaused || !w.hostConnected || (w.phase === 'open' && r.paused)) { delete w.autoProgress; return; }
  const host: Actor = {id:'host',role:'host'};
  const run = (type: 'close'|'publish'|'score'|'next'|'open'|'voting') => act(w, host, {type,roundId:r.id}, now, true);
  const respondents = r.eligible.filter(id => id !== r.artist && (w.players[id]?.connected || r.answers[id]?.submitted));
  const allAnswered = respondents.length > 0 && respondents.every(id => r.answers[id]?.submitted);
  const buzzerWon = r.mode === 'BUZZER' && r.eligible.some(id => r.grades[id] === true);
  if (w.phase === 'open' && (allAnswered || buzzerWon)) run('close');
  if (['closed','reveal'].includes(w.phase)) {
    // Never infer the meaning of handwriting. Keep host overrides intact.
    judge(w, true);
    const canScore = ['NEAREST','VOTE'].includes(r.mode) ||
      (['CONSENSUS','WOLF','MAJORITY'].includes(r.mode) ? r.question.format !== 'FLIP' || (r.mode !== 'MAJORITY' && r.consensus !== null) : !pendingGrades(r));
    const newlyVisible = !r.showAnswer || r.revealed.length !== r.eligible.length;
    r.revealed = [...r.eligible]; r.showAnswer = true;
    if (newlyVisible) w.revision++;
    if (!canScore) { delete w.autoProgress; return; }
    if (r.mode !== 'VOTE' && !r.showJudgments) {
      // Non-competitive agreement and numeric ranks are evaluated by score.
      if (['STANDARD','BUZZER','SURVIVAL','TEAMS','DRAW'].includes(r.mode)) run('publish');
    }
    schedule(r.mode === 'VOTE' ? 'voting' : 'score', 3000);
  } else if (w.phase === 'voting') {
    const voters = respondents.filter(id => r.answers[id]?.submitted);
    if (voters.length > 1 && voters.every(id => r.votes[id])) schedule('score', 1000);
    else delete w.autoProgress;
  } else if (w.phase === 'scoreboard') schedule('next', 5000);
  else if (w.phase === 'ready') schedule('open', 2000);
  else delete w.autoProgress;
  function schedule(type: 'score'|'next'|'open'|'voting', delay: number) {
    const timer = w.autoProgress;
    if (!timer || timer.phase !== w.phase || timer.roundId !== r!.id) {
      w.autoProgress = {phase:w.phase,roundId:r!.id,at:now+delay}; return;
    }
    if (now < timer.at) return;
    delete w.autoProgress; run(type);
  }
}
function publishChoices(w: ShowWorld) {
  const r = w.round;
  if (!r || r.question.format !== 'CHOICE' || !['STANDARD','BUZZER','SURVIVAL','TEAMS'].includes(r.mode)) return;
  judge(w); r.revealed = [...r.eligible]; r.showAnswer = true; r.showJudgments = true; w.phase = 'reveal';
}
function markUnanswered(r: Round) { for (const id of r.eligible) if (id !== r.artist && !r.answers[id]?.submitted) r.grades[id] = false; }
function pendingGrades(r: Round) { return ['STANDARD', 'BUZZER', 'SURVIVAL', 'TEAMS'].includes(r.mode) && r.eligible.some(id => r.answers[id]?.submitted && !owns(r.grades, id)); }
function textCorrect(q: ShowQuestion, text: string) {
  if (q.format === 'CHOICE') return text === q.answer;
  const n = normalizeAnswer(text);
  return !!n && [q.answer, ...q.aliases].some(a => !!a.trim() && normalizeAnswer(a) === n);
}
function judge(w: ShowWorld, onlyMissing = false) {
  const r = w.round!;
  for (const id of r.eligible) {
    if (id === r.artist) continue;
    if (onlyMissing && owns(r.grades, id)) continue;
    const a = r.answers[id];
    if (!a?.submitted) { if (w.phase !== 'open') r.grades[id] = false; }
    else if (!r.question.opinion && !a.ink.length && r.question.answer.trim()) r.grades[id] = textCorrect(r.question, a.text);
  }
}
/** Recalculate from the round baseline. Repeated grading never duplicates scores or life loss. */
function settle(w: ShowWorld) {
  const r = w.round!, awards: Record<string, number> = {};
  const submitted = r.eligible.filter(id => r.answers[id]?.submitted);
  if (r.mode === 'VOTE') {
    for (const target of Object.values(r.votes)) awards[target] = (awards[target] || 0) + 10;
  } else if (r.mode === 'NEAREST') {
    const values = submitted.map(id=>({id,value:numericAnswer(r.answers[id].text)})).filter((a):a is {id:string;value:number}=>a.value!==null);
    const target = values.length ? values.reduce((n,a)=>n+a.value/values.length,0) : undefined;
    r.average=target;
    const ranked=values.map(a=>({id:a.id,distance:Math.abs(a.value-(target??0))})).sort((a,b)=>a.distance-b.distance);
    const distances:number[]=[];
    for(const a of ranked){let rank=distances.findIndex(d=>Math.abs(d-a.distance)<=Number.EPSILON*Math.max(1,d,a.distance,Math.abs(target??0))*2);if(rank<0){rank=distances.length;distances.push(a.distance);}awards[a.id]=Math.round(r.question.points*([1,.7,.5][rank]||.2));r.grades[a.id]=rank===0;}
  } else if (r.mode === 'CONSENSUS' || r.mode === 'WOLF') {
    const texts = submitted.map(id => normalizeAnswer(r.answers[id].text));
    const agree = r.consensus ?? (submitted.length === r.eligible.length && texts.length >= 2 && !!texts[0] && texts.every(t => t === texts[0]));
    for (const id of r.eligible) { r.grades[id] = agree; if (agree) awards[id] = r.question.points; }
    if (r.mode === 'WOLF' && w.wolf) {
      w.wolf.matches += (agree ? 1 : 0) - (r.agreementAwarded ? 1 : 0); r.agreementAwarded = agree;
      checkWolfWinner(w.wolf);
    }
  } else if (r.mode === 'MAJORITY') {
    if (r.question.format === 'FLIP') { for (const id of r.eligible) if (r.grades[id]) awards[id] = r.question.points; }
    else {
      const groups = new Map<string, string[]>();
      for (const id of submitted) { const t = normalizeAnswer(r.answers[id].text); if (t) groups.set(t, [...(groups.get(t) || []), id]); }
      const max = Math.max(2, ...[...groups.values()].map(a => a.length));
      for (const ids of groups.values()) for (const id of ids) { r.grades[id] = ids.length === max; if (r.grades[id]) awards[id] = r.question.points; }
    }
  } else {
    for (const id of r.eligible) if (r.grades[id]) awards[id] = r.question.points;
    if (r.mode === 'DRAW' && r.artist && Object.keys(awards).length) awards[r.artist] = Math.round(r.question.points / 2);
  }
  for (const p of Object.values(w.players)) {
    p.score += (awards[p.id] || 0) - (r.awards[p.id] || 0);
    if (r.mode === 'SURVIVAL' && r.eligible.includes(p.id)) p.lives = Math.max(0, r.startLives[p.id] - (r.grades[p.id] ? 0 : 1));
  }
  r.awards = awards;
}
function eligible(w: ShowWorld, id: string) { return !!w.round?.eligible.includes(id) && owns(w.players, id); }
function validText(t: unknown): t is string { return typeof t === 'string' && t.length <= 3000; }

export function act(w: ShowWorld, actor: Actor, raw: unknown, now = Date.now(), fromTick = false): ShowError | null {
  if (!fromTick) tickShow(w, now);
  if (!raw || typeof raw !== 'object' || typeof (raw as ShowAction).type !== 'string') return 'AUTH';
  const a = raw as ShowAction, r = w.round;
  if(a.type==='drawingTopic'){
    if(actor.role!=='player'||!r||r.id!==a.roundId||r.mode!=='DRAW'||!r.question.freeDraw||r.artist!==actor.id||w.phase!=='open'||!w.hostConnected||typeof a.text!=='string'||!a.text.trim()||a.text.length>80)return 'AUTH';
    if(r.question.answer)return r.question.answer===a.text.trim()?null:'ANSWER';
    r.question.answer=a.text.trim();r.deadline=now+r.question.seconds*1000;r.remaining=r.question.seconds*1000;w.revision++;return null;
  }
  if (a.type === 'wolfReview' || a.type === 'wolfVote' || a.type === 'wolfNight' || a.type === 'wolfResolve') {
    const result = wolfAction(w, actor, a);
    if (result === 'next') { w.index++; prepare(w); }
    else if (result) return result;
    w.revision++; return null;
  }
  const playerAction = a.type === 'answer' || a.type === 'buzz' || a.type === 'vote';
  if (playerAction) {
    if (actor.role !== 'player' || !eligible(w, actor.id) || !w.hostConnected) return 'AUTH';
    if (!r || a.roundId !== r.id) return 'LATE';
    if (a.type === 'vote') {
      if (w.phase !== 'voting' || r.mode !== 'VOTE' || a.playerId === actor.id || !r.eligible.includes(a.playerId) || !r.answers[a.playerId]?.submitted) return 'VOTE';
      r.votes[actor.id] = a.playerId;
    } else {
      if (w.phase !== 'open' || r.paused || now >= r.deadline) return 'LATE';
      if (a.type === 'buzz') {
        if (r.mode !== 'BUZZER' || r.buzzer || r.locked.includes(actor.id) || r.answers[actor.id]?.submitted) return 'BUZZ';
        r.buzzer = actor.id; r.buzzOrder.push(actor.id);
      } else {
        if (r.mode === 'BUZZER' && r.buzzer !== actor.id) return 'BUZZ';
        if (r.answers[actor.id]?.submitted) return 'ANSWER';
        if (!validText(a.text) || !validInk(a.ink) || typeof a.submit !== 'boolean') return 'ANSWER';
        const format = r.mode === 'NEAREST' || (r.mode === 'DRAW' && r.artist !== actor.id) ? 'TEXT' : r.question.format;
        const artist = r.mode === 'DRAW' && r.artist === actor.id;
        if (artist && a.submit) return 'ANSWER'; // Artist keeps drawing until the host closes the round.
        if (!artist && r.question.freeDraw && !r.question.answer) return 'PHASE';
        if (!artist && format === 'CHOICE' && !r.question.options.includes(a.text)) return 'ANSWER';
        if (!artist && format !== 'FLIP' && a.ink.length) return 'ANSWER';
        if (a.submit && !a.text.trim() && !a.ink.length) return 'ANSWER';
        if (a.submit && r.mode === 'NEAREST' && numericAnswer(a.text) === null) return 'ANSWER';
        r.answers[actor.id] = { text: a.text.replace(/[\u0000-\u0008\u000b-\u001f]/g, ''), ink: a.ink.map(s => ({ c: s.c, w: s.w, p: [...s.p] })), submitted: a.submit, revision: (r.answers[actor.id]?.revision || 0) + 1 };
        if (a.submit && r.mode === 'BUZZER' && format === 'TEXT' && w.plan.autoAdvance !== false && r.question.answer.trim()) {
          r.grades[actor.id] = textCorrect(r.question,a.text);
          if (!r.grades[actor.id]) { r.locked.push(actor.id); r.buzzer = null; }
        }
        if (a.submit && format === 'CHOICE' && !artist && !r.question.opinion) {
          r.grades[actor.id] = a.text === r.question.answer;
          if (r.mode === 'BUZZER' && !r.grades[actor.id]) { r.locked.push(actor.id); r.buzzer = null; }
        }
      }
    }
  } else {
    if (actor.role !== 'host') return 'AUTH';
    if ('roundId' in a && a.roundId !== undefined && a.roundId !== r?.id) return 'LATE';
    const between = ['lobby', 'ready', 'scoreboard', 'finished'].includes(w.phase);
    switch (a.type) {
      case 'configure':
        if (!between || !MODES.includes(a.mode) || typeof a.title !== 'string' || a.title.trim().length < 1 || a.title.length > 80 || !finiteInt(a.teamCount, 2, 8)) return 'PHASE';
        if ((w.wolf || a.mode === 'WOLF') && !['lobby', 'finished'].includes(w.phase)) return 'PHASE';
        w.title = a.title.trim(); w.mode = a.mode; w.teamCount = a.teamCount;
        if (a.mode === 'WOLF') w.plan.limit = 0;
        for (const p of Object.values(w.players)) p.team %= w.teamCount;
        if (w.phase === 'ready' && r) r.mode = a.mode;
        break;
      case 'bank':
        if (!['lobby', 'finished'].includes(w.phase) || !validBank(a.questions)) return 'QUESTION';
        if (a.source !== undefined && (typeof a.source !== 'string' || a.source.length > 160)) return 'QUESTION';
        w.questionSource = a.source || ''; w.autoPaused = false;
        w.bank = structuredClone(a.questions); w.index = 0; w.round = null; w.phase = 'lobby'; w.wolf = null; w.queue = []; w.plan.limit = Math.min(w.plan.limit, w.bank.length);
        break;
      case 'plan': {
        const next = {...w.plan,...a};
        if (!['lobby', 'finished'].includes(w.phase) || !['SEQUENTIAL', 'RANDOM'].includes(next.order) || !finiteInt(next.limit, 0, MAX_SHOW_QUESTIONS) || typeof next.shuffleChoices !== 'boolean' || (next.autoAdvance !== undefined && typeof next.autoAdvance !== 'boolean')) return 'PHASE';
        if ((next.partyCategory!==undefined&&!PARTY_CATEGORIES.includes(next.partyCategory))||(next.partyFormat!==undefined&&!['TEXT','FLIP','CHOICE'].includes(next.partyFormat))||(next.partyLevel!==undefined&&!['ALL','EASY','NORMAL','HARD'].includes(next.partyLevel))||(next.drawFree!==undefined&&typeof next.drawFree!=='boolean'))return 'QUESTION';
        w.plan = {order:next.order,limit:next.limit,shuffleChoices:next.shuffleChoices,autoAdvance:next.autoAdvance??w.plan.autoAdvance??true,partyFormat:next.partyFormat??w.plan.partyFormat??'TEXT',partyLevel:next.partyLevel??w.plan.partyLevel??'ALL',partyCategory:next.partyCategory??w.plan.partyCategory??'ALL',drawFree:next.drawFree??w.plan.drawFree??false}; break;
      }
      case 'start':
        if (!validBankForMode(w.mode,w.bank)) return 'QUESTION';
        if (w.phase !== 'lobby' || !w.bank.length || Object.values(w.players).filter(p => p.connected).length < minimumAnswerers(w.mode)) return 'PHASE';
        if (w.mode === 'WOLF') {
          const ids = Object.values(w.players).filter(p => p.connected).map(p => p.id); if (ids.length < 3) return 'PHASE';
          w.wolf = startWolves(ids); w.accepting = false;
        }
        for (const p of Object.values(w.players)) { p.score = 0; p.lives = 3; }
        const all = w.bank.map((_, i) => i).filter(i=>matchesPartyPlan(w.bank[i],w.plan)), ordered = w.plan.order === 'RANDOM' ? shuffle(all) : all;
        w.queue = w.wolf || !w.plan.limit ? ordered : ordered.slice(0, w.plan.limit);
        if (!ordered.length) return 'QUESTION';
        w.autoPaused = false; w.index = 0; prepare(w); break;
      case 'open':
        if (w.phase !== 'ready' || !r) return 'PHASE';
        r.eligible = Object.values(w.players).filter(p => (w.wolf ? owns(w.wolf.seats, p.id) : p.connected) && (r.mode !== 'SURVIVAL' || p.lives > 0)).map(p => p.id);
        if (r.eligible.length < minimumAnswerers(r.mode)) return 'PHASE';
        if (r.mode === 'DRAW') { if (!r.question.freeDraw && !r.question.answer.trim()) return 'QUESTION'; r.artist = r.eligible[w.index % r.eligible.length]; }
        r.startLives = Object.fromEntries(Object.values(w.players).map(p => [p.id, p.lives]));
        r.deadline = now + r.question.seconds * 1000; r.remaining = r.question.seconds * 1000; w.phase = 'open'; break;
      case 'close':
        if (w.phase !== 'open' || !r) return 'PHASE';
        r.remaining = r.paused ? r.remaining : Math.max(0, r.deadline - now); markUnanswered(r); if(r.mode==='NEAREST'){const values=r.eligible.filter(id=>r.answers[id]?.submitted).map(id=>numericAnswer(r.answers[id].text)).filter((v):v is number=>v!==null);r.average=values.length?values.reduce((n,v)=>n+v/values.length,0):undefined;} w.phase = 'closed'; publishChoices(w); break;
      case 'autoPause':
        if (!r || ['lobby','finished'].includes(w.phase)) return 'PHASE';
        w.autoPaused = !w.autoPaused; delete w.autoProgress; break;
      case 'pause':
        if (w.phase !== 'open' || !r) return 'PHASE';
        if (!r.paused) r.remaining = Math.max(0, r.deadline - now); else r.deadline = now + r.remaining;
        r.paused = !r.paused; break;
      case 'extraTime':
        if (!r || w.phase !== 'open') return 'PHASE';
        if (r.paused) r.remaining = Math.min(600000, r.remaining + 10000); else r.deadline = Math.min(now + 600000, r.deadline + 10000);
        break;
      case 'reveal': case 'revealAll': case 'revealAnswer':
        if (!r || !['closed', 'reveal'].includes(w.phase)) return 'PHASE';
        w.phase = 'reveal';
        if (a.type === 'revealAnswer') r.showAnswer = true;
        else if (a.type === 'revealAll') r.revealed = [...r.eligible];
        else if (a.type === 'reveal') { if (!r.eligible.includes(a.playerId)) return 'ANSWER'; if (!r.revealed.includes(a.playerId)) r.revealed.push(a.playerId); }
        break;
      case 'autoJudge':
        if (!r || !['open', 'closed', 'reveal', 'scoreboard'].includes(w.phase)) return 'PHASE';
        judge(w); if (w.phase === 'scoreboard') settle(w); break;
      case 'grade':
        if (!r || !r.eligible.includes(a.playerId) || typeof a.correct !== 'boolean' || !['open', 'closed', 'reveal', 'scoreboard'].includes(w.phase)) return 'PHASE';
        r.grades[a.playerId] = a.correct;
        if (w.phase === 'open' && !a.correct && r.buzzer === a.playerId) { r.locked.push(a.playerId); r.buzzer = null; }
        if (w.phase === 'scoreboard') settle(w); break;
      case 'consensus':
        if (!r || !['CONSENSUS', 'WOLF'].includes(r.mode) || typeof a.agree !== 'boolean' || !['open', 'closed', 'reveal', 'scoreboard'].includes(w.phase)) return 'PHASE';
        r.consensus = a.agree; if (w.phase === 'scoreboard') settle(w); break;
      case 'voting':
        if (!r || r.mode !== 'VOTE' || !['closed', 'reveal'].includes(w.phase)) return 'PHASE';
        r.revealed = [...r.eligible]; w.phase = 'voting'; break;
      case 'publish':
        if (!r || !['closed', 'reveal'].includes(w.phase)) return 'PHASE';
        if (pendingGrades(r)) return 'ANSWER';
        r.revealed = [...r.eligible]; r.showAnswer = true; r.showJudgments = true; w.phase = 'reveal'; break;
      case 'score':
        if (!r || !['closed', 'reveal', 'voting', 'scoreboard'].includes(w.phase) || (r.mode === 'VOTE' && !['voting', 'scoreboard'].includes(w.phase))) return 'PHASE';
        if (['CONSENSUS', 'WOLF'].includes(r.mode) && r.question.format === 'FLIP' && r.consensus === null) return 'ANSWER';
        if (pendingGrades(r)) return 'ANSWER';
        if (r.mode === 'DRAW') judge(w, true);
        r.revealed = [...r.eligible]; r.showAnswer = true; r.showJudgments = true; settle(w);
        const survivors = Object.values(w.players).filter(p => p.lives > 0).length;
        w.phase = w.wolf?.winner || (r.mode === 'SURVIVAL' && (survivors === 0 || (Object.keys(w.players).length > 1 && survivors === 1))) ? 'finished' : 'scoreboard'; break;
      case 'next':
        if (w.wolf && w.phase === 'dawn') { w.index++; prepare(w); break; }
        if (w.phase !== 'scoreboard') return 'PHASE';
        if (w.wolf && (w.index + 1) % 5 === 0) { w.wolf.review = {}; w.wolf.votes = {}; w.phase = 'review'; break; }
        w.index++; prepare(w); break;
      case 'finish': w.phase = 'finished'; break;
      case 'accepting': if (typeof a.value !== 'boolean' || (w.wolf && w.phase !== 'finished')) return 'AUTH'; w.accepting = a.value; break;
      case 'layout': if (typeof a.overview !== 'boolean') return 'AUTH'; w.overview = a.overview; break;
      case 'balance':
        if (!between) return 'PHASE';
        Object.values(w.players).forEach((p, i) => { p.team = i % w.teamCount; }); break;
      case 'team':
        if (!between || !owns(w.players, a.playerId) || !finiteInt(a.team, 0, w.teamCount - 1)) return 'PHASE';
        w.players[a.playerId].team = a.team; break;
      case 'adjust':
        if (!owns(w.players, a.playerId) || !finiteInt(a.delta, -1000, 1000)) return 'ANSWER';
        w.players[a.playerId].score = Math.max(-1000000, Math.min(1000000, w.players[a.playerId].score + a.delta)); break;
      case 'remove':
        if (!owns(w.players, a.playerId) || !between || (w.wolf && w.phase !== 'finished')) return 'PHASE';
        delete w.players[a.playerId]; break;
      default: return 'AUTH';
    }
  }
  w.revision++; return null;
}
export function viewFor(w: ShowWorld, actor: Actor, now = Date.now()): ShowView {
  const r = w.round, host = actor.role === 'host';
  const qVisible = w.phase !== 'ready';
  const v: ShowView = { revision: w.revision, serverNow: now, title: w.title, mode: w.mode, teamCount: w.teamCount, phase: w.phase,
    autoPaused: !!w.autoPaused, audienceScreens: w.audienceScreens || 0, questionSource: w.questionSource || '',
    accepting: w.accepting, hostConnected: w.hostConnected, players: Object.values(w.players).map(p => ({ ...p })), self: actor.id, role: actor.role, questionCount: w.queue.length || Math.min(w.bank.filter(q=>matchesPartyPlan(q,w.plan)).length, w.plan.limit || MAX_SHOW_QUESTIONS), index: w.index, overview: !!w.overview, plan: { ...w.plan }, round: null };
  if (host) v.host = { bank: w.bank };
  if (w.wolf) {
    const g = w.wolf, mine = g.seats[actor.id];
    v.wolf = { matches: g.matches, goal: g.goal, winner: g.winner, active: Object.entries(g.seats).filter(([, s]) => s.active).map(([id]) => id),
      reviewCount: Object.keys(g.review).length, voteCount: Object.keys(g.votes).length, nightCount: host ? Object.keys(g.night).length : 0, nightTotal: host ? nightActors(g).length : 0,
      myReview: g.review[actor.id], myVote: g.votes[actor.id], myNight: g.night[actor.id], event: g.event,
      ...(mine ? { mine: structuredClone(mine), ...(mine.role === 'WOLF' && mine.active ? { allies: Object.entries(g.seats).filter(([, s]) => s.active && s.role === 'WOLF').map(([id]) => id) } : {}) } : {}),
      ...(host || g.winner ? { roles: structuredClone(g.seats) } : {}) };
  }
  if (r) {
    const secretDrawing = r.mode === 'DRAW' && !r.showAnswer && actor.id !== r.artist && !host;
    const q = r.question;
    v.round = { id: r.id, mode: r.mode, prompt: qVisible && !secretDrawing ? q.prompt : '',
      format: r.mode === 'NEAREST' || (r.mode === 'DRAW' && actor.id !== r.artist) ? 'TEXT' : q.format,
      options: qVisible && !secretDrawing && r.mode !== 'DRAW' ? q.options : [],
      ...(qVisible && !secretDrawing && r.mode !== 'DRAW' ? { passage: q.passage, visual: q.visual, audioPrompt: q.audioPrompt } : {}),
      seconds: q.seconds, points: q.points, deadline: r.deadline, remaining: r.remaining, paused: r.paused,
      eligible: [...r.eligible], artist: r.artist, buzzer: r.buzzer, buzzOrder: [...r.buzzOrder], locked: [...r.locked],
      freeDraw:!!q.freeDraw,topicReady:!!q.answer,...(r.showAnswer&&r.mode==='NEAREST'&&r.average!==undefined?{average:r.average}:{}),
      showAnswer: r.showAnswer, showJudgments: r.showJudgments, consensus: r.consensus, votedFor: r.votes[actor.id],
      ...(host || r.showAnswer || (r.mode === 'DRAW' && actor.id === r.artist) ? { answer: r.mode==='NEAREST' ? (r.average===undefined?'':String(Number(r.average.toFixed(6)))) : q.answer } : {}),
      tiles: r.eligible.map(id => {
        const a = r.answers[id], revealed = r.revealed.includes(id);
        const collecting = actor.role === 'screen' && ['ready','open','closed'].includes(w.phase);
        const visible = (!collecting && (host || actor.id === id || revealed)) || (r.mode === 'DRAW' && id === r.artist && qVisible);
        return { id, submitted: !!a?.submitted, revealed, visible, ...(visible && a ? { text: a.text } : {}),
          inkRevision: visible && a?.ink.length ? a.revision : 0, hasInk: visible && !!a?.ink.length,
          ...(!collecting && (host || r.showJudgments || w.phase === 'scoreboard' || w.phase === 'finished') ? { correct: r.grades[id], award: r.awards[id] } : {}),
          ...(w.phase === 'scoreboard' || host ? { votes: Object.values(r.votes).filter(t => t === id).length } : {}) };
      }) };
  }
  return v;
}
/** Ink is fetched separately: private flips never enter a public state packet. */
export function inkFor(w: ShowWorld, actor: Actor, roundId: string, playerId: string): Answer | null {
  const r = w.round;
  if (!r || r.id !== roundId || !owns(r.answers, playerId)) return null;
  const collecting = actor.role === 'screen' && ['ready','open','closed'].includes(w.phase);
  const permitted = (!collecting && (actor.role === 'host' || actor.id === playerId || r.revealed.includes(playerId))) || (r.mode === 'DRAW' && r.artist === playerId && w.phase !== 'ready');
  return permitted ? r.answers[playerId] : null;
}
