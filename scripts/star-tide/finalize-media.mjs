/** Verify deliveries before recording the combined CPU-generation provenance. */
import fs from'node:fs/promises';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const path='assets/star-tide/voice-build.json',report=JSON.parse(await fs.readFile(path)),plan=JSON.parse(await fs.readFile('assets/star-tide/voice-plan.json')),byId=new Map(report.clips.map(c=>[c.id,c]));
assert.equal(byId.size,plan.clips.length);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
report.clips=await Promise.all(plan.clips.map(async c=>{
 const r=byId.get(c.id);assert(r,c.id);assert.equal(r.text,c.text);assert.equal(r.spokenText,c.spokenText);assert.equal(hash(await fs.readFile('public/'+c.path)),r.sha256,c.id);
 r.precision??='fp32 with CPU bfloat16 autocast';r.caption??=c.caption;r.seed??=c.seed;
 if(typeof r.reference==='string')r.reference=r.reference.replace(/^\/workspace\/math-rogue\//,'');
 // These two unchanged first takes originally established the actor reference.
 if(c.id==='opening-0'||c.id==='opening-2')r.reference=null;
 return r;
}));
if(report.precision!=='per clip')report.executionPrecision=report.precision;report.precision='per clip';report.precisionModes=[...new Set(report.clips.map(c=>c.precision))];
report.encoding={codec:'libvorbis',format:'ogg',sampleRate:24000,channels:1,quality:4,filter:'silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB,loudnorm=I=-18:TP=-2:LRA=9,alimiter=limit=0.89:level=false'};
report.watermark='Official Irodori default SilentCipher / SDR 47 dB';report.generatorScript='scripts/star-tide/generate-voices.py';report.generatorSha256=hash(await fs.readFile(report.generatorScript));
await fs.writeFile(path,JSON.stringify(report,null,2)+'\n');console.log(`Verified and finalized ${report.clips.length} CPU voice deliveries.`);
