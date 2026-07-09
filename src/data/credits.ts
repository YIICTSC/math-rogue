export const CROWDFUNDING_STAFF_ROLL_NAMES = [
  '辻凪 あやめ',
  'miyake',
  '秋雨漆莉',
  'カネダナオキ',
  'punigari',
  'つかぽん',
  'いち',
  'Red i Games',
  'たまごかぞく',
  '愛市',
  'toshi7m',
  '木田',
] as const;

export const CROWDFUNDING_SPECIAL_STAFF_ROLL_NAMES = [
  'どどめ',
  '長野和子',
] as const;

export const CREDIT_SECTIONS = [
  {
    title: '制作',
    entries: ['YUSUKE ISHIGE'],
  },
  {
    title: 'Special Supporters',
    entries: CROWDFUNDING_SPECIAL_STAFF_ROLL_NAMES,
    special: true,
  },
  {
    title: 'Crowdfunding Supporters',
    entries: CROWDFUNDING_STAFF_ROLL_NAMES,
  },
] as const;
