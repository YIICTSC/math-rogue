import React from 'react';
import { Gift } from 'lucide-react';

interface RewardHintBannerProps {
  text?: string;
}

const RewardHintBanner: React.FC<RewardHintBannerProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-40 w-[min(92vw,560px)] -translate-x-1/2 rounded border border-yellow-300/60 bg-black/70 px-3 py-2 text-center text-[11px] font-bold leading-snug text-yellow-100 shadow-[0_0_16px_rgba(250,204,21,0.18)] backdrop-blur-sm sm:top-4 sm:text-sm">
      <div className="inline-flex max-w-full items-center justify-center gap-1.5">
        <Gift size={14} className="shrink-0 text-yellow-300" />
        <span className="break-words">{text}</span>
      </div>
    </div>
  );
};

export default RewardHintBanner;
