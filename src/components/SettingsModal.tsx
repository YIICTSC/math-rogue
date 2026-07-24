import React from 'react';
import { Settings, X, Volume2, Monitor, Wifi, Download } from 'lucide-react';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';
import { AndroidAssetPackManager } from './AndroidAssetPackManager';

export type BgmMode = 'STUDY' | 'NEW' | 'OLD';
export type SettingsTab = 'AUDIO' | 'DISPLAY' | 'BATTLE' | 'COMM' | 'ASSETS';

export type BattleUiSettings = {
  controlBarOffsetY: number;
  handCardScale: number;
  enemyScale: number;
  playerScale: number;
  enemyOffsetY: number;
  playerOffsetY: number;
  statsScale: number;
};

export type AppSettings = {
  bgmMode: BgmMode;
  bgmVolume: number;
  seVolume: number;
  voiceVolume: number;
  reduceScreenShake: boolean;
  fontSize: 'normal' | 'large';
  battleUi: BattleUiSettings;
  battleUiPortrait: BattleUiSettings;
  battleUiLandscape: BattleUiSettings;
  lowDataMode: boolean;
};

type Props = {
  open: boolean;
  tab: SettingsTab;
  settings: AppSettings;
  onClose: () => void;
  onChangeTab: (tab: SettingsTab) => void;
  onChange: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onResetAudio: () => void;
  onResetAll: () => void;
  isElectron?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: (enabled: boolean) => void;
  onResetWindowState?: () => void;
  onQuitApp?: () => void;
  showCommunication?: boolean;
  showAssetDownloads?: boolean;
  battleUiOrientation?: 'portrait' | 'landscape';
  languageMode: LanguageMode;
};

const tabs: Array<{ key: SettingsTab; label: string; icon: React.ReactNode }> = [
  { key: 'AUDIO', label: '音声', icon: <Volume2 size={14} /> },
  { key: 'DISPLAY', label: '表示', icon: <Monitor size={14} /> },
  { key: 'BATTLE', label: '戦闘UI', icon: <Monitor size={14} /> },
  { key: 'COMM', label: '通信', icon: <Wifi size={14} /> },
  { key: 'ASSETS', label: '素材', icon: <Download size={14} /> }
];

const BattleSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, unit = '', onChange }) => (
  <label className="block">
    <div className="mb-1 flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="min-w-[4.75rem] rounded border border-cyan-500/40 bg-slate-950 px-2 py-0.5 text-right font-mono text-sm tabular-nums text-cyan-100">{value}{unit}</span>
    </div>
    <input
      className="w-full"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onInput={e => onChange(Number(e.currentTarget.value))}
      onChange={e => onChange(Number(e.target.value))}
    />
  </label>
);

