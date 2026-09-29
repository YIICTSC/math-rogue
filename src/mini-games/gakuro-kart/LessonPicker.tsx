import React, { useState } from 'react';
import ModeSelectionScreen from '../../components/ModeSelectionScreen';
import AssignmentInboxModal from '../../components/AssignmentInboxModal';
import { storageService } from '../../services/storageService';
import { getAssignmentFromUrl, getAssignmentRepresentativeMode } from '../../utils/assignmentUtils';
import { trans } from '../../utils/textUtils';
import type { AssignmentPayload, LanguageMode } from '../../types';
import type { LessonSelection } from './questions';
export default function LessonPicker({ languageMode, busy, error, onSelect, onBack }: { languageMode: LanguageMode; busy: boolean; error: string; onSelect: (selection: LessonSelection) => void; onBack: () => void }) {
  const [inbox, setInbox] = useState(false);
  const [assignment] = useState(() => getAssignmentFromUrl() || storageService.getCurrentAssignment());
  const t = (s: string) => trans(s, languageMode);
  const selectAssignment = (a: AssignmentPayload) => { setInbox(false); onSelect({ mode: getAssignmentRepresentativeMode(a), assignment: { ...a, answerMode: 'CHOICE', units: a.units.map(u => ({ ...u, answerMode: 'CHOICE' })) } }); };
  return <section className="gk-lesson-picker" aria-label={t('カートの問題選択')}>
    <header><button onClick={onBack} disabled={busy}>{t('戻る')}</button><div><b>{t('カートの問題選択')}</b><small>{t('4択固定・スタート直線で3問')}</small></div><button disabled={busy} onClick={() => setInbox(true)}>{t('配信課題を選ぶ')}</button>{assignment && <button disabled={busy} onClick={() => selectAssignment(assignment)}>{t('受け取り済みの課題')}</button>}</header>
    {error && <p role="alert" className="gk-error">{t(error)}</p>}
    <div className="gk-mode-selection" inert={busy || undefined}><ModeSelectionScreen fixedAnswerMode="CHOICE" languageMode={languageMode} onBack={onBack} onSelectMode={(mode, modes) => onSelect({ mode, modes })} /></div>
    {busy && <div className="gk-preparing" role="status">{t('問題とコースを準備中…')}</div>}
    <AssignmentInboxModal open={inbox} onClose={() => setInbox(false)} onSelect={selectAssignment} onProfileChange={() => {}} languageMode={languageMode} />
  </section>;
}
