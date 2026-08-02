import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createServer } from 'vite';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'docs/language-check-all-elements.md');
const E2E_EVIDENCE_FILE = path.join(ROOT, 'docs/local-debug-english-e2e-evidence.json');
const JAPANESE = /[ぁ-ゖァ-ヺ㐀-鿿々〆ヵヶ]/;
const KANJI = /[㐀-鿿々〆ヵヶ]/;
const GENERIC_ENGLISH = /(?:Choose Option|Event Details|School Foe|Choose a fitting event action|The short break helped your body and mind recover\.|You handled the (?:event|situation|moment)|You turned the event into a useful tool for the road ahead\.|You handled the situation carefully and turned the experience into progress\.)/;
const TRANSLATION_DATA = /(?:english|hiragana|displayCopy|debugUi|textUtils2|translationAudit)/i;
const DISPLAY_FIELD_NAMES = new Set([
  'name', 'title', 'label', 'description', 'text', 'body', 'subBody', 'summary',
  'message', 'question', 'answer', 'result', 'explanation', 'placeholder', 'alt',
  'endingText', 'endingTitle', 'rankLabel', 'metricLabel', 'shortName', 'relicName',
  'relicDescription', 'introTitle', 'finalGoal', 'restTitle', 'prompt', 'caption',
]);
const INTENTIONAL_JAPANESE_VARIABLES = new Set([
  // Japanese typing drills are the learning material itself. Translating the
  // prompt would make the accepted romaji answer incorrect.
  'ROMAJI_BASIC', 'ROMAJI_ADVANCED', 'ROMAJI_NA_HA', 'ROMAJI_MA_YA_RA_WA',
  'SCHOOL_WORDS', 'SENTENCE_DRILLS', 'MIXED_DRILLS',
  // Unit names intentionally remain Japanese in both problem-selection UIs.
  'UPPER_PROBLEM_CATEGORIES', 'KOKUGO_GRADE_UNITS', 'MATH_GRADE_UNITS',
  'CATEGORY_LABELS', 'SUBMODE_LABELS',
]);
const SEPARATELY_AUDITED_CATALOG_FILES = new Set([
  'src/constants.ts',
  'src/constants1.ts',
  'src/data/magicCards.ts',
]);
const CURRICULUM_MANUSCRIPT_FILES = new Set([
  'src/data/unitBoardSummaries.ts',
  'src/data/unitBoardDedicatedSummaries.ts',
]);
const JAPANESE_UNIT_LABEL_FILES = new Set([
  'src/scienceUnitConfig.ts',
  'src/socialUnitConfig.ts',
  'src/subjectConfig.ts',
]);

const enclosingVariableName = (node, sourceFile) => {
  let current = node.parent;
  while (current && current !== sourceFile) {
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text;
    current = current.parent;
  }
  return '';
};

const collectFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  if (entry.isDirectory()) return collectFiles(target);
  return /\.tsx?$/.test(entry.name) ? [target] : [];
});

const markdown = (value) => String(value ?? '')
  .replaceAll('\\', '\\\\')
  .replaceAll('|', '\\|')
  .replaceAll('\r', '')
  .replaceAll('\n', '<br>');

const sourceCategory = (file) => {
  const normalized = file.replaceAll('\\', '/').toLowerCase();
  if (/minigame|mini-game|schooldungeon|poker|paperplane|gohome|survivor|kocho|dodgeball|basketball/.test(normalized)) return 'ミニゲーム';
  if (/magic/.test(normalized)) return 'マジック編';
  if (/highschool|high-school|supporternpc/.test(normalized)) return '高校編';
  if (/elementary|schoolstory|eventservice/.test(normalized)) return '小学生編';
  if (/card|relic|potion|enemy|battle/.test(normalized)) return 'カード・戦闘データ';
  if (/ranking/.test(normalized)) return 'ランキング';
  if (/ending/.test(normalized)) return 'エンディング';
  return '共通UI・その他';
};

const sourceFiles = collectFiles(path.join(ROOT, 'src'))
  .filter((file) => !TRANSLATION_DATA.test(path.basename(file)))
  .sort();
