import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { Player } from '../types';
import { getMagicRuleConfig } from '../data/magicLoadouts';
import { assetUrl } from '../utils/assetPaths';

interface MagicRulePanelProps {
  player: Player;
}

const MagicRulePanel: React.FC<MagicRulePanelProps> = ({ player }) => {
  const heroId = player.magicProtagonistId ?? 'AKARI';
  const config = getMagicRuleConfig(heroId);
  const state = player.magicRuleState;
  const progress = Math.min(3, state?.value ?? 0);
  const remaining = Math.max(0, 3 - progress);
  const panelStyle = {
    backgroundImage: `linear-gradient(rgba(2,6,23,0.74), rgba(2,6,23,0.9)), url(${assetUrl(`sprites/magic/rules/${heroId}/ui.webp`)})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  };
  const panelBody = (
    <div className="p-3">
      <div className="grid grid-cols-3 gap-1.5">
        {config.slotLabels.map((label, index) => {
          const filled = index < progress;
          return (
            <div
              key={label}
              className={`min-h-12 rounded-lg border px-1 py-2 text-center text-[9px] font-bold transition-all ${
                filled
                  ? 'border-fuchsia-200 bg-fuchsia-500/65 text-white shadow-[0_0_10px_rgba(232,121,249,0.55)]'
                  : 'border-slate-500/70 bg-slate-900/70 text-slate-400'
              }`}
            >
              <div className="mb-1 text-base leading-none">{filled ? '◆' : '◇'}</div>
              {label}
            </div>
          );
        })}
      </div>
      <div className="mt-2 rounded-lg border border-cyan-300/40 bg-cyan-950/70 px-2 py-1.5">
        <div className="text-[9px] font-black tracking-wider text-cyan-300">完成条件</div>
        <p className="mt-0.5 text-[10px] font-bold leading-relaxed text-white">{config.completionCondition}</p>
        <div className="mt-1 text-right text-[10px] font-black text-amber-200">
          {remaining > 0 ? `完成まであと ${remaining}` : '完成！'}
        </div>
      </div>
      <details className="mt-2 text-[10px] text-slate-200">
        <summary className="cursor-pointer font-bold text-fuchsia-200">ルール説明を見る</summary>
        <p className="mt-1 leading-relaxed">{config.description}</p>
        <div className="mt-2 rounded border border-amber-300/40 bg-amber-950/60 px-2 py-1">
          <div className="font-black text-amber-200">完成効果</div>
          <p className="mt-0.5 leading-relaxed text-amber-50">{config.completionEffect}</p>
        </div>
      </details>
      {player.magicTransformed && (
        <div className="mt-2 rounded border border-amber-300/60 bg-amber-950/70 px-2 py-1 text-center text-[10px] font-black text-amber-200">
          変身中：強化版カード追加済み
        </div>
      )}
    </div>
  );

  return (
    <>
      <details
        className="magic-rule-panel-mobile pointer-events-auto absolute left-2 top-14 z-40 overflow-hidden rounded-xl border-2 border-fuchsia-300/70 bg-slate-950/95 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]"
        style={panelStyle}
      >
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-2.5 py-1.5">
          <Sparkles size={14} className="shrink-0 text-fuchsia-300" />
          <div className="min-w-0">
            <div className="truncate text-xs font-black">{config.name}</div>
            <div className="flex items-center gap-1 text-[10px] font-black text-fuchsia-200">
              <span>{[0, 1, 2].map(index => index < progress ? '◆' : '◇').join('')}</span>
              <span className="text-amber-200">{remaining > 0 ? `あと${remaining}` : '完成'}</span>
            </div>
          </div>
          <ChevronDown size={14} className="magic-rule-panel-mobile-chevron ml-auto shrink-0 text-fuchsia-200" />
        </summary>
        <div className="magic-rule-panel-mobile-body border-t border-fuchsia-300/30">
          {panelBody}
        </div>
      </details>

      <div
        className="magic-rule-panel-desktop pointer-events-auto absolute left-2 top-14 z-40 w-52 overflow-hidden rounded-xl border-2 border-fuchsia-300/70 bg-slate-950/92 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] md:left-4 md:top-16 md:w-64"
        style={panelStyle}
      >
        <div className="border-b border-fuchsia-300/30 px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-fuchsia-300">
            <Sparkles size={13} /> PERSONAL MAGIC SYSTEM
          </div>
          <div className="mt-0.5 text-sm font-black text-white">{config.name}</div>
        </div>
        {panelBody}
      </div>
    </>
  );
};

export default MagicRulePanel;
