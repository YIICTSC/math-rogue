export interface MagicGalleryEntry {
  id: string;
  title: string;
  category: 'COMMON' | 'ROMANCE' | 'TRUE' | 'DRAMA' | 'HERO';
  file: string;
}

const makeEntries = (prefix: string, count: number, category: MagicGalleryEntry['category'], offset = 1) =>
  Array.from({ length: count }, (_, index) => {
    const number = index + offset;
    const padded = String(number).padStart(3, '0');
    return { id: `${prefix}${padded}`, title: `${category} ${number}`, category, file: `cg/magic/CG_${prefix}${padded}.webp` };
  });

export const GALLERY_DATA: MagicGalleryEntry[] = [
  ...makeEntries('C', 35, 'COMMON'),
  ...makeEntries('R', 48, 'ROMANCE'),
  ...makeEntries('T', 8, 'TRUE'),
  ...makeEntries('D', 7, 'DRAMA'),
  ...makeEntries('H', 27, 'HERO'),
];
