import { c, type Copy } from './catalog';
import { DAILY_DIALOGUES, SEASONAL_DIALOGUES, CONTEXT_DIALOGUES, PERSONALITY_FOLLOWUPS, BOND_FAREWELLS } from './dailyDialogue';
import { OUTING_DIALOGUES, OUTING_INTRODUCTIONS, OUTING_FAREWELLS } from './outingDialogue';
import { RESIDENT_STORIES } from './storyDialogue';

function pick<T>(items: readonly T[], index: number): T {
  return items[((Math.floor(index) % items.length) + items.length) % items.length];
}
export function personalityFollowup(personality: number, variant: number): Copy[] {
  return [...pick(pick(PERSONALITY_FOLLOWUPS, personality), variant)];
}
export interface ChatContext {
  count: number;
  offset: number;
  personality: number;
  season: number;
  birthday: boolean;
  hungry: boolean;
  sad: boolean;
  conflict: boolean;
  friendship: number;
  sharedHome: boolean;
  favorite?: Copy;
}
/** Exchanges alternate player/resident; every response belongs to the preceding prompt. */
export function dailyConversation(context: ChatContext): Copy[] {
  const { count, personality } = context;
  const state = context.conflict ? 3 : context.birthday ? 0 : context.hungry ? 1 : context.sad ? 2 : -1;
  // Leave room for ordinary subjects even when a resident's needs persist.
  if (state >= 0 && count % 7 === 0) return [...pick(CONTEXT_DIALOGUES[state], Math.floor(count / 7))];
  let exchange: Copy[];
  if (context.favorite && count % 3 === 2) {
    exchange = [context.favorite,
      c('それ、どんなところが好き？ もう少し聞いてみたいな。', 'What do you like about it? I would love to hear more.', 'それ、どんなところがすき？もうすこしきいてみたいな。'),
      c('うまく言えないけど、考えるだけで楽しくなるんだ。', 'It is hard to explain, but just thinking about it makes me happy.', 'うまくいえないけど、かんがえるだけでたのしくなるんだ。'),
      c('好きなものの話をすると、声まで楽しそうになるね。', 'Even your voice sounds happy when you talk about something you like.', 'すきなもののはなしをすると、こえまでたのしそうになるね。')];
  } else if (count % 5 === 0) {
    exchange = pick(pick(SEASONAL_DIALOGUES, context.season), Math.floor(count / 5));
  } else {
    // Seasonal turns do not consume an ordinary topic, so the complete bank can rotate.
    const ordinaryTurn = count - Math.floor(count / 5) - 1;
    exchange = pick(DAILY_DIALOGUES, context.offset + ordinaryTurn);
  }
  const tier = context.sharedHome ? 2 : context.friendship >= 50 ? 1 : 0;
  const tail = count % 2 === 0
    ? personalityFollowup(personality, Math.floor(count / 2))
    : pick(BOND_FAREWELLS[tier], Math.floor(count / 2));
  return [...exchange, ...tail];
}
export function storyIntroduction(index: number): Copy[] {
  return [RESIDENT_STORIES[index].scene,
    c('うん。一緒に考えてみよう。', 'Yes. Let us think about it together.', 'うん。いっしょにかんがえてみよう。')];
}
export function storyConversation(index: number, choice: number, personality: number, variant: number): Copy[] {
  const story = RESIDENT_STORIES[index];
  return [story.choices[choice], story.responses[choice], ...personalityFollowup(personality, variant)];
}
export function outingIntroduction(route: number, personality: number, variant: number): Copy[] {
  return [...OUTING_INTRODUCTIONS[route], ...personalityFollowup(personality, variant)];
}
export function outingConversation(route: number, step: number, choice: number, personality: number, variant: number, partnerChoice = choice): Copy[] {
  const exchange = OUTING_DIALOGUES[route][step][choice];
  const tail = partnerChoice !== choice
    ? [c('ほかの案も気になる？ あとで話を聞かせてね。', 'Interested in another idea too? Tell me about it afterward.', 'ほかのあんもきになる？あとではなしをきかせてね。'),
       c('うん。今回はこの案を楽しんで、別の案は次のお楽しみにしよう。', 'Yes. Let us enjoy this plan now and save the other for next time.', 'うん。こんかいはこのあんをたのしんで、べつのあんはつぎのおたのしみにしよう。')]
    : personalityFollowup(personality, variant + step);
  return [...exchange, ...tail, ...(step === 2 ? OUTING_FAREWELLS[route] : [])];
}
