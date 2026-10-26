/** Walk through narrative pages in gameplay-focused browser checks. */
export async function advanceStarStory(page, destination=/人と記憶をつなぐ|Connect people and memories/){
 for(let i=0;i<10;i++){
  const target=page.getByRole('button',{name:destination,exact:false});
  if(await target.isVisible())return;
  const next=page.locator('.st-story-backdrop').getByRole('button',{name:/次のことば|最初の島へ|Next|To the first island/});
  await next.click();
 }
 throw Error('Story destination was not reached');
}
