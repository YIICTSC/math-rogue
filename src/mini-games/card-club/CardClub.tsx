import { useCardVoices } from './useCardVoices';
import React,{useEffect,useRef,useState} from 'react';
import type { MiniGameComponentProps } from '../../components/MiniGameRouter';
import { audioService } from '../../services/audioService';
import { assetUrl } from '../../utils/assetPaths';
import { CARD_CLUB_HIRAGANA } from './hiragana';
import { trans } from '../../utils/textUtils';
import { CARD_CLUB_HEROES, type ClubPacket } from './session';
import { CLUB_GAMES, definition, referenceGame, type GameId } from './catalog';
import { cardLabel, rank, SUITS } from './cards';
import { actionKey, type Action, type ClubEvent, type ClubView } from './model';
import { CardClubRoom } from './network';
import './cardClub.css';
import { GameChooser } from './GameChooser';
import { CardFace } from './CardFace';
import { GameTableExtras } from './GameTableExtras';
import { ClassicTable } from './ClassicTable';
import { casinoCaptureValid,casinoBuildValid } from './cassino';
import { TRADITIONAL_TRICKS } from './traditionalGames';
import { WORLD_TRICKS } from './worldGames';
import { CLASSIC_TRICKS } from './classicTricks';
import { EXTENDED_TRICKS } from './extendedTricks';
import { HandBacks,TableStock } from './TableStock';
import { useCardPresentation } from './useCardPresentation';

const DEFAULT_HERO='high-school-warrior';
function Face({hero}:{hero:string}){return <span className="cc-face" aria-hidden="true" style={{backgroundImage:`url("${assetUrl(`sprites/after-school-poker/portraits/${hero}.webp`)}")`}}/>;}

