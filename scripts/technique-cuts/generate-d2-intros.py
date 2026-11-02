import sys,json,hashlib,subprocess,time,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root.parent/'Irodori-TTS'))
import torch,soundfile as sf
from huggingface_hub import HfApi
from irodori_tts.inference_runtime import InferenceRuntime,RuntimeKey,SamplingRequest,download_hf_checkpoint,save_wav
retakes={a.split('=',1)[1]for a in sys.argv if a.startswith('--retake=')}
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
model='Aratako/Irodori-TTS-v4.1-Small-MF';revision=HfApi().model_info(model).sha;code=subprocess.check_output(['git','-C',str(root.parent/'Irodori-TTS'),'rev-parse','HEAD'],text=True).strip();torch.set_num_threads(2);torch.set_num_interop_threads(1)
rt=InferenceRuntime.from_key(RuntimeKey(checkpoint=download_hf_checkpoint(model),model_device='cpu',codec_device='cpu'));rt.model.to(dtype=torch.bfloat16);rt._model_dtype=torch.bfloat16;rt.codec.model.to(dtype=torch.bfloat16);rt.codec.dtype=torch.bfloat16
rt.codec._normalize_loudness=torch.autocast('cpu',enabled=False)(rt.codec._normalize_loudness);mark=rt.watermarker.encode_batch
rt.watermarker.encode_batch=lambda audios,**kw:mark([a.float()for a in audios],**kw)
lines={'lyria':['いくよ！','ここで決める！','星よ、力を！'],'celis':['凍りなさい！','狙いはここ！','静まりなさい！'],'flora':['いくよ！','風をつかんで！','みんなのために！'],'noctia':['見せてあげる。','おやすみ。','逃がさないわ。'],'aurene':['光よ！','祈りを力に！','希望を照らして！'],'ignis':['いくぜ！','燃え上がれ！','ここで決める！'],'leon':['参る！','勝負だ！','守り抜く！'],'orion':['いくぞ。','隙は逃さない。','これで終わりだ。'],'leif':['いくよ！','狙いを定めて！','風に乗せて！']}
design=json.loads((root/'assets-source/dungeons2/voice-design.json').read_text());record=root/'assets/technique-cuts/d2-intro-build.json';data=json.loads(record.read_text())if record.exists()else{'clips':{}};data.update(model=model,model_revision=revision,code_revision=code,device='cpu',codec_device='cpu',steps=4,checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat());scratch=root/'tmp/d2-technique-intros';scratch.mkdir(parents=True,exist_ok=True)
for n,h in enumerate(design['heroes']):
 ident=h['id'];pending=[(i,t)for i,t in enumerate(lines[ident])if f'{ident}-{i}'not in data['clips']or f'{ident}-{i}'in retakes]
 if not pending:continue
 ref=root/f'public/sfx/dungeons2-voices/{ident}/attack.ogg';caption=h['caption']+' 参照音声と同じ人物の声色と年齢感を維持。戦闘の技を繰り出す短く明瞭な掛け声。指定された言葉だけを一度、力強く発声する。背景音・音楽なし。';latent=scratch/(ident+'.pt')
 with torch.autocast('cpu',dtype=torch.bfloat16):encoded=rt.codec.encode_file(str(ref))
 torch.save(encoded.float().cpu(),latent)
 for start in range(0,len(pending),1):
  batch=pending[start:start+1];requests=[SamplingRequest(text=t,caption=caption,ref_latent=str(latent),num_steps=4,seed=158000+n*101+i+(10000 if f'{ident}-{i}'in retakes else 0),seconds=1.6 if len(t)<5 else 2.0,max_seconds=5)for i,t in batch];now=time.time();print('START',ident,batch,flush=True)
  with torch.autocast('cpu',dtype=torch.bfloat16):results=rt.synthesize_batch(requests,log_fn=lambda _:None)
  for(i,text),result in zip(batch,results):
   path=f'sfx/technique-cuts/d2-{ident}-intro-{i}.ogg';target=root/'public'/path;target.parent.mkdir(parents=True,exist_ok=True);wav=scratch/'output.wav';save_wav(wav,result.audio,result.sample_rate);subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af',f'loudnorm=I=-18:TP=-1.5:LRA=7,afade=t=out:st={max(0,sf.info(wav).duration-.04):.4f}:d=0.04','-ar','44100','-ac','1','-c:a','libvorbis','-q:a','4',str(target)],check=True);duration=sf.info(target).duration
   data['clips'][f'{ident}-{i}']={'actor':f'd2/{ident}','text':text,'path':path,'duration':duration,'sha256':sha(target),'reference':str(ref.relative_to(root)),'reference_sha256':sha(ref),'caption':caption,'seed':158000+n*101+i+(10000 if f'{ident}-{i}'in retakes else 0),'model':model,'model_revision':revision,'code_revision':code,'device':'cpu','codec_device':'cpu','steps':4};record.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('DONE',ident,i,len(data['clips']),round(time.time()-now,1),flush=True)
print('COMPLETE',len(data['clips']),flush=True)
