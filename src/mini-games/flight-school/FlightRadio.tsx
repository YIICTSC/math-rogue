import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';
import script from './radio-script.json';
import { assetUrl } from '../../utils/assetPaths';
import { audioService } from '../../services/audioService';
import type { LanguageMode } from '../../types';
import { localize, type Phrase } from './courses';
import type { RadioEvent } from './patrol';

export type Pilot = keyof typeof script;
const names: Record<Pilot, Phrase> = {
  WARRIOR: ['反逆の高校生', 'High-school rebel', 'はんぎゃくの こうこうせい'],
  CARETAKER: ['生物部の先輩', 'Biology mentor', 'せいぶつぶの せんぱい'],
  ASSASSIN: ['謎めく転入生', 'Mystery transfer', 'なぞめく てんにゅうせい'],
  MAGE: ['化学研究会長', 'Chemistry chair', 'かがくけんきゅうかいちょう'],
  DODGEBALL: ['バスケ部エース', 'Basketball ace', 'バスケぶ エース'],
  BARD: ['放送部ディレクター', 'Broadcast director', 'ほうそうぶ ディレクター'],
  LIBRARIAN: ['文芸部書記', 'Literature secretary', 'ぶんげいぶ しょき'],
  CHEF: ['学食の料理長', 'Cafeteria chef', 'がくしょくの りょうりちょう'],
  GARDENER: ['園芸部部長', 'Gardening captain', 'えんげいぶ ぶちょう'],
};
const portrait = (id: Pilot) =>
  assetUrl('sprites/flight-school/pilots/' + id.toLowerCase() + '.webp');
export function PilotPicker({
  pilot,
  select,
  language,
  compact = false,
}: {
  pilot: Pilot;
  select: (p: Pilot) => void;
  compact?: boolean;
  language: LanguageMode;
}) {
  const t = (...p: Phrase) => localize(p, language);
  const picker = (
    <fieldset className="fs-pilots">
      <legend>{t('搭乗パイロット', 'Select pilot', 'とうじょう パイロット')}</legend>
      <section className="fs-crew-preview">
        {[pilot, script[pilot].wing as Pilot].map((id, i) => (
          <div key={i}>
            <img src={portrait(id)} alt="" />
            <div>
              <small>
                {i ? t('僚機', 'Wingmate', 'りょうき') : t('自機', 'Flight lead', 'じき')}
              </small>
              <strong>{localize(names[id], language)}</strong>
            </div>
          </div>
        ))}
      </section>
      <div>
        {(Object.keys(names) as Pilot[]).map((id) => (
          <button key={id} type="button" aria-pressed={id === pilot} onClick={() => select(id)}>
            <img src={portrait(id)} alt="" />
            <span>{localize(names[id], language)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
  return compact ? (
    <details className="fs-pilot-fold">
      <summary>
        {t('搭乗パイロット', 'Select pilot', 'とうじょう パイロット')} ·{' '}
        {localize(names[pilot], language)}
      </summary>
      {picker}
    </details>
  ) : (
    picker
  );
}
type Caption = { actor: Pilot; text: Phrase };
export function RadioCaption({ line, language }: { line: Caption | null; language: LanguageMode }) {
  return line ? (
    <aside className="fs-radio" role="status">
      <img alt="" src={portrait(line.actor)} />
      <div>
        <b>
          <Radio size={13} /> {localize(names[line.actor], language)}
        </b>
        <span>{localize(line.text, language)}</span>
      </div>
    </aside>
  ) : null;
}
export function useFlightCrew() {
  const [pilot, select] = useState<Pilot>('WARRIOR');
  const [line, setLine] = useState<Caption | null>(null);
  const channel = useRef({ generation: 0, busy: false, pending: [] as RadioEvent[] });
  const stop = useCallback(() => {
    const ch = channel.current;
    ch.generation++;
    ch.busy = false;
    ch.pending.length = 0;
    audioService.stopFlightRadio();
    setLine(null);
  }, []);
  useEffect(() => stop, [stop, pilot]);
  const cue = useCallback(
    async (event: RadioEvent) => {
      const ch = channel.current;
      // Finish the current call and its reply, even when touchdown opens the debrief.
      if (event === 'land') ch.pending = ch.pending.filter((item) => item === 'home');
      if (event === 'home') ch.pending.length = 0;
      ch.pending.push(event);
      if (ch.busy) return;
      ch.busy = true;
      const generation = ch.generation;
      while (ch.pending.length && generation === ch.generation) {
        const next = ch.pending.shift()!,
          lines = script[pilot][next];
        for (const [index, text] of lines.entries()) {
          if (generation !== ch.generation) return;
          setLine({
            actor: index ? (script[pilot].wing as Pilot) : pilot,
            text: [text[0], text[1], text[2]],
          });
          const captionMs = Math.max(1600, Math.min(4500, text[0].length * 105));
          await Promise.all([
            audioService.playFlightRadio(pilot, next, index).catch(() => false),
            new Promise((resolve) => window.setTimeout(resolve, captionMs)),
          ]);
        }
      }
      if (ch.generation === generation) {
        ch.busy = false;
        setLine(null);
      }
    },
    [pilot],
  );
  return { pilot, select, line, cue, stop };
}

export type FlightCrew = ReturnType<typeof useFlightCrew>;
