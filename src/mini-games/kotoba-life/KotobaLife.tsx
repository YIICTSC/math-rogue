import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Coffee, Heart, Home, Leaf, MapPin, MessageCircle, Moon, Pause, Play, Plus, RotateCcw, Settings2, Sparkles, Sun, Utensils, Volume2, VolumeX, X } from 'lucide-react';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import MiniGameProblemChallenge from '../../components/MiniGameProblemChallenge';
import { assetUrl } from '../../utils/assetPaths';
import { audioService } from '../../services/audioService';
import { CHARACTERS, ROOMS, NPCS, WORD_CATEGORIES, text, type CharacterId, type RoomId, type NpcId } from './data';
import { MAX_ENERGY, loadState, saveState, selectCharacter, selectRoom, currentCompanion, initialDialogue, teachWord, talk, care, visitTown, rechargeEnergy, friendshipStage, bondStage, removeWord, respondToDialogue } from './model';
import CompanionScene from './CompanionScene';
import { useKotobaVoice } from './useKotobaVoice';
import './kotoba-life.css';

type Panel = 'teach' | 'care' | 'town' | 'notebook' | 'settings' | 'help' | null;
type Dialogue = ReturnType<typeof initialDialogue>;
type LifeState = ReturnType<typeof loadState>;
const ANIMAL_MARKS: Record<CharacterId, string> = { mugi: '♧', momo: '♧', sora: '≈', kohaku: '✧', pico: '❄' };
const VOICE_PREF_KEY = 'learning-rogue:kotoba-life:voice';

