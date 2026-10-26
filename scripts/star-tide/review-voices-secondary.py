import json,os
from pathlib import Path
from faster_whisper import WhisperModel
root=Path(os.environ.get('STAR_TIDE_REPO',Path(__file__).resolve().parents[2]));m=WhisperModel('medium',download_root=str(root.parent/'whisper-review'),device='cpu',compute_type='int8',cpu_threads=1)
clips=json.loads((root/'assets/star-tide/voice-build.json').read_text())['clips'];results=[]
for id in os.environ.get('STAR_TIDE_SECONDARY_IDS','action-ring-0,action-spear-3,action-damage-0').split(','):
 c=next(c for c in clips if c['id']==id);s,_=m.transcribe(str(root/'public'/c['path']),language='ja',beam_size=5,vad_filter=False,condition_on_previous_text=False)
 heard=''.join(x.text for x in s).strip();results.append({'id':id,'sha256':c['sha256'],'expected':c['text'],'heard':heard});print(id,heard,flush=True)
(root/'assets/star-tide/voice-secondary-review.json').write_text(json.dumps({'recognizer':'faster-whisper medium / CPU int8 / Japanese / beam5','clips':results},ensure_ascii=False,indent=2)+'\n')
