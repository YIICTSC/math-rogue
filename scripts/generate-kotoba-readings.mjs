import fs from 'node:fs';
import ts from 'typescript';
import KuroshiroImport from 'kuroshiro';
import AnalyzerImport from 'kuroshiro-analyzer-kuromoji';
const Kuroshiro=KuroshiroImport.default||KuroshiroImport, Analyzer=AnalyzerImport.default||AnalyzerImport;
const converter=new Kuroshiro();await converter.init(new Analyzer());
const bank=new Set();
for(const file of ['model.ts','data.ts','dialogueCorpus.ts']){
 const source=ts.createSourceFile(file,fs.readFileSync('src/mini-games/kotoba-life/'+file,'utf8'),ts.ScriptTarget.Latest,true);
 function walk(n){if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||n.kind===ts.SyntaxKind.TemplateHead||n.kind===ts.SyntaxKind.TemplateMiddle||n.kind===ts.SyntaxKind.TemplateTail){if(/[ぁ-んァ-ヶ一-龯]/.test(n.text))bank.add(n.text);}ts.forEachChild(n,walk);}walk(source);
}
const readings={};for(const value of bank)readings[value]=await converter.convert(value,{to:'hiragana',mode:'normal'});
fs.writeFileSync('src/mini-games/kotoba-life/readings.json',JSON.stringify(readings,null,2)+'\n');console.log('Kana fragments:',bank.size);
