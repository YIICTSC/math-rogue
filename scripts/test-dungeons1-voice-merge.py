"""Protect completed voice metadata when combining disjoint CPU jobs."""
import json,subprocess,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory()as folder:
 folder=Path(folder);a=folder/'a.json';b=folder/'b.json';out=folder/'merged.json'
 def record(clips):return {'model_device':'cpu','codec_device':'cpu','models':{'MF':{'checkpoint_sha256':'checkpoint'}},'clips':{key:{'sha256':digest,'model_device':'cpu','codec_device':'cpu'}for key,digest in clips.items()}}
 a.write_text(json.dumps(record({'elementary-warrior/sword-1':'one'})));b.write_text(json.dumps(record({'elementary-warrior/sword-1':'one','elementary-caretaker/fist-1':'two'})))
 command=[sys.executable,str(ROOT/'scripts/dungeons1/merge-technique-voice-builds.py'),str(a),str(b),'--output',str(out)]
 subprocess.run(command,cwd=ROOT,check=True,capture_output=True);merged=json.loads(out.read_text());assert len(merged['clips'])==2 and merged['cpu_workers']==2
 before=out.read_bytes();broken=record({'elementary-warrior/sword-1':'CONFLICT'});b.write_text(json.dumps(broken));assert subprocess.run(command,cwd=ROOT,capture_output=True).returncode!=0;assert out.read_bytes()==before,'conflicts must not replace the last valid record'
 broken=record({'elementary-caretaker/fist-1':'two'});broken['clips']['elementary-caretaker/fist-1']['codec_device']='cuda';b.write_text(json.dumps(broken));assert subprocess.run(command,cwd=ROOT,capture_output=True).returncode!=0;assert out.read_bytes()==before,'GPU metadata must not be published'
print('PASS: disjoint CPU voice records merge without duplication, conflicting audio and non-CPU jobs are rejected atomically.')
