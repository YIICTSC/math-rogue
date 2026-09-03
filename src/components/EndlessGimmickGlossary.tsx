import React from 'react';
import type { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

export interface EndlessGimmickGlossaryEntry {
  term: string;
  definition: string;
  termEnglish: string;
  termHiragana: string;
  definitionEnglish: string;
  definitionHiragana: string;
}

/**
 * Terms used by endless-boss rules.  Keep the source terms in Japanese so
 * the same component can split the canonical rule text before it is
 * localized for the current display language.
 */
export const ENDLESS_GIMMICK_GLOSSARY: EndlessGimmickGlossaryEntry[] = [
  { term: '学習判定', termEnglish: 'Learning check', termHiragana: 'がくしゅう はんてい', definition: '問題に答え、正解・不正解を記録するゲーム内の学習チャレンジです。', definitionEnglish: 'An in-game learning challenge that records whether your answer is correct.', definitionHiragana: 'もんだいに こたえ、せいかい・ふせいかいを きろくする ゲームないの がくしゅう チャレンジです。' },
  { term: '再提出', termEnglish: 'Resubmission', termHiragana: 'さいていしゅつ', definition: '失敗した学習判定を、もう一度解き直す操作です。', definitionEnglish: 'Retry a learning check that you failed.', definitionHiragana: 'しっぱいした がくしゅう はんていを、もういちど ときなおす そうさです。' },
  { term: '未処理データ', termEnglish: 'Unprocessed data', termHiragana: 'みしょり データ', definition: 'まだ処理されていない課題や記録です。ギミック達成で消去されます。', definitionEnglish: 'An assignment or record that has not been handled yet. Clearing the mechanic removes it.', definitionHiragana: 'まだ しょりされていない かだいや きろくです。ギミック たっせいで しょうきょされます。' },
  { term: '未処理タグ', termEnglish: 'Unresolved tag', termHiragana: 'みしょり タグ', definition: 'ボスが付けた、まだ解決されていない目印です。', definitionEnglish: 'A marker placed by the boss that has not been resolved.', definitionHiragana: 'ボスが つけた、まだ かいけつされていない めじるしです。' },
  { term: '同じ単元', termEnglish: 'Same unit', termHiragana: 'おなじ たんげん', definition: '同じ学習分野・単元から出題された問題です。', definitionEnglish: 'A problem from the same subject or unit.', definitionHiragana: 'おなじ がくしゅう ぶんや・たんげんから しゅつだいされた もんだいです。' },
  { term: 'カードタイプ', termEnglish: 'Card type', termHiragana: 'カード タイプ', definition: 'カードの分類です。ATTACK・SKILL・POWERの3種類があります。', definitionEnglish: 'A card category: ATTACK, SKILL, or POWER.', definitionHiragana: 'カードの ぶんるいです。ATTACK・SKILL・POWERの 3しゅるいが あります。' },
  { term: '同一戦闘', termEnglish: 'Same battle', termHiragana: 'どういつ せんとう', definition: '1回のバトル中を指します。別の戦闘へ移ると数え直します。', definitionEnglish: 'Within one battle. The count resets when you enter another battle.', definitionHiragana: '1かいの バトルちゅうを さします。べつの せんとうへ うつると かぞえなおします。' },
  { term: '区間', termEnglish: 'Segment', termHiragana: 'くかん', definition: 'そのボスのギミック進捗を数える、ボスまでの進行範囲です。', definitionEnglish: 'The progression range used to count this boss mechanic.', definitionHiragana: 'その ボスの ギミック しんちょくを かぞえる、ボスまでの しんこう はんいです。' },
  { term: 'フェーズ', termEnglish: 'Phase', termHiragana: 'フェーズ', definition: 'ボスのHPや行動を区切った段階です。', definitionEnglish: 'A stage that divides the boss’s HP or actions.', definitionHiragana: 'ボスの HPや こうどうを くぎった だんかいです。' },
  { term: 'ターン', termEnglish: 'Turn', termHiragana: 'ターン', definition: 'プレイヤーまたは敵が1回行動する単位です。', definitionEnglish: 'One action by the player or an enemy.', definitionHiragana: 'プレイヤー または てきが 1かい こうどうする たんいです。' },
  { term: 'ブロック', termEnglish: 'Block', termHiragana: 'ブロック', definition: '次のターン開始まで受けるダメージを防ぐ数値です。', definitionEnglish: 'A value that prevents damage until the next turn begins.', definitionHiragana: 'つぎの ターン かいしまで うける ダメージを ふせぐ すうちです。' },
  { term: '再演', termEnglish: 'Replay', termHiragana: 'さいえん', definition: '直前に解決したカード効果を、もう一度発生させることです。', definitionEnglish: 'Trigger a card effect that was just resolved one more time.', definitionHiragana: 'ちょくぜんに かいけつした カード こうかを、もういちど はっせいさせる ことです。' },
  { term: '反照片', termEnglish: 'Reflection shard', termHiragana: 'はんしゃへん', definition: '反射の力を保つ、ボス固有の鏡像です。', definitionEnglish: 'A boss-specific mirror image that maintains reflective power.', definitionHiragana: 'はんしゃの ちからを たもつ、ボス こゆうの きょうぞうです。' },
  { term: '属性', termEnglish: 'Attribute', termHiragana: 'ぞくせい', definition: 'マジック編のカードや能力が持つ種類です。', definitionEnglish: 'A category assigned to cards or abilities in the Magic arc.', definitionHiragana: 'マジックへんの カードや のうりょくが もつ しゅるいです。' },
  { term: '強化効果', termEnglish: 'Buff effect', termHiragana: 'きょうか こうか', definition: '敵を有利にする一時的な効果です。', definitionEnglish: 'A temporary effect that benefits an enemy.', definitionHiragana: 'てきを ゆうりにする いちじてきな こうかです。' },
  { term: 'ATTACK', termEnglish: 'ATTACK', termHiragana: 'アタック', definition: '敵へダメージを与える攻撃カードです。', definitionEnglish: 'An attack card that deals damage to an enemy.', definitionHiragana: 'てきへ ダメージを あたえる こうげき カードです。' },
  { term: 'SKILL', termEnglish: 'SKILL', termHiragana: 'スキル', definition: '防御や補助など、攻撃以外の効果を持つカードです。', definitionEnglish: 'A card with a defense or support effect rather than an attack.', definitionHiragana: 'ぼうぎょや ほじょなど、こうげき いがいの こうかを もつ カードです。' },
  { term: 'POWER', termEnglish: 'POWER', termHiragana: 'パワー', definition: '戦闘中に継続する効果を持つカードです。', definitionEnglish: 'A card with an effect that persists during battle.', definitionHiragana: 'せんとうちゅうに けいぞくする こうかを もつ カードです。' },
];

const glossaryByTerm = new Map(ENDLESS_GIMMICK_GLOSSARY.map(entry => [entry.term, entry]));
const glossaryPattern = new RegExp(`(${ENDLESS_GIMMICK_GLOSSARY.map(entry => entry.term).sort((a, b) => b.length - a.length).join('|')})`, 'g');

export const getEndlessGimmickTermLabel = (entry: EndlessGimmickGlossaryEntry, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? entry.termEnglish : languageMode === 'HIRAGANA' ? entry.termHiragana : entry.term;

export const getEndlessGimmickDefinition = (entry: EndlessGimmickGlossaryEntry, languageMode: LanguageMode): string =>
  languageMode === 'ENGLISH' ? entry.definitionEnglish : languageMode === 'HIRAGANA' ? entry.definitionHiragana : entry.definition;

interface Props {
  text: string;
  languageMode: LanguageMode;
  onTermClick?: (entry: EndlessGimmickGlossaryEntry) => void;
  className?: string;
}

const EndlessGimmickGlossaryText: React.FC<Props> = ({ text, languageMode, onTermClick, className = '' }) => {
  const parts = text.split(glossaryPattern);
  return (
    <span className={className} data-endless-gimmick-glossary="true">
      {parts.map((part, index) => {
        const entry = glossaryByTerm.get(part);
        if (!entry) return <React.Fragment key={`${part}-${index}`}>{trans(part, languageMode)}</React.Fragment>;
        const label = getEndlessGimmickTermLabel(entry, languageMode);
        const definition = getEndlessGimmickDefinition(entry, languageMode);
        return (
          <span
            key={`${entry.term}-${index}`}
            role={onTermClick ? 'button' : undefined}
            tabIndex={onTermClick ? 0 : undefined}
            title={onTermClick ? definition : undefined}
            className={onTermClick ? 'cursor-pointer rounded-sm bg-yellow-300/25 px-0.5 font-black text-yellow-200 underline decoration-yellow-300 decoration-2 underline-offset-2 hover:bg-yellow-300/40' : 'rounded-sm bg-yellow-300/25 px-0.5 font-black text-yellow-200'}
            onClick={onTermClick ? (event) => {
              event.stopPropagation();
              onTermClick(entry);
            } : undefined}
            onKeyDown={onTermClick ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              onTermClick(entry);
            } : undefined}
            aria-label={onTermClick ? `${label}：${definition}` : undefined}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
};

export default EndlessGimmickGlossaryText;
