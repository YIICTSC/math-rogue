"""Validate authored coverage, per-hero identity references and every generated audio asset."""
from pathlib import Path
import argparse,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true');args=parser.parse_args()
 import numpy as np,soundfile as sf
 plan=json.loads((ROOT/'assets/dungeons1/technique-voice-plan.json').read_text());build=json.loads((ROOT/'assets/dungeons1/technique-voice-build.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 assert len(plan['heroes'])==35 and plan['total_clips']==1680
 assert build['models'][plan['model']]['revision']==plan['model_revision']
 assert build['codec']['device']=='cpu'and build['codec']['revision']and len(build['codec']['checkpoint_sha256'])==64
 expected={h['id']+'/'+key:(h,text)for h in plan['heroes']for key,text in h['lines'].items()};assert len(expected)==1680
 if not args.partial:assert set(build['clips'])==set(expected),'Unfinished technique voice generation'
 hashes=set();measurements={}
 for ident,clip in build['clips'].items():
  assert ident in expected,ident
  hero,text=expected[ident];path=ROOT/clip['output'];digest=sha(path)
  assert digest==clip['sha256']and digest not in hashes,ident;hashes.add(digest)
  assert clip['text']==text and clip['spoken_text']==hero['readings'][ident.split('/')[1]],ident
  assert clip['reference']==hero['reference']and sha(ROOT/hero['reference'])==clip['reference_sha256']==hero['reference_sha256'],ident
  assert clip['model_device']==clip['codec_device']=='cpu'and clip['silentcipher_watermark'],ident
  assert clip['irodori_revision']==plan['latest_code_checked']and clip['model']==plan['model'],ident
  data,rate=sf.read(path);assert rate==44100 and data.ndim==1 and np.isfinite(data).all(),ident
  duration=len(data)/rate;rms=float(np.sqrt(np.mean(data*data)));peak=float(np.max(np.abs(data)));tail=float(np.sqrt(np.mean(data[-int(rate*.04):]**2)))
  assert .35<duration<6.5 and .003<rms<.5 and .003<peak<1.02 and tail<.05,ident
  assert abs(sf.info(path).duration-clip['seconds'])<.09,ident
  measurements[ident]={'sha256':digest,'duration':round(duration,4),'rms':round(rms,5),'peak':round(peak,5),'tail_rms':round(tail,5)}
 report={'complete':len(measurements)==1680,'expected':1680,'verified':len(measurements),'clips':measurements}
 if not args.partial:
  primary=json.loads((ROOT/'assets/dungeons1/technique-speech-qa.json').read_text());review=json.loads((ROOT/'assets/dungeons1/technique-speech-review.json').read_text())
  samples={h['id']+'/'+key:h['readings'][key]for h in plan['heroes']for key in ['sword-1','ultimate-dawn','ultimate-earth','ultimate-sky','ultimate-heart']}
  assert primary['complete']and set(primary['clips'])==set(samples)
  for ident,spoken in samples.items():
   c=primary['clips'][ident];assert c['sha256']==build['clips'][ident]['sha256']and c['expected']==spoken,ident
   alternate=review['clips'].get(ident,{})
   assert c['similarity']>=.75 or(alternate.get('sha256')==c['sha256']and alternate.get('similarity',0)>=.75),'Unresolved speech sample: '+ident
  report['speech_samples_verified']=len(samples);report['speech_sampling_policy']=primary['sample_policy'];report['speech_models']=[primary['model'],review['model']]
 (ROOT/'assets/dungeons1/technique-voice-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(f"PASS: {len(measurements)}/1680 unique dedicated technique recordings, explicit readings, correct character references, CPU model+codec, watermark, amplitude, tails and durations.")
if __name__=='__main__':main()
