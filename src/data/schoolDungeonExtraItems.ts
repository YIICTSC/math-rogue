export type SchoolDungeonExtraItemTemplate = {
    category: 'WEAPON' | 'ARMOR' | 'RANGED' | 'CONSUMABLE' | 'SYNTH' | 'STAFF' | 'ACCESSORY';
    type: string;
    name: string;
    desc: string;
    value?: number;
    power?: number;
    range?: number;
    count?: number;
    plus?: number;
    charges?: number;
    maxCharges?: number;
    price?: number;
};

export const EXTRA_SCHOOL_DUNGEON_ITEMS: Record<string, SchoolDungeonExtraItemTemplate> = {
    'WOOD_RULER': { category: 'WEAPON', type: 'WOOD_RULER', name: '木のものさし', desc: '木刀風の軽い一振り。攻撃+2', power: 2, value: 120 },
    'BRASS_TRIANGLE': { category: 'WEAPON', type: 'BRASS_TRIANGLE', name: '真ちゅう三角定規', desc: '角が鋭い。攻撃+3', power: 3, value: 180 },
    'EXAM_CUTTER': { category: 'WEAPON', type: 'EXAM_CUTTER', name: 'テストカッター', desc: 'よく切れる。攻撃+4', power: 4, value: 260 },
    'SCIENCE_SCALPEL': { category: 'WEAPON', type: 'SCIENCE_SCALPEL', name: '理科室メス', desc: '軽くて鋭い。攻撃+5', power: 5, value: 320 },
    'GYM_PICKAXE': { category: 'WEAPON', type: 'GYM_PICKAXE', name: '体育倉庫のつるはし', desc: '重い一撃。攻撃+6', power: 6, value: 420 },
    'BROOM_NAGINATA': { category: 'WEAPON', type: 'BROOM_NAGINATA', name: '竹ぼうき長巻', desc: '間合いを取れる。攻撃+5', power: 5, value: 340 },
    'FIRE_EXTINGUISHER_LANCE': { category: 'WEAPON', type: 'FIRE_EXTINGUISHER_LANCE', name: '消火器ランス', desc: '押し込みが強い。攻撃+7', power: 7, value: 480 },
    'DRAGON_WHISTLE_BLADE': { category: 'WEAPON', type: 'DRAGON_WHISTLE_BLADE', name: '竜笛ブレード', desc: '竜退治向けの意匠。攻撃+8', power: 8, value: 560 },
    'KAMAITACHI_RULER': { category: 'WEAPON', type: 'KAMAITACHI_RULER', name: 'かまいたち定規', desc: '風を切る刃。攻撃+6', power: 6, value: 500 },
    'GHOST_ERASER': { category: 'WEAPON', type: 'GHOST_ERASER', name: 'おばけ消しゴムナイフ', desc: '見えない相手にも強そう。攻撃+5', power: 5, value: 360 },
    'EYE_PATCH_COMPASS': { category: 'WEAPON', type: 'EYE_PATCH_COMPASS', name: '片目のコンパス槍', desc: '一点をえぐる。攻撃+7', power: 7, value: 520 },
    'CANTEEN_HAMMER': { category: 'WEAPON', type: 'CANTEEN_HAMMER', name: '水筒ハンマー', desc: '鈍いが重い。攻撃+8', power: 8, value: 620 },
    'BROKEN_UMBRELLA_SPEAR': { category: 'WEAPON', type: 'BROKEN_UMBRELLA_SPEAR', name: '折れ傘のやり', desc: '危険な突き。攻撃+6', power: 6, value: 430 },
    'REPORT_CARD_EDGE': { category: 'WEAPON', type: 'REPORT_CARD_EDGE', name: '通知表エッジ', desc: '切れ味のある一振り。攻撃+9', power: 9, value: 700 },
    'CLEANING_MOP_HALBERD': { category: 'WEAPON', type: 'CLEANING_MOP_HALBERD', name: 'モップハルベルト', desc: '掃除用の長柄武器。攻撃+10', power: 10, value: 760 },
    'DESK_LEG_AXE': { category: 'WEAPON', type: 'DESK_LEG_AXE', name: '机脚アクス', desc: '机を砕く重量。攻撃+11', power: 11, value: 820 },
    'MORNING_BELL_MACE': { category: 'WEAPON', type: 'MORNING_BELL_MACE', name: '朝礼ベルメイス', desc: '鐘の音が響く。攻撃+9', power: 9, value: 710 },
    'GRADUATION_SHEARS': { category: 'WEAPON', type: 'GRADUATION_SHEARS', name: '卒業ばさみ', desc: '大きく重い。攻撃+12', power: 12, value: 900 },
    'BLACKBOARD_BLADE': { category: 'WEAPON', type: 'BLACKBOARD_BLADE', name: '黒板ブレード', desc: '板書も敵も切る。攻撃+10', power: 10, value: 780 },
    'PRINCIPAL_POINTER': { category: 'WEAPON', type: 'PRINCIPAL_POINTER', name: '校長ポインター', desc: '威厳ある指導棒。攻撃+13', power: 13, value: 980 },

    'LEATHER_GYM_UNIFORM': { category: 'ARMOR', type: 'LEATHER_GYM_UNIFORM', name: '皮の体操服', desc: '着込みやすい。防御+2', power: 2, value: 120 },
    'THICK_TRACKSUIT': { category: 'ARMOR', type: 'THICK_TRACKSUIT', name: '厚手のジャージ', desc: '地味に頼れる。防御+4', power: 4, value: 220 },
    'HARD_RANDO_SERU': { category: 'ARMOR', type: 'HARD_RANDO_SERU', name: 'ハードランドセル', desc: '背中が硬い。防御+6', power: 6, value: 320 },
    'SCIENCE_GOGGLES_SUIT': { category: 'ARMOR', type: 'SCIENCE_GOGGLES_SUIT', name: '理科室コート', desc: '薬品に強そう。防御+5', power: 5, value: 280 },
    'CLEANING_APRON_PLUS': { category: 'ARMOR', type: 'CLEANING_APRON_PLUS', name: '強化エプロン', desc: 'しぶとい作業着。防御+7', power: 7, value: 360 },
    'LIBRARY_CARDIGAN': { category: 'ARMOR', type: 'LIBRARY_CARDIGAN', name: '図書委員カーディガン', desc: '静かに堅い。防御+5', power: 5, value: 300 },
    'BELL_HELMET': { category: 'ARMOR', type: 'BELL_HELMET', name: 'チャイムヘルメット', desc: '頭部をしっかり守る。防御+8', power: 8, value: 430 },
    'GOLDEN_NAME_TAG_ARMOR': { category: 'ARMOR', type: 'GOLDEN_NAME_TAG_ARMOR', name: '金色の名札鎧', desc: '見た目以上に硬い。防御+9', power: 9, value: 520 },
    'RAINCOAT_PONCHO': { category: 'ARMOR', type: 'RAINCOAT_PONCHO', name: '雨の日ポンチョ', desc: 'ぬれにくい。防御+6', power: 6, value: 340 },
    'SEWING_CUSHION_VEST': { category: 'ARMOR', type: 'SEWING_CUSHION_VEST', name: '裁縫クッションベスト', desc: 'ふかふかで丈夫。防御+10', power: 10, value: 600 },
    'ART_ROOM_SMOCK': { category: 'ARMOR', type: 'ART_ROOM_SMOCK', name: '図工スモック', desc: '汚れにも強い。防御+7', power: 7, value: 390 },
    'MUSIC_STAND_GUARD': { category: 'ARMOR', type: 'MUSIC_STAND_GUARD', name: '譜面台ガード', desc: '構えやすい盾。防御+11', power: 11, value: 700 },
    'CLASS_MONITOR_SASH': { category: 'ARMOR', type: 'CLASS_MONITOR_SASH', name: '学級委員のたすき鎧', desc: '責任感が守りになる。防御+8', power: 8, value: 460 },
    'PRINCIPAL_CURTAIN': { category: 'ARMOR', type: 'PRINCIPAL_CURTAIN', name: '校長室のカーテン', desc: '重厚でひるまない。防御+12', power: 12, value: 820 },
    'CEREMONY_HAKAMA': { category: 'ARMOR', type: 'CEREMONY_HAKAMA', name: '式典のはかま', desc: '礼装ながら堅牢。防御+13', power: 13, value: 950 },

    'RED_PENCIL_BAND': { category: 'ACCESSORY', type: 'RING_POWER', name: '赤えんぴつバンド', desc: '攻撃+1', power: 1, value: 200 },
    'AFTERSCHOOL_MISANGA': { category: 'ACCESSORY', type: 'RING_POWER', name: '放課後ミサンガ', desc: '攻撃+2', power: 2, value: 350 },
    'DUMBBELL_WRIST': { category: 'ACCESSORY', type: 'RING_POWER', name: 'ダンベルリスト', desc: '攻撃+3', power: 3, value: 550 },
    'STRATEGY_CLIP': { category: 'ACCESSORY', type: 'RING_POWER', name: '作戦クリップ', desc: '攻撃+4', power: 4, value: 800 },
    'HERO_BADGE': { category: 'ACCESSORY', type: 'RING_POWER', name: '伝説の校章', desc: '攻撃+5', power: 5, value: 1100 },
    'LIBRARIAN_BADGE': { category: 'ACCESSORY', type: 'RING_GUARD', name: '図書委員バッジ', desc: '防御+1', power: 1, value: 200 },
    'NURSE_CHARM': { category: 'ACCESSORY', type: 'RING_GUARD', name: '保健室のおまもり', desc: '防御+2', power: 2, value: 350 },
    'DISASTER_WHISTLE': { category: 'ACCESSORY', type: 'RING_GUARD', name: '防災ホイッスル', desc: '防御+3', power: 3, value: 550 },
    'REFLECTION_FILE': { category: 'ACCESSORY', type: 'RING_GUARD', name: '反省文ファイル', desc: '防御+4', power: 4, value: 800 },
    'TEACHER_PATCH': { category: 'ACCESSORY', type: 'RING_GUARD', name: '先生公認ワッペン', desc: '防御+5', power: 5, value: 1100 },

    'PAPER_PLANE_BUNDLE': { category: 'RANGED', type: 'PAPER_PLANE_BUNDLE', name: '紙ひこうき束', desc: '軽くてたくさん飛ぶ。', power: 2, range: 6, count: 10, value: 90 },
    'THUMBTACK_BOX': { category: 'RANGED', type: 'THUMBTACK_BOX', name: '画びょうケース', desc: '小さいが痛い。', power: 4, range: 4, count: 4, value: 180 },
    'ERASER_SHURIKEN': { category: 'RANGED', type: 'ERASER_SHURIKEN', name: '消しゴム手裏剣', desc: '程よく飛ぶ。', power: 3, range: 5, count: 6, value: 140 },
    'WATER_BALLOON': { category: 'RANGED', type: 'WATER_BALLOON', name: '水ふうせん', desc: '重くて痛い。', power: 5, range: 3, count: 4, value: 200 },
    'RED_CHALK_BUNDLE': { category: 'RANGED', type: 'RED_CHALK_BUNDLE', name: '赤チョーク束', desc: 'よく目立つ飛び道具。', power: 4, range: 6, count: 8, value: 160 },
};