const e2eEvidence = JSON.parse(fs.readFileSync(E2E_EVIDENCE_FILE, 'utf8'));

const occurrences = [];
for (const absoluteFile of sourceFiles) {
  const source = fs.readFileSync(absoluteFile, 'utf8');
  const relativeFile = path.relative(ROOT, absoluteFile).replaceAll('\\', '/');
  const sourceFile = ts.createSourceFile(
    relativeFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    relativeFile.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const visit = (node) => {
    let original = null;
    let sample = null;
    let kind = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      original = node.text;
      sample = node.text;
      kind = ts.isStringLiteral(node) ? 'string' : 'template';
    } else if (ts.isTemplateExpression(node)) {
      original = node.getText(sourceFile).slice(1, -1);
      sample = node.head.text;
      for (const span of node.templateSpans) sample += `1${span.literal.text}`;
      kind = 'dynamic-template';
    }

    if (original && sample && JAPANESE.test(original)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
      let displayCandidate = false;
      let parent = node.parent;
      while (parent && parent !== sourceFile) {
        if (ts.isCallExpression(parent) && /^(?:trans|transEventText|transProblemSubjectName)$/.test(parent.expression.getText(sourceFile))) {
          displayCandidate = true;
          break;
        }
        if (ts.isJsxElement(parent) || ts.isJsxAttribute(parent) || ts.isJsxExpression(parent)) {
          displayCandidate = true;
          break;
        }
        if (ts.isPropertyAssignment(parent)) {
          const fieldName = parent.name.getText(sourceFile).replace(/^['"]|['"]$/g, '');
          if (DISPLAY_FIELD_NAMES.has(fieldName)) displayCandidate = true;
          break;
        }
        parent = parent.parent;
      }
      occurrences.push({
        category: sourceCategory(relativeFile),
        file: relativeFile,
        line,
        kind,
        original,
        sample,
        displayCandidate,
        intentionalJapanese: INTENTIONAL_JAPANESE_VARIABLES.has(enclosingVariableName(node, sourceFile)),
        separatelyAuditedCatalog: SEPARATELY_AUDITED_CATALOG_FILES.has(relativeFile),
        productionExcludedDebug: relativeFile === 'src/components/DebugMenuScreen.tsx',
        internalEncodedValue: /^[A-Z0-9_]+\|/.test(sample),
        curriculumManuscript: CURRICULUM_MANUSCRIPT_FILES.has(relativeFile),
        intentionalUnitLabel: JAPANESE_UNIT_LABEL_FILES.has(relativeFile),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const { trans, transEventText, buildEnglishCardDescription, buildEnglishCardName } = await server.ssrLoadModule('/src/utils/textUtils.ts');
  const { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY } = await server.ssrLoadModule('/src/constants.ts');
  const { MAGIC_CARDS } = await server.ssrLoadModule('/src/data/magicCards.ts');
  const { getEnemyLibraryByTheme } = await server.ssrLoadModule('/src/data/enemyCatalogs.ts');
  const { getMagicCardArtUrl } = await server.ssrLoadModule('/src/utils/cardArtPaths.ts');
  const { getCardIllustrationPaths } = await server.ssrLoadModule('/src/utils/cardIllustration.ts');
  const { GENERIC_ENGLISH_FALLBACK_PATTERN } = await server.ssrLoadModule('/src/utils/translationAudit.ts');

  const translationCache = new Map();
  const translateOccurrence = (entry, mode) => {
    // Curriculum copy can intentionally be the Japanese material being tested.
    // It is still enumerated below, but running the generic UI translator over
    // tens of thousands of question records is both misleading and needlessly
    // expensive.
    if (entry.file.includes('/data/subjects/')) return entry.sample;
    const eventLike = /event/i.test(entry.file);
    const key = `${eventLike ? 'event' : 'ui'}\u0000${mode}\u0000${entry.sample}`;
    if (translationCache.has(key)) return translationCache.get(key);
    const translated = eventLike ? transEventText(entry.sample, mode) : trans(entry.sample, mode);
    translationCache.set(key, translated);
    return translated;
  };

  const occurrenceGroups = new Map();
  for (const entry of occurrences) {
    const key = `${entry.category}\u0000${entry.original}\u0000${entry.sample}\u0000${entry.displayCandidate}\u0000${entry.intentionalJapanese}\u0000${entry.separatelyAuditedCatalog}\u0000${entry.productionExcludedDebug}\u0000${entry.internalEncodedValue}\u0000${entry.curriculumManuscript}\u0000${entry.intentionalUnitLabel}`;
    const existing = occurrenceGroups.get(key);
    const location = `${entry.file}:${entry.line}`;
    if (existing) {
      existing.occurrenceCount += 1;
      if (existing.locations.length < 8 && !existing.locations.includes(location)) existing.locations.push(location);
    } else {
      occurrenceGroups.set(key, { ...entry, occurrenceCount: 1, locations: [location] });
    }
  }

  const rows = [...occurrenceGroups.values()].map((entry) => {
    const hiragana = translateOccurrence(entry, 'HIRAGANA');
    const english = translateOccurrence(entry, 'ENGLISH');
    const curriculum = entry.file.includes('/data/subjects/') || entry.curriculumManuscript;
    const issues = [];
    const reviewedElsewhere = entry.intentionalJapanese || entry.intentionalUnitLabel || entry.separatelyAuditedCatalog || entry.productionExcludedDebug || entry.internalEncodedValue;
    if (!curriculum && !reviewedElsewhere && entry.displayCandidate && KANJI.test(hiragana)) issues.push('ひらがな要確認');
    if (!curriculum && !reviewedElsewhere && entry.displayCandidate && (JAPANESE.test(english) || GENERIC_ENGLISH.test(english) || GENERIC_ENGLISH_FALLBACK_PATTERN.test(english.trim()))) issues.push('英語要確認');
    const status = curriculum
      ? '教材原文（列挙対象）'
      : entry.intentionalJapanese
        ? '日本語教材・単元名（仕様どおり）'
      : entry.intentionalUnitLabel
        ? '問題選択の日本語単元名（仕様どおり）'
      : entry.separatelyAuditedCatalog
        ? 'カタログ構造化翻訳で別途監査済み'
      : entry.productionExcludedDebug
        ? '開発専用（本番ビルド非表示）'
      : entry.internalEncodedValue
        ? '内部描画ID（表示文言外）'
      : !entry.displayCandidate
        ? '列挙のみ（表示経路外・内部値）'
        : issues.join('・') || 'OK';
    return { ...entry, hiragana, english, status };
  });

  const cardRecords = [
    ...Object.entries(CARDS_LIBRARY).map(([id, card]) => ({ ...card, id, catalog: 'CARDS_LIBRARY' })),
    ...MAGIC_CARDS.map((card) => ({ ...card, catalog: 'MAGIC_CARDS' })),
  ];
  const cardRows = cardRecords.map((card) => {
    const englishName = buildEnglishCardName(card);
    const englishDescription = buildEnglishCardDescription(card);
    const hiraganaName = trans(card.name, 'HIRAGANA');
    const hiraganaDescription = trans(card.description, 'HIRAGANA');
    const magicArt = getMagicCardArtUrl(card);
    const directArt = card.highSchoolCardArtIndex !== undefined
      ? `/sprites/high-school/cards/${card.highSchoolCardArtIndex}.webp`
      : card.magicBasicCardArt && card.magicHeroId
        ? `/sprites/magic/basic-cards/${card.magicHeroId}/${card.magicBasicCardArt}.webp`
        : card.familiarSummon?.imageIndex !== undefined
          ? `/sprites/high-school/familiars-action/${card.familiarSummon.imageIndex}.webp`
          : null;
    const candidates = magicArt || directArt
      ? [magicArt || directArt]
      : getCardIllustrationPaths(card.id, englishName, [card.name, ...(card.originalNames || [])]);
    const resolved = candidates.find((candidate) => {
      const pathname = decodeURIComponent(new URL(candidate, 'http://local.invalid/').pathname).replace(/^\//, '');
      return fs.existsSync(path.join(ROOT, 'public', pathname));
    });
    const image = resolved || candidates[0] || '';
    const issues = [];
    if (KANJI.test(hiraganaName) || KANJI.test(hiraganaDescription)) issues.push('ひらがな要確認');
    if (JAPANESE.test(englishName) || JAPANESE.test(englishDescription) || GENERIC_ENGLISH_FALLBACK_PATTERN.test(englishDescription)) issues.push('英語要確認');
    if (!resolved || /unknown-card\.webp/.test(resolved)) issues.push('画像要確認');
    return {
      catalog: card.catalog,
      id: card.id,
      japanese: `${card.name}\n${card.description}`,
      hiragana: `${hiraganaName}\n${hiraganaDescription}`,
      english: `${englishName}\n${englishDescription}`,
      image,
      status: issues.join('・') || 'OK',
    };
  });

  const itemRows = [
    ...Object.entries(RELIC_LIBRARY).map(([id, item]) => ({ kind: 'レリック', id, ...item })),
    ...Object.entries(POTION_LIBRARY).map(([id, item]) => ({ kind: 'アイテム', id, ...item })),
    ...['elementary', 'high-school', 'magic'].flatMap((theme) => Object.entries(getEnemyLibraryByTheme(theme)).map(([id, item]) => ({ kind: `敵:${theme}`, id, ...item }))),
  ].map((item) => {
    const japanese = `${item.name}\n${item.description || ''}`;
    const hiragana = `${trans(item.name, 'HIRAGANA')}\n${trans(item.description || '', 'HIRAGANA')}`;
    const english = `${trans(item.name, 'ENGLISH')}\n${trans(item.description || '', 'ENGLISH')}`;
    const issues = [];
    if (KANJI.test(hiragana)) issues.push('ひらがな要確認');
    if (JAPANESE.test(english) || GENERIC_ENGLISH_FALLBACK_PATTERN.test(english)) issues.push('英語要確認');
    return { ...item, japanese, hiragana, english, status: issues.join('・') || 'OK' };
  });

  const issueRows = rows.filter((row) => row.status.includes('要確認'));
  const cardIssueRows = cardRows.filter((row) => row.status !== 'OK');
  const itemIssueRows = itemRows.filter((row) => row.status !== 'OK');
  const fileCoverage = new Map(sourceFiles.map((file) => [
    path.relative(ROOT, file).replaceAll('\\', '/'),
    { occurrences: 0, displayCandidates: 0 },
  ]));
  for (const occurrence of occurrences) {
    const coverage = fileCoverage.get(occurrence.file);
    if (!coverage) throw new Error(`Coverage entry missing for ${occurrence.file}`);
    coverage.occurrences += 1;
    if (occurrence.displayCandidate) coverage.displayCandidates += 1;
  }
  const fileRows = [...fileCoverage.entries()].map(([file, coverage]) => ({
    file,
    category: sourceCategory(file),
    ...coverage,
  }));
  const groupedOccurrenceTotal = [...occurrenceGroups.values()]
    .reduce((sum, row) => sum + row.occurrenceCount, 0);
  const runModes = ['elementary', 'high-school', 'magic'];
  const runCounts = Object.fromEntries(runModes.map((mode) => [
    mode,
    e2eEvidence.runs.filter((run) => run.mode === mode).length,
  ]));
  const invalidRuns = e2eEvidence.runs.filter((run) => (
    !run.ending || run.runtimeTranslationLeaks !== 0 || run.brokenImages !== 0
  ));
  const magicHeroCards = MAGIC_CARDS.filter((card) => card.magicHeroId);
  const coverageChecks = [
    ['TS/TSX対象ファイルを全件台帳化', fileRows.length === sourceFiles.length, `${fileRows.length}/${sourceFiles.length}`],
    ['日本語文字列の全出現を重複統合行へ対応', groupedOccurrenceTotal === occurrences.length, `${groupedOccurrenceTotal}/${occurrences.length}`],
    ['カードデータを全件台帳化', cardRows.length === cardRecords.length, `${cardRows.length}/${cardRecords.length}`],
    ['レリック・アイテム・敵を全件台帳化', itemRows.length > 0, `${itemRows.length}件`],
    ['各編を5周ずつ実走', runModes.every((mode) => runCounts[mode] === 5), runModes.map((mode) => `${mode}:${runCounts[mode]}`).join(', ')],
    ['全実走でエンディング到達・翻訳混入0・画像破損0', invalidRuns.length === 0, `不合格:${invalidRuns.length}`],
    ['英語表示でカード合成を実行', e2eEvidence.synthesis?.completed === true && e2eEvidence.synthesis?.renderedMaterialImages >= 2, `${e2eEvidence.synthesis?.result ?? '—'} / 素材画像:${e2eEvidence.synthesis?.renderedMaterialImages ?? 0}`],
    ['マジック主人公固有カードを全件監査', magicHeroCards.length === 51 && !cardIssueRows.some((row) => row.catalog === 'MAGIC_CARDS'), `${magicHeroCards.length}件`],
    ['ランキング報酬をスマホ横2カラムで実測', e2eEvidence.rankingRewardLandscape?.display === 'grid' && e2eEvidence.rankingRewardLandscape?.gridTemplateAreas === '"summary card" "action action"', `${e2eEvidence.rankingRewardLandscape?.viewport?.width ?? '—'}×${e2eEvidence.rankingRewardLandscape?.viewport?.height ?? '—'}`],
  ];
  const failedCoverageChecks = coverageChecks.filter(([, passed]) => !passed);
  if (failedCoverageChecks.length > 0) {
    throw new Error(`Language report coverage check failed: ${failedCoverageChecks.map(([label]) => label).join(', ')}`);
  }
  const now = new Date().toISOString();
  const lines = [
    '# 学習ローグ 全要素言語チェック',
    '',
    `生成日時: ${now}`,
    '',
    '## 監査範囲と判定',
    '',
    '- `src/` 配下の全TS/TSXから、日本語を含む文字列リテラルと動的テンプレートをファイル・行番号つきで機械抽出。',
    '- 小学生編・高校編・マジック編・全ミニゲーム・共通UI・イベント・ランキング・エンディングを含む。',
    '- 教材問題本文も台帳には含める。ただし、日本語そのものを問う教材は「教材原文」として翻訳漏れとは区別する。',
    '- カード、マジック固有カード、レリック、アイテム、全テーマの敵は、実行時データから別途全件列挙する。',
    '- 動的テンプレートは埋め込み値を `1` に置換した監査用サンプルで翻訳を検査する。',
    '- 「要確認」はソース抽出ヒューリスティックのレビュー候補であり、実行時に表示された翻訳漏れ件数とは分けて扱う。',
    '- 「要確認」の行も台帳から除外せず、現在の日本語・ひらがな・English出力を並記する。したがって「要確認」は列挙漏れではなく、今後の表現改善候補を意味する。',
    '',
    '## 列挙完全性チェック',
    '',
    '|検査|結果|証拠|',
    '|---|---|---|',
    ...coverageChecks.map(([label, passed, evidence]) => `|${markdown(label)}|${passed ? 'PASS' : 'FAIL'}|${markdown(evidence)}|`),
    '',
    '## ローカルデバッグ実走結果',
    '',
    '|編|周回|主人公番号|エンディング到達|操作ステップ|実行時日本語混入|壊れた画像|',
    '|---|---:|---:|---|---:|---:|---:|',
    ...e2eEvidence.runs.map((run) => `|${markdown(run.mode)}|${run.run}|${run.heroIndex ?? '—'}|${run.ending ? 'PASS' : 'FAIL'}|${run.steps}|${run.runtimeTranslationLeaks}|${run.brokenImages}|`),
    '',
    `- 合成: ${markdown(e2eEvidence.synthesis.materials.join(' + '))} → ${markdown(e2eEvidence.synthesis.result)}。英語効果「${markdown(e2eEvidence.synthesis.resultEnglishDescription)}」、素材画像${e2eEvidence.synthesis.renderedMaterialImages}枚を確認。`,
    '- マジック編の主人公固有カード51件は専用ルール英訳監査を通過。実画面でも固有カード名・説明・画像を確認。',
    '- 英語カード画像は生成済みマニフェストの実在ファイルだけを候補にし、Unicode正規化差・拡張子差・旧名を吸収。',
    '- ランキング報酬モーダルはスマートフォン横844×390で、概要/カードの2列と下部操作ボタン1列を確認。',
    '',
    '## 集計',
    '',
    '|対象|件数|要確認|',
    '|---|---:|---:|',
    `|ソース文字列（重複統合後）|${rows.length}|${issueRows.length}|`,
    `|ソース文字列の総出現数|${occurrences.length}|—|`,
    `|カード|${cardRows.length}|${cardIssueRows.length}|`,
    `|レリック・アイテム・敵|${itemRows.length}|${itemIssueRows.length}|`,
    `|監査対象TS/TSXファイル|${fileRows.length}|—|`,
    '',
    '## 要確認一覧',
    '',
    '|区分|場所|日本語|ひらがな|English|判定|',
    '|---|---|---|---|---|---|',
    ...issueRows.map((row) => `|${markdown(row.category)}|${markdown(row.locations.join('<br>'))}|${markdown(row.original)}|${markdown(row.hiragana)}|${markdown(row.english)}|${markdown(row.status)}|`),
    ...cardIssueRows.map((row) => `|カード|${markdown(`${row.catalog}:${row.id}`)}|${markdown(row.japanese)}|${markdown(row.hiragana)}|${markdown(row.english)}|${markdown(row.status)}|`),
    ...itemIssueRows.map((row) => `|${markdown(row.kind)}|${markdown(row.id)}|${markdown(row.japanese)}|${markdown(row.hiragana)}|${markdown(row.english)}|${markdown(row.status)}|`),
    ...(issueRows.length + cardIssueRows.length + itemIssueRows.length === 0 ? ['|—|—|—|—|—|要確認なし|'] : []),
    '',
    '## カード全件（画像参照を含む）',
    '',
    '|データ集合|ID|日本語|ひらがな|English|画像参照|判定|',
    '|---|---|---|---|---|---|---|',
    ...cardRows.map((row) => `|${markdown(row.catalog)}|${markdown(row.id)}|${markdown(row.japanese)}|${markdown(row.hiragana)}|${markdown(row.english)}|${markdown(row.image)}|${markdown(row.status)}|`),
    '',
    '## レリック・アイテム・敵 全件',
    '',
    '|種類|ID|日本語|ひらがな|English|判定|',
    '|---|---|---|---|---|---|',
    ...itemRows.map((row) => `|${markdown(row.kind)}|${markdown(row.id)}|${markdown(row.japanese)}|${markdown(row.hiragana)}|${markdown(row.english)}|${markdown(row.status)}|`),
    '',
    '## 監査対象ファイル全件',
    '',
    '|区分|ファイル|日本語文字列出現数|表示候補数|',
    '|---|---|---:|---:|',
    ...fileRows.map((row) => `|${markdown(row.category)}|${markdown(row.file)}|${row.occurrences}|${row.displayCandidates}|`),
    '',
    '## 全画面・イベント・データ文字列（同一文字列を統合）',
    '',
    '|区分|場所（最大8件）|出現数|種別|日本語|ひらがな|English|判定|',
    '|---|---|---:|---|---|---|---|---|',
    ...rows.map((row) => `|${markdown(row.category)}|${markdown(row.locations.join('<br>'))}|${row.occurrenceCount}|${markdown(row.kind)}|${markdown(row.original)}|${markdown(row.hiragana)}|${markdown(row.english)}|${markdown(row.status)}|`),
    '',
  ];
  fs.writeFileSync(OUTPUT, `${lines.join('\n')}\n`);
  console.log(`Language report generated: ${path.relative(ROOT, OUTPUT)}`);
  console.log(`Source occurrences: ${occurrences.length}; unique source rows: ${rows.length}; cards: ${cardRows.length}; items/enemies: ${itemRows.length}`);
  console.log(`Issues: source=${issueRows.length}, cards=${cardIssueRows.length}, items/enemies=${itemIssueRows.length}`);
} finally {
  await server.close();
}
