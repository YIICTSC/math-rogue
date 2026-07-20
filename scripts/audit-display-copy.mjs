import fs from 'node:fs';
import ts from 'typescript';
import { createServer } from 'vite';

const DISPLAY_DATA_FILES = [
  'src/services/eventService.ts',
  'src/services/magicRomanceEventService.ts',
  'src/services/magicEndingService.ts',
  'src/data/visualThemes.ts',
  'src/data/friendshipEvents.ts',
  'src/data/magicScenarioEvents.ts',
  'src/data/romanceEvents.ts',
  'src/data/magicRomanceDialogue.ts',
  'src/data/magicFriendshipRoutes.ts',
  'src/data/magicFriendshipEndingDialogue.ts',
  'src/data/endings.ts',
  'src/data/stories.ts',
  'src/data/highSchoolStories.ts',
  'src/data/magicStories.ts',
  'src/data/azukiBoss.ts',
  'src/data/dodomedesuBoss.ts',
  'src/data/statusEffects.ts',
];
const DISPLAY_FIELDS = new Set([
  'title', 'description', 'content', 'label', 'text', 'result', 'resultLog',
  'summary', 'endingText', 'name', 'message', 'explanation',
]);
const JAPANESE = /[ぁ-んァ-ヶ一-龠々〆ヵヶ]/;
const KANJI = /[一-龠]/;
const GENERIC_FALLBACK = /^(Choose Option|Event Details|School Foe|Choose a fitting event action|You handled the (?:event|situation|moment).*|You turned the event into a useful tool for the road ahead\.|You handled the situation carefully and turned the experience into progress\.|The exchange with others changed the mood and opened a way forward\.|Facing the feeling directly helped your mind settle\.)$/;
const BROKEN_PLACEHOLDER = /ZXQNAME|QZQ\d+QZQ|\bToshi\b/;
const CONTEXTUAL_HIRAGANA = ['そらにもどる', '主にん公', '好感たびに', 'いちばんじょう', 'あぶねえじ', 'ほうもつ', 'すんで読', '閉か', '癒やし', 'ついかときキラ'];

const entries = [];
for (const file of DISPLAY_DATA_FILES) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isPropertyAssignment(node)) {
      const field = node.name.getText(sourceFile).replace(/^['"]|['"]$/g, '');
      const value = node.initializer;
      if (DISPLAY_FIELDS.has(field) && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) && JAPANESE.test(value.text)) {
        const line = sourceFile.getLineAndCharacterOfPosition(value.getStart(sourceFile)).line + 1;
        entries.push({ file, line, field, value: value.text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const failures = [];
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const { transEventText } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  for (const entry of entries) {
    const english = transEventText(entry.value, 'ENGLISH');
    const hiragana = transEventText(entry.value, 'HIRAGANA');
    if (JAPANESE.test(english) || GENERIC_FALLBACK.test(english.trim())) {
      failures.push(`${entry.file}:${entry.line} [English ${entry.field}] ${entry.value} => ${english}`);
    }
    if (BROKEN_PLACEHOLDER.test(english)) failures.push(`${entry.file}:${entry.line} [English broken placeholder ${entry.field}] ${entry.value} => ${english}`);
    if (KANJI.test(hiragana)) {
      failures.push(`${entry.file}:${entry.line} [Hiragana ${entry.field}] ${entry.value} => ${hiragana}`);
    }
    for (const broken of CONTEXTUAL_HIRAGANA) {
      if (hiragana.includes(broken)) failures.push(`${entry.file}:${entry.line} [Hiragana contextual error ${entry.field}] ${entry.value} => ${hiragana}`);
    }
  }

  const { HIGH_SCHOOL_SUPPORTER_NPC_EVENTS } = await server.ssrLoadModule('/src/data/supporterNpcEvents.ts');
  for (const profile of HIGH_SCHOOL_SUPPORTER_NPC_EVENTS) {
    for (const [field, value] of [['titleEnglish', profile.titleEnglish], ['npcNameEnglish', profile.npcNameEnglish], ['descriptionEnglish', profile.descriptionEnglish]]) {
      if (!value || JAPANESE.test(value)) failures.push(`supporter NPC ${profile.id} [English ${field}] ${value || '(missing)'}`);
    }
    if (!profile.englishQuestions || profile.englishQuestions.length !== profile.questions.length) {
      failures.push(`supporter NPC ${profile.id} [English questions] ${profile.englishQuestions?.length ?? 0}/${profile.questions.length}`);
      continue;
    }
    profile.questions.forEach((question, index) => {
      for (const [field, value] of [['question', question.question], ...question.options.map((option, optionIndex) => [`option${optionIndex + 1}`, option]), ['explanation', question.explanation]]) {
        const hiragana = transEventText(value, 'HIRAGANA');
        if (KANJI.test(hiragana)) failures.push(`supporter NPC ${profile.id} question ${index + 1} [Hiragana ${field}] ${value} => ${hiragana}`);
      }
      const englishQuestion = profile.englishQuestions[index];
      for (const [field, value] of [['question', englishQuestion.question], ...englishQuestion.options.map((option, optionIndex) => [`option${optionIndex + 1}`, option]), ['explanation', englishQuestion.explanation]]) {
        const japaneseAnswerIsIntentional = profile.id === 'tsukapon' && (field.startsWith('option') || field === 'explanation');
        if (!japaneseAnswerIsIntentional && JAPANESE.test(value)) failures.push(`supporter NPC ${profile.id} question ${index + 1} [English ${field}] ${value}`);
      }
    });
  }
} finally {
  await server.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`Display copy audit failed: ${failures.length} issue(s) across ${entries.length} static entries.`);
  process.exit(1);
}
console.log(`Display copy audit passed: ${entries.length} static entries and supporter NPC question sets.`);
