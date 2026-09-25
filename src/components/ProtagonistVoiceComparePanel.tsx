import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CircleStop, Play, Volume2 } from 'lucide-react';
import { PROTAGONIST_VOICE_AUDITIONS, type ProtagonistVoiceAuditionTheme } from '../data/protagonistVoiceAudition';
import { audioService } from '../services/audioService';
import { getWebAssetManifest, type WebAssetManifest } from '../services/webAssetCacheService';
import type { LanguageMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import TranslatedUiTree from './TranslatedUiTree';

const VOICE_CATEGORIES = [
  { id: 'battle', label: '戦闘ボイス' },
  { id: 'event', label: 'イベントボイス' },
  { id: 'ending', label: 'エンディング' },
  { id: 'vacation-event', label: 'バカンスイベント' },
  { id: 'vacation-ending', label: 'バカンスエンディング' },
] as const;

type VoiceCategory = typeof VOICE_CATEGORIES[number]['id'];

const stopVoicePlayback = () => {
  audioService.stopMagicBattleVoices();
  audioService.stopHighSchoolVoices();
  audioService.stopMagicEventVoices();
};

const matchesCategory = (theme: ProtagonistVoiceAuditionTheme, category: VoiceCategory, fileName: string) => {
  if (category === 'battle') {
    return theme === 'high-school'
      ? /^(attack|summon|block|power|damage|item|finish|defeat)-\d+$/i.test(fileName)
      : /^(attack|damage|spell)-\d+$/i.test(fileName);
  }
  if (category === 'event') {
    return theme === 'magic' && /^(friendship|romance)-/i.test(fileName);
  }
  if (category === 'ending') return /^ending-/i.test(fileName);
  if (category === 'vacation-event') {
    return theme === 'high-school'
      ? /^vacation-(?!ending-)/i.test(fileName)
      : /^vacation-romance-/i.test(fileName);
  }
  return /^vacation-ending-/i.test(fileName);
};

const getCategoryLabel = (category: VoiceCategory, languageMode: LanguageMode) => {
  if (languageMode !== 'ENGLISH') return VOICE_CATEGORIES.find(option => option.id === category)?.label ?? '';
  return {
    battle: 'Battle Voices',
    event: 'Event Voices',
    ending: 'Endings',
    'vacation-event': 'Vacation Events',
    'vacation-ending': 'Vacation Endings',
  }[category];
};

const getEmptyCategoryMessage = (theme: ProtagonistVoiceAuditionTheme, category: VoiceCategory, languageMode: LanguageMode) => {
  if (languageMode === 'ENGLISH') {
    if (theme === 'high-school' && category === 'event') return 'No protagonist voice clips are available for regular high-school events yet.';
    if (theme === 'magic' && category === 'vacation-ending') return 'No vacation-ending voice clips are currently available for the Magic theme.';
    return 'No voice clips are available in this category.';
  }
  if (theme === 'high-school' && category === 'event') {
    return '高校編には、通常イベント専用の主人公ボイス素材がまだありません。';
  }
  if (theme === 'magic' && category === 'vacation-ending') {
    return 'マジック編のバカンスエンディング音声は、現在の素材一覧にありません。';
  }
  return 'このカテゴリに該当する音声素材はありません。';
};

const ProtagonistVoiceComparePanel: React.FC<{ languageMode: LanguageMode }> = ({ languageMode }) => {
  const [theme, setTheme] = useState<ProtagonistVoiceAuditionTheme>('high-school');
  const [heroId, setHeroId] = useState('WARRIOR');
  const [category, setCategory] = useState<VoiceCategory>('battle');
  const [manifest, setManifest] = useState<WebAssetManifest | null>(null);
  const [manifestError, setManifestError] = useState('');
  const [playingPath, setPlayingPath] = useState('');
  const playbackGeneration = useRef(0);

  const protagonists = useMemo(
    () => PROTAGONIST_VOICE_AUDITIONS.filter(entry => entry.theme === theme),
    [theme],
  );
  const selectedProtagonist = protagonists.find(entry => entry.heroId === heroId) ?? protagonists[0];

  useEffect(() => {
    if (!protagonists.some(entry => entry.heroId === heroId)) {
      setHeroId(protagonists[0]?.heroId ?? '');
    }
  }, [heroId, protagonists]);

  useEffect(() => {
    let cancelled = false;
    void getWebAssetManifest()
      .then(result => {
        if (!cancelled) setManifest(result);
      })
      .catch(reason => {
        if (!cancelled) setManifestError(reason instanceof Error ? reason.message : '音声素材一覧を読み込めませんでした。');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryTracks = useMemo(() => {
    if (!manifest || !selectedProtagonist) return [];
    const voiceRoot = theme === 'high-school' ? 'high-school-voices' : 'magic-voices';
    const eventRoot = theme === 'high-school' ? voiceRoot : 'magic-event-voices';
    const root = category === 'battle' ? voiceRoot : eventRoot;
    const directory = `sfx/${root}/${selectedProtagonist.heroId}/`;
    const packs = Object.values(manifest.packs) as Array<{ files: Array<{ path: string }> }>;
    return Array.from(new Set(packs
      .flatMap(pack => pack.files.map(file => file.path))
      .filter(path => path.startsWith(directory) && path.toLowerCase().endsWith('.ogg'))
      .filter(path => matchesCategory(theme, category, path.slice(directory.length).replace(/\.ogg$/i, '')))))
      .sort((left, right) => left.localeCompare(right, 'en'));
  }, [category, manifest, selectedProtagonist, theme]);

  const stopPlayback = useCallback(() => {
    playbackGeneration.current += 1;
    stopVoicePlayback();
    setPlayingPath('');
  }, []);

  useEffect(() => () => stopVoicePlayback(), []);

  const playTrack = useCallback((path: string) => {
    stopVoicePlayback();
    const generation = playbackGeneration.current + 1;
    playbackGeneration.current = generation;
    setPlayingPath(path);
    const voiceName = path.slice(path.lastIndexOf('/') + 1).replace(/\.(?:ogg|wav)$/i, '');
    const playback = theme === 'high-school'
      ? audioService.playHighSchoolVoiceFile(selectedProtagonist?.heroId, voiceName, 30000)
      : category === 'battle'
        ? audioService.playMagicVoiceFile(selectedProtagonist?.heroId, voiceName, 10000)
        : audioService.playMagicEventVoice(selectedProtagonist?.heroId, voiceName);
    void playback.finally(() => {
      if (playbackGeneration.current === generation) setPlayingPath('');
    });
  }, [category, selectedProtagonist, theme]);

  return (
    <TranslatedUiTree mode={languageMode}>
    <div className="space-y-4">
      <section className="rounded-xl border border-cyan-800/70 bg-gradient-to-br from-cyan-950/45 via-slate-950/50 to-slate-900/40 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="flex items-center text-lg font-black text-cyan-200">
              <Volume2 size={18} className="mr-2" />{languageMode === 'ENGLISH' ? 'Protagonist Voice Comparison' : '主人公ボイス比較'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-300">
              {languageMode === 'ENGLISH'
                ? 'Choose a protagonist and category to preview recorded clips. Starting another clip stops the current one.'
                : '主人公とカテゴリを選び、収録済みの音声を順に試聴できます。再生中に別の音声を選ぶと、前の音声は停止します。'}
            </p>
          </div>
          {playingPath && (
            <button type="button" onClick={stopPlayback} className="flex items-center gap-1 self-start rounded bg-rose-900/80 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-800 lg:self-auto">
              <CircleStop size={14} />{languageMode === 'ENGLISH' ? 'Stop Playback' : '再生停止'}
            </button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            { id: 'high-school', label: languageMode === 'ENGLISH' ? 'High School (9)' : '高校編（9人）' },
            { id: 'magic', label: languageMode === 'ENGLISH' ? 'Magic (17)' : 'マジック編（17人）' },
          ] as const).map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                stopPlayback();
                setTheme(option.id);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-black ${theme === option.id ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-cyan-200 hover:bg-slate-800'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_1fr]">
        <div className="space-y-3 rounded-xl border border-slate-700 bg-black/35 p-3">
          <label className="block space-y-1">
            <span className="text-xs font-black text-gray-400">{languageMode === 'ENGLISH' ? 'Protagonist' : '主人公'}</span>
            <select
              value={selectedProtagonist?.heroId ?? ''}
              onChange={event => {
                stopPlayback();
                setHeroId(event.target.value);
              }}
              className="w-full rounded border border-cyan-800/70 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-300"
            >
              {protagonists.map(entry => <option key={entry.heroId} value={entry.heroId}>{entry.name} / {entry.heroId}</option>)}
            </select>
          </label>
          {selectedProtagonist && (
            <>
              <div className="overflow-hidden rounded-lg border border-cyan-900/70 bg-slate-950/70">
                <img src={assetUrl(selectedProtagonist.imagePath)} alt={selectedProtagonist.name} className="mx-auto max-h-72 w-full object-contain" />
              </div>
              <div className="rounded border border-cyan-900/60 bg-cyan-950/20 p-3">
                <div className="text-base font-black text-white">{selectedProtagonist.name}</div>
                <div className="mt-1 font-mono text-[10px] text-gray-500">{selectedProtagonist.heroId}</div>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {VOICE_CATEGORIES.map(option => {
              const count = category === option.id ? categoryTracks.length : null;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    setCategory(option.id);
                  }}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-black ${category === option.id ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700 bg-slate-900 text-gray-300 hover:border-cyan-800'}`}
                >
                  {getCategoryLabel(option.id, languageMode)}{count !== null ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-700 bg-black/30 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-black text-white">{getCategoryLabel(category, languageMode)}</div>
              {manifest && <div className="text-[10px] text-gray-500">{categoryTracks.length} {languageMode === 'ENGLISH' ? 'clips' : 'クリップ'}</div>}
            </div>
            {manifestError ? (
              <div className="rounded border border-rose-800/70 bg-rose-950/30 p-3 text-xs text-rose-200">{languageMode === 'ENGLISH' ? 'Could not load the asset list: ' : '素材一覧を読み込めません: '}{manifestError}</div>
            ) : !manifest ? (
              <div className="p-4 text-center text-xs text-gray-400">音声素材一覧を読み込み中…</div>
            ) : categoryTracks.length === 0 ? (
              <div className="rounded border border-slate-800 bg-slate-950/70 p-4 text-center text-xs leading-relaxed text-gray-400">
                {getEmptyCategoryMessage(theme, category, languageMode)}
              </div>
            ) : (
              <div className="grid max-h-[min(55vh,620px)] grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
                {categoryTracks.map((path, index) => {
                  const fileName = path.slice(path.lastIndexOf('/') + 1).replace(/\.ogg$/i, '');
                  const isPlaying = playingPath === path;
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => isPlaying ? stopPlayback() : playTrack(path)}
                      aria-pressed={isPlaying}
                      title={fileName}
                      className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${isPlaying ? 'border-cyan-400 bg-cyan-950/70 text-cyan-100' : 'border-slate-700 bg-slate-900/80 text-gray-200 hover:border-cyan-700 hover:bg-slate-800'}`}
                    >
                      {isPlaying ? <Check size={14} className="shrink-0 text-cyan-300" /> : <Play size={14} className="shrink-0 text-cyan-400" />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold">{languageMode === 'ENGLISH' ? 'Voice' : 'ボイス'} {String(index + 1).padStart(2, '0')}</span>
                        <span className="block truncate font-mono text-[9px] text-gray-500">{fileName}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
    </TranslatedUiTree>
  );
};

export default ProtagonistVoiceComparePanel;
