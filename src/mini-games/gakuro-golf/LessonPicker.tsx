import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ModeSelectionScreen from '../../components/ModeSelectionScreen';
import AssignmentInboxModal from '../../components/AssignmentInboxModal';
import { storageService } from '../../services/storageService';
import { getAssignmentFromUrl, getAssignmentRepresentativeMode } from '../../utils/assignmentUtils';
import { trans } from '../../utils/textUtils';
import type { AssignmentPayload, LanguageMode } from '../../types';
import type { LessonSelection } from '../gakuro-kart/questions';
export default function LessonPicker({ languageMode, busy, error, onSelect, onBack }: { languageMode: LanguageMode; busy: boolean; error: string; onSelect: (selection: LessonSelection) => void; onBack: () => void }) {
  const [inbox, setInbox] = useState(false);
  const [assignment] = useState(() => getAssignmentFromUrl() || storageService.getCurrentAssignment());
  const t = (s: string) => trans(s, languageMode);
  const selectAssignment = (a: AssignmentPayload) => { setInbox(false); onSelect({ mode: getAssignmentRepresentativeMode(a), assignment: { ...a, answerMode: 'CHOICE', units: a.units.map(u => ({ ...u, answerMode: 'CHOICE' })) } }); };
  // Outside gg-root so golf's button/input styles cannot override the main game's selection UI.
  return createPortal(<section className="gg-lesson-picker" aria-label={t('ゴルフの問題選択')}>
    <header><button onClick={onBack} disabled={busy}>{t('戻る')}</button><div><b>{t('ゴルフの問題選択')}</b><small>{t('3ショットごとに3問。正解するほどパワーと精度がアップ')}</small></div><button disabled={busy} onClick={() => setInbox(true)}>{t('配信課題を選ぶ')}</button>{assignment && <button disabled={busy} onClick={() => selectAssignment(assignment)}>{t('受け取り済みの課題')}</button>}</header>
    {error && <p role="alert" className="gg-error">{t(error)}</p>}
    <div className="gg-mode-selection" inert={busy || undefined}><ModeSelectionScreen fixedAnswerMode="CHOICE" languageMode={languageMode} onBack={onBack} onSelectMode={(mode, modes) => onSelect({ mode, modes })} /></div>
    {busy && <div className="gg-preparing" role="status">{t('コースと問題を準備中…')}</div>}
    <AssignmentInboxModal open={inbox} onClose={() => setInbox(false)} onSelect={selectAssignment} onProfileChange={() => {}} languageMode={languageMode} />
  </section>, document.body);
}
