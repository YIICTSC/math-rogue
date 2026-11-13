import type { LanguageMode } from '../../types';
import { Sprite } from './art';
import { translate, gameText } from './copy';
import { castFor } from './direction';
import { RushPortrait } from './RoundEffects';
import { isSpeedUp, type Active } from './engine';
import { controlsFor } from './controls';

/** A short, readable command before the controls become live. */
export default function RoundBroadcast({ stage, mode }: { stage: Active; mode: LanguageMode }) {
  if (stage.tag !== 'ready') return null;
  const l = (ja: string, en: string, hira: string) => translate(mode, [ja, en, hira]);
  const boss = !!stage.round.entry.game.boss, speed = isSpeedUp(stage.run), cast = castFor(stage.round.entry);
  const scheme = controlsFor(stage.round.entry).scheme;
  return <div className="asr-round-intro" data-announcement={boss ? 'boss' : speed ? 'speed' : 'next'} role="status" key={stage.run.number}>
    <div className="asr-intro-rays" aria-hidden="true" />
    <div className="asr-intro-heading"><Sprite name={boss ? 'shield' : speed ? 'wind' : 'bell'} />
      <b>{boss ? 'BOSS!' : speed ? 'SPEED UP!' : `ROUND ${String(stage.run.number).padStart(2, '0')}`}</b>
    </div>
    <div className="asr-intro-cast"><RushPortrait id={cast.id} /><span>{l(...cast.name)}</span></div>
    <h2>{gameText(mode, stage.round.entry.game.cue)}</h2>
    <p>{boss ? l('じっくり、勝負！', 'Big challenge!', 'じっくり、しょうぶ！') : speed
      ? l('ひと息ついたら、もう一段！', 'Ready for the next gear?', 'ひといきついたら、もういちだん！')
      : stage.run.mode.kind === 'practice' ? l('操作を試してみよう', 'Take your time and try the controls', 'そうさをためしてみよう')
      : l('見て、すぐ動こう！', 'Watch. React. Go!', 'みて、すぐうごこう！')}</p>
    <small className="asr-intro-controls">{stage.round.entry.game.action ? <>
      {gameText(mode, stage.round.entry.game.action.stick)} · A {gameText(mode, stage.round.entry.game.action.a)} · B {gameText(mode, stage.round.entry.game.action.b)}
    </> : scheme === 'select'
      ? l('方向でえらぶ → A ／ Bでひとつ戻す', 'Stick to choose → A / B to undo', 'ほうこうでえらぶ → A ／ Bでひとつもどす')
      : scheme === 'direction' ? l('方向で操作 ／ A・Bでアクション', 'Move with the stick / A · B to act', 'ほうこうでそうさ ／ A・Bでアクション')
        : scheme === 'dual' ? l('A・Bを使い分けよう', 'Use A and B', 'A・Bをつかいわけよう') : l('タイミングよく A！', 'Time your A press!', 'タイミングよく A！')}</small>
  </div>;
}
