// Extract the authoritative game catalog without evaluating the React screen.
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = fs.readFileSync('src/components/PaperPlaneBattle.tsx', 'utf8');
const ast = ts.createSourceFile('catalog.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ['createEmptyPart', 'SHIPS', 'ENEMY_DATA', 'PART_TEMPLATES', 'UNLOCKABLE_PART_TEMPLATES'];
const declarations = [];
for (const statement of ast.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (names.includes(declaration.name.getText(ast))) declarations.push(`const ${declaration.getText(ast)};`);
  }
}
const js = ts.transpileModule(declarations.join('\n') + '\nJSON.stringify({ships:SHIPS,enemies:ENEMY_DATA,parts:[...PART_TEMPLATES,...UNLOCKABLE_PART_TEMPLATES]})', { compilerOptions: { target: ts.ScriptTarget.ES2022 }}).outputText;
const catalog = JSON.parse(vm.runInNewContext(js));
fs.mkdirSync('art/paper-plane', { recursive: true });
fs.writeFileSync('art/paper-plane/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log({ ships: catalog.ships.length, enemies: catalog.enemies.length, modules: catalog.parts.length });
