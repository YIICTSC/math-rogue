import React from 'react';
import { Settings, X, Volume2, Mic, Monitor, Wifi } from 'lucide-react';
import { LanguageMode } from '../types';
import { trans } from '../utils/textUtils';

export type BgmMode = 'STUDY' | 'MP3' | 'OSCILLATOR';
export type SettingsTab = 'AUDIO' | 'DISPLAY' | 'BATTLE' | 'COMM';

export type BattleUiSettings = {
  handAreaHeightRem: number;
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
  micEnabled: boolean;
  selectedInputDeviceId: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  remoteVoiceVolume: number;
  joinMuted: boolean;
  reduceScreenShake: boolean;
  fontSize: 'normal' | 'large';
  battleUi: BattleUiSettings;
  lowDataMode: boolean;
};

type Props = {
  open: boolean;
  tab: SettingsTab;
  settings: AppSettings;
  inputDevices: MediaDeviceInfo[];
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
  languageMode: LanguageMode;
};

const tabs: Array<{ key: SettingsTab; label: string; icon: React.ReactNode }> = [
  { key: 'AUDIO', label: '音声', icon: <Volume2 size={14} /> },
  { key: 'DISPLAY', label: '表示', icon: <Monitor size={14} /> },
  { key: 'BATTLE', label: '戦闘UI', icon: <Monitor size={14} /> },
  { key: 'COMM', label: '通信', icon: <Wifi size={14} /> }
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
      <span className="font-mono text-xs text-cyan-200">{value}{unit}</span>
    </div>
    <input
      className="w-full"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
    />
  </label>
);

const SettingsModal: React.FC<Props> = ({
  open,
  tab,
  settings,
  inputDevices,
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
  languageMode
}) => {
  if (!open) return null;
  const visibleTabs = showCommunication ? tabs : tabs.filter(t => t.key !== 'COMM');

  return (
    <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-xl border-2 border-cyan-500/50 bg-slate-900 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h2 className="font-black flex items-center gap-2"><Settings size={16} /> {trans("セッティング", languageMode)}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700"><X size={16} /></button>
        </div>

        <div className="px-3 pt-3 flex gap-2 flex-wrap">
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => onChangeTab(t.key)} className={`px-3 py-1 rounded border text-xs font-bold flex items-center gap-1 ${tab === t.key ? 'bg-cyan-700 border-cyan-300' : 'bg-slate-800 border-slate-600'}`}>
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
                  {(['STUDY','MP3','OSCILLATOR'] as BgmMode[]).map(mode => (
                    <button key={mode} onClick={() => onChange('bgmMode', mode)} className={`px-3 py-1 rounded border ${settings.bgmMode === mode ? 'border-cyan-300 bg-cyan-700' : 'border-slate-600 bg-slate-800'}`}>{mode}</button>
                  ))}
                </div>
              </div>
              <label className="block">{trans("BGM音量", languageMode)}: {Math.round(settings.bgmVolume * 100)}%
                <input className="w-full" type="range" min={0} max={100} value={Math.round(settings.bgmVolume * 100)} onChange={e => onChange('bgmVolume', Number(e.target.value) / 100)} />
              </label>
              <label className="block">{trans("SE音量", languageMode)}: {Math.round(settings.seVolume * 100)}%
                <input className="w-full" type="range" min={0} max={100} value={Math.round(settings.seVolume * 100)} onChange={e => onChange('seVolume', Number(e.target.value) / 100)} />
              </label>
              <div className="rounded border border-slate-700 p-3 space-y-2">
                <div className="font-bold flex items-center gap-1"><Mic size={14} /> {trans("マイク", languageMode)}</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.micEnabled} onChange={e => onChange('micEnabled', e.target.checked)} />{trans("マイクON", languageMode)}</label>
                <label className="block">{trans("入力デバイス", languageMode)}
                  <select className="w-full bg-slate-800 rounded border border-slate-600 p-1" value={settings.selectedInputDeviceId} onChange={e => onChange('selectedInputDeviceId', e.target.value)}>
                    <option value="">{trans("既定デバイス", languageMode)}</option>
                    {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || trans('マイク', languageMode)}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.noiseSuppression} onChange={e => onChange('noiseSuppression', e.target.checked)} />{trans("ノイズ抑制", languageMode)}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.echoCancellation} onChange={e => onChange('echoCancellation', e.target.checked)} />{trans("エコーキャンセル", languageMode)}</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.autoGainControl} onChange={e => onChange('autoGainControl', e.target.checked)} />{trans("自動ゲイン調整", languageMode)}</label>
              </div>
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
                <div className="font-bold">{trans("戦闘画面のUI調整", languageMode)}</div>
                <p className="mt-1 text-xs text-slate-400">
                  {trans("戦闘中にこの設定を開くと、変更が画面へすぐ反映されます。", languageMode)}
                </p>
              </div>
              <BattleSlider
                label={trans("手札エリアの高さ", languageMode)}
                value={settings.battleUi.handAreaHeightRem}
                min={9}
                max={17}
                step={0.25}
                unit="rem"
                onChange={value => onChange('battleUi', { ...settings.battleUi, handAreaHeightRem: value })}
              />
              <BattleSlider
                label={trans("敵キャラサイズ", languageMode)}
                value={settings.battleUi.enemyScale}
                min={0.6}
                max={1.6}
                step={0.05}
                onChange={value => onChange('battleUi', { ...settings.battleUi, enemyScale: value })}
              />
              <BattleSlider
                label={trans("味方キャラサイズ", languageMode)}
                value={settings.battleUi.playerScale}
                min={0.6}
                max={1.6}
                step={0.05}
                onChange={value => onChange('battleUi', { ...settings.battleUi, playerScale: value })}
              />
              <BattleSlider
                label={trans("敵キャラ上下位置", languageMode)}
                value={settings.battleUi.enemyOffsetY}
                min={-80}
                max={80}
                step={2}
                unit="px"
                onChange={value => onChange('battleUi', { ...settings.battleUi, enemyOffsetY: value })}
              />
              <BattleSlider
                label={trans("味方キャラ上下位置", languageMode)}
                value={settings.battleUi.playerOffsetY}
                min={-80}
                max={80}
                step={2}
                unit="px"
                onChange={value => onChange('battleUi', { ...settings.battleUi, playerOffsetY: value })}
              />
              <BattleSlider
                label={trans("ステータス表示サイズ", languageMode)}
                value={settings.battleUi.statsScale}
                min={0.75}
                max={1.35}
                step={0.05}
                onChange={value => onChange('battleUi', { ...settings.battleUi, statsScale: value })}
              />
            </div>
          )}

          {showCommunication && tab === 'COMM' && (
            <>
              <label className="block">{trans("相手音量", languageMode)}: {Math.round(settings.remoteVoiceVolume * 100)}%
                <input className="w-full" type="range" min={0} max={100} value={Math.round(settings.remoteVoiceVolume * 100)} onChange={e => onChange('remoteVoiceVolume', Number(e.target.value) / 100)} />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.joinMuted} onChange={e => onChange('joinMuted', e.target.checked)} />{trans("部屋参加時ミュート開始", languageMode)}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.lowDataMode} onChange={e => onChange('lowDataMode', e.target.checked)} />{trans("低データ通信モード", languageMode)}</label>
            </>
          )}

        </div>

        <div className="sticky bottom-0 bg-slate-900/95 border-t border-slate-700 p-3 flex justify-between">
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
