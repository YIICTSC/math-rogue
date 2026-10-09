import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export async function verifyRenderBuildFilter(){
 const yaml=await readFile('render.yaml','utf8');
 assert(/^    autoDeployTrigger: 'off'$/m.test(yaml),'Render deployments must be started manually');
 assert(!/^\s*buildFilter:/m.test(yaml),'Path filters must not exclude commits from deployment');
 assert(/^    branch: main$/m.test(yaml),'Deploy the main branch');
 console.log('PASS: Render uses manual deployments from main without path filters.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await verifyRenderBuildFilter();
