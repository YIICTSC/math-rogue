import React from 'react';
import TranslatedUiTree from '../../components/TranslatedUiTree';
import type {LanguageMode} from '../../types';
import {trans} from '../../utils/textUtils';
import './onlineEntry.css';

/** The garage layout: a full-height preview beside the preparation controls. */
export default function OnlineEntryScreen({brand,title,preview,caption,children,onBack,languageMode,footer,className=''}:{brand:string;title:string;preview:React.ReactNode;caption?:React.ReactNode;children:React.ReactNode;onBack:()=>void;languageMode:LanguageMode;footer?:React.ReactNode;className?:string}){
 return <TranslatedUiTree mode={languageMode}><main className={`online-entry-shell ${className}`}>
  <header className="online-entry-header"><button onClick={onBack}>← {trans('タイトルへ戻る',languageMode)}</button><strong>{brand}</strong></header>
  <div className="online-entry-layout">
   <section className="online-entry-preview">{preview}{caption&&<div className="online-entry-caption">{caption}</div>}</section>
   <section className="online-entry-panel"><header className="online-entry-heading"><h2>{title}</h2></header><div className="online-entry-fields">{children}</div>{footer&&<footer className="online-entry-footer">{footer}</footer>}</section>
  </div>
 </main></TranslatedUiTree>;
}