export default function CardClub({onBack,languageMode='JAPANESE'}:MiniGameComponentProps){
  const l=(jp:string,en:string)=>languageMode==='ENGLISH'?en:(languageMode==='HIRAGANA'&&CARD_CLUB_HIRAGANA[jp])||trans(jp,languageMode);
  const [page,setPage]=useState<'title'|'hero'|'games'|'connect'>(()=>'title');
  const [hero,setHero]=useState(()=>{try{const h=localStorage.getItem('card-club-hero');return CARD_CLUB_HEROES.some(x=>x.id===h)?h!:DEFAULT_HERO;}catch{return DEFAULT_HERO;}});
  const [name,setName]=useState(()=>{try{return localStorage.getItem('card-club-name')||'';}catch{return '';}});
  const [game,setGame]=useState<GameId>('whist'),[count,setCount]=useState(4),[packet,setPacket]=useState<ClubPacket|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[rules,setRules]=useState(false),[selected,setSelected]=useState<number[]>([]),[copied,setCopied]=useState(false);
  const [code,setCode]=useState(()=>new URLSearchParams(location.search).get('cardClubRoom')||'');
  const room=useRef<CardClubRoom|null>(null);
  const current=packet?.phase==='game'?packet.view:null;
  const tableRoot=useRef<HTMLElement|null>(null);
  const capturePresentation=useCardPresentation(tableRoot,current);
  const announceAction=useCardVoices(current);
  const host=!!packet&&packet.selfId===packet.hostId;
  const title=(id:string)=>{const r=referenceGame(id);return languageMode==='ENGLISH'?r?.english||id:l(r?.name||id,r?.english||id);};
  const msg=(key:string)=>({NETWORK_ERROR:l('通信に失敗しました。接続を確認してもう一度お試しください。','Connection failed. Check your network and try again.'),TIMEOUT:l('接続がタイムアウトしました。ホストの画面とコードを確認してください。','Connection timed out. Check the host screen and room code.'),INVALID_CODE:l('6桁のコードを入力してください。','Enter a six-digit room code.'),ROOM_FULL_OR_STARTED:l('部屋が満員か、すでに対戦が始まっています。','The room is full or the match has already started.'),HOST_DISCONNECTED:l('ホストとの接続が切れました。表示中の対戦は中断されています。','The host connection closed. This match is paused.'),CLOSED:l('接続を終了しました。','Connection closed.')}[key]||l('接続できませんでした。もう一度お試しください。','Could not connect. Please try again.'));
  useEffect(()=>{void audioService.playBGM('poker_shop');return ()=>{room.current?.finish();room.current?.close();};},[]);
  useEffect(()=>{void audioService.playBGM(current?'poker_play':'poker_shop');},[!!current]);
  useEffect(()=>{setSelected([]);},[current?.revision]);
  const profile=()=>({name:name.trim().slice(0,32)||l('プレイヤー','Player'),hero});
  const remember=()=>{try{localStorage.setItem('card-club-hero',hero);localStorage.setItem('card-club-name',profile().name);}catch{}};
  const open=async(mode:'practice'|'create'|'join')=>{
    if(busy)return;setBusy(true);setError('');room.current?.close();remember();
    const client=new CardClubRoom(p=>setPacket(p),m=>setError(msg(m)));room.current=client;
    try{if(mode==='practice')client.practice(profile());else if(mode==='create')await client.create(profile());else await client.join(profile(),code);
      if(mode!=='join')client.configure(game,count);
    }catch(e){client.close();room.current=null;setPacket(null);setError(msg(String(e instanceof Error?e.message:e)));}finally{setBusy(false);}
  };
  const leave=()=>{room.current?.finish();room.current?.close();room.current=null;setPacket(null);setError('');setPage('games');};
  const send=(a:Action)=>{capturePresentation();announceAction(a);setSelected([]);room.current?.command(a);};
  const choose=(id:GameId)=>{const d=definition(id);setGame(id);setCount(d.defaultPlayers);setPage('connect');};
  const selectCard=(input:number|number[])=>setSelected(old=>{
    const cards=Array.isArray(input)?input:[input];
    if(cards.every(c=>old.includes(c)))return old.filter(c=>!cards.includes(c));
    const next=[...old.filter(c=>!cards.includes(c)),...cards];
    if(current?.game==='cassino')return next;
    if(current?.extra.step==='palaceSetup')return cards;
    if(current?.extra.step==='worldPass')return next.slice(-current.extra.classic!.contract);
    if(['ecarteDiscard','sergentDiscard'].includes(current?.extra.step||''))return next.slice(-(current?.extra.step==='sergentDiscard'?4:5));
    if(current?.extra.step==='cribDiscard')return next.slice(-2);
    if(current?.game==='doubt')return next.slice(-4);
    if(current?.extra.step==='exchange')return next.slice(-3);
    return ['rummy','daihinmin','shithead2'].includes(current?.game||'')?next:cards;
  });
  const actionLabel=(a:Action,v:ClubView)=>{
    const cards=(a.cards||[]).map(cardLabel).join(' + ');
    if(v.game==='guessit')return `${a.type==='ask'?l('相手に質問','Ask opponent'):l('中央札を推理','Guess central card')}: ${a.value===1?'A':a.value===11?'J':a.value===12?'Q':a.value===13?'K':a.value}`;
    if(v.game==='reddog'&&a.type==='bid')return `${l('宣言して公開','Stake and reveal')}: ${a.value}`;
    if(v.game==='speculation'){
      if(a.type==='bid')return `${v.extra.step==='specAuction'?l('購入額','Purchase bid'):v.extra.step==='specOffer'?l('公開札の最低価格','Exposed card minimum'):l('裏札の最低価格','Blind card minimum')}: ${a.value}`;
      if(a.type==='stand')return l('この札を保持','Keep this card');
      if(a.type==='pass')return l('競りから降りる','Leave auction');
      if(a.type==='reveal')return l('伏せ札を1枚めくる','Reveal one blind card');
      if(a.type==='continue')return l('手番を終える','End turn');
    }
    if(v.game==='petrangola'){
      if(a.type==='pass')return v.extra.step==='petrDealer'?l('元の手札を保持','Keep original hand'):l('交換せずノック','Knock without swapping');
      if(a.type==='swap')return !a.cards?l('場の3枚と交換してノック','Swap all three and knock'):`${l('交換','Swap')}: ${cards} ↔ ${v.table.filter((_,i)=>a.index!&(1<<i)).map(cardLabel).join(' + ')}`;
    }
    if(v.game==='suitmatch'){
      if(a.type==='accept')return l('同じ合計を返す','Return equal total');
      if(a.type==='draw')return l('山札から5枚まで引く','Draw up to five');
      if(a.type==='discard')return `${l('山の底に戻す','Put under stock')}: ${cards}`;
      if(a.type==='exchange')return `${l('返す','Return')}: ${cards}`;
      if(a.type==='continue')return v.extra.step==='suitBottom'?l('返却を終えて次へ','Finish returning and continue'):l('手番を終えて勝利判定','End turn and check victory');
    }

    if(a.type==='stand'&&v.game==='allfour')return v.extra.step==='allFourReply'?l('採用して1点ギフト','Keep trump and gift one'):l('この切札でスタンド','Stand with this trump');
    if(a.type==='pass'&&v.game==='allfour')return v.extra.step==='allFourReply'?l('追加配札して候補変更','Deal more and change candidate'):l('ベッグして親へ','Beg: ask dealer');
    if(a.type==='swap'&&v.game==='rantergo')return v.self===v.dealer?l('手札公開して山札と交換','Reveal and swap with stock'):l('左隣と交換','Swap left');
    if(a.type==='stand'&&v.game==='rantergo')return l('この札をキープ','Keep this card');
    if(a.type==='accept'&&v.extra.step==='sevenRetry')return l('追撃せず場を渡す','Concede contested pile');
    if(a.type==='take'&&v.game==='rollingstone')return l('場を取ってリード','Pick up and lead');
    if(a.type==='bid'&&v.game==='put')return l('プットを宣言','Declare put');
    if(a.type==='bid'&&v.game==='truc')return a.value===-1?v.extra.step==='bluffReply'?l('ゲーム全体の勝負にする','Play for the entire match'):l('残り全部を提案','Propose all remaining'): `${l('点数引上げ','Raise stake')} → ${a.value}`;
    if(a.type==='pass'&&['put','truc'].includes(v.game))return v.extra.step==='trucRedealReply'?l('配り直しを拒否','Refuse redeal'):l('降伏','Concede');
    if(a.type==='accept'&&['put','truc'].includes(v.game))return v.extra.step==='trucRedealReply'?l('配り直しに同意','Accept redeal'):l('提案を承諾','Accept proposal');
    if(a.type==='draw'&&v.extra.step==='trucRedealOffer')return l('配り直しを提案','Request redeal');
    if(a.type==='continue'&&v.extra.step==='trucRedealOffer')return l('この手札で開始','Keep hand and begin');
    if(a.type==='play'&&a.double&&['66','schnapsen'].includes(v.game))return `${l('マリッジを宣言してリード','Declare marriage and lead')}: ${cards}`;
    if(a.type==='swap'&&['66','schnapsen'].includes(v.game))return `${l('切札表示札と交換','Exchange trump indicator')}: ${cards}`;
    if(a.type==='swap'&&v.game==='shithead2')return `${l('公開札と交換','Swap with exposed card')}: ${cards} → #${a.index!+1}`;
    if(a.type==='continue'&&v.game==='shithead2')return l('準備完了','Ready');
    if(a.type==='close'&&['66','schnapsen'].includes(v.game))return l('山札をクローズ','Close the stock');
    if(a.type==='close'&&v.game==='empatsatu')return l('ストップして採点','Stop and score');
    if(a.type==='accept'&&v.game==='ecarte')return v.extra.step==='ecarteOffer'?l('交換を提案','Propose exchange'):l('交換を承諾','Accept exchange');
    if(a.type==='stand'&&v.game==='ecarte')return l('交換せずプレイ','Play without exchange');
    if(a.type==='stand'&&v.game==='empatsatu')return l('山切れ：採点する','Stock empty: score now');
    if(a.type==='reveal'&&v.game==='ecarte')return `${l('切札Kを宣言','Declare trump king')}: ${cards}`;
    if(a.type==='exchange'&&['blacklady','blackmaria'].includes(v.game))return `${l('右隣へ渡す','Pass right')}: ${cards}`;
    if(a.type==='exchange'&&v.game==='sergent')return `${l('強制交換','Forced exchange')}: ${cards} → ${v.players[a.target!].name}`;
    if(a.type==='exchange'&&v.game==='ecarte')return `${l('交換','Exchange')}: ${cards}`;
    if(a.type==='take'&&v.game==='shithead2')return `${l('場を引き取る','Pick up pile')}${cards?` + ${cards}`:''}`;
    if(a.type==='bid'&&v.game==='minnesotawhist')return `${cards} · ${a.cards&&[0,3].includes(Math.floor(a.cards[0]/13))?l('ハイ','High'):l('ロー','Low')}`;
    if(a.type==='bid'&&v.game==='nap')return [l('パス','Pass'),l('2勝','Two'),l('3勝','Three'),l('ミゼール（0勝）','Misere (zero)'),l('4勝','Four'),l('ナップ（全勝）','Nap (all)'),l('ウェリントン','Wellington')][a.value!];
    if(a.type==='bid'&&v.game==='pontoon')return `${l('賭点','Stake')} ${a.value}`;
    if(a.type==='bid'&&v.game==='napoleon')return `${SUITS[a.suit!]} · ${l('絵札','Counting cards')} ${a.value}`;
    if(a.type==='order')return `${l('切札を宣言','Order trump')} ${SUITS[a.suit!]}${a.alone?` · ${l('単独','Alone')}`:''}`;
    if(a.type==='name')return `${l('副官の指名札','Name partner card')}: ${cards}`;
    if(a.type==='knock')return `${l('ノックして捨てる','Knock and discard')}: ${cards}`;
    if(a.type==='defend')return `${l('防御','Defend')}: ${cards}`;
    if(a.type==='transfer')return `${l('次の人に転送','Transfer attack')}: ${cards}`;
    if(a.type==='take')return l('場札を取る','Take the attacks');
    if(a.type==='swap')return v.extra.step==='swimDealer'?l('伏せ札3枚と手札全部を交換','Exchange for the unseen central hand'):`${l('交換','Swap')} ${cards} → ${l('位置','Position')} ${a.index!+1}`;
    if(a.type==='build')return `${l('ビルド','Build')} ${cards} + #${a.index!+1} → ${a.value} · ${a.form==='set'?l('複合','Compound'):l('合計','Sum')}`;
    if(a.type==='close')return l('クローズ（他の人はあと1手）','Close (others get one final turn)');
    if(a.type==='buy')return `${l('裏札を購入','Buy a hidden card')} (+${a.value})`;
    if(a.type==='hit'&&v.game==='pontoon')return l('ツイスト（表札を引く）','Twist (draw face up)');
    if(a.type==='continue'&&v.game==='cribbage')return `${l('手役を数える','Count hand')} · ${v.extra.classic?.countIndex===2?l('クリブ','Crib'):v.players[v.turn].name}`;
    if(a.type==='continue')return v.game==='schwimmen'?l('クローズせずに次へ','Continue without closing'):l('確認したので裏返して次の人へ','Turn back over and continue');
    if(a.type==='play')return (a.cards||[]).map(cardLabel).join(' + ')+(a.suit!==undefined?` → ${SUITS[a.suit]}`:'')+(a.value!==undefined&&!a.form?` → ${a.value}`:'')+(a.form==='run'?` · ${l('階段','Run')}`:'')+(a.revolution?` · ${l('革命','Revolution')}`:'')+(a.index!==undefined?` → #${a.index+1}`:'')+(a.double?` · ${l('倍増宣言','Double')}`:'');
    if(['exchange','discard','meld','layoff'].includes(a.type))return ({exchange:l('3枚渡す','Pass three'),discard:l('捨てる','Discard'),meld:l('組を公開','Meld'),layoff:`${l('付け札','Lay off')} #${(a.index??0)+1}`}[a.type]||'')+': '+(a.cards||[]).map(cardLabel).join(' + ');
    if(a.type==='trump')return `${l('切札','Trump')}: ${SUITS[a.suit!]}`;
    if(a.type==='move')return `${l('列を移動','Move pile')} #${a.index!+1} → #${a.target!+1}`;
    if(a.type==='pass'&&v.game==='kingsinthe')return l('手番を終える','End turn');
    if(a.type==='draw'&&a.target===1)return l('捨て札から引く','Draw top discard');
    if(a.type==='ask')return `${v.players[a.target!].name}: ${a.suit===undefined?'':SUITS[a.suit]}${a.value===1?'A':a.value===11?'J':a.value===12?'Q':a.value===13?'K':a.value} ${l('ください','please')}`;
    if(a.type==='pick')return `${l('裏向きのカード','Face-down card')} ${a.index!+1}`;
    const labels:Record<string,string>={draw:l('山札から引く','Draw'),pass:l('パス','Pass'),bid:l('宣言','Bid'),challenge:l('ダウト！','Challenge!'),accept:l('見送る','Accept'),reveal:l('カードをめくる','Reveal'),bust:l('出せない（ライフ−1）','No play (lose a life)'),hit:l('もう1枚引く','Hit'),stand:l('止める','Stand'),double:l('ダブルで1枚','Double'),next:l('次の配札へ','Next deal')};return labels[a.type]+(a.type==='bid'?` ${a.value}`:'');
  };
  const eventLabel=(e:ClubEvent,v:ClubView)=>{
    const n=e.player===undefined?'':v.players[e.player]?.name||'';
    const names:Record<string,string>={answerYes:l('持っています','Yes, held'),answerNo:l('持っていません','No, not held'),knock:l('ノック','Knock'),raise:l('点数引上げ','Stake raised'),partnerHands:l('味方手札を確認','Partner hands shown'),marriage:l('マリッジ宣言','Marriage declared'),king:l('切札K宣言','Trump king declared'),exchange:l('交換枚数','Cards exchanged'),burn:l('場を焼く','Pile burned'),contract:l('契約','Contract'),name:l('副官の指名札','Named partner card'),faceDiscard:l('捨てた絵札','Discarded counting card'),crib:l('クリブへ','To crib'),go:l('ゴー','Go'),close:l('クローズ','Closed'),buy:l('裏札を購入','Bought a hidden card'),defend:l('防御','Defended'),transfer:l('転送','Transferred'),take:l('場札を引き取る','Took attacks'),build:l('ビルド','Built'),swap:l('交換','Swapped'),stand:l('ストップ','Stood'),points:l('得点','Points'),double:l('倍増宣言','Doubled'),meld:l('組を公開','Melded'),layoff:l('付け札','Laid off'),discard:l('捨て札','Discarded'),goingOut:l('上がり得点','Going-out score'),blocked:l('配札は引き分け','Blocked deal: draw'),flip:l('めくった位置','Flipped position'),pair:l('ペア獲得','Pair captured'),snipped:l('プールへの支払い','Paid to pool'),move:l('列を移動','Moved a pile'),reveal:l('カード公開','Revealed'),deal:l('配札','Deal'),bid:l('宣言','Bid'),book:l('ブック完成','Book completed'),play:l('プレイ','Played'),trick:l('獲得','Won'),tie:l('同点・もう1枚','Tie: reveal again'),capture:l('場札獲得','Captured'),sweep:l('スコパ！','Sweep!'),pick:l('カードを引きました','Drew a card'),pass:l('パス','Passed'),draw:l('山札から引きました','Drew from stock'),ask:l('要求','Asked'),claim:l('宣言した枚数','Claimed cards'),bluff:l('嘘が見抜かれました','Bluff caught'),honest:l('正しい宣言でした','Truthful play'),life:l('残りライフ','Lives remaining'),total:l('累計','Total'),roundEnd:l('この配札の結果','Deal results'),finish:l('対戦終了','Match finished')};
    return `${n} ${names[e.key]||e.key}${e.value!==undefined?` ${e.value}`:''}${e.card!==undefined?` ${cardLabel(e.card)}`:''}`;
  };
  const visibleActions=[...new Map((current?.actions.filter(a=>(current.game!=='memory'||a.type!=='pick')&&(!selected.length||!['play','ask','exchange','discard','meld','layoff','knock','defend','transfer','swap','build','bid','take'].includes(a.type)||a.type==='take'&&!a.cards||a.type==='ask'&&selected.every(c=>rank(c)===a.value)||a.cards&&(current.game==='cassino'?selected.filter(c=>current.players[current.self].hand.includes(c)):selected).every(c=>a.cards!.includes(c))))||[]).map(a=>[actionKey(a),a])).values()];

  const captureSelection:Action={type:'play',cards:current?[...selected.filter(c=>current.players[current.self].hand.includes(c)),...selected.filter(c=>!current.players[current.self].hand.includes(c))]:[]};
  const captureValid=!!current&&current.game==='cassino'&&current.turn===current.self&&casinoCaptureValid(current,captureSelection);

  return <main ref={tableRoot} className={`card-club cc-page-${current?'table':page}`} style={{'--cc-title':`url("${assetUrl('sprites/card-club/title.webp')}")`,'--cc-table':`url("${assetUrl('sprites/card-club/table.webp')}")`} as React.CSSProperties} data-gamepad-navigation-root data-mini-game-scope="card-club" data-club-game={current?.game}>
    <header className="cc-header"><button onClick={()=>packet?leave():page==='title'?onBack():setPage(page==='hero'?'title':page==='games'?'hero':'games')}>{l('戻る','Back')}</button><span className="cc-brand">LEARNING ROGUE · CARD CLUB</span>{current&&<span className="cc-compact-title"><strong>{title(current.game)}</strong><small>{l('配札','Deal')} {current.round+1}{current.trump>=0?` · ${l('切札','Trump')} ${current.trump===4?l('ジャック4枚','Four jacks'):SUITS[current.trump]}`:''}</small></span>}<button onClick={()=>setRules(true)}>{l('遊び方','Rules')}</button></header>
    {error&&<div className="cc-notice" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}
    {!packet&&page==='title'&&<section className="cc-title-copy"><p>AFTER SCHOOL · AROUND THE WORLD</p><h1>{l('放課後','After-school')}<br/><em>{l('トランプゲーム集','Card Club')}</em></h1><p>{l('好きな顔で集まって、世界のトランプを。','Pick your portrait. Gather around. Discover card games.')}</p><button className="cc-primary" onClick={()=>{void audioService.playBGM('poker_shop');setPage('hero');}}>{l('クラブへ入る','Enter the club')} →</button></section>}
    {!packet&&page==='hero'&&<section className="cc-panel"><h1>{l('キャラクター選択','Choose your character')}</h1><label>{l('参加名','Player name')}<input maxLength={32} value={name} onChange={e=>setName(e.target.value)} placeholder={l('プレイヤー','Player')}/></label><div className="cc-heroes">{CARD_CLUB_HEROES.map(h=><button key={h.id} aria-pressed={hero===h.id} onClick={()=>setHero(h.id)}><Face hero={h.id}/><small>{languageMode==='ENGLISH'?h.id.replace(/^(high-school|magic)-/,'').replaceAll('-',' '):trans(h.name,languageMode)}</small></button>)}</div><button className="cc-primary" onClick={()=>{remember();setPage(code?'connect':'games');}}>{l('このキャラクターでゲーム選択','Choose a game with this character')} →</button></section>}
    {!packet&&page==='games'&&<section className="cc-panel"><div className="cc-heading"><div><h1>{l('ゲーム選択','Choose a game')}</h1><p>{l('CPUと練習、友達とオンライン。','Practice with CPU players or play online with friends.')}</p></div><Face hero={hero}/></div><GameChooser english={languageMode==='ENGLISH'} l={l} onChoose={choose}/></section>}
    {!packet&&page==='connect'&&<section className="cc-panel cc-connection"><div className="cc-heading"><div><p>{l('選択中','Selected')}</p><h1>{title(game)}</h1></div><Face hero={hero}/></div><p>{l(definition(game).rule,definition(game).englishRule)}</p><label>{l('プレイ人数（空席はCPU）','Seats (empty seats use CPU)')}<select value={count} onChange={e=>setCount(Number(e.target.value))}>{definition(game).players.map(n=><option key={n}>{n}</option>)}</select></label><button className="cc-primary" disabled={busy} onClick={()=>void open('practice')}>{l('CPUと遊ぶ','Play with CPU')}</button><button disabled={busy} onClick={()=>void open('create')}>{l('オンラインの部屋を作る','Create online room')}</button><hr/><h2>{l('招待に参加','Join an invitation')}</h2><p>{l('参加名と6桁のコードだけで参加できます。','Join with your name and a six-digit code.')}</p><label>{l('参加名','Player name')}<input maxLength={32} value={name} onChange={e=>setName(e.target.value)}/></label><label>{l('部屋コード','Room code')}<input inputMode="numeric" maxLength={12} value={code} onChange={e=>setCode(e.target.value)} placeholder="000000"/></label><button disabled={busy} onClick={()=>void open('join')}>{busy?l('接続中…','Connecting…'):l('このコードで参加','Join this room')}</button></section>}
    {packet?.phase==='lobby'&&<section className="cc-panel cc-connection"><h1>{l('対戦準備','Table lobby')}</h1>{packet.code&&<><label>{l('部屋コード','Room code')}<output className="cc-code">{packet.code}</output></label><button onClick={async()=>{try{await navigator.clipboard.writeText(packet.code);setCopied(true);}catch{setCopied(false);}}}>{copied?l('コピーしました','Copied'):l('コードをコピー','Copy code')}</button></>}{host?<><label>{l('ゲーム','Game')}<select value={packet.game} onChange={e=>{const id=e.target.value as GameId;room.current?.configure(id,definition(id).players.find(n=>n>=Math.max(packet.members.length,definition(id).defaultPlayers))||definition(id).players.find(n=>n>=packet.members.length)!);}}>{CLUB_GAMES.filter(d=>d.players.some(n=>n>=packet.members.length)).map(d=><option key={d.id} value={d.id}>{title(d.id)}</option>)}</select></label><label>{l('人数','Seats')}<select value={packet.count} onChange={e=>room.current?.configure(packet.game,Number(e.target.value))}>{definition(packet.game).players.filter(n=>n>=packet.members.length).map(n=><option key={n}>{n}</option>)}</select></label></>:<h2>{title(packet.game)}</h2>}<div className="cc-seat-list">{packet.members.map(p=><article key={p.id}><Face hero={p.hero}/><strong>{p.name}</strong><small>{p.id===packet.hostId?'HOST':l('参加済み','Joined')}</small></article>)}{Array.from({length:packet.count-packet.members.length},(_,i)=><article key={i}><Face hero={CARD_CLUB_HEROES[((packet.members.length+i)*7)%CARD_CLUB_HEROES.length].id}/><strong>CPU {packet.members.length+i+1}</strong></article>)}</div><p>{l('開始すると参加受付を締め切り、空席をCPUが担当します。','Starting closes admission and fills empty seats with CPU players.')}</p>{host?<button className="cc-primary" onClick={()=>room.current?.start()}>{l('このメンバーで開始','Start this table')}</button>:<p>{l('ホストの開始を待っています。','Waiting for the host to start.')}</p>}</section>}
    {current&&<section className="cc-match"><div className="cc-match-heading"><h1>{title(current.game)}</h1><span>{l('配札','Deal')} {current.round+1} · {current.trump>=0?`${l('切札','Trump')} ${current.trump===4?l('ジャック4枚','Four jacks'):SUITS[current.trump]}`:''}</span><button onClick={()=>setRules(true)}>{l('ルール','Rules')}</button></div><div className="cc-player-ring">{current.players.map((p,i)=><article key={p.id} data-club-seat={i} className={`${current.turn===i?'cc-turn':''} ${current.winners.includes(i)?'cc-winner':''}`}><Face hero={p.hero}/><div><strong>{p.name}{p.id===packet?.selfId?' ★':''}</strong><small>{p.cpu?'CPU':'PLAYER'} · {l('手札','Cards')} {p.handCount}</small><span>{l('得点','Score')} {current.game==='golf'?-p.score:p.score}{['99add','schwimmen','rantergo','petrangola'].includes(current.game)?` · ♥${p.lives}`:''}{(['whist','spades','ohhell'].includes(current.game)||EXTENDED_TRICKS.has(current.game)||CLASSIC_TRICKS.has(current.game)||WORLD_TRICKS.has(current.game)||TRADITIONAL_TRICKS.has(current.game))?` · ${p.tricks}/${p.bid??'—'}`:''}</span></div><HandBacks count={p.handCount}/></article>)}</div>
      <div className="cc-playfield">
      <div className="cc-table-area"><p className="cc-turn-label">{current.phase==='result'?l('対戦終了','Match finished'):current.phase==='round'?l('配札の結果','Deal results'):`${current.players[current.turn]?.name} · ${current.turn===current.self?l('あなたの番','Your turn'):l('の番です','to act')}`}</p>{current.game==='99add'&&<strong className="cc-total">{current.total} / 99</strong>}{current.phase==='reaction'&&current.pending&&<div className="cc-claim">{current.players[current.pending.player].name}: {current.pending.rank} × {current.pending.count}<p>{l('ダウトするか、見送るかを選んでください。','Challenge the claim or accept it.')}</p></div>}
      <div className="cc-table-cards">{current.trick.length?current.trick.map(t=><figure key={t.player}><CardFace card={t.card}/><figcaption>{current.players[t.player].name}</figcaption></figure>):current.game==='fantan'?[0,1,2,3].map(st=><div className="cc-fantan-row" key={st}>{current.table.filter(c=>Math.floor(c/13)===st).sort((a,b)=>rank(a)-rank(b)).map(c=><CardFace key={c} card={c}/>)}</div>):(current.game==='shithead2'?current.table.slice(-4):current.table).map((c,i)=><CardFace key={`${c}:${i}`} card={c} selected={current.game==='cassino'&&selected.includes(c)} onClick={current.game==='cassino'&&current.turn===current.self&&current.phase==='play'?()=>selectCard(c):undefined}/>)}{!current.table.length&&!current.trick.length&&current.lastTrick.map(t=><figure key={t.player}><CardFace card={t.card}/><figcaption>{current.players[t.player].name}</figcaption></figure>)}</div>{current.game!=='memory'&&<TableStock count={current.stock} discard={current.discard} pile={['doubt','shithead2'].includes(current.game)?current.table.length:undefined} l={l}/>}</div>
      <GameTableExtras view={current} l={l} send={send}/>
      <ClassicTable view={current} l={l} send={send} selected={selected} select={selectCard}/>
      <details className="cc-log"><summary>{l('プレイ記録','Play log')}</summary>{current.log.map((e,i)=><p key={i}>{eventLabel(e,current)}</p>)}</details>
      </div>
      {current.game!=='memory'&&current.phase!=='result'&&current.phase!=='round'&&<div className="cc-hand-area"><h2>{l('あなたの手札','Your hand')} · {current.players[current.self].handCount}</h2><div className="cc-hand">{current.players[current.self].hand.map(c=><CardFace key={c} card={c} selected={selected.includes(c)} onClick={()=>selectCard(c)}/>)}</div>{current.turn===current.self&&<p className="cc-hand-hint">{l('カードを選ぶと、そのカードでできる操作を表示します。','Select a card to filter the actions you can take with it.')}</p>}<div className="cc-actions">{current.game==='cassino'&&current.turn===current.self&&selected.length>0&&<button className="cc-primary" disabled={!captureValid} onClick={()=>send(captureSelection)}>{l('選んだ場札を獲得','Capture selection')}</button>}{current.game==='cassino'&&current.turn===current.self&&[...new Set(current.players[current.self].hand.map(rank))].map(value=>({type:'build' as const,cards:captureSelection.cards,value})).filter(a=>casinoBuildValid(current,a)).map(a=><button key={`custom-build-${a.value}`} onClick={()=>send(a)}>{l('選択札でビルド','Build selection')} → {a.value}</button>)}{current.game==='doubt'&&current.phase==='play'&&current.turn===current.self&&selected.length>0?<button className="cc-primary" onClick={()=>send({type:'play',cards:selected})}>{l('このカードで宣言','Play these cards')} {current.claim} × {selected.length}</button>:visibleActions.slice(0,180).map(a=><button key={actionKey(a)} onClick={()=>send(a)}>{actionLabel(a,current)}</button>)}</div></div>}
      {(current.phase==='result'||current.phase==='round')&&<section className="cc-result"><h2>{current.resultReason==='draw'?l('引き分け','Draw'):current.resultReason==='repetition'?l('同じ状態が繰り返されたため引き分け','Repeated position: draw'):current.resultReason==='hostEnded'?l('ホストが対戦を終了しました','The host ended the match'):current.phase==='result'?current.winners.includes(current.self)?l('おめでとう！','Congratulations!'):l('対戦結果','Results'):l('今回の結果','Deal complete')}</h2><div className="cc-result-standings">{[...current.players].sort((a,b)=>b.score-a.score).map(p=><div key={p.id}><Face hero={p.hero}/><span>{p.name}</span><strong>{current.game==='golf'?-p.score:p.score}</strong></div>)}</div><div className="cc-result-actions">{host&&<button className="cc-primary" onClick={()=>current.phase==='round'?send({type:'next'}):room.current?.rematch()}>{current.phase==='round'?l('次の配札へ','Next deal'):l('ゲーム選択へ','Back to table lobby')}</button>}<button onClick={leave}>{l('クラブに戻る','Return to club')}</button></div></section>}
    </section>}
    {rules&&<div className="cc-modal" role="dialog" aria-modal="true" aria-label={l('遊び方','Rules')}><section className="cc-panel"><button onClick={()=>setRules(false)}>{l('閉じる','Close')} ×</button><h1>{title(current?.game||(packet?.phase==='lobby'?packet.game:game))}</h1><p>{l(definition(current?.game||(packet?.phase==='lobby'?packet.game:game)).rule,definition(current?.game||(packet?.phase==='lobby'?packet.game:game)).englishRule)}</p><p>{l('CPUの空席補充と、オンラインでの友達との対戦に対応。接続が切れた参加者の席はCPUが引き継ぎます。','Empty seats use CPU players. Play online with friends; disconnected guests are replaced by CPU players.')}</p><a href={referenceGame(current?.game||game)?.source} target="_blank" rel="noreferrer">{l('参考ルール（ゲームファーム）','Reference rules (Gamefarm)')} ↗</a></section></div>}
  </main>;
}
