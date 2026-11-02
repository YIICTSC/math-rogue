import fs from 'node:fs/promises';
import {createServer} from 'vite';
const server=await createServer({configFile:false,logLevel:'error',server:{middlewareMode:true,watch:null,hmr:false},optimizeDeps:{noDiscovery:true,entries:[]}});
try{
 const {BANTERS,BANTER_CAST}=await server.ssrLoadModule('/src/mini-games/lantern-war/banter.ts');
 const {heroById}=await server.ssrLoadModule('/src/mini-games/lantern-war/roster.ts');
 const out=['# 継界戦記：出撃前の言葉・全組台本','',`全${BANTER_CAST.length}人、${BANTERS.length}組、${BANTERS.length*2}台詞。順序を逆にした重複組・自分同士は含まない。各組の日本語原稿を個別に執筆し、名前・役割の差し替えによる台詞生成は行わない。`,'','元原稿：`src/mini-games/lantern-war/banter/00.json`〜`42.json`。この文書は原稿の内容を変えず、名前と見出しを付けて出力した閲覧用一覧。',''];
 let previous='';for(const b of BANTERS){if(previous!==b.actors[0]){previous=b.actors[0];out.push('## '+heroById(previous).name,'');}out.push('### '+b.actors.map(id=>heroById(id).name).join(' × '),'');for(const l of b.lines)out.push(`**${heroById(l.who).name}**「${l.text}」`,'');}
 const file='docs/lantern-war/banter-manuscript.md';await fs.mkdir('docs/lantern-war',{recursive:true});await fs.writeFile(file,out.join('\n').trimEnd()+'\n');console.log(`${BANTERS.length} original pairs exported to ${file}`);
}finally{await server.close();}
