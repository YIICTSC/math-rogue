import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Gift, Trophy } from 'lucide-react';
import { CARD_CLUB_VOICE_HEROES } from '../../data/cardClubVoices';
import { audioService } from '../../services/audioService';
import { trans } from '../../utils/textUtils';
import PartyGamesPanel from '../gakuro-craft/PartyGamesPanel';
import { gameCommand, tickGames, type GameCommand } from '../gakuro-craft/homeGames';
import useGameAudio from '../gakuro-craft/useGameAudio';
import useGameBgm from '../gakuro-craft/useGameBgm';
import { LocalTablePortraits, type LocalMatchResult } from '../shared/localTableMatch';
import { illustration } from './art';
import type { Copy } from './campaign';
import { HEROES } from './catalog';
import { houseBoardResult, startHouseBoard } from './houseFurniture';
import type { HouseGame } from './interiors';
import { useWords } from './presentation';
import TravelerPortrait from './TravelerPortrait';

const CardClub = lazy(() => import('../card-club/CardClub'));
const TraditionalGames = lazy(() => import('../traditional-games/TraditionalGames'));

const englishBoard: Record<string, string> = {
  'ルールと操作': 'Rules',
  '黒の手番': 'Black to move', '白の手番': 'White to move', '赤の手番': 'Red to move', '黄の手番': 'Gold to move',
  'マス': 'Space', '空きマス': 'Empty', '列を選ぶ': 'Choose column', 'リバーシの盤面': 'Reversi board', '四目並べの盤面': 'Connect Four board',
};

function FurnitureDuel({match, name, opponent, onBack, onResult}: {
  match: Extract<HouseGame, {family:'furniture'}>; name: string; opponent: string;
  onBack: () => void; onResult: (result: LocalMatchResult) => void;
}) {
  const {t,language}=useWords();
  const [{world, player, game}] = useState(() => startHouseBoard(match.game, name));
  const [revision, setRevision] = useState(game?.revision);
  useGameAudio(game,player.id,true,revision);
  useGameBgm(game,true);
  const send=useCallback((action:GameCommand)=>{
    gameCommand(world,player,action);
    setRevision(game?.revision);
  },[game,player,world]);
  useEffect(()=>{
    if(!game||game.phase!=='playing')return;
    let previous=performance.now();
    const timer=window.setInterval(()=>{
      const now=performance.now(),dt=Math.min(.15,(now-previous)/1000);
      previous=now;
      if(document.hidden)return;
      world.time+=dt;
      tickGames(world,dt);
      setRevision(game.revision);
      if(game.phase!=='playing')window.clearInterval(timer);
    },50);
    return ()=>window.clearInterval(timer);
  },[game,world]);
  useEffect(()=>{
    if(!game)return;
    const result=houseBoardResult(game);
    if(result)onResult(result);
  },[game,onResult,revision]);
  const localize=(jp:string)=>{
    if(language!=='ENGLISH')return trans(jp,language);
    return englishBoard[jp]??(match.game==='reversi'
      ?'Trap your opponent’s discs between two of yours to flip them. Legal squares light up. The most discs at the end wins.'
      :'Choose a column and drop a disc. Connect four vertically, horizontally or diagonally to win.');
  };
  return <div className="pr-house-board" data-gamepad-navigation-root>
    <header><button className="pr-house-button" onClick={onBack} data-gamepad-back><ArrowLeft size={17}/>{t('民家へ戻る','Return to the house')}</button><h2>{t(...match.name)}</h2></header>
    {game?<PartyGamesPanel world={world} g={game} selfId={player.id} send={send} t={localize} opponentName={opponent}/>
      :<p role="status">{t('盤面を準備できませんでした。','The board could not be started.')}</p>}
  </div>;
}

