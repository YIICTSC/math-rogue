import React, { useEffect, useState } from 'react';
import GameTitleScreen from '../mini-games/shared/GameTitleScreen';
import type { LanguageMode } from '../types';
import { assetUrl } from '../utils/assetPaths';
import { trans } from '../utils/textUtils';
import MenuSelection from './MenuSelection';
import MiniGameLab from './MiniGameLab';
import RpgSettings from './RpgSettings';
import type { RpgStartIntent } from './creative';
import { useRpgMusic } from './music';
import { copy } from './town/catalog';
import { readWorldSave, type RpgWorldSave } from './worldSave';

type Props = {
  languageMode: LanguageMode;
  onNew: (mode: RpgStartIntent) => void;
  onContinue: (save: RpgWorldSave) => void;
  onClose: () => void;
  debugEnabled?: boolean;
};

export default function RpgTitle({languageMode,onNew,onContinue,onClose,debugEnabled=false}:Props) {
  const t=(s:string)=>trans(s,languageMode);
  const L=(ja:string,en:string,hi:string)=>copy({ja,en,hi},languageMode);
  const [settings,setSettings]=useState(false);
  const [lab,setLab]=useState(false);
  const [save,setSave]=useState<RpgWorldSave|null>(null);
  const [creative,setCreative]=useState<RpgWorldSave|null>(null);
  const [loading,setLoading]=useState(true);
  const [creativeLoading,setCreativeLoading]=useState(true);
  const [error,setError]=useState(false);
  const [creativeError,setCreativeError]=useState(false);

  useEffect(()=>{
    let live=true;
    readWorldSave().then(value=>{if(live)setSave(value);})
      .catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setLoading(false);});
    readWorldSave('creative').then(value=>{if(live)setCreative(value);})
      .catch(()=>{if(live)setCreativeError(true);}).finally(()=>{if(live)setCreativeLoading(false);});
    return()=>{live=false;};
  },[]);

  useRpgMusic(lab&&debugEnabled?null:'title',10,'title');
  if(lab&&debugEnabled)return <MiniGameLab languageMode={languageMode} onClose={()=>setLab(false)}/>;

  const finished=save?.world.ended&&save.world.endReason!=='clear';
  const title=t('異世界転生したら学力で無双した件');
  const subtitle=t('学習ローグRPG');
  return <>
    <MenuSelection/>
    {settings&&<RpgSettings languageMode={languageMode} onClose={()=>setSettings(false)}/>}
    <GameTitleScreen kind="rpg" title={title} subtitle={subtitle}
      logo={<img src={assetUrl('sprites/rpg/title/logo.webp')} alt={title+' · '+subtitle}/>}
      languageMode={languageMode} onClose={onClose}
      backdrop={<img src={assetUrl('sprites/rpg/title/frontier.webp')} alt=""/>}
      actions={[
        {label:'ひとりで遊ぶ',onClick:()=>onNew('solo')},
        {label:'続きから',disabled:loading||!save||finished,onClick:()=>save&&onContinue(save)},
        {label:L('創造工房','Creative Workshop','そうぞうこうぼう'),disabled:creativeLoading||creativeError,
          onClick:()=>creative?onContinue(creative):onNew('creative')},
        {label:'オンラインで遊ぶ',onClick:()=>onNew('online')},
        {label:'招待に参加する',onClick:()=>onNew('join')},
        {label:'RPG設定',onClick:()=>setSettings(true)},
        ...(debugEnabled?[{label:'ゲーム家具の練習室',onClick:()=>setLab(true)}]:[]),
      ]}>
      {error?t('保存データを読み込めませんでした。'):loading?t('保存データを確認中…'):save?<>
        <strong>{save.world.players[save.selfId].name}</strong>
        <span>{new Date(save.savedAt).toLocaleString(languageMode==='ENGLISH'?'en-US':'ja-JP')}</span>
        <span>{t('戦闘勝利')} {save.world.players[save.selfId].completedBattles} · {t('家')} {save.world.life.houses.length}</span>
      </>:t('この端末に保存した冒険はまだありません。')}
      {finished&&<p>{t('この冒険は終了しました。新しい冒険を始めましょう。')}</p>}
      {creativeError&&<p>{L('創造工房の保存データを読み込めませんでした。','The Creative Workshop save could not be loaded.','そうぞうこうぼうのほぞんデータをよみこめませんでした。')}</p>}
      <p>{t('ひとり用ワールドは自動保存。制限時間なしで遊べます。')}</p>
    </GameTitleScreen>
  </>;
}
