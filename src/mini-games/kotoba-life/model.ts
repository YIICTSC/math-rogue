import {COZY_CHATS,cozyChat,CASUAL_REPLIES} from './cozyDialogue';
import { ROOM_TOPICS, PERSONA, type ReplyId } from './dialogueCorpus';
import {
  CHARACTERS, CHARACTER_IDS, ROOM_IDS, NPC_IDS, CATEGORY_IDS, words,
  type CharacterId, type RoomId, type NpcId, type WordCategory, type Localized,
} from './data';

export const SAVE_KEY = 'learning-rogue:kotoba-life:v1';
export const MAX_ENERGY = 6;
export const MAX_WORDS = 600;
export const MAX_WORD_LENGTH = 24;
const MAX_MEMORIES = 36;

export type Reaction = 'idle' | 'happy' | 'think' | 'wave' | 'eat' | 'sleep' | 'surprise' | 'shy' | 'dance';
export type CareAction = 'feed' | 'play' | 'rest' | 'pet';
export type Mood = 'content' | 'happy' | 'curious' | 'sleepy';
export interface LearnedWord { id: string; value: string; category: WordCategory; reading?: string; learnedAt: number }
export interface Memory { id: string; at: number; text: Localized }
export interface CompanionState {
  words: LearnedWord[];
  affinity: number;
  satiety: number;
  rest: number;
  mood: Mood;
  traits: { curiosity: number; kindness: number; creativity: number };
  talkCount: number;
  outings: number;
  friendships: Record<NpcId, number>;
  memories: Memory[];
}
export interface LifeState {
  version: 1;
  started: boolean;
  character: CharacterId;
  room: RoomId;
  energy: number;
  companions: Record<CharacterId, CompanionState>;
  createdAt: number;
  lastPlayed: number;
}
export interface DialogueLine { speaker: 'pet' | 'npc' | 'narrator'; text: Localized; reaction: Reaction }
export interface Dialogue { id: string; kind: 'talk' | 'care' | 'learn' | 'town'; npcId?: NpcId; lines: DialogueLine[]; choices?: {id: ReplyId; label:Localized}[]; chatId?:string }
export interface Interaction { state: LifeState; dialogue: Dialogue }
export type TeachStatus = 'learned' | 'duplicate' | 'empty' | 'too-long' | 'no-energy' | 'full' | 'reading-required' | 'invalid-reading';
export interface TeachResult { state: LifeState; status: TeachStatus; dialogue?: Dialogue }
interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value));
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown, fallback: number, max = 100, min = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.floor(clamp(value, min, max)) : fallback;
const clean = (value: string): string => value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').normalize('NFC').trim();
const wordKey = (value: string): string => clean(value).normalize('NFKC').toLocaleLowerCase('en');
const has = <T extends string>(values: readonly T[], value: unknown): value is T => typeof value === 'string' && values.includes(value as T);

function freshCompanion(id: CharacterId): CompanionState {
  const traits = { curiosity: 12, kindness: 12, creativity: 12 };
  if (id === 'mugi' || id === 'kohaku') traits.kindness = 24;
  if (id === 'momo') traits.creativity = 24;
  if (id === 'sora' || id === 'pico') traits.curiosity = 24;
  return { words: [], affinity: 0, satiety: 75, rest: 80, mood: 'content', traits, talkCount: 0, outings: 0,
    friendships: { bakery: 0, florist: 0, station: 0 }, memories: [] };
}

export function freshState(now = Date.now()): LifeState {
  return { version: 1, started: false, character: 'mugi', room: 'sunroom', energy: MAX_ENERGY,
    companions: Object.fromEntries(CHARACTER_IDS.map(id => [id, freshCompanion(id)])) as LifeState['companions'],
    createdAt: now, lastPlayed: now };
}

