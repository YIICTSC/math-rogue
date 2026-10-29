import {heroById} from './roster';
import {SUPPORTS} from './story';
import {PERSONAL_TECHNIQUES} from './techniques';
export const BATTLE_VOICE_KINDS=['attack','damage','heal','ultimate','support','win','defeat'] as const;
export type BattleVoiceKind=typeof BATTLE_VOICE_KINDS[number]|'technique';
const adultLines:Record<string,Partial<Record<BattleVoiceKind,string>>>={
 aster:{attack:'道を切り開く！',damage:'まだ、立てる！',heal:'ありがとう。もう一度！',ultimate:'暁を継ぐ剣！',support:'ここは僕が支える！',win:'みんなで、つかんだ勝利だ。',defeat:'この灯を、託す。'},
 lyra:{attack:'私が道を開く！',damage:'このくらいで！',heal:'ありがとう。まだ戦える！',ultimate:'暁を継ぐ剣！',support:'背中は私に任せて！',win:'みんな、よく戦ったね。',defeat:'ごめん……後を、お願い。'},
};
export function battleVoiceText(actor:string,kind:BattleVoiceKind,ally?:string,technique?:string):string{
 if(kind==='technique')return PERSONAL_TECHNIQUES[actor]?.some(t=>t.name===technique)?technique+'！':battleVoiceText(actor,'attack');
 if(kind==='support'&&ally&&SUPPORTS.some(p=>p.a===actor&&p.b===ally||p.b===actor&&p.a===ally))return `${heroById(ally).name}、合わせるよ！`;
 return adultLines[actor]?.[kind]||({attack:'道を切り開く！',damage:'まだ、立てる！',heal:'ありがとう。もう一度！',ultimate:`${heroById(actor).skill}！仲間と道を切り開く！`,support:'ここは任せて！',win:'みんなで、つかんだ明日だ。',defeat:'この灯を、託す。'}[kind]);
}