/** A room to return to. Only teaching consumes energy; every other visit is unhurried. */
export default function KotobaLife({ onBack, problemMode, problemModePool, answerMode, assignment, onAnswerResult, languageMode = 'JAPANESE' }: MiniGameComponentProps) {
  const en = languageMode === 'ENGLISH';
  const t = (ja: string, english: string) => en ? english : ja;
  const tx = (value: Parameters<typeof text>[0]) => text(value, en);
  const [state, setState] = useState(loadState);
  const stateRef = useRef(state);
  const [entered, setEntered] = useState(false);
  const [setup, setSetup] = useState(false);
  const [draftCharacter, setDraftCharacter] = useState<CharacterId>(state.character);
  const [draftRoom, setDraftRoom] = useState<RoomId>(state.room);
  const [panel, setPanel] = useState<Panel>(null);
  const [settingsTab, setSettingsTab] = useState<'friend' | 'room'>('friend');
  const [notebookTab, setNotebookTab] = useState<'words' | 'memories' | 'heart'>('words');
  const [dialogue, setDialogue] = useState<Dialogue>(() => initialDialogue(state));
  const [lineIndex, setLineIndex] = useState(0);
  const [town, setTown] = useState<NpcId | null>(null);
  const [auto, setAuto] = useState(false);
  const [reactionKey, setReactionKey] = useState(0);
  const [word, setWord] = useState('');
  const [reading, setReading] = useState('');
  const [category, setCategory] = useState<(typeof WORD_CATEGORIES)[number]['id']>('thing');
  const [wordError, setWordError] = useState('');
  const [quiz, setQuiz] = useState(false);
  const quizRewarded = useRef(false);
  const [quizOffset, setQuizOffset] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [notice, setNotice] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(() => { try { return localStorage.getItem(VOICE_PREF_KEY) !== 'off'; } catch { return true; } });
  const dialogueElement = useRef<HTMLDivElement>(null);
  const [dialogueBottom, setDialogueBottom] = useState(270);
  const music = useRef<ReturnType<typeof audioService.acquireBgmScene> | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const character = CHARACTERS.find(item => item.id === state.character)!;
  const room = ROOMS.find(item => item.id === state.room)!;
  const companion = currentCompanion(state);
  const npc = NPCS.find(item => item.id === town);
  const line = dialogue.lines[Math.min(lineIndex, dialogue.lines.length - 1)];
  const lastLine = lineIndex >= dialogue.lines.length - 1;
  const voice = useKotobaVoice({ line, characterId: state.character, npcId: town, words: companion.words,
    enabled: entered && !panel && !quiz && !setup, voiceEnabled, languageMode,
    utteranceKey: `${dialogue.id}:${lineIndex}:${reactionKey}` });
  const musicType = quiz ? 'math' : town ? 'shop' : 'rest';

  const commit = (next: LifeState) => {
    stateRef.current = next;
    setState(next);
    setSaveError(!saveState(next));
  };
  const showDialogue = (next: Dialogue) => {
    setDialogue(next);
    setLineIndex(0);
    setReactionKey(key => key + 1);
  };
  const answerDialogue = (choiceId: 'curious' | 'kind' | 'playful') => {
    const result = respondToDialogue(stateRef.current, dialogue, choiceId);
    commit(result.state);
    showDialogue(result.dialogue);
  };
  const toggleVoice = () => {
    setVoiceEnabled(value => {
      const next = !value;
      try { localStorage.setItem(VOICE_PREF_KEY, next ? 'on' : 'off'); } catch { /* A voice preference need not block play. */ }
      return next;
    });
  };
  const interact = (action: 'talk' | 'feed' | 'play' | 'rest' | 'pet') => {
    const result = action === 'talk' ? talk(stateRef.current) : care(stateRef.current, action);
    commit(result.state);
    showDialogue(result.dialogue);
    setPanel(null);
  };
  const closePanel = () => { setPanel(null); setSetup(false); setWordError(''); };
  const beginQuiz = () => {
    quizRewarded.current = false;
    setAuto(false);
    setPanel(null);
    setQuiz(true);
  };
  const completeQuiz = (correct: number) => {
    if (quizRewarded.current) return;
    quizRewarded.current = true;
    const before = stateRef.current.energy;
    const next = rechargeEnergy(stateRef.current, correct);
    commit(next);
    setQuiz(false);
    setQuizOffset(offset => offset + 3);
    setNotice(next.energy > before ? t(`ことばエネルギー +${next.energy - before}。またひとつ、お話を増やそう。`, `Word energy +${next.energy - before}. Another little story to share.`) : t('ひとやすみ。おしゃべりやお世話は、いつでもできるよ。', 'Take your time. Chatting and caring are always free.'));
  };
  const start = () => {
    const next = selectRoom(selectCharacter(stateRef.current, draftCharacter), draftRoom);
    commit(next);
    showDialogue(initialDialogue(next));
    setSetup(false);
    setEntered(true);
  };
  const advance = () => {
    if (lastLine) { setAuto(false); return; }
    setLineIndex(index => index + 1);
    setReactionKey(key => key + 1);
  };
  const goHome = () => {
    setTown(null);
    setAuto(false);
    showDialogue(initialDialogue(stateRef.current));
  };
  const openTown = (id: NpcId) => {
    const result = visitTown(stateRef.current, id);
    commit(result.state);
    showDialogue(result.dialogue);
    setTown(id);
    setPanel(null);
    setAuto(true);
  };
  const submitWord = (event: React.FormEvent) => {
    event.preventDefault();
    const result = teachWord(stateRef.current, word, category, reading);
    if (result.status === 'learned') {
      commit(result.state);
      if (result.dialogue) showDialogue(result.dialogue);
      setWord('');
      setReading('');
      setWordError('');
      setPanel(null);
      return;
    }
    const errors: Record<string, string> = {
      duplicate: t('そのことばは、もう覚えているよ。別のことばを教えてね。', 'I already know that word. Teach me another one.'),
      empty: t('教えたいことばを入れてね。', 'Enter a word to share.'),
      'too-long': t('ことばは24文字までにしてね。', 'Use up to 24 characters.'),
      'reading-required': t('このことばの読み方を、ひらがなかカタカナで教えてね。', 'Add a hiragana or katakana reading so your friend can say this word.'),
      'invalid-reading': t('読み方は、ひらがなかカタカナで入れてね。', 'Use hiragana or katakana for the reading.'),
      'no-energy': t('エネルギーがからっぽ。問題でチャージしよう。', 'Word energy is empty. Answer a few questions to recharge.'),
      full: t('ことば帳がいっぱい。手帳からことばを整理できるよ。', 'Your wordbook is full. You can make room in your notebook.'),
    };
    setWordError(errors[result.status] || t('ことばを確認してね。', 'Please check that word.'));
  };

  useEffect(() => {
    const scope = audioService.acquireBgmScene('rest', { theme: 'high-school' }, 30);
    music.current = scope;
    return () => { scope(); music.current = null; };
  }, []);
  useEffect(() => { music.current?.update(musicType, { theme: 'high-school' }); }, [musicType]);
  useEffect(() => {
    const flush = () => { if (stateRef.current.started) saveState(stateRef.current); };
    window.addEventListener('pagehide', flush);
    return () => { flush(); window.removeEventListener('pagehide', flush); };
  }, []);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!auto || !town || panel || quiz || lastLine || !voice.finished) return;
    const timer = setTimeout(() => {
      if (!document.hidden) { setLineIndex(index => index + 1); setReactionKey(key => key + 1); }
      else setAuto(false);
    }, voiceEnabled && voice.supported && !voice.unreadable ? 1100 : Math.max(3800, (line ? tx(line.text).length : 0) * (en ? 55 : 110)));
    return () => clearTimeout(timer);
  }, [auto, town, panel, quiz, lastLine, lineIndex, dialogue.id, en, voice.finished, voiceEnabled, voice.supported, voice.unreadable]);
  useLayoutEffect(() => {
    const element = dialogueElement.current;
    if (!element) return;
    const measure = () => setDialogueBottom(element.getBoundingClientRect().bottom);
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure();
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [entered, quiz]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!setup && !panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('.kl-dialog');
    const timer = setTimeout(() => dialog?.querySelector<HTMLElement>('[autofocus],input,button,select')?.focus(), 30);
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closePanel(); }
      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')).filter(item => item.getClientRects().length > 0);
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', keys);
    return () => { clearTimeout(timer); document.removeEventListener('keydown', keys); previous?.focus(); };
  }, [setup, panel]);

  const name = tx(character.name);
  const panelTitle = setup ? t('きょうから、一緒に。', 'A little life together.') : panel === 'teach' ? t('ことばを教える', 'Teach a word') : panel === 'care' ? t('いっしょに、ひとやすみ', 'A little time together') : panel === 'town' ? t('まちへ、おさんぽ', 'A stroll around town') : panel === 'notebook' ? t('ふたりの手帳', 'Our little notebook') : panel === 'settings' ? t('暮らしの着せかえ', 'Make yourself at home') : t('ことば日和のあそびかた', 'Welcome to Kotoba Days');
  const chooseCharacter = (id: CharacterId) => {
    if (setup) { setDraftCharacter(id); return; }
    const next = selectCharacter(stateRef.current, id);
    commit(next);
    setTown(null);
    setAuto(false);
    showDialogue(initialDialogue(next));
  };
  const chooseRoom = (id: RoomId) => {
    if (setup) { setDraftRoom(id); return; }
    const next = selectRoom(stateRef.current, id);
    commit(next);
    showDialogue(initialDialogue(next));
    setTown(null);
    setAuto(false);
  };
  const choices = (inSetup: boolean) => <>
    <div className="kl-choice-tabs" role="tablist" aria-label={t('暮らしを選ぶ', 'Choose your little life')}>
      <button role="tab" aria-selected={settingsTab === 'friend'} onClick={() => setSettingsTab('friend')}><Heart size={16}/>{t('ともだち', 'Companions')}</button>
      <button role="tab" aria-selected={settingsTab === 'room'} onClick={() => setSettingsTab('room')}><Home size={16}/>{t('おへや', 'Rooms')}</button>
    </div>
    {settingsTab === 'friend' ? <>
      <div className="kl-friend-preview" style={{ backgroundImage: `url(${assetUrl(ROOMS.find(item => item.id === (inSetup ? draftRoom : state.room))!.image)})` }}>
        <CompanionScene characterId={inSetup ? draftCharacter : state.character} reaction="wave" reactionKey={inSetup ? CHARACTERS.findIndex(item => item.id === draftCharacter) : reactionKey} reducedMotion={reducedMotion} languageMode={languageMode}/>
      </div>
      <div className="kl-friend-choices" role="group" aria-label={t('5人のともだち', 'Five companions')}>
        {CHARACTERS.map(item => <button key={item.id} data-companion-choice={item.id} aria-pressed={(inSetup ? draftCharacter : state.character) === item.id} onClick={() => chooseCharacter(item.id)} style={{ '--friend-color': item.color } as React.CSSProperties}>
          <span className={'kl-animal-mark kl-animal-' + item.id} aria-hidden="true">{ANIMAL_MARKS[item.id]}</span><b>{tx(item.name)}</b>
        </button>)}
      </div>
      <p className="kl-choice-description">{tx(CHARACTERS.find(item => item.id === (inSetup ? draftCharacter : state.character))!.description)}</p>
      <p className="kl-fine">{t('どの子も、はじめから選べます。覚えたことばや思い出は、それぞれに残ります。', 'Every companion is available from the start. Each keeps their own words and memories.')}</p>
    </> : <>
      <div className="kl-room-choices">{ROOMS.map(item => <button key={item.id} data-room-choice={item.id} aria-pressed={(inSetup ? draftRoom : state.room) === item.id} onClick={() => chooseRoom(item.id)}>
        <img src={assetUrl(item.image)} alt="" loading="lazy"/><span>{tx(item.name)}{(inSetup ? draftRoom : state.room) === item.id && <Check size={16}/>}</span>
      </button>)}</div>
      <p className="kl-choice-description">{tx(ROOMS.find(item => item.id === (inSetup ? draftRoom : state.room))!.description)}</p>
      <p className="kl-fine">{t('8つのおへやを、いつでも自由に模様替え。', 'Eight rooms, ready whenever you feel like a change.')}</p>
    </>}
    {inSetup ? <div className="kl-setup-footer"><button className="kl-primary" onClick={start}>{t('この暮らしをはじめる', 'Make ourselves at home')}<ArrowRight size={18}/></button></div> : <button className="kl-primary kl-wide" onClick={closePanel}>{t('おへやに戻る', 'Back to our room')}</button>}
  </>;

  return <section className="kl-root" data-kotoba-life data-gamepad-navigation-root lang={en ? 'en' : 'ja'} style={{ '--kl-dialogue-bottom': `${dialogueBottom}px` } as React.CSSProperties}>
    {!entered ? <div className="kl-title" inert={setup || !!panel} style={{ backgroundImage: `url(${assetUrl('sprites/kotoba-life/title.webp')})` }}>
      <button className="kl-title-back kl-round-button" onClick={onBack}><ArrowLeft size={18}/>{t('ゲーム一覧', 'Games')}</button>
      <div className="kl-title-copy"><span className="kl-eyebrow">LEARNING ROGUE · KOTOBA DAYS</span><h1>{t('ことば日和', 'Kotoba Days')}</h1><p>{t('なんでもない日が、', 'Ordinary days,')}<br/>{t('きみと話すと、たからもの。', 'made lovely with you.')}</p><span className="kl-title-note">{t('ことばを教えて、のんびり暮らそう。', 'Share a word. Stay a while.')}</span></div>
      <div className="kl-title-actions">
        {state.started && <button className="kl-primary" onClick={() => { setEntered(true); setTown(null); setAuto(false); showDialogue(initialDialogue(stateRef.current)); }}>{t(`${name}に会いにいく`, `Visit ${name}`)}<ArrowRight size={20}/></button>}
        <button className={state.started ? 'kl-light-button' : 'kl-primary'} onClick={() => { setDraftCharacter(state.character); setDraftRoom(state.room); setSettingsTab('friend'); setSetup(true); }}>{state.started ? t('ともだち・おへやを選ぶ', 'Choose a companion & room') : t('小さな暮らしをはじめる', 'Begin our little life')}<Leaf size={18}/></button>
        <p>{t('5人のともだちと、8つのおへや。進み具合は自動保存。', 'Five companions. Eight rooms. Your days are saved automatically.')}</p>
      </div>
    </div> : <>
      <div className="kl-living" hidden={quiz} inert={setup || !!panel || quiz}>
        <div className={'kl-world' + (town ? ' kl-in-town' : '')} style={{ backgroundImage: `url(${assetUrl(npc?.image || room.image)})` }}>
          <div className="kl-scene-shade"/>
          <div className="kl-character-stage"><CompanionScene characterId={state.character} reaction={line?.reaction || 'idle'} reactionKey={reactionKey} town={!!town} reducedMotion={reducedMotion} speaking={line?.speaker === 'pet' && voice.speaking} onPet={() => { if (!panel && !town) interact('pet'); }} languageMode={languageMode}/></div>
          <div className="kl-location"><span><MapPin size={13}/>{town ? tx(npc!.place) : tx(room.name)}</span><small>{t('今日は、急がなくてもいい日。', 'There is no hurry today.')}</small></div>
          <div ref={dialogueElement} className={'kl-dialogue' + (town ? ' kl-town-dialogue' : '')} aria-live={auto ? 'off' : 'polite'}>
            <div className="kl-dialogue-heading"><span>{line?.speaker === 'npc' && npc ? tx(npc.name) : line?.speaker === 'narrator' ? t('まちのひとこま', 'A moment in town') : name}</span><div className="kl-voice-controls">
              <button className="kl-tiny-button" onClick={toggleVoice} aria-pressed={voiceEnabled} aria-label={voiceEnabled ? t('会話の声をオフ', 'Turn conversation voice off') : t('会話の声をオン', 'Turn conversation voice on')}>{voiceEnabled ? <Volume2 size={17}/> : <VolumeX size={17}/>}</button>
              <button className="kl-tiny-button" onClick={voice.replay} disabled={!voiceEnabled || !voice.supported || !line || line.speaker === 'narrator'} aria-label={t('もう一度聞く', 'Hear it again')}><RotateCcw size={15}/></button>
              {town && <button className="kl-tiny-button" onClick={() => setAuto(value => !value)} aria-pressed={auto} aria-label={auto ? t('自動再生を止める', 'Pause conversation') : t('会話を自動再生', 'Play conversation automatically')}>{auto ? <Pause size={14}/> : <Play size={14}/>}<span>{t('おまかせ', 'Watch')}</span></button>}
            </div></div>
            <p>{line ? tx(line.text) : t('おかえり。きょうは何を話そう？', 'Welcome home. What shall we talk about?')}</p>
            {lastLine && !!dialogue.choices?.length && <div className="kl-reply-choices" role="group" aria-label={t('返事を選ぶ', 'Choose a reply')}>{dialogue.choices.map(choice => <button key={choice.id} onClick={() => answerDialogue(choice.id)}>{tx(choice.label)}</button>)}</div>}
            {dialogue.lines.length > 1 && <div className="kl-dialogue-next"><span>{lineIndex + 1} / {dialogue.lines.length}</span>{!lastLine ? <button onClick={advance}>{t('つぎのおはなし', 'Go on')}<ChevronRight size={16}/></button> : town ? <button onClick={goHome}>{t('おへやに帰る', 'Head home')}<Home size={16}/></button> : <span className="kl-dialogue-end"><Heart size={13}/></span>}</div>}
          </div>
          {town && <button className="kl-town-return kl-round-button" onClick={goHome}><Home size={17}/>{t('帰る', 'Home')}</button>}
        </div>
        <header className="kl-header">
          <button className="kl-icon-button" onClick={() => { setSaveError(!saveState(stateRef.current)); setEntered(false); setTown(null); setAuto(false); }} aria-label={t('タイトルへ戻る', 'Back to title')}><ArrowLeft size={20}/></button>
          <div className="kl-name"><b>{name}</b><span><Heart size={12}/>{tx(bondStage(companion.affinity))}</span></div>
          <button className={'kl-energy' + (state.energy === 0 ? ' kl-empty' : '')} onClick={() => { setPanel('teach'); setWordError(''); }} aria-label={t(`ことばエネルギー ${state.energy} / ${MAX_ENERGY}`, `Word energy ${state.energy} of ${MAX_ENERGY}`)}><Leaf size={18}/><span className="kl-energy-leaves" aria-hidden="true">{Array.from({ length: MAX_ENERGY }, (_, index) => <i key={index} className={index < state.energy ? 'filled' : ''}/>)}</span><b>{state.energy}<small>/{MAX_ENERGY}</small></b></button>
          <button className="kl-icon-button" onClick={() => { setPanel('notebook'); setNotebookTab('words'); }} aria-label={t('ふたりの手帳', 'Our little notebook')}><BookOpen size={20}/></button>
          <button className="kl-icon-button" onClick={() => { setPanel('settings'); setSettingsTab('room'); }} aria-label={t('ともだち・おへやを選ぶ', 'Choose a companion and room')}><Settings2 size={20}/></button>
        </header>
        <nav className="kl-action-dock" aria-label={t('いっしょに過ごす', 'Spend time together')}>
          <button onClick={() => { if (town) goHome(); interact('talk'); }}><MessageCircle/><span>{t('おしゃべり', 'Chat')}</span></button>
          <button aria-label={t('ことば', 'Teach')} className="kl-teach-action" onClick={() => { if (town) goHome(); setPanel('teach'); setWordError(''); }}><Sparkles/><span>{t('ことば', 'Teach')}</span><small>−1<Leaf size={10}/></small></button>
          <button onClick={() => { if (town) goHome(); setPanel('care'); }}><Coffee/><span>{t('ふれあい', 'Together')}</span></button>
          <button onClick={() => { setPanel('town'); setAuto(false); }}><MapPin/><span>{t('おさんぽ', 'Town')}</span></button>
          <button onClick={() => setPanel('help')}><Sun/><span>{t('あそびかた', 'Guide')}</span></button>
        </nav>
        {notice && <div className="kl-notice" role="status">{notice}</div>}
      </div>
      {quiz && <div className="kl-study"><header><button className="kl-round-button" onClick={() => { quizRewarded.current = true; setQuiz(false); }}><ArrowLeft size={17}/>{t('おへやに戻る', 'Back to our room')}</button><span><Leaf size={18}/>{t('正解ひとつで、エネルギー +2', 'Each correct answer restores 2 energy')}</span></header><div className="kl-study-content"><MiniGameProblemChallenge mode={problemMode} modePool={problemModePool} answerMode={answerMode} assignment={assignment} onAnswerResult={onAnswerResult} languageMode={languageMode} problemOffset={quizOffset} rewardHint={t('正解1問につき、ことばエネルギーが2回復します。', 'Each correct answer restores 2 word energy.')} onComplete={completeQuiz}/></div></div>}
    </>}

    {(setup || panel) && <div className="kl-modal-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) closePanel(); }}><div className={'kl-dialog' + (setup || panel === 'settings' ? ' kl-customize-dialog' : '')} role="dialog" aria-modal="true" aria-labelledby="kl-panel-title">
      <header><div><span className="kl-eyebrow">KOTOBA DAYS</span><h2 id="kl-panel-title">{panelTitle}</h2></div><button className="kl-icon-button" onClick={closePanel} aria-label={t('閉じる', 'Close')}><X size={21}/></button></header>
      <div className="kl-dialog-content">
      {setup || panel === 'settings' ? choices(setup) : panel === 'teach' ? <>
        <div className="kl-energy-note"><Leaf/><div><b>{t('ことばエネルギー', 'Word energy')} {state.energy} / {MAX_ENERGY}</b><p>{t('新しいことばひとつで、エネルギーを1使います。', 'One new word uses one energy.')}</p></div></div>
        {state.energy > 0 ? <form className="kl-word-form" onSubmit={submitWord}>
          <label htmlFor="kl-word">{t(`${name}に教えたいことば`, `A word for ${name}`)}</label>
          <input id="kl-word" autoFocus value={word} maxLength={24} onChange={event => { setWord(event.target.value); setWordError(''); }} placeholder={t('たとえば、いちご・ひだまり', 'For example, strawberries or sunshine')} autoComplete="off"/>
          <label htmlFor="kl-reading">{t('読みかた', 'How to say it')}</label>
          <input id="kl-reading" value={reading} maxLength={60} onChange={event => { setReading(event.target.value); setWordError(''); }} placeholder={t('ひらがな・カタカナで教えてね', 'A hiragana or katakana reading')} aria-describedby="kl-reading-hint" autoComplete="off"/>
          <p id="kl-reading-hint" className="kl-fine">{t('漢字・英字・数字のことばは、読みかたも教えてね。「星空」なら「ほしぞら」。かなのことばは、そのままで大丈夫。', 'For kanji, letters, or numbers, add a kana reading for your friend’s Japanese voice. Kana words need no extra reading.')}</p>
          <label htmlFor="kl-category">{t('どんなことば？', 'What kind of word?')}</label><select id="kl-category" value={category} onChange={event => setCategory(event.target.value as typeof category)}>{WORD_CATEGORIES.map(item => <option value={item.id} key={item.id}>{tx(item.label)}</option>)}</select>
          {wordError && <p className="kl-form-error" role="alert">{wordError}</p>}
          <button aria-label={t('このことばを教える', 'Share this word')} className="kl-primary" type="submit"><Sparkles size={18}/>{t('このことばを教える', 'Share this word')}<span>−1<Leaf size={13}/></span></button>
        </form> : <div className="kl-empty-energy"><Sun size={40}/><h3>{t('ことばの前に、ちょっと学ぼう。', 'A little learning, a little energy.')}</h3><p>{t('問題に正解すると、エネルギーをチャージ。おしゃべり・ふれあい・おさんぽは、からっぽでも遊べます。', 'Correct answers refill your energy. You can always chat, care, or stroll together, even with no energy.')}</p></div>}
        <button className="kl-charge-button" disabled={state.energy >= MAX_ENERGY} onClick={beginQuiz}><Plus size={17}/>{state.energy >= MAX_ENERGY ? t('エネルギーは満タンです', 'Your energy is full') : t('問題でチャージする', 'Recharge with questions')}</button>
      </> : panel === 'care' ? <>
        <p className="kl-intro">{t('一緒にいるだけでも、少しずつ仲良しに。どの行動もエネルギーは使いません。', 'Little moments bring you closer. None of these activities use word energy.')}</p>
        <div className="kl-care-list">{([
          ['pet', Heart, t('なでなで', 'A gentle pat'), t('きみがいてくれて、うれしい。', 'Glad you are here.')],
          ['feed', Utensils, t('おやつにしよう', 'Share a snack'), t('ひとくちで、ほっぺがゆるむ。', 'A little treat, a little smile.')],
          ['play', Sparkles, t('いっしょに遊ぶ', 'Play together'), t('へんてこなダンスも、ご愛嬌。', 'There is no wrong way to dance.')],
          ['rest', Moon, t('のんびり休む', 'Take a rest'), t('何もしない時間も、たからもの。', 'Doing nothing is lovely too.')],
        ] as const).map(([id, Icon, title, description]) => <button key={id} onClick={() => interact(id)}><Icon size={26}/><span><b>{title}</b><small>{description}</small></span><ChevronRight size={18}/></button>)}</div>
      </> : panel === 'town' ? <>
        <p className="kl-intro">{t('教えたことばを持って、町の人とおしゃべり。ちょっと不思議で、いつも通りの毎日を眺めよう。', 'Take those new words out into the world. Watch a wonderfully ordinary conversation unfold.')}</p>
        <div className="kl-town-choices">{NPCS.map(item => <button key={item.id} onClick={() => openTown(item.id)}><img src={assetUrl(item.image)} alt=""/><span><small>{tx(item.place)}</small><b>{tx(item.name)}</b><em>{tx(friendshipStage(companion.friendships[item.id]))}</em></span><ChevronRight size={20}/></button>)}</div>
        <p className="kl-fine">{t('会話は自動で進みます。止めたり、自分のペースで送ったりもできます。', 'Conversations play automatically. Pause or move ahead whenever you like.')}</p>
      </> : panel === 'notebook' ? <>
        <div className="kl-notebook-heading"><Heart size={25}/><div><h3>{name}</h3><p>{tx(bondStage(companion.affinity))} · {t(`覚えたことば ${companion.words.length}`, `${companion.words.length} words learned`)}</p></div></div>
        <div className="kl-choice-tabs" role="tablist" aria-label={t('手帳のページ', 'Notebook pages')}>{(['words', 'memories', 'heart'] as const).map(id => <button key={id} role="tab" aria-selected={notebookTab === id} onClick={() => setNotebookTab(id)}>{id === 'words' ? t('ことば', 'Words') : id === 'memories' ? t('思い出', 'Memories') : t('こころ', 'Heart')}</button>)}</div>
        {notebookTab === 'words' ? companion.words.length ? <ul className="kl-word-list">{[...companion.words].reverse().map(item => <li key={item.id}><span><b>{item.value}</b>{item.reading && item.reading !== item.value && <small>{item.reading}</small>}<small>{tx(WORD_CATEGORIES.find(entry => entry.id === item.category)!.label)}</small></span><button className="kl-icon-button" aria-label={t(`「${item.value}」をことば帳から外す`, `Remove ${item.value} from the wordbook`)} onClick={() => commit(removeWord(stateRef.current, item.id))}><X size={16}/></button></li>)}</ul> : <div className="kl-empty-page"><BookOpen size={40}/><p>{t('まだ真っ白なことば帳。好きなことばを、ひとつ教えてあげよう。', 'A fresh little wordbook. Teach your companion a word you love.')}</p><button className="kl-primary" onClick={() => setPanel('teach')}>{t('ことばを教える', 'Teach a word')}</button></div> : notebookTab === 'memories' ? <div className="kl-memory-list">{companion.memories.length ? [...companion.memories].reverse().map(item => <article key={item.id}><small>{new Date(item.at).toLocaleDateString(en ? 'en-US' : 'ja-JP', { month: 'short', day: 'numeric' })}</small><p>{tx(item.text)}</p></article>) : <p className="kl-intro">{t('きょうの小さな出来事が、ここに増えていきます。', 'Little moments from your days will gather here.')}</p>}</div> : <div className="kl-heart-page">
          <p className="kl-intro">{t('ことばや過ごし方で、少しずつ、その子らしく。数字は競わなくて大丈夫。', 'Words and shared moments gently shape a personality. There is no score to chase.')}</p>
          {(['curiosity', 'kindness', 'creativity'] as const).map(id => <div className="kl-trait" key={id}><span>{id === 'curiosity' ? t('わくわく', 'Curiosity') : id === 'kindness' ? t('やさしさ', 'Kindness') : t('ひらめき', 'Imagination')}</span><meter min={0} max={100} value={companion.traits[id]}/></div>)}
          <div className="kl-needs"><span><Utensils size={17}/>{t('おなか', 'Tummy')}<meter min={0} max={100} value={companion.satiety}/></span><span><Moon size={17}/>{t('ひとやすみ', 'Rest')}<meter min={0} max={100} value={companion.rest}/></span></div>
          <h4>{t('まちのともだち', 'Friends around town')}</h4>{NPCS.map(item => <p className="kl-friendship" key={item.id}><span>{tx(item.name)}</span><small>{tx(friendshipStage(companion.friendships[item.id]))}</small></p>)}
        </div>}
      </> : <div className="kl-guide"><p>{t('ここは、きみと小さなともだちの暮らす場所。急ぐことも、勝ち負けもありません。', 'A little home for you and a little friend. No hurry, no winning or losing.')}</p><article><MessageCircle/><div><h3>{t('ことばで、ふたりの毎日が変わる', 'Words become part of your days')}</h3><p>{t('食べもの、場所、気持ち。好きなことばを教えると、おしゃべりや町の会話で使ってくれます。', 'Food, places, feelings. Teach a favorite word and hear it in chats at home and around town.')}</p></div></article><article><Leaf/><div><h3>{t('学んで、またおしゃべり', 'Learn a little, share a little')}</h3><p>{t('新しいことばを教えるとエネルギーを1消費。問題に1問正解で2回復、最大6。お世話と会話はいつでも自由です。', 'Teaching one new word costs 1 energy. Each correct quiz answer restores 2, up to 6. Chatting and caring are always free.')}</p></div></article><article><Home/><div><h3>{t('いつでも、ただいま', 'A home to return to')}</h3><p>{t('5人のともだち、8つのおへやを自由に選べます。ことばと思い出は自動保存。遊ばない間に寂しさで困ることもありません。', 'Choose any of five companions and eight rooms. Words and memories are saved automatically. Your friend will be fine while you are away.')}</p></div></article><button className="kl-primary kl-wide" onClick={closePanel}>{t('のんびり過ごそう', 'Let us take our time')}</button></div>}
      </div>
    </div></div>}
    {saveError && <div className="kl-save-error" role="alert">{t('保存できませんでした。この画面を閉じる前に、端末の空き容量や保存設定を確認してください。', 'Your progress could not be saved. Check your device storage and browser settings before leaving.')}</div>}
  </section>;
}