/** Repair individual fields instead of throwing away all five friends for one damaged value. */
export function parseState(raw: unknown, now = Date.now()): LifeState {
  const fresh = freshState(now);
  if (!isRecord(raw) || raw.version !== 1) return fresh;
  const state: LifeState = { ...fresh,
    started: raw.started === true,
    character: has(CHARACTER_IDS, raw.character) ? raw.character : fresh.character,
    room: has(ROOM_IDS, raw.room) ? raw.room : fresh.room,
    energy: number(raw.energy, MAX_ENERGY, MAX_ENERGY),
    createdAt: number(raw.createdAt, now, Number.MAX_SAFE_INTEGER),
    lastPlayed: number(raw.lastPlayed, now, Number.MAX_SAFE_INTEGER),
  };
  const source = isRecord(raw.companions) ? raw.companions : {};
  for (const id of CHARACTER_IDS) {
    const candidate = source[id];
    if (!isRecord(candidate)) continue;
    const base = freshCompanion(id);
    const traits = isRecord(candidate.traits) ? candidate.traits : {};
    const friendships = isRecord(candidate.friendships) ? candidate.friendships : {};
    const seen = new Set<string>();
    const learned: LearnedWord[] = [];
    for (const item of (Array.isArray(candidate.words) ? candidate.words : []).slice(0, MAX_WORDS * 2)) {
      if (!isRecord(item) || typeof item.value !== 'string' || !has(CATEGORY_IDS, item.category)) continue;
      const value = clean(item.value);
      if (!value || [...value].length > MAX_WORD_LENGTH || seen.has(wordKey(value))) continue;
      seen.add(wordKey(value));
      learned.push({ id: typeof item.id === 'string' ? clean(item.id).slice(0,120) : `word-${id}-${learned.length}`, value, reading: typeof item.reading === 'string' ? clean(item.reading).slice(0,60) : undefined, category: item.category, learnedAt: number(item.learnedAt, now, Number.MAX_SAFE_INTEGER) });
      if (learned.length === MAX_WORDS) break;
    }
    const memories: Memory[] = [];
    for (const item of (Array.isArray(candidate.memories) ? candidate.memories : []).slice(-MAX_MEMORIES)) {
      if (!isRecord(item) || !isRecord(item.text) || typeof item.text.ja !== 'string' || typeof item.text.en !== 'string') continue;
      memories.push({ id: typeof item.id === 'string' ? clean(item.id).slice(0,120) : `memory-${id}-${memories.length}`, at: number(item.at, now, Number.MAX_SAFE_INTEGER),
        text: words(clean(item.text.ja).slice(0, 500), clean(item.text.en).slice(0, 500)) });
    }
    state.companions[id] = {
      words: learned, memories,
      affinity: number(candidate.affinity, 0, 999), satiety: number(candidate.satiety, base.satiety), rest: number(candidate.rest, base.rest),
      mood: has(['content', 'happy', 'curious', 'sleepy'] as const, candidate.mood) ? candidate.mood : 'content',
      traits: { curiosity: number(traits.curiosity, base.traits.curiosity), kindness: number(traits.kindness, base.traits.kindness), creativity: number(traits.creativity, base.traits.creativity) },
      talkCount: number(candidate.talkCount, 0, 1_000_000), outings: number(candidate.outings, 0, 1_000_000),
      friendships: { bakery: number(friendships.bakery, 0, 999), florist: number(friendships.florist, 0, 999), station: number(friendships.station, 0, 999) },
    };
  }
  return state;
}

export function loadState(storage?: StoragePort): LifeState {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(SAVE_KEY);
    return raw ? parseState(JSON.parse(raw)) : freshState();
  } catch { return freshState(); }
}

