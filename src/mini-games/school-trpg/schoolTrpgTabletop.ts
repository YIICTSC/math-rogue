import { trpgCopy, type TrpgCampaignState, type TrpgCopy, type TrpgEventArchetype, type TrpgApproach, type TrpgStat } from './schoolTrpgTypes';

export const TRPG_APPROACHES: Record<TrpgApproach, { label: TrpgCopy; detail: TrpgCopy }> = {
 STANDARD: { label: trpgCopy('直感で動く', 'ちょっかんでうごく', 'Trust your instincts'), detail: trpgCopy('追加の消費なし。能力と運で挑む。', 'ついかのしょうひなし。のうりょくとうんでいどむ。', 'No extra cost. Rely on your ability and the die.') },
 CAREFUL: { label: trpgCopy('慎重に準備', 'しんちょうにじゅんび', 'Prepare carefully'), detail: trpgCopy('判定+2。時間+1、集中による疲労+1。', 'はんてい+2。じかん+1、しゅうちゅうによるひろう+1。', 'Check +2. Spend 1 time and gain 1 stress from concentration.') },
 BOLD: { label: trpgCopy('大胆に賭ける', 'だいたんにかける', 'Take a bold risk'), detail: trpgCopy('判定+1。成功時は手がかり+1、失敗時は追加疲労+2。', 'はんてい+1。せいこうじはてがかり+1、しっぱいじはついかひろう+2。', 'Check +1. Success earns an extra clue; a miss adds 2 extra stress.') },
 TEAM: { label: trpgCopy('仲間と連携', 'なかまとれんけい', 'Ask your companion'), detail: trpgCopy('判定+2、疲労-1。仲間加入後、各章で1回。', 'はんてい+2、ひろう-1。なかまかにゅうご、かくしょうで1かい。', 'Check +2 and stress -1. Once per chapter after recruiting a companion.') },
};
export const canUseTrpgApproach = (state: TrpgCampaignState, approach: TrpgApproach) =>
 approach !== 'TEAM' || !!state.flags.companionJoined && !state.flags[`teamSupport.${state.chapter}`];
export const trpgApproachBonus = (approach: TrpgApproach) => approach === 'STANDARD' ? 0 : approach === 'BOLD' ? 1 : 2;

