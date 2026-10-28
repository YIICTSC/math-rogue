from pathlib import Path
import json,hashlib,datetime
r=Path(__file__).resolve().parents[2];p=json.loads((r/'assets/lantern-war/voice-catalog.json').read_text());sports=json.loads((r/'assets/sports-performances/voice-plan.json').read_text());d2=json.loads((r/'assets-source/dungeons2/voice-design.json').read_text());star=json.loads((r/'assets/star-tide/voice-plan.json').read_text());speakers={}
for h in p['heroes']:
 ident=h['id'];v=next((v for v in sports['voices']if v['id']==ident),None)
 if v:speakers[ident]={'caption':v['caption'],'reference':v['reference']};continue
 if ident.startswith('dungeons2-'):
  old=next(v for v in d2['heroes']if ident=='dungeons2-'+v['id']);speakers[ident]={'caption':old['caption']+' 日本語を母語とする自然な演技。','reference':f"public/sfx/dungeons2-voices/{old['id']}/attack.ogg"};continue
 if ident in ['nagi','mio','sena']:
  old=next(v for v in star['clips']if v['speaker']==ident);speakers[ident]={'caption':old['caption'],'reference':f'assets-source/star-tide/voice-anchors/{ident}.wav'};continue
 speakers[ident]={'caption':('若い成人男性。穏やかな中低音、誠実で凛とした王子。'if ident=='aster'else'若い成人女性。澄んだ中高音、気丈で温かな剣士。')+' 日本語を母語とする、明瞭で自然な標準語。音楽や効果音なし。','reference':f'assets/lantern-war/references/{ident}.ogg','design_text':h['motto']+'仲間の声を聞いて、一緒に明日への道を作ろう。'}
old=next(v for v in star['clips']if v['speaker']=='narrator');speakers['narrator']={'caption':old['caption'],'reference':'assets-source/star-tide/voice-anchors/narrator.wav'}
for hero in p['heroes']:
 ident=hero['id']
 directory=(r/'public/sfx/high-school-voices'/ident[12:].upper() if ident.startswith('high-school-') else r/'public/sfx/magic-voices'/ident[6:].upper() if ident.startswith('magic-') else r/'public/sfx/dungeons2-voices'/ident[10:] if ident.startswith('dungeons2-') else None)
 for event,text in {'attack':'道を切り開く！','damage':'まだ、立てる！','heal':'ありがとう。もう一度！','win':'みんなで、つかんだ明日だ。','defeat':'この灯を、託す。'}.items():
  prefix='finish'if event=='win'else event
  if directory and (any(directory.glob(prefix+'.ogg')) or any(directory.glob(prefix+'-*.ogg'))):continue
  if ident=='lyra':text=text.replace('明日だ。','明日だね。')
  i=hashlib.sha256((ident+'\n'+text).encode()).hexdigest()[:20];p['clips'].append({'id':i,'speaker':ident,'text':text,'kind':event,'path':f'sfx/lantern-war/{ident}/{i}.ogg'})
for ident,v in speakers.items():
 path=r/v['reference'];v['reference_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()if path.exists()else None
prior=json.loads((r/'assets/lantern-war/voice-plan.json').read_text())if(r/'assets/lantern-war/voice-plan.json').exists()else{}
corrections=r/'assets/lantern-war/voice-corrections.json'
overrides={**prior.get('clip_overrides',{}),**(json.loads(corrections.read_text())if corrections.exists()else{})}
plan={'clip_overrides':overrides,'model':'Aratako/Irodori-TTS-v4.1-Small-MF','latest_checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'speakers':speakers,'clips':p['clips']}
(r/'assets/lantern-war/voice-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n');print(len(plan['clips']),'clips',len(speakers),'speakers')