export default function HouseMatch({match, owner, hero, job, onBack, onResult}: {
  match: HouseGame; owner: {name:Copy;portrait?:string}; hero: string; job: Parameters<typeof illustration>[1];
  onBack:()=>void; onResult:(result:LocalMatchResult)=>Copy|undefined;
}) {
  const {t,l,language}=useWords();
  const name=l(HEROES[hero].name), opponent=l(owner.name);
  const [result,setResult]=useState<{kind:LocalMatchResult; reward?:Copy}>();
  const currentResult=useRef(false), grant=useRef(onResult);
  const root=useRef<HTMLElement>(null), resultButton=useRef<HTMLButtonElement>(null);
  grant.current=onResult;
  const settle=useCallback((kind:LocalMatchResult)=>{
    if(currentResult.current)return;
    currentResult.current=true;
    setResult({kind,reward:grant.current(kind)});
  },[]);
  const [seats]=useState(()=>({
    player:{name:name.slice(0,32),hero:CARD_CLUB_VOICE_HEROES.find(id=>id===hero)??CARD_CLUB_VOICE_HEROES[0]},
    opponent:{name:opponent,hero:'pixel-rpg-resident'}, onResult:settle,
  }));
  const [table]=useState(()=>match.family==='cards'
    ? {family:match.family,session:{...seats,game:match.game}} as const
    : match.family==='traditional'?{family:match.family,session:{...seats,game:match.game}} as const:undefined);
  useEffect(()=>{
    root.current?.focus({preventScroll:true});
    if(match.family!=='furniture')return audioService.acquireBgmScene('poker_play',{},32);
  },[match.family]);
  useEffect(()=>{if(result)resultButton.current?.focus();},[result]);
  const portraits={
    [seats.player.hero]:<img alt="" src={illustration(hero,job)}/>,
    [seats.opponent.hero]:owner.portrait?<TravelerPortrait id={owner.portrait} name={opponent}/>:undefined,
  };
  const gameName=l(match.name);
  return <section className="pr-house-match" aria-label={`${gameName} · ${opponent}`} role="dialog" aria-modal="true"
    tabIndex={-1} ref={root} lang={language==='ENGLISH'?'en':'ja'} data-gamepad-navigation-root data-pr-house-game={match.game}
    data-allow-japanese={language!=='ENGLISH'||undefined}
    onKeyDown={e=>{
      if(e.key!=='Escape'||e.target instanceof Element&&e.target.closest('.tt-modal,.cc-modal'))return;
      e.preventDefault();e.stopPropagation();onBack();
    }}>
    <div className="pr-house-match-game" inert={!!result}>
      <LocalTablePortraits.Provider value={portraits}>
        <Suspense fallback={<div className="pr-house-loading"><p role="status">{t('対局を準備中…','Setting up the match…')}</p><button className="pr-house-button" onClick={onBack}>{t('民家へ戻る','Return to the house')}</button></div>}>
          {match.family==='furniture'?<FurnitureDuel match={match} name={name} opponent={opponent} onBack={onBack} onResult={settle}/>
            :table?.family==='cards'?<CardClub localMatch={table.session} onBack={onBack} languageMode={language}/>
            :table&&<TraditionalGames localMatch={table.session} onBack={onBack} languageMode={language}/>}
        </Suspense>
      </LocalTablePortraits.Provider>
    </div>
    {result&&<div className="pr-house-result" data-gamepad-modal>
      <section>
        {owner.portrait&&<div className="pr-house-result-portrait"><TravelerPortrait id={owner.portrait} name={opponent} reaction={result.kind==='win'?'joy':'neutral'}/></div>}
        <div><p className="pr-house-result-name">{opponent} · {gameName}</p>
          <h2>{result.kind==='win'?t('勝利！','You won!'):result.kind==='loss'?t('住人の勝ち','The resident wins'):t('引き分け','Draw')}</h2>
          {result.kind==='win'?<p className="pr-house-reward" role="status"><Gift size={18}/>{result.reward?l(result.reward):t('初勝利の褒美は受け取り済み。','You’ve already collected the first-win reward.')}</p>
            :<p>{t('住人に話しかけると、また対戦できます。','Speak to the resident for another match.')}</p>}
        </div>
        <button className="pr-house-button pr-house-continue" ref={resultButton} onClick={onBack} data-gamepad-back>
          {result.kind==='win'?<Trophy size={17}/>:<ArrowLeft size={17}/>} {t('民家へ戻る','Return to the house')}
        </button>
      </section>
    </div>}
  </section>;
}