const TABLE_TALK: Record<TrpgEventArchetype, [TrpgCopy, TrpgCopy]> = {
 INVESTIGATION: [trpgCopy('光は答えを教えない。ただ、触れた指先にだけ違う温度が残る。何を証拠として持ち帰る？', 'ひかりはこたえをおしえない。ただ、ふれたゆびさきにだけちがうおんどがのこる。なにをしょうことしてもちかえる？', 'The light gives no answer, but leaves a different warmth on your fingertips. What will you take as evidence?'), trpgCopy('「見つけた順番も書こう。偶然かどうかは、あとで一緒に確かめればいい」', '「みつけたじゅんばんもかこう。ぐうぜんかどうかは、あとでいっしょにたしかめればいい」', '“Write down the order we found them. We can decide together later whether it was coincidence.”')],
 DIALOGUE: [trpgCopy('相手は答えかけて、言葉を飲み込んだ。必要なのは正しい質問か、それとも待つ勇気か。', 'あいてはこたえかけて、ことばをのみこんだ。ひつようなのはただしいしつもんか、それともまつゆうきか。', 'The witness starts to answer, then swallows the words. Do you need the right question, or the courage to wait?'), trpgCopy('「急がなくていい。話してくれたことを、勝手に誰かへ渡したりしない」', '「いそがなくていい。はなしてくれたことを、かってにだれかへわたしたりしない」', '“Take your time. We won’t pass your story on without asking.”')],
 PUZZLE: [trpgCopy('最後の部品だけが、どの穴にも合わない。装置を直すべきか、使い方を疑うべきか。', 'さいごのぶひんだけが、どのあなにもあわない。そうちをなおすべきか、つかいかたをうたがうべきか。', 'The last piece fits none of the slots. Should you repair the mechanism, or question how it is meant to work?'), trpgCopy('「壊れてるって決める前に、逆から見てみよう。僕らの地図だって、最初は逆さまだった」', '「こわれてるってきめるまえに、ぎゃくからみてみよう。ぼくらのちずだって、さいしょはさかさまだった」', '“Before we call it broken, look from the other side. Our map was upside down at first, too.”')],
 CHASE: [trpgCopy('曲がり角の向こうで、足音が二つに分かれた。近道は暗い。安全な道では追いつけないかもしれない。', 'まがりかどのむこうで、あしおとがふたつにわかれた。ちかみちはくらい。あんぜんなみちではおいつけないかもしれない。', 'Beyond the corner, footsteps split in two. The shortcut is dark; the safe route may cost your chance to catch up.'), trpgCopy('「先に行って。戻る場所には印をつける。一人にしないって、そういうことだろ」', '「さきにいって。もどるばしょにはしるしをつける。ひとりにしないって、そういうことだろ」', '“Go ahead. I’ll mark where to return. That’s what not leaving someone behind means.”')],
 DEFENSE: [trpgCopy('扉の向こうから、助けを呼ぶ声。全員を守るには、誰がどこを引き受けるか決めなければならない。', 'とびらのむこうから、たすけをよぶこえ。ぜんいんをまもるには、だれがどこをひきうけるかきめなければならない。', 'Someone calls for help beyond the door. To protect everyone, you must decide who covers each position.'), trpgCopy('「全部一人で受けなくていい。こっちは任せて。合図だけ、忘れないで」', '「ぜんぶひとりでうけなくていい。こっちはまかせて。あいずだけ、わすれないで」', '“You don’t have to take it all alone. Leave this side to me. Just remember our signal.”')],
 COMBAT: [trpgCopy('番人は武器より先に、あなたの手帳を見た。何を知り、何を守るために来たのか。最初の一手がその答えになる。', 'ばんにんはぶきよりさきに、あなたのてちょうをみた。なにをしり、なにをまもるためにきたのか。さいしょのいってがそのこたえになる。', 'The guardian looks at your notebook before your weapon. What do you know, and what have you come to protect? Your opening move will answer.'), trpgCopy('「倒せば終わるとは限らない。話す道も、帰る道も残しておこう」', '「たおせばおわるとはかぎらない。はなすみちも、かえるみちものこしておこう」', '“Defeating it may not end this. Let’s keep a way to talk, and a way home.”')],
};
const CHAPTER_QUESTIONS = [
 trpgCopy('校章が消えた日の記録には、誰かの名前だけがない。取り戻すのは物だけでいいのだろうか。', 'こうしょうがきえたひのきろくには、だれかのなまえだけがない。とりもどすのはものだけでいいのだろうか。', 'One name is missing from the record of the day the emblem vanished. Is recovering an object enough?'),
 trpgCopy('鐘の音に、言いかけた言葉が混ざる。時間を元に戻せば、今ここで交わした約束はどうなる？', 'かねのおとに、いいかけたことばがまざる。じかんをもとにもどせば、いまここでかわしたやくそくはどうなる？', 'An unfinished sentence mingles with the chime. If time returns to normal, what happens to the promise you just made?'),
 trpgCopy('同じ祭りを、皆が違う色で覚えている。多数の記憶に合わせるか、一人の違いを残すか。', 'おなじまつりを、みんながちがういろでおぼえている。たすうのきおくにあわせるか、ひとりのちがいをのこすか。', 'Everyone remembers the festival in a different color. Will you follow the majority, or preserve one person’s difference?'),
 trpgCopy('校外へ続く道は、帰り道と同じとは限らない。先へ進む理由を、仲間と確かめておこう。', 'こうがいへつづくみちは、かえりみちとおなじとはかぎらない。さきへすすむりゆうを、なかまとたしかめておこう。', 'The road beyond school may not lead back the same way. Check with your companion why you both want to continue.'),
 trpgCopy('古い設計図には、直された跡まで保存されている。失敗を消すことと、失敗から学ぶことは同じだろうか。', 'ふるいせっけいずには、なおされたあとまでほぞんされている。しっぱいをけすことと、しっぱいからまなぶことはおなじだろうか。', 'The old blueprint preserves every correction. Is erasing a mistake the same as learning from it?'),
 trpgCopy('名簿の空欄を埋める前に、その人がどう呼ばれたいか聞こう。記録の正しさだけでは、救えないものがある。', 'めいぼのくうらんをうめるまえに、そのひとがどうよばれたいかきこう。きろくのただしさだけでは、すくえないものがある。', 'Before filling a blank in the register, ask what that person wants to be called. Correct records alone cannot save everything.'),
];
export const getTrpgTableTalk = (state: TrpgCampaignState, archetype: TrpgEventArchetype = 'INVESTIGATION') => {
 const lines = [TABLE_TALK[archetype][0], CHAPTER_QUESTIONS[Math.min(5, state.chapter)]];
 if (state.flags.companionJoined) lines.push(TABLE_TALK[archetype][1]);
 if (state.flags.companionTrusted) lines.push(trpgCopy('前に交わした約束を覚えている仲間が、あなたの返事を待っている。', 'まえにかわしたやくそくをおぼえているなかまが、あなたのへんじをまっている。', 'Your companion remembers the promise you made and waits for your answer.'));
 if (state.flags.rivalAlliance) lines.push(trpgCopy('ライバルの助言を思い出す。「勝てる手だけ探すな。相手が引ける手も残せ」', 'ライバルのじょげんをおもいだす。「かてるてだけさがすな。あいてがひけるても のこせ」', 'You remember your rival’s advice: “Don’t only look for a winning move. Leave the other side a move that lets them step back.”'));
 if (state.stress >= 4) lines.push(trpgCopy('息が浅い。休まず進むなら、次の反撃まで耐えられるか考えよう。', 'いきがあさい。やすまずすすむなら、つぎのはんげきまでたえられるかかんがえよう。', 'Your breathing is shallow. Before pressing on, consider whether you can endure the next counterattack.'));
 return lines;
};
export const trpgSupportCopy = (stat: TrpgStat) => ({
 study: trpgCopy('仲間が記録を読み上げ、あなたは矛盾する一行を見つけた。', 'なかまがきろくをよみあげ、あなたはむじゅんするいちぎょうをみつけた。', 'Your companion reads the record aloud. You spot the line that does not fit.'),
 energy: trpgCopy('仲間が荷物を引き受け、あなたは最後の足場へ手を伸ばした。', 'なかまがにもつをひきうけ、あなたはさいごのあしばへてをのばした。', 'Your companion takes your pack. You reach for the final foothold.'),
 friendship: trpgCopy('仲間が自分の失敗を話した。相手の肩から、少しだけ力が抜けた。', 'なかまがじぶんのしっぱいをはなした。あいてのかたから、すこしだけちからがぬけた。', 'Your companion shares a mistake of their own. The witness relaxes a little.'),
 courage: trpgCopy('「一緒に行こう」。短い言葉と、背中に触れた手が迷いを止めた。', '「いっしょにいこう」。みじかいことばと、せなかにふれたてがまよいをとめた。', '“Together.” A brief word and a hand on your back steady your resolve.'),
})[stat];
