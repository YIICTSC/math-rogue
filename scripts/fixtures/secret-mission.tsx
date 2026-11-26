import React from 'react';
import { createRoot } from 'react-dom/client';
import VrTitle from '../../src/mini-games/gakurogear/VrTitle';
import { vrInviteCode } from '../../src/mini-games/gakurogear/invite';
import { GameMode } from '../../src/types';

const target=document.getElementById('root')!;
createRoot(target).render(<VrTitle
  languageMode={new URL(location.href).searchParams.get('en')==='1'?'ENGLISH':'JAPANESE'}
  onBack={()=>{target.dataset.closed='true';}} onFinish={()=>{}} problemMode={GameMode.ADDITION} answerMode="CHOICE"
  inviteCode={vrInviteCode(location.href)}
/>);
