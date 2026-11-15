import assert from 'node:assert/strict';
export async function testKochoRewardLayout(page,out){
 for(const hero of ['original','rebel','akari'])for(const [width,height]of [[1280,591],[844,390],[568,320],[390,844],[320,568]]){
  await page.setViewportSize({width,height});await page.evaluate(hero=>{const s=__kocho.initial(hero);s.phase='REWARD';s.status='PLAYING';s.battleStage=2;__kocho.setState(s);__kocho.generateRewards();},hero);
  const cards=page.locator('[data-kocho-reward-card]');await cards.first().waitFor();assert.equal(await cards.count(),hero==='original'?2:3);
  for(const card of await cards.all()){
   await card.scrollIntoViewIfNeeded();const pick=card.locator('.kocho-reward-pick');await pick.scrollIntoViewIfNeeded();const r=await pick.boundingBox();assert(r&&r.y>=0&&r.y+r.height<=height+1,'Pick fits '+hero+' '+width);assert.equal(await pick.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Pick is hit-testable');
  }
  await page.screenshot({path:`${out}/reward-${hero}-${width}x${height}.png`});const before=await page.evaluate(()=>({size:__kocho.state.hand.length,stage:__kocho.state.battleStage}));const name=await cards.first().locator('.kocho-reward-name').innerText();await cards.first().locator('.kocho-reward-pick').tap();await page.waitForFunction(()=>__kocho.state.phase!=='REWARD');assert.equal(await page.evaluate(()=>__kocho.state.hand.length),before.size+1,'Exactly one card awarded');assert.equal(await page.evaluate(()=>__kocho.state.battleStage),before.stage,'Stays in the same chapter');assert.equal(await page.evaluate(()=>__kocho.state.battleSequence),1);assert.equal(await page.evaluate(()=>__kocho.state.wave),1);assert(await page.evaluate(name=>__kocho.state.hand.some(c=>c.name===name),name));
 }
 // Whole card remains a single keyboard control, including long wrapping text.
 await page.evaluate(()=>{const s=__kocho.initial('rebel');s.phase='REWARD';s.status='PLAYING';s.battleStage=2;__kocho.setState(s);__kocho.generateRewards();});
 await page.setViewportSize({width:568,height:320});await page.evaluate(()=>{const a=__kocho.rewards[0];a.name='とても長い名前の主人公専用カード・最後まで表示して選べる報酬';a.description='長い説明文でも選択操作を塞がないことを確認するためのテキスト。'.repeat(4);__kocho.setState({...__kocho.state});});
 await page.locator('[data-kocho-reward-card]').first().focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>__kocho.state.phase!=='REWARD');
 console.log('PASS reward cards: all 3 heroes, five viewports, touch hit tests, exactly-once award/stage transition, keyboard and long text.');
}
