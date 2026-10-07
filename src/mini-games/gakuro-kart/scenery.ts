/** Course-specific materials. Track geometry and racing physics stay independent. */
export const COURSE_SCENERY = [
  { kind:'cyber', road:'#19253e', rail:'#304976', building:'#283962', sun:'#91bfff', ambient:'#a2afff', island:'#263554', exposure:1.05 },
  { kind:'garden', road:'#c9d5ce', rail:'#edcf86', building:'#ebf5f0', sun:'#fff5d6', ambient:'#ecffff', island:'#70b8a2', exposure:1.08 },
  { kind:'solar', road:'#635054', rail:'#bd784c', building:'#c58154', sun:'#ffbf82', ambient:'#ffd1a9', island:'#a87855', exposure:1.08 },
  { kind:'library', road:'#725445', rail:'#c4a46a', building:'#b09880', sun:'#ffe2aa', ambient:'#e7d9cd', island:'#87705b', exposure:1.1 },
  { kind:'forest', road:'#7b8d58', rail:'#69563b', building:'#859b68', sun:'#fff4c6', ambient:'#d7ffe7', island:'#568a4d', exposure:1.08 },
  { kind:'harbor', road:'#b3c7cc', rail:'#f2e0a6', building:'#d4edf4', sun:'#fff9df', ambient:'#ccf6ff', island:'#b4aa79', exposure:1.08 },
  { kind:'aurora', road:'#2b4560', rail:'#7facc4', building:'#678da9', sun:'#aecbff', ambient:'#9cadff', island:'#bacfd9', exposure:1.1 },
  { kind:'stadium', road:'#57374f', rail:'#ab739a', building:'#775a89', sun:'#ffafcf', ambient:'#cfc0ff', island:'#604a78', exposure:1.08 },
] as const;
