import { MAGIC_HEROES } from './magicHeroes';
import { ROMANCE_TARGETS } from './romanceTargets';

export interface MagicArtConsistencyTarget {
  id: string;
  category: 'COMMON_EVENT' | 'ROMANCE_EVENT' | 'ENDING_EVENT';
  label: string;
  filePath: string;
  heroId?: string;
  targetId?: string;
  expected: string;
}

const HERO_EXPECTATIONS: Record<string, string> = {
  AKARI: '赤髪ポニーテール、星飾り、赤金',
  SHIZUKU: '長い濃紺髪、眼鏡、青銀',
  HIYORI: '桃色の長髪、柔らかい表情',
  TSUBASA: '短い橙髪、スポーティー、橙黒ハンマー',
  REI: '非常に長い黒髪、赤眼、黒紅',
  MADOKA: 'ミント髪ツイン団子、丸眼鏡',
  KOHARU: '長い緑の編み髪、琥珀眼',
  MIRAI: '紫髪サイドポニー、舞台系',
  SERA: '銀白ショート、金眼、白紺金',
};

const TARGET_EXPECTATIONS: Record<string, string> = {
  REN: '灰茶短髪、青緑眼、紺ブレザー',
  SOMA: '銀青の整った髪、眼鏡、白紺',
  MINATO: '淡い水色短髪、白マフラー',
  RIKU: 'ラベンダーグレー低い結び髪、黒コート',
  YAMATO: '黒髪に赤い毛先、赤パーカー',
  LEON: '金髪ウェーブ、紫眼、黒紫',
  ELLIOT: '白金髪、金眼、白制服',
  SAKUYA: '長い黒髪に深紅差し色、赤眼、黒赤',
};

const ROMANCE_STAGE_FILES = ['r1.webp', 'r2.webp', 'r3.webp', 'r4.webp', 'r5.webp'];
const ENDING_STAGE_FILES = ['r6.webp', 'r6-true.webp', 'r6-special.webp', 'r6-bond.webp'];

export const MAGIC_ART_CONSISTENCY_TARGETS: MagicArtConsistencyTarget[] = [
  ...Array.from({ length: 20 }, (_, index) => ({
    id: `common:${index}`,
    category: 'COMMON_EVENT' as const,
    label: `共通イベント ${index}`,
    filePath: `sprites/magic/events/${index}.webp`,
    expected: 'イベントガイドの主要人物、髪型、髪色、衣装、場面が一致していること',
  })),
  ...MAGIC_HEROES.flatMap(hero =>
    ROMANCE_TARGETS.flatMap(target => {
      const expected = `${hero.name}: ${HERO_EXPECTATIONS[hero.id] ?? hero.transformedTitle} / ${target.name}: ${TARGET_EXPECTATIONS[target.id] ?? target.role}`;
      const basePath = `sprites/magic/events/romance/${hero.id}/${target.id}`;
      return [
        ...ROMANCE_STAGE_FILES.map(file => ({
          id: `romance:${hero.id}:${target.id}:${file}`,
          category: 'ROMANCE_EVENT' as const,
          label: `${hero.name} x ${target.name} ${file.replace('.webp', '')}`,
          filePath: `${basePath}/${file}`,
          heroId: hero.id,
          targetId: target.id,
          expected,
        })),
        ...ENDING_STAGE_FILES.map(file => ({
          id: `ending:${hero.id}:${target.id}:${file}`,
          category: 'ENDING_EVENT' as const,
          label: `${hero.name} x ${target.name} ${file.replace('.webp', '')}`,
          filePath: `${basePath}/${file}`,
          heroId: hero.id,
          targetId: target.id,
          expected,
        })),
      ];
    })
  ),
];
