"""Prepare the unlock-compatible, 24-person school crossover revision once."""
from pathlib import Path
import json,hashlib,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'src/mini-games/kocho/story/scenes.json';scenes=json.loads(p.read_text())
if scenes[0].get('artVersion')==2:raise SystemExit('Revision already prepared; use the existing plan.')
archive=ROOT/'assets/kocho/story/retired-v1';archive.mkdir(parents=True,exist_ok=True)
for name in ['voice-lines.json','voice-build.json','speech-qa.json','wave-qa.json','art-build.json','art-sources.json']:
 shutil.copy2(ROOT/'assets/kocho/story'/name,archive/name)
inputs=json.loads((ROOT/'assets/kocho/story/cast-inputs.json').read_text())
source=(ROOT/'src/three/protagonistCatalog.ts').read_text();protags={x['id']:x['name'] for x in json.loads(source.split('export const PROTAGONISTS = ')[1].split(' as const')[0])}
texts=[
 ('禁止令の根拠、気になるね。実験より先に、まず申請書の束を攻略しよう。','I wonder what evidence supports that ban. Before experiments, let us conquer this pile of application forms.'),
 ('えっと、作戦名を決めてる間に、下校時刻になりそうだよ。','Um, at this rate it will be closing time before we finish naming the plan.'),
 ('戦いの前こそ腹ごしらえだ。ただし最後のパンを巡って、仲間割れはするなよ。','Fuel up before a battle! Just do not fight your friends over the last bread roll.'),
 ('応援旗は十本！マイクも持ってきたけど、音量は校長室に届くくらいでいい？','Ten cheering flags! I brought a microphone too. Shall I set the volume so the principal can hear us?'),
 ('この議事録にも、昔の挑戦が残ってる。君の言葉で、次の一行を書いてきて。','These minutes preserve an old challenge. Go write the next line in your own words.'),
 ('ここに帰ってくる約束があるなら、きっと大丈夫。私たちも、ずっと待ってるから。','If you promised to come back, you will be all right. We will be here waiting for you.'),
 ('勝ったら、願いを真っすぐ伝えようぜ。先生まで仲間にできたら、それが一番だ！','When you win, tell him what you want. Getting the principal on our team would be the best result!'),
 ('お祝いのご飯、みんなで作ろう！ところで今日の給食当番、誰にお願いしようかな？','Let us cook a celebration meal together! Who shall we put on lunch duty today?'),
 ('あの禁止令、文字数まで偉そうね。あなたの本音なら、もっと短く届くはずよ。','Even the word count of that ban sounds pompous. Your honest feelings will reach him in far fewer words.'),
 ('作戦名は任せて！舞台名は、放課後・大反省会なんてどう？','Leave the name to me! How about After-School: The Great Reflection Meeting?'),
 ('全員分に分けよう。その切り方だと、君の分が一番小さくなっちゃうけど。','Let us divide it between everyone. But if you cut it that way, your piece will be the smallest.'),
 ('強そうに描いたつもりだって！ほら、声の応援なら負けないぞ！','I was trying to make you look strong! Listen, nobody can beat my cheering voice!'),
 ('校長先生にだって、格好つけたい季節はあったさ。今度は君の番だ。','Even the principal once wanted to look cool. Now it is your turn.'),
 ('帰ったら、反省会って名前の食事会にする？席は全員分、確保しとくよ。','Shall we call our meal a reflection meeting? I will save a seat for everyone.'),
 ('ぶつけるなら拳より気持ちだ。先生を倒すより、願いを届けてこいよ。','Make him feel your resolve, not your fists. Get your wish across instead of just beating him.'),
 ('今日の看板は、叛逆定食だ！花も山盛りに飾っておいたぜ。','The sign for today says Rebellion Set Meal! I decorated it with heaps of flowers too.'),
 ('秘密基地を守るより、放課後を守る方が難しそうだな。一人では行かせないけど。','Protecting after-school time looks harder than protecting a secret base. I will not let you go alone.'),
 ('その作戦名、言い終わる前に下校時間よ。短くしても、気持ちは減らないわ。','School will close before you finish saying that name. Shortening it will not lessen your resolve.'),
 ('公平に切る計算なら任せてくれ。パンくずまで数えるのは、やり過ぎか？','Leave the calculations for fair shares to me. Would counting the crumbs be going too far?'),
 ('十本とも、みんなの応援だよ。風が吹かなくても、私たちが振るからね。','All ten carry our support. Even without a breeze, we will keep waving them.'),
 ('先生にも、忘れられない放課後があるのですね。あなたの光なら、きっと届きます。','The principal has an after-school memory he cannot forget too. I am certain your light will reach him.'),
 ('小さな芽だって、日なたがあるから育つの。みんなの居場所、ちゃんと残そうね。','Even little sprouts need a sunny spot to grow. Let us make sure everyone keeps a place here.'),
 ('その光、言葉だけで終わらせるな。先生の願いまで聞けたら、見届けてやる。','Do not let that light stop at words. If you hear the principal out too, I will stay and watch.'),
 ('乾杯の練習は、もうばっちりです！先生、挨拶は短めでお願いします！','We have rehearsed our toast perfectly! Sir, please keep your speech short!'),
]
locations=[
 'School gate in the late afternoon, a school notice board, the guest holds a neat stack of forms while the hero resolves to challenge the principal.',
 'Sunlit school stair landing, a quick planning meeting, guest and hero looking at a small plan notebook, expressive friendly comic timing.',
 'School bread shop counter, exactly one last yakisoba bread roll resting on a clean tray, guest and hero preparing to split it fairly.',
 'School gymnasium, guest cheering enthusiastically with cheering pennants and a microphone or small banner bundle, ten small cheering flags as props, hero responds warmly.',
 'Quiet school library, guest and hero examining an old school meeting ledger and an old photograph of the principal as a student; no readable text on documents.',
 'School rooftop in a warm sunset breeze, guest and hero speaking sincerely side by side against the city and school landscape, hopeful atmosphere.',
 'Outside the closed principal office door, guest encourages the hero just before the final challenge, warm dramatic rim light, a hopeful determined mood.',
 'School courtyard festival feast after victory at sunset, guest and hero laughing together, festive bunting and food, friendly elderly principal holding a juice cup in the background, joyful best ending.',
]
names={'original':['赤ジャージの勇者','Tracksuit hero','あかジャージのゆうしゃ'],'rebel':['叛逆の高校生','Rebel student','はんぎゃくのこうこうせい'],'akari':['星宮あかり','Akari Hoshimiya','ほしみやあかり'],'narrator':['ナレーション','Narrator','ナレーション']}
eng=['Chemistry club president','Madoka Midorikawa','School cafeteria chef','Broadcast director','Literature secretary','Sera Shiramine','Basketball ace','Hiyori Hanasaki','Rei Kuroba','Mirai Shido','Ren Asagiri','Tsubasa Kagami','Leon Kamishiro','Riku Amane','Yamato Kurose','Gardening club president','Mysterious transfer student','Shizuku Mizuki','Soma Mikage','Koharu Kazamori','Elliot Knox','Biology club senior','Sakuya Kujo','Minato Shiraishi']
catalog=json.load(open(ROOT/'assets/kocho/story/voice-lines.json'));catalog['heroes']=[h for h in catalog['heroes'] if h['id'] not in ['aster','lyra']]
repairs=[];cast=[]
for i,(scene,inp,pair) in enumerate(zip(scenes,inputs,texts)):
 guest=inp['id'];text,english=pair;voice_id=guest+'-'+hashlib.sha256(text.encode()).hexdigest()[:12]
 names[guest]=[protags[guest],eng[i],protags[guest]]
 old=ROOT/'public'/scene['image'];dest=archive/'art'/old.name;dest.parent.mkdir(exist_ok=True);shutil.copy2(old,dest)
 scene.update(guest=guest,cast=[scene['hero'],guest],artVersion=2,image=f"sprites/kocho/story/{scene['id']}-v2.webp")
 scene['lines'][2]={'speaker':guest,'text':text,'english':english,'hiragana':text,'voiceId':voice_id,'audio':f'sfx/kocho-story/{guest}/{voice_id}.ogg'}
 hero={'original':'the black spiky-haired male in a RED TRACKSUIT','rebel':'the black-haired male student in a dark navy-black school jacket with gold trim and a blue inner lining','akari':'the red ponytail girl Akari with a gold star hair clip and navy sailor school uniform'}[scene['hero']]
 prompt=f"Repaint a single beautiful 16:9 school anime story CG. The LEFT part of the reference board is the old scene: retain ONLY the MAIN HERO, {hero}, with the same face and outfit. The RIGHT part is the canonical portrait of the NEW SPEAKING GUEST, {protags[guest]} ({guest}). Replace all old non-hero foreground characters with this new guest. The final image MUST prominently show exactly TWO foreground characters: that hero AND that specific guest, both identifiable with faithful hair, face, glasses and accessories from their references. No Aster, no Lyra, no unrelated fantasy warrior or hooded desert guest. {locations[scene['stage']-1]} The guest is actually speaking to the hero, natural eyelines, appropriate facial reactions. The conversational context is: {text} Do NOT render that dialogue as text. Match the warm richly detailed anime illustration and school-story atmosphere of the old CG; preserve natural female/male proportions of the canonical guest. Exactly two arms per person, anatomically correct hands, no extra hands, no duplicate limbs. A complete composed illustration, no split panels, no comparison board, no labels, no subtitles, no logos, no UI, no frames. All faces fully inside image. Keep the lower quarter calm enough for a later dialogue overlay."
 scene['artPrompt']=prompt
 entry={'scene':scene['id'],'hero':scene['hero'],'guest':guest,'guestName':protags[guest],'referenceArt':inp['art'],'referenceVoice':inp['reference'],'voiceId':voice_id,'text':text,'board':f"tmp/kocho-story-cast/boards/{scene['id']}.png",'oldImage':str(dest.relative_to(ROOT)),'prompt':prompt};cast.append(entry)
 h={'id':guest,'caption':inp['caption'],'references':[inp['reference']],'seed':91000+i*137,'lines':{voice_id:text}}
 if guest=='high-school-gardener':h['synthesis_text']={voice_id:text.replace('叛逆定食','はんぎゃく定食')}
 catalog['heroes'].append(h);repairs.append(guest+'/'+voice_id)
for h in ['aster','lyra']:
 old=ROOT/'public/sfx/kocho-story'/h
 if old.exists():shutil.move(str(old),str(archive/h))
for scene in scenes:
 old=ROOT/f"public/sprites/kocho/story/{scene['id']}.webp"
 if old.exists():old.unlink()
# Keep only active voice records; retired provenance is archived above.
active={h['id']+'/'+k for h in catalog['heroes'] for k in h['lines']}
for filename,prop in [('voice-build.json','clips'),('speech-qa.json','samples'),('wave-qa.json','clips')]:
 f=ROOT/'assets/kocho/story'/filename;data=json.load(open(f));data[prop]={k:v for k,v in data[prop].items() if k in active};f.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
for rel,data in [('src/mini-games/kocho/story/scenes.json',scenes),('src/mini-games/kocho/story/speakers.json',names),('assets/kocho/story/voice-lines.json',catalog),('assets/kocho/story/cast-revision.json',cast),('assets/kocho/story/guest-keys.json',repairs),('src/mini-games/kocho/story/ready.json',{'ready':False})]:
 (ROOT/rel).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Prepared 24 unique school guests, 24 new recordings, 56 preserved recordings and 24 CG revision prompts.')
