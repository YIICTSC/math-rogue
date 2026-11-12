import React from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles.css';
import QuizShow from '../../src/quiz-show/QuizShow';
import {invitationFromLocation} from '../../src/quiz-show/invite';
const params=new URLSearchParams(location.search);
const language=params.get('lang')==='ENGLISH'?'ENGLISH':params.get('lang')==='HIRAGANA'?'HIRAGANA':'JAPANESE';
createRoot(document.getElementById('root')!).render(<React.StrictMode><QuizShow direct={!!invitationFromLocation()} languageMode={language} onBack={()=>location.assign('/quiz-test')} /></React.StrictMode>);
