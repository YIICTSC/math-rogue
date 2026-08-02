import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'docs', 'language-check-all-elements.md');
const OUTPUT_DIR = path.join(ROOT, 'docs', 'language-check');
const INDEX_FILE = path.join(OUTPUT_DIR, 'README.md');
const MAX_FILE_BYTES = 750 * 1024;
const MAX_DATA_ROWS = 1500;

const SECTION_CONFIG = [
  { heading: '## 要確認一覧', prefix: '10-review-candidates', title: '要確認一覧' },
  { heading: '## カード全件（画像参照を含む）', prefix: '20-cards', title: 'カード全件（画像参照を含む）' },
  { heading: '## レリック・アイテム・敵 全件', prefix: '30-items-enemies', title: 'レリック・アイテム・敵 全件' },
  { heading: '## 監査対象ファイル全件', prefix: '40-source-files', title: '監査対象ファイル全件' },
  { heading: '## 全画面・イベント・データ文字列（同一文字列を統合）', prefix: '50-all-elements', title: '全画面・イベント・データ文字列' },
];

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const byteSize = (value) => Buffer.byteLength(value, 'utf8');
const formatBytes = (bytes) => bytes >= 1024 * 1024
  ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  : `${Math.ceil(bytes / 1024)} KB`;

const source = fs.readFileSync(SOURCE, 'utf8');
const lines = source.split('\n');
const sectionStarts = SECTION_CONFIG.map((section) => {
  const index = lines.indexOf(section.heading);
  if (index < 0) throw new Error(`Section not found: ${section.heading}`);
  return index;
});

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const file of fs.readdirSync(OUTPUT_DIR)) {
  if (/^(?:README|\d{2}-.+)\.md$/.test(file)) fs.unlinkSync(path.join(OUTPUT_DIR, file));
}

const summaryLines = lines.slice(0, sectionStarts[0]);
summaryLines.splice(2, 0,
  '',
  '> 閲覧用分割版です。完全版は [language-check-all-elements.md](../language-check-all-elements.md) に保持されています。',
  '',
  '> 分割ファイルの目次は [README.md](README.md) です。',
);
const summaryFile = '00-summary.md';
fs.writeFileSync(path.join(OUTPUT_DIR, summaryFile), `${summaryLines.join('\n').trimEnd()}\n`, 'utf8');

const outputRecords = [];
const sectionVerifications = [];

for (let sectionIndex = 0; sectionIndex < SECTION_CONFIG.length; sectionIndex += 1) {
  const config = SECTION_CONFIG[sectionIndex];
  const start = sectionStarts[sectionIndex];
  const end = sectionStarts[sectionIndex + 1] ?? lines.length;
  const sectionLines = lines.slice(start, end);
  const tableHeaderIndex = sectionLines.findIndex((line) => line.startsWith('|'));
  if (tableHeaderIndex < 0 || !sectionLines[tableHeaderIndex + 1]?.startsWith('|---')) {
    throw new Error(`Markdown table header not found: ${config.heading}`);
  }

  const tableHeader = sectionLines.slice(tableHeaderIndex, tableHeaderIndex + 2);
  const dataRows = sectionLines
    .slice(tableHeaderIndex + 2)
    .filter((line) => line.startsWith('|'));
  const chunks = [];
  let currentRows = [];
  let currentBytes = 0;

  for (const row of dataRows) {
    const rowBytes = byteSize(`${row}\n`);
    if (currentRows.length > 0 && (
      currentRows.length >= MAX_DATA_ROWS
      || currentBytes + rowBytes > MAX_FILE_BYTES
    )) {
      chunks.push(currentRows);
      currentRows = [];
      currentBytes = 0;
    }
    currentRows.push(row);
    currentBytes += rowBytes;
  }
  if (currentRows.length > 0) chunks.push(currentRows);

  const reconstructedRows = [];
  chunks.forEach((chunkRows, index) => {
    const part = index + 1;
    const file = `${config.prefix}-${String(part).padStart(3, '0')}.md`;
    const content = [
      `# ${config.title}（${part}/${chunks.length}）`,
      '',
      `[目次へ戻る](README.md) / [完全版](../language-check-all-elements.md)`,
      '',
      ...tableHeader,
      ...chunkRows,
      '',
    ].join('\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, file), content, 'utf8');

    const writtenLines = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf8').split('\n');
    const writtenSeparator = writtenLines.findIndex((line) => line.startsWith('|---'));
    const writtenRows = writtenLines.slice(writtenSeparator + 1).filter((line) => line.startsWith('|'));
    reconstructedRows.push(...writtenRows);

    outputRecords.push({
      section: config.title,
      file,
      rows: chunkRows.length,
      bytes: byteSize(content),
      hash: sha256(chunkRows.join('\n')),
    });
  });

  const originalHash = sha256(dataRows.join('\n'));
  const reconstructedHash = sha256(reconstructedRows.join('\n'));
  if (reconstructedRows.length !== dataRows.length || reconstructedHash !== originalHash) {
    throw new Error(`Split verification failed: ${config.title}`);
  }
  sectionVerifications.push({
    section: config.title,
    rows: dataRows.length,
    parts: chunks.length,
    hash: originalHash,
  });
}

const summaryBytes = fs.statSync(path.join(OUTPUT_DIR, summaryFile)).size;
const fullSourceHash = sha256(source);
const indexLines = [
  '# 学習ローグ 言語チェック分割版・目次',
  '',
  `生成元: [language-check-all-elements.md](../language-check-all-elements.md)（${formatBytes(byteSize(source))}、SHA-256: \`${fullSourceHash}\`）`,
  '',
  '元の完全版は変更せず保持しています。以下はCodexで開きやすい容量に分割した閲覧用ファイルです。',
  '',
  '## 検証結果',
  '',
  '|セクション|元データ行|分割数|再結合検証|SHA-256|',
  '|---|---:|---:|---|---|',
  ...sectionVerifications.map((record) => `|${record.section}|${record.rows}|${record.parts}|PASS|\`${record.hash}\`|`),
  '',
  '## ファイル一覧',
  '',
  '|セクション|ファイル|データ行|容量|データSHA-256|',
  '|---|---|---:|---:|---|',
  `|概要|[${summaryFile}](${summaryFile})|—|${formatBytes(summaryBytes)}|—|`,
  ...outputRecords.map((record) => `|${record.section}|[${record.file}](${record.file})|${record.rows}|${formatBytes(record.bytes)}|\`${record.hash}\`|`),
  '',
];
fs.writeFileSync(INDEX_FILE, `${indexLines.join('\n')}\n`, 'utf8');

const largestFile = outputRecords.reduce((largest, record) => (
  record.bytes > largest.bytes ? record : largest
), { file: summaryFile, bytes: summaryBytes });

console.log(`Split report generated: ${path.relative(ROOT, INDEX_FILE)}`);
console.log(`Browsable Markdown files: ${outputRecords.length + 2} including summary and index; the full report is kept separately.`);
console.log(`Largest split file: ${largestFile.file} (${formatBytes(largestFile.bytes)}).`);
console.log(`Full source SHA-256: ${fullSourceHash}`);
