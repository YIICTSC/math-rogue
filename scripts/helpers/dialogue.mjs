/** Wait for generated portrait atlases and the conversation scenery. */
export async function waitForConversationArt(page){
 await page.locator('[data-conversation-stage]').waitFor();
 await page.locator('[data-conversation-stage]').evaluate(async root=>{
  const background=getComputedStyle(root.querySelector('.conversation-landscape')).backgroundImage;
  const sources=[...root.querySelectorAll(root.dataset.presentation==='illustration'?'.conversation-illustration img':'.conversation-portrait image')].map(el=>el.getAttribute('href')||el.getAttribute('src'));
  if(background.startsWith('url("'))sources.push(background.slice(5,-2));
  if(sources.length!==(root.dataset.presentation==='illustration'?2:root.querySelectorAll('.conversation-actor').length+1))throw Error('Conversation art is missing');
  await Promise.all(sources.map(async src=>{const image=new Image();image.src=src;await image.decode();}));
 });
}