/** False means the UI should explain that this session cannot be saved. */
export function saveState(state: LifeState, storage?: StoragePort): boolean {
  try { (storage ?? globalThis.localStorage).setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

export const currentCompanion = (state: LifeState): CompanionState => state.companions[state.character];
export const selectCharacter = (state: LifeState, id: CharacterId): LifeState =>
  has(CHARACTER_IDS, id) ? { ...state, started: true, character: id, lastPlayed: Date.now() } : state;
export const selectRoom = (state: LifeState, id: RoomId): LifeState =>
  has(ROOM_IDS, id) ? { ...state, room: id, lastPlayed: Date.now() } : state;

export function bondStage(points: number): Localized {
  if (points >= 160) return words('かけがえのない相棒', 'An irreplaceable friend');
  if (points >= 80) return words('気の合うふたり', 'Kindred spirits');
  if (points >= 30) return words('なかよし', 'Good friends');
  if (points >= 8) return words('顔なじみ', 'Getting comfortable');
  return words('はじめまして', 'A new beginning');
}
export function friendshipStage(points: number): Localized {
  if (points >= 24) return words('いつもの友だち', 'A familiar friend');
  if (points >= 9) return words('顔なじみ', 'A familiar face');
  if (points > 0) return words('ごあいさつ', 'First hellos');
  return words('まだ会っていない', 'Yet to meet');
}
export function dominantTrait(companion: CompanionState): Localized {
  const { curiosity, kindness, creativity } = companion.traits;
  if (creativity > curiosity && creativity > kindness) return words('空想じょうず', 'Imaginative');
  if (kindness >= curiosity) return words('思いやりいっぱい', 'Warmhearted');
  return words('知りたがり', 'Curious');
}

function changeCompanion(state: LifeState, companion: CompanionState): LifeState {
  return { ...state, started: true, lastPlayed: Date.now(), companions: { ...state.companions, [state.character]: companion } };
}
function remember(companion: CompanionState, label: Localized, now = Date.now()): CompanionState {
  return { ...companion, memories: [...companion.memories,
    { id: `memory-${now}-${companion.talkCount}-${companion.outings}-${companion.memories.length}`, at: now, text: label }].slice(-MAX_MEMORIES) };
}
const line = (speaker: DialogueLine['speaker'], ja: string, en: string, reaction: Reaction = 'idle'): DialogueLine => ({ speaker, text: words(ja, en), reaction });
const pet = (ja: string, en: string, reaction: Reaction = 'idle') => line('pet', ja, en, reaction);
const npc = (ja: string, en: string, reaction: Reaction = 'think') => line('npc', ja, en, reaction);
const narration = (ja: string, en: string, reaction: Reaction = 'idle') => line('narrator', ja, en, reaction);
const dialogue = (state: LifeState, kind: Dialogue['kind'], lines: DialogueLine[], npcId?: NpcId): Dialogue =>
  ({ id: `${kind}-${state.character}-${currentCompanion(state).talkCount}-${currentCompanion(state).outings}-${currentCompanion(state).words.length}`, kind, lines, ...(npcId ? { npcId } : {}) });

export function initialDialogue(state: LifeState, hour = new Date().getHours()): Dialogue {
  const companion = currentCompanion(state);
  const hello = hour < 5 || hour >= 21 ? words('夜は、音がちょっとやわらかいね。', 'Sounds feel a little softer at night.')
    : hour < 11 ? words('おはよう。今日はどんな言葉に会えるかな。', 'Good morning. What words will we meet today?')
      : hour < 17 ? words('おかえり。日なたを少し、とっておいたよ。', 'Welcome back. I saved you a little patch of sunlight.')
        : words('夕方の空って、毎日ちがう色だね。', 'The evening sky is a different color every day.');
  return dialogue(state, 'talk', [pet(hello.ja, hello.en, 'wave'), companion.affinity < 8
    ? pet('ここで、一緒にのんびりしよう。知らない言葉も、教えてね。', "Let's take our time here together. You can teach me new words, too.", 'happy')
    : pet('また会えてうれしい。今日は、何から始めようか。', "I'm glad you're here again. What shall we do first?", 'happy')]);
}

const learnResponses: Record<CharacterId, Localized> = {
  mugi: words('ゆっくり言うと、もっと覚えられる気がする。', 'Saying it slowly makes it feel easier to remember.'),
  momo: words('その言葉の、小さな物語が浮かんできた！', 'A tiny story about that word just popped into my head!'),
  sora: words('今度、お出かけしたら探してみよう！', "Let's look for it next time we go out!"),
  kohaku: words('大事な言葉、ひとつ増えた。ありがとう。', 'One more word to treasure. Thank you.'),
  pico: words('記録完了。……頭の中のノートだけどね。', 'Recorded. ...In the notebook inside my head, anyway.'),
};

export function teachWord(state: LifeState, input: string, category: WordCategory, readingInput = ''): TeachResult {
  const value = clean(input);
  const companion = currentCompanion(state);
  if (!value || !has(CATEGORY_IDS, category)) return { state, status: 'empty' };
  if ([...value].length > MAX_WORD_LENGTH) return { state, status: 'too-long' };
  if (companion.words.some(word => wordKey(word.value) === wordKey(value))) return { state, status: 'duplicate' };
  if (companion.words.length >= MAX_WORDS) return { state, status: 'full' };
  const reading = clean(readingInput) || value;
  if (!/^[ぁ-ゖァ-ヺー・ 　]+$/u.test(reading)) return {state,status:readingInput ? 'invalid-reading' : 'reading-required'};
  if (state.energy < 1) return { state, status: 'no-energy' };
  const now = Date.now();
  const trait = category === 'feeling' || category === 'person' ? 'kindness' : category === 'activity' || category === 'thing' ? 'creativity' : 'curiosity';
  let next: CompanionState = { ...companion,
    words: [...companion.words, { id: `word-${state.character}-${now}-${companion.words.length}`, value, reading, category, learnedAt: now }],
    affinity: clamp(companion.affinity + 3, 0, 999), mood: 'curious', traits: { ...companion.traits, [trait]: clamp(companion.traits[trait] + 4) },
  };
  next = remember(next, words(`「${value}」という言葉を教えてもらった。`, `Learned the word “${value}” together.`), now);
  const changed = { ...changeCompanion(state, next), energy: state.energy - 1 };
  const response = learnResponses[state.character];
  return { state: changed, status: 'learned', dialogue: dialogue(changed, 'learn', [
    pet(`「${value}」……。うん、覚えたよ！`, `“${value}”... Got it! I'll remember.`, 'surprise'),
    pet(response.ja, response.en, 'happy'),
  ]) };
}

export function removeWord(state: LifeState, wordId: string): LifeState {
  const companion = currentCompanion(state);
  if (!companion.words.some(word => word.id === wordId)) return state;
  return changeCompanion(state, { ...companion, words: companion.words.filter(word => word.id !== wordId) });
}

export function rechargeEnergy(state: LifeState, correctCount: number): LifeState {
  if (!Number.isFinite(correctCount) || correctCount <= 0) return state;
  return { ...state, energy: Math.min(MAX_ENERGY, state.energy + Math.floor(correctCount) * 2), lastPlayed: Date.now() };
}

const smallTalk: Record<CharacterId, ReadonlyArray<Localized>> = {
  mugi: [
    words('何もしないのって、意外と忙しいね。日なたに移動しないといけないし。', 'Doing nothing is surprisingly busy. You have to keep moving with the sunbeam.'),
    words('おやつの時間を待っていたら、おやつの夢を見ちゃった。予行練習だね。', 'While waiting for snack time, I dreamed about snacks. A rehearsal, really.'),
    words('この床、昨日より落ち着く。ぼくが慣れたのかな、床が慣れたのかな。', 'This floor feels more comfortable today. Did I get used to it, or did it get used to me?'),
    words('雲がパンに見えたよ。たぶん、空もおなかがすいてる。', 'A cloud looked like bread. Maybe the sky is hungry too.'),
  ],
  momo: [
    words('カーテンが揺れてる。風が、手を振ってくれてるのかな。', 'The curtain is moving. Maybe the wind is waving at us.'),
    words('小さな月を育てたら、植木鉢は夜だけ光ると思う？', 'If we grew a tiny moon, would its flowerpot glow only at night?'),
    words('クッションの下に、物語の続きが落ちていたらいいのに。', 'I wish the next chapter of a story would fall under the cushion.'),
    words('雨の日の水たまりって、空の落とし物だね。', 'Rain puddles are little things the sky has left behind.'),
  ],
  sora: [
    words('窓の外に同じ自転車があった！　昨日と同じ場所。きっとお気に入りなんだ。', "That bicycle is in the same place as yesterday! It must have a favorite spot."),
    words('影を踏まないで歩いてみたけど、自分の影がずっとついてくる。', 'I tried walking without stepping on a shadow, but mine keeps following me.'),
    words('角を曲がると、知らない道がある。当たり前だけど、わくわくするね。', "There's another street around every corner. Obvious, but exciting!"),
    words('石を裏返したら、裏側にもちゃんと石があったよ。調査報告でした。', 'I turned a stone over. It was still a stone underneath. Investigation complete.'),
  ],
  kohaku: [
    words('さっき、花屋さんに手を振れた。……ちょっとだけだけど。', 'I managed to wave at the florist. ...Just a little wave.'),
    words('好きなものを聞かれると、たくさんありすぎて黙っちゃう。', 'When someone asks what I like, I go quiet. There are too many things.'),
    words('何も話さなくても、同じ部屋にいると安心するね。', "It's comforting to share a room, even when we don't say anything."),
    words('きれいな葉っぱを見つけた。持って帰ろうか、ずっと迷ってた。', 'I found a pretty leaf. I spent ages wondering whether to bring it home.'),
  ],
  pico: [
    words('今日の予定は、予定を考えること。まずは休憩から始めよう。', "Today's plan is to make a plan. Let's start with a break."),
    words('歩数を数えていたんだけど、途中で床の模様を数えちゃった。', 'I was counting my steps, but somehow switched to counting floor patterns.'),
    words('時計はまじめだね。誰も見ていないときも、ちゃんと進んでる。', 'Clocks are so diligent. They keep going even when nobody is watching.'),
    words('本を逆さにすると、新しい文字に見える。読めないけど、新発見だよ。', 'Turn a book upside down and the letters look new. Unreadable, but a discovery!'),
  ],
};

function wordConversation(word: LearnedWord, variation: number): DialogueLine[] {
  const w = word.value;
  const categoryLines: Record<WordCategory, Array<DialogueLine>> = {
    food: [pet(`「${w}」のことを考えていたら、おなかが返事したよ。`, `I was thinking about “${w}”, and my tummy answered.`, 'think'), pet(`今度「${w}」を食べるとき、一緒にゆっくり味わいたいな。`, `Next time there's “${w}”, I'd like to savor it together.`, 'happy')],
    place: [pet(`「${w}」って、ここからどれくらいかな。おやつ一回分？`, `How far is “${w}” from here? About one snack break?`, 'think'), pet(`「${w}」へ行くなら、途中の道も覚えて帰りたい。`, `If we go to “${w}”, I want to remember the way there too.`, 'wave')],
    activity: [pet(`「${w}」、うまくできるかより、一緒にできるかが気になる。`, `With “${w}”, I care more about doing it together than doing it perfectly.`, 'shy'), pet(`「${w}」の練習を頭の中でしたよ。本番は明日でもいい？`, `I practiced “${w}” in my head. Can the real try wait until tomorrow?`, 'happy')],
    feeling: [pet(`「${w}」っていう気持ち、顔にするとどんな顔かな。……こう？`, `What face goes with the feeling “${w}”? ...Like this?`, 'surprise'), pet(`今日の気持ちに「${w}」を少し混ぜたら、どんな一日になるかな。`, `What kind of day would it be with a little “${w}” mixed in?`, 'think')],
    thing: [pet(`「${w}」に名前をつけるとしたら……もう名前があったね。`, `If I gave “${w}” a name... Oh, it already has one.`, 'surprise'), pet(`「${w}」がひとつあるだけで、いつもの部屋が変わりそう。`, `Just one “${w}” might make our ordinary room feel different.`, 'think')],
    person: [pet(`「${w}」さんにも、この日なたを少し分けてあげたい。`, `I'd like to share a little of this sunbeam with “${w}” too.`, 'happy'), pet(`「${w}」さんは、雨の日に何をしてるんだろう。`, `I wonder what “${w}” does on rainy days.`, 'think')],
  };
  return [categoryLines[word.category][variation % 2], pet('教えてもらった言葉を使うと、ちょっと世界が広くなるね。', 'Using a word you taught me makes the world feel a little bigger.', 'happy')];
}

export function talk(state: LifeState): Interaction {
  const companion = currentCompanion(state);
  const turn = companion.talkCount;
  const topic = ROOM_TOPICS[(Math.floor(turn / 2) * 53 + CHARACTER_IDS.indexOf(state.character) * 17) % ROOM_TOPICS.length];
  const response = PERSONA[topic.theme][state.character];
  const scene = turn % 2 === 0 ? cozyChat(state.character,turn,companion.affinity) : undefined;
  const lines: DialogueLine[] = scene ? scene.lines.map((line,i)=>pet(line.ja,line.en,i===0?'think':'happy')) : [pet(topic.opening.ja,topic.opening.en,'think'),pet(response.ja,response.en,'happy')];
  if (!scene && companion.words.length) lines.push(...wordConversation(companion.words[Math.floor(turn/2) % companion.words.length],Math.floor(turn / (2*Math.max(1,companion.words.length)))));
  const setting = ROOM_CONTEXT[state.room];
  const hour = new Date().getHours();
  const time = TIME_CONTEXT[hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3];
  if (!scene && turn % 5 === 0) lines.push(pet(setting.ja,setting.en,'happy'));
  if (!scene && turn % 7 === 0) lines.push(pet(time.ja,time.en,'think'));
  if (!scene && companion.affinity >= 30 && turn % 11 === 0) lines.push(pet('こんな話を覚えていてくれる人がいる。ぼくには、それがうれしい。','Having someone who remembers these little stories makes me happy.','shy'));
  const next: CompanionState = { ...companion, talkCount: turn + 1,
    affinity: clamp(companion.affinity + 2, 0, 999), mood: 'happy', satiety: Math.max(20, companion.satiety - 1),
    traits: { ...companion.traits, kindness: clamp(companion.traits.kindness + 1) } };
  return { state: changeCompanion(state, next), dialogue: { ...dialogue(state, 'talk', lines), choices: scene?.choices || replyChoices, ...(scene ? {chatId:scene.id} : {}) } };
}

export function care(state: LifeState, action: CareAction): Interaction {
  const companion = currentCompanion(state);
  let next: CompanionState = { ...companion, affinity: clamp(companion.affinity + 2, 0, 999), traits: { ...companion.traits } };
  const snack = [...companion.words].reverse().find(word => word.category === 'food');
  let lines: DialogueLine[];
  let memory: Localized;
  if (action === 'feed') {
    next = { ...next, satiety: clamp(next.satiety + 28), mood: 'happy' };
    memory = words('一緒におやつを食べた。最後のひとくちまで、ゆっくり。', 'Shared a snack, slowly, right down to the last bite.');
    lines = [pet('いただきます。……ん、しあわせの味がする。', 'Thank you. ...Mm, this tastes like happiness.', 'eat'),
      snack ? pet(`「${snack.value}」のお話をしながら食べると、もっとおいしいね。`, `Talking about “${snack.value}” makes snack time even nicer.`, 'happy')
        : pet('おいしいものって、誰かと食べると少し増える気がする。', 'Good food somehow feels like more when you share it.', 'happy')];
  } else if (action === 'play') {
    next = { ...next, mood: 'happy', rest: Math.max(20, next.rest - 8), satiety: Math.max(20, next.satiety - 4), traits: { ...next.traits, creativity: clamp(next.traits.creativity + 3) } };
    memory = words('へんてこなダンスを考えた。名前は、まだない。', 'Invented a silly dance. It still needs a name.');
    lines = [pet('右、左、くるっ。……今の動き、もう一回できるかな？', 'Right, left, spin... Can I do that move again?', 'dance'), pet('笑ったら大成功ってことにしよう！', "Let's call it a success if it makes us laugh!", 'happy')];
  } else if (action === 'rest') {
    next = { ...next, rest: 100, mood: 'sleepy' };
    memory = words('同じ部屋でひと休み。静かな時間も、思い出になった。', 'Rested in the same room. Quiet time became a memory too.');
    lines = [pet('ちょっとだけ、目を閉じるね。ここにいてくれる？', "I'll close my eyes for a little while. Will you stay here?", 'sleep'), pet('……すう。夢の中でも、のんびりしよう。', '...Zzz. Even in dreams, we can take our time.', 'sleep')];
  } else {
    next = { ...next, mood: 'happy', traits: { ...next.traits, kindness: clamp(next.traits.kindness + 3) } };
    memory = words('なでてもらった。言葉がなくても、気持ちが届いた。', 'A gentle pat. Feelings found their way without words.');
    lines = [pet('えへへ。なんだか、心まであったかくなった。', 'Hehe. That made me feel warm all the way inside.', 'shy'), pet('お返しに……小さく手を振るね。', "In return... here's a little wave.", 'wave')];
  }
  return { state: changeCompanion(state, remember(next, memory)), dialogue: dialogue(state, 'care', lines) };
}

function townTopic(companion: CompanionState, place: NpcId): Localized {
  const preferred: Record<NpcId, WordCategory[]> = { bakery: ['food', 'feeling'], florist: ['thing', 'feeling'], station: ['place', 'activity'] };
  const candidates = companion.words.filter(word => preferred[place].includes(word.category));
  const choices = candidates.length ? candidates : companion.words;
  const learned = choices[(companion.outings + companion.friendships[place]) % Math.max(1, choices.length)];
  return learned ? words(learned.value, learned.value) : place === 'bakery' ? words('焼きたて', 'freshly baked')
    : place === 'florist' ? words('木漏れ日', 'sunlight through leaves') : words('寄り道', 'a little detour');
}

/** A whole short outing is produced once; advancing its lines never spends energy or rewards twice. */
export function visitTown(state: LifeState, place: NpcId): Interaction {
  const companion = currentCompanion(state);
  const topic = townTopic(companion, place);
  const points = companion.friendships[place];
  const variation = Math.floor(points / 3) % 3;
  const greeting = points >= 9
    ? npc('お、また来てくれたんだ。今日はどんなお話？', 'Oh, good to see you again. What have you been thinking about?')
    : points > 0 ? npc('こんにちは。この前はどうも。今日は少しゆっくりしていって。', 'Hello again. Thanks for dropping by. Take your time today.')
      : npc('こんにちは。見かけない顔だね。この辺りをお散歩？', 'Hello. I haven’t seen you around before. Exploring the neighborhood?');
  const intro = pet(`最近「${topic.ja}」って言葉を覚えたんだ。誰かに話してみたくて。`, `I learned the words “${topic.en}” recently. I wanted to tell someone.`, 'wave');
  const scripts: Record<NpcId, DialogueLine[][]> = {
    bakery: [
      [npc(`「${topic.ja}」かあ。いいね。私は毎朝四時起きで、まずオーブンを温めるんだ。`, `“${topic.en}”, hmm? Nice. I get up at four every morning and warm the oven first.`),
        pet('四時！　その時間、夢の中でもまだ寝てるよ。', "Four! At that time, I'm asleep even in my dreams.", 'surprise'),
        npc('はは、私も休みの日はそうだよ。今日は焼きすぎた端っこ、持っていく？', 'Ha! Me too, on my days off. Would you like a little end piece from today’s batch?'),
        pet('端っこにも、おいしい役目があるんだね。大事に食べる。', 'Even the end piece has a delicious job. I’ll savor it.', 'eat')],
      [npc(`「${topic.ja}」といえば、常連さんとの何気ない話で新しいパンを思いつくこともあるよ。`, `Thinking about “${topic.en}” reminds me: chatting with regulars sometimes gives me ideas for bread.`),
        pet('じゃあ、お話も材料になるの？', 'So conversation can be an ingredient?', 'surprise'),
        npc('そうかもね。小麦粉よりは量りにくいけど。あ、レジの紙を替えなきゃ。', 'Maybe! Harder to measure than flour, though. Oh, I need to change the receipt roll.'),
        pet('ぼくのお話、ひとつまみ分くらいになったかな。', 'I wonder if my story counted as a little pinch.', 'happy')],
      [npc(`「${topic.ja}」の話、聞きながら棚を拭いてもいい？　午後は少し落ち着くの。`, `Mind if I wipe this shelf while we talk about “${topic.en}”? It gets quieter in the afternoon.`),
        pet('お仕事の音って、お店の音楽みたいだね。', 'The sounds of work are like the shop’s own music.', 'think'),
        npc('いいこと言うね。冷蔵庫はちょっと声が大きいけど。', 'That’s a lovely way to put it. Though the refrigerator sings a bit too loudly.'),
        pet('低い声で、ずっと同じ歌を歌ってる。', 'It’s singing the same song in a very low voice.', 'happy')],
    ],
    florist: [
      [npc(`「${topic.ja}」ね。花束につける短い言葉にも、気持ちが出るんだよ。`, `“${topic.en}”, yes. Even a short note with a bouquet can carry a lot of feeling.`),
        pet('お花に手紙を持ってもらうんだ。重くないかな。', 'The flowers carry a letter? Is it heavy for them?', 'think'),
        npc('紙一枚なら大丈夫。むしろ水切れのほうが心配かな。今ちょうど水を替えてたんだ。', 'One sheet is fine. Running out of water worries me more. I was just changing the vase water.'),
        pet('気持ちにも、お水にも気を配るんだね。', 'You take care of both the feelings and the water.', 'happy')],
      [npc(`「${topic.ja}」って、いい響きだね。この葉っぱ、少し触ってみる？`, `“${topic.en}” has a nice sound. Would you like to touch this leaf gently?`),
        pet('……ふわふわ。植物にも、あったかい服があるんだ。', '...So soft. Plants have cozy clothes too.', 'surprise'),
        npc('ラムズイヤーっていうんだ。名前のとおり、羊の耳みたいでしょう。', 'It’s called lamb’s ear. Feels a bit like one, doesn’t it?'),
        pet('名前を知ると、さっきより仲よくなれた気がする。', 'Now I know its name, it feels a little more like a friend.', 'happy')],
      [npc(`「${topic.ja}」の話を聞いてたら、帰りに遠回りしたくなったよ。`, `Hearing about “${topic.en}” makes me want to take the long way home.`),
        pet('いつもと違う花が、見つかるかもしれないね。', 'Maybe you’ll find a flower you haven’t seen before.', 'wave'),
        npc('そうだね。でも今日は配達が二件。まずはこっちを終わらせようかな。', 'Maybe. But I’ve got two deliveries today. Better finish those first.'),
        pet('楽しみを、あとに少し取っておくんだね。', 'Saving a little something to look forward to.', 'happy')],
    ],
    station: [
      [npc(`「${topic.ja}」かあ。駅前にいると、毎日いろんな言葉が聞こえるよ。`, `“${topic.en}”, hmm. You hear all sorts of words around this station.`),
        pet('言葉も、電車に乗ってやってくるのかな。', 'Do words arrive on trains too?', 'think'),
        npc('そうかもしれないね。さっきは落とし物の傘を探している人が来たよ。', 'Maybe they do. Just now someone came looking for a lost umbrella.'),
        pet('その傘も、持ち主を待ってるといいね。', 'I hope the umbrella is waiting for its person too.', 'shy')],
      [npc(`「${topic.ja}」のこと、川沿いを歩きながら考えたら楽しそうだね。`, `“${topic.en}” sounds like something nice to think about on a riverside walk.`),
        pet('どっちへ曲がると、川に会える？', 'Which way do we turn to meet the river?', 'wave'),
        npc('郵便局の角を左。工事をしているから、細い道はゆっくり通ってね。', 'Left at the post office. There’s construction, so take it slowly on the narrow path.'),
        pet('左、ゆっくり。急がない道案内って、なんだか安心する。', 'Left, and slowly. Directions that don’t rush you feel reassuring.', 'happy')],
      [npc(`「${topic.ja}」ね。いいねえ。私は今日、昼休みに新しいお弁当屋へ行くつもり。`, `“${topic.en}”, nice. I’m planning to try the new lunch shop on my break.`),
        pet('いつもの町にも、はじめてが増えるんだね。', 'Even a familiar town can have new first times.', 'surprise'),
        npc('そうそう。ところで、そろそろバスが来るね。あの人、間に合うかな。', 'Exactly. The bus should be here soon. I wonder if that person will make it.'),
        pet('……間に合った！　知らない人だけど、ほっとしちゃった。', '...They made it! I don’t know them, but I’m relieved.', 'happy')],
    ],
  };
  const signature: Record<CharacterId, DialogueLine> = {
    mugi: pet('帰ったら、今日のことを思い出しながらひと休みしよう。', 'When we get home, let’s rest and think about today.', 'happy'),
    momo: pet('今日の話、夢の続きに出てきそう。', 'Today’s conversation might turn up in my dreams.', 'happy'),
    sora: pet('今度は、違う質問も考えて来よう！', 'Next time I’ll bring a different question!', 'wave'),
    kohaku: pet('最初はどきどきしたけど……話せてよかった。', 'I was nervous at first... But I’m glad we talked.', 'shy'),
    pico: pet('今日の発見、忘れないうちに心のノートへ。', 'Today’s discovery goes in my mental notebook before I forget.', 'think'),
  };
  let next: CompanionState = { ...companion, outings: companion.outings + 1,
    affinity: clamp(companion.affinity + 3, 0, 999), mood: 'happy',
    rest: Math.max(20, companion.rest - 4), satiety: Math.max(20, companion.satiety - 2),
    friendships: { ...companion.friendships, [place]: clamp(points + 3, 0, 999) },
    traits: { ...companion.traits, curiosity: clamp(companion.traits.curiosity + 2) },
  };
  const placeNames: Record<NpcId, Localized> = { bakery: words('パン屋さん', 'the baker'), florist: words('花屋さん', 'the florist'), station: words('まちの案内人', 'the neighborhood guide') };
  const placeName = placeNames[place];
  next = remember(next, words(`${placeName.ja}に「${topic.ja}」の話をした。また、会いに行こう。`, `Talked about “${topic.en}” with ${placeName.en}. Let’s visit again.`));
  return { state: changeCompanion(state, next), dialogue: dialogue(state, 'town', [greeting, intro, ...scripts[place][variation], pet(ROOM_TOPICS[(companion.outings*53+NPC_IDS.indexOf(place)*31)%ROOM_TOPICS.length].opening.ja, ROOM_TOPICS[(companion.outings*53+NPC_IDS.indexOf(place)*31)%ROOM_TOPICS.length].opening.en,'think'), signature[state.character]], place) };
}

export const characterName = (state: LifeState): Localized => CHARACTERS.find(character => character.id === state.character)!.name;

const replyChoices = [
 {id:'curious' as const,label:words('それで、どうなったの？','And what happened?')},
 {id:'kind' as const,label:words('わかる気がする','I think I get it')},
 {id:'playful' as const,label:words('もしも、の話しよう','What if…?')},
];
export function respondToDialogue(state:LifeState, previous:Dialogue, choice:ReplyId):Interaction {
 const c=currentCompanion(state); const last=previous.lines.find(l=>l.speaker==='pet');
 const scene=COZY_CHATS.find(chat=>chat.id===previous.chatId&&chat.hero===state.character);
 const phrase=scene?.replies[choice] || CASUAL_REPLIES[state.character][choice];
 const next=remember({...c,affinity:clamp(c.affinity+1,0,999)},last?.text||phrase);
 return {state:changeCompanion(state,next),dialogue:dialogue(state,'talk',[pet(phrase.ja,phrase.en,choice==='playful'?'dance':'happy')])};
}

const ROOM_CONTEXT:Record<RoomId,Localized> = {
 sunroom:words('この部屋の光を見ていると、考えもゆっくりほどけてくる。','The light in this room lets my thoughts slowly unwind.'),
 tatami:words('畳の上に座って、今のお話をもう少し考えていたいな。','I want to sit on the tatami and think about that a little longer.'),
 loft:words('窓の外でも、誰かが同じようなことを考えているかな。','Might someone beyond the window be thinking something similar?'),
 seaside:words('波の音が、話の続きを待ってくれてるみたい。','The waves seem to be waiting for the rest of our story.'),
 forest:words('木の葉も聞いていると思うと、ちょっと照れるね。','Thinking the leaves might be listening makes me a little shy.'),
 atelier:words('今の気持ちを絵にしたら、どんな色になるだろう。','What color would this feeling be if we painted it?'),
 rainy:words('雨が窓をたたく間は、ここで話していよう。','Let us keep talking here while the rain taps the window.'),
 attic:words('屋根の近くで話すと、空まで聞こえてしまいそう。','Talking near the roof feels like the sky might overhear us.'),
};
const TIME_CONTEXT = [
 words('まだ静かな時間だね。小さな声でも、ちゃんと届く。','It is still quiet. Even a small voice can reach us.'),
 words('朝のうちに話したことって、一日のしおりになるね。','Morning conversations become bookmarks for the day.'),
 words('午後は急がず、今の話に寄り道していたいな。','This afternoon, I want to take a leisurely detour through that thought.'),
 words('今日の終わりに、覚えておきたい話がまた増えた。','Another story to remember at the end of the day.'),
];