const SettingsModal: React.FC<Props> = ({
  open,
  tab,
  settings,
  onClose,
  onChangeTab,
  onChange,
  onResetAudio,
  onResetAll,
  isElectron = false,
  isFullScreen = false,
  onToggleFullScreen,
  onResetWindowState,
  onQuitApp,
  showCommunication = true,
  showAssetDownloads = false,
  battleUiOrientation = 'portrait',
  languageMode
}) => {
  if (!open) return null;
  const visibleTabs = tabs.filter(t =>
    (showCommunication || t.key !== 'COMM')
    && (showAssetDownloads || t.key !== 'ASSETS')
  );
  const battleUiSettingsKey = battleUiOrientation === 'landscape' ? 'battleUiLandscape' : 'battleUiPortrait';
  const activeBattleUi = settings[battleUiSettingsKey] || settings.battleUi;
  const updateBattleUi = (next: BattleUiSettings) => onChange(battleUiSettingsKey, next);

  return (
    <div data-gamepad-modal data-gamepad-initial-scope={`settings-${tab}`} className="app-modal-overlay app-settings-modal-overlay fixed inset-0 z-[10020] bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-3" onClick={onClose}>
      <div data-gamepad-navigation-root className="app-modal-panel app-settings-modal w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-xl border-2 border-cyan-500/50 bg-slate-900/65 text-white shadow-2xl backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900/70 border-b border-slate-700 px-4 py-3 flex items-center justify-between backdrop-blur-sm">
          <h2 className="font-black flex items-center gap-2"><Settings size={16} /> {trans("セッティング", languageMode)}</h2>
          <button data-gamepad-back onClick={onClose} className="p-1 rounded hover:bg-slate-700"><X size={16} /></button>
        </div>

        <div className="px-3 pt-3 flex gap-2 flex-wrap">
          {visibleTabs.map((t, index) => (
            <button key={t.key} data-gamepad-initial-choice={index === 0 ? true : undefined} onClick={() => onChangeTab(t.key)} className={`px-3 py-1 rounded border text-xs font-bold flex items-center gap-1 ${tab === t.key ? 'bg-cyan-700 border-cyan-300' : 'bg-slate-800 border-slate-600'}`}>
              {t.icon}{trans(t.label, languageMode)}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4 text-sm">
          {tab === 'AUDIO' && (
            <>
              <div className="rounded border border-slate-700 p-3 space-y-2">
                <div className="font-bold">{trans("BGMモード", languageMode)}</div>
                <div className="flex gap-2 flex-wrap">
                  {([
                    ['NEW', '新BGM'],
                    ['OLD', '旧BGM'],
                    ['STUDY', 'BGMなし']
                  ] as Array<[BgmMode, string]>).map(([mode, label]) => (
                    <button key={mode} onClick={() => onChange('bgmMode', mode)} className={`px-3 py-1 rounded border ${settings.bgmMode === mode ? 'border-cyan-300 bg-cyan-700' : 'border-slate-600 bg-slate-800'}`}>{trans(label, languageMode)}</button>
                  ))}
                </div>
              </div>
              <label className="block">{trans("BGM音量", languageMode)}: {Math.round(settings.bgmVolume * 100)}%
                <input className="w-full" type="range" min={0} max={150} value={Math.round(settings.bgmVolume * 100)} onInput={e => onChange('bgmVolume', Number(e.currentTarget.value) / 100)} onChange={e => onChange('bgmVolume', Number(e.target.value) / 100)} />
              </label>
              <label className="block">{trans("SE音量", languageMode)}: {Math.round(settings.seVolume * 100)}%
                <input className="w-full" type="range" min={0} max={150} value={Math.round(settings.seVolume * 100)} onInput={e => onChange('seVolume', Number(e.currentTarget.value) / 100)} onChange={e => onChange('seVolume', Number(e.target.value) / 100)} />
              </label>
              <label className="block">{trans("ボイス音量", languageMode)}: {Math.round(settings.voiceVolume * 100)}%
                <input className="w-full" type="range" min={0} max={150} value={Math.round(settings.voiceVolume * 100)} onInput={e => onChange('voiceVolume', Number(e.currentTarget.value) / 100)} onChange={e => onChange('voiceVolume', Number(e.target.value) / 100)} />
              </label>
            </>
          )}

          {tab === 'DISPLAY' && (
            <>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.reduceScreenShake} onChange={e => onChange('reduceScreenShake', e.target.checked)} />{trans("画面揺れ軽減", languageMode)}</label>
              <label className="block">{trans("文字サイズ", languageMode)}
                <select className="w-full bg-slate-800 rounded border border-slate-600 p-1" value={settings.fontSize} onChange={e => onChange('fontSize', e.target.value as AppSettings['fontSize'])}>
                  <option value="normal">{trans("標準", languageMode)}</option><option value="large">{trans("大", languageMode)}</option>
                </select>
              </label>
              {isElectron && (
                <div className="rounded border border-slate-700 p-3 space-y-2">
                  <div className="font-bold">{trans("スクリーン", languageMode)}</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isFullScreen} onChange={e => onToggleFullScreen?.(e.target.checked)} />
                    {trans("フルスクリーン", languageMode)}
                  </label>
                  <button onClick={onResetWindowState} className="px-3 py-1 text-xs rounded border border-slate-500 bg-slate-800 hover:bg-slate-700">
                    {trans("画面サイズを初期化", languageMode)}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'BATTLE' && (
            <div className="rounded border border-slate-700 p-3 space-y-3">
              <div>
                <div className="font-bold">
                  {trans("戦闘画面のUI調整", languageMode)}
                  <span className="ml-2 rounded border border-cyan-400/40 bg-cyan-950/50 px-2 py-0.5 text-[10px] text-cyan-100">
                    {trans(battleUiOrientation === 'landscape' ? "横画面" : "縦画面", languageMode)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {trans("戦闘中にこの設定を開くと、変更が画面へすぐ反映されます。", languageMode)}
                </p>
              </div>
              <BattleSlider
                label={trans("手札上部バー上下位置", languageMode)}
                value={activeBattleUi.controlBarOffsetY}
                min={-140}
                max={40}
                step={2}
                unit="px"
                onChange={value => updateBattleUi({ ...activeBattleUi, controlBarOffsetY: value })}
              />
              <BattleSlider
                label={trans("手札カードサイズ", languageMode)}
                value={activeBattleUi.handCardScale}
                min={0.65}
                max={1.35}
                step={0.05}
                onChange={value => updateBattleUi({ ...activeBattleUi, handCardScale: value })}
              />
              <BattleSlider
                label={trans("敵キャラサイズ", languageMode)}
                value={activeBattleUi.enemyScale}
                min={0.6}
                max={1.6}
                step={0.05}
                onChange={value => updateBattleUi({ ...activeBattleUi, enemyScale: value })}
              />
              <BattleSlider
                label={trans("味方キャラサイズ", languageMode)}
                value={activeBattleUi.playerScale}
                min={0.6}
                max={1.6}
                step={0.05}
                onChange={value => updateBattleUi({ ...activeBattleUi, playerScale: value })}
              />
              <BattleSlider
                label={trans("敵キャラ上下位置", languageMode)}
                value={activeBattleUi.enemyOffsetY}
                min={-80}
                max={80}
                step={2}
                unit="px"
                onChange={value => updateBattleUi({ ...activeBattleUi, enemyOffsetY: value })}
              />
              <BattleSlider
                label={trans("味方キャラ上下位置", languageMode)}
                value={activeBattleUi.playerOffsetY}
                min={-80}
                max={80}
                step={2}
                unit="px"
                onChange={value => updateBattleUi({ ...activeBattleUi, playerOffsetY: value })}
              />
              <BattleSlider
                label={trans("ステータス表示サイズ", languageMode)}
                value={activeBattleUi.statsScale}
                min={0.75}
                max={1.35}
                step={0.05}
                onChange={value => updateBattleUi({ ...activeBattleUi, statsScale: value })}
              />
            </div>
          )}

          {showCommunication && tab === 'COMM' && (
            <>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.lowDataMode} onChange={e => onChange('lowDataMode', e.target.checked)} />{trans("低データ通信モード", languageMode)}</label>
            </>
          )}

          {showAssetDownloads && tab === 'ASSETS' && (
            <AndroidAssetPackManager languageMode={languageMode} />
          )}

        </div>

        <div className="sticky bottom-0 bg-slate-900/70 border-t border-slate-700 p-3 flex justify-between backdrop-blur-sm">
          <div className="flex gap-2">
            <button onClick={onResetAudio} className="px-3 py-1 text-xs rounded border border-amber-400/70 bg-amber-600/30">{trans("音声を初期化", languageMode)}</button>
            <button onClick={onResetAll} className="px-3 py-1 text-xs rounded border border-red-400/70 bg-red-600/30">{trans("全設定を初期化", languageMode)}</button>
            {isElectron && (
              <button onClick={onQuitApp} className="px-3 py-1 text-xs rounded border border-red-400/70 bg-red-900/50 hover:bg-red-800/70">
                {trans("ゲームをとじる", languageMode)}
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-1 rounded bg-cyan-600 hover:bg-cyan-500 font-bold">{trans("閉じる", languageMode)}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
