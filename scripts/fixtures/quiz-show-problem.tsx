import React from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles.css';
import ProblemChallengeScreen from '../../src/components/ProblemChallengeScreen';
createRoot(document.getElementById('root')!).render(<div style={{position:'fixed',inset:0}}><ProblemChallengeScreen languageMode="JAPANESE" onBack={()=>{}} /></div>);
