import {useState,type CSSProperties} from 'react';
import { assetUrl } from '../../utils/assetPaths';
import { CATALOG, chapterEntries, CHAPTER_ROUNDS, canPlayChapter, THEMES } from './catalog';
import { Sprite, type Localize } from './art';
import type { LanguageMode } from '../../types';
import { gameText } from './copy';
import { GENRES, type Genre } from './originals/model';
import { visualFor } from './visuals';
import { chapterCast } from './direction';
import { DASH_HERO_ART } from '../go-home-dash/heroes';
import type { Mode } from './engine';

type Props = {
  view: 'story' | 'practice';
  chapter: number;
  setChapter: (index: number) => void;
  scores: number[];
  discovered: readonly string[];
  launch: (mode: Mode) => void;
  l: Localize;
  mode: LanguageMode;
  genre: Genre | '';
  setGenre: (genre: Genre | '') => void;
};

export default function ChapterMenu({ view, chapter, setChapter, scores, discovered, launch, l, mode, genre, setGenre }: Props) {
  const [endless,setEndless]=useState(false);
  const theme = THEMES[chapter];
  const practice = view === 'practice';
  const entries = genre ? CATALOG.filter(entry => entry.game.genre === genre) : chapterEntries(chapter);
  const chapterTitle = (index: number) => `${String(index + 1).padStart(2, '0')} · ${l(...THEMES[index].name)}`;
  return <section className="asr-practice asr-chapter-menu">
    <div className="asr-chapter-heading">
      <div>
        <small>{practice ? 'GAME LIBRARY' : 'STORY / 10 CHAPTERS'}</small>
        <h1>{practice ? l('お題図鑑', 'Game Library', 'おだいずかん')
          : l('消えた文化祭の鐘', 'The Missing Festival Chime', 'きえた ぶんかさいの かね')}</h1>
      </div>
      <b>{practice ? `${discovered.length} / ${CATALOG.length}` : `${scores.filter(Boolean).length} / ${THEMES.length}`}</b>
    </div>
    <nav className="asr-chapter-tabs" aria-label={l('章を選ぶ', 'Choose chapter', 'しょうを えらぶ')}>
      {THEMES.map((item, i) => {
        const locked = !practice && !canPlayChapter(i, scores);
        return <button key={item.id} type="button" aria-current={i === chapter && (!practice || !genre) ? 'true' : undefined}
          data-gamepad-initial-choice={i === chapter || undefined} disabled={locked} onClick={() => { setChapter(i); setGenre(''); }}>
          {chapterTitle(i)}{!practice && scores[i] > 0 && <span aria-label={l('クリア済み', 'Cleared', 'クリアずみ')}> ✓</span>}
          {locked && <span aria-label={l('未解放', 'Locked', 'みかいほう')}> · —</span>}
        </button>;
      })}
    </nav>
    {practice ? <>
      <p className="asr-library-explainer">{l('ストーリーで一度遊んだお題が解禁されます。ミスしても登録！', 'Play a game in Story to unlock it here. A miss still counts!', 'ストーリーで いちど あそんだ おだいが ひらきます。ミスしても とうろく！')}</p>
      <div className="asr-library-filter"><label><span>{l('遊ぶモード','Play mode','あそぶモード')}</span><select aria-label={l('遊ぶモード','Play mode','あそぶモード')} value={endless?'endless':'practice'} onChange={e=>setEndless(e.target.value==='endless')}><option value="practice">{l('1回練習','Single practice','1かいれんしゅう')}</option><option value="endless">{l('ミスまでエンドレス','Endless until a miss','ミスまでエンドレス')}</option></select></label>
        <label>
          <span>{l('遊び方から探す', 'Browse by play style', 'あそびかたから さがす')}</span>
          <select value={genre} onChange={event => setGenre(event.currentTarget.value as Genre | '')}>
            <option value="">{l('章から探す', 'Browse by chapter', 'しょうから さがす')}</option>
            {Object.entries(GENRES).filter(([id]) => CATALOG.some(entry => entry.game.genre === id)).map(([id, label]) => <option key={id} value={id}>{l(...label)}</option>)}
          </select>
        </label>
        <small>{entries.length} {l('本', 'games', 'ほん')}</small>
      </div>
      <div className="asr-practice-grid">
        {entries.map(entry => {
          const entryTheme = THEMES[entry.chapter];
          const [, , prop] = visualFor(entry);
          const locked = !discovered.includes(entry.key);
          return <button type="button" key={entry.key} data-asr-library-entry={entry.key} data-asr-locked={locked}
            disabled={locked} onClick={() => { if (!locked) launch({ kind: 'practice', entry, endless }); }}
            style={{ '--card-color': entry.game.boss ? '#ffb4b7' : entryTheme.color } as CSSProperties}>
            {locked ? <b className="asr-library-lock" aria-hidden="true">?</b> : <Sprite name={prop} />}
            <span>{locked ? '???' : entry.game.boss ? l(...entryTheme.boss) : gameText(mode, entry.game.title)}</span>
            <small>{locked ? l('ストーリーで発見しよう', 'Discover in Story', 'ストーリーで みつけよう') : entry.game.quick ? l('瞬間チャレンジ', 'Quick challenge', 'しゅんかんチャレンジ') : l(...GENRES[entry.game.genre])}
              {genre && ` · ${l(...entryTheme.name)}`}</small>
          </button>;
        })}
      </div>
    </> : <article className="asr-chapter-story" style={{ '--chapter-color': theme.color, '--chapter-art': `url("${assetUrl(theme.art)}")` } as CSSProperties}>
      <div className="asr-chapter-portrait"><img src={assetUrl(DASH_HERO_ART[chapterCast(chapter)])} alt="" /></div>
      <div className="asr-chapter-copy">
        <h2>{chapterTitle(chapter)}</h2>
        <p>{l(...theme.story)}</p>
        <p><b>{l('ボス', 'Boss', 'ボス')}</b> · {l(...theme.boss)}</p>
        <button type="button" className="asr-primary" onClick={() => launch({ kind: 'story', chapter })}>
          {l('章を始める', 'Start chapter', 'しょうを はじめる')} ▶
        </button>
        <small>{chapter === THEMES.length - 1
          ? l(`全${CHAPTER_ROUNDS}ラウンド · 最後のボスで物語が完結`, `${CHAPTER_ROUNDS} rounds · The final boss completes the story`, `${CHAPTER_ROUNDS}ラウンド · さいごの ボスで おはなしが おわる`)
          : l(`全${CHAPTER_ROUNDS}ラウンド · ボスを倒すと次の章が解放`, `${CHAPTER_ROUNDS} rounds · Beat the boss to unlock the next chapter`, `${CHAPTER_ROUNDS}ラウンド · ボスを たおすと つぎの しょうへ`)}</small>
      </div>
    </article>}
  </section>;
}
