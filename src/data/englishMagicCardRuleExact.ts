/**
 * Exact English copy for every protagonist-specific Magic card rule line.
 *
 * These mechanics are intentionally kept separate from generic event prose:
 * a fallback sentence here would hide how the protagonist's battle UI advances.
 */
export const ENGLISH_MAGIC_CARD_RULE_EXACT: Record<string, string> = {
  '専用ルール: 攻撃枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。': 'Unique rule: Fill the Attack slot. If it is already filled, the Constellation Board does not advance.',
  '専用ルール: スキル枠を埋める。同じ種類が埋まっている場合、星座盤は進まない。': 'Unique rule: Fill the Skill slot. If it is already filled, the Constellation Board does not advance.',
  '専用ルール: パワー枠を埋める。攻撃・スキル・パワーが揃うと完成効果が発動する。': 'Unique rule: Fill the Power slot. Filling the Attack, Skill, and Power slots triggers the completion effect.',

  '専用ルール: 月鏡を1段階進める。3回目の専用カード使用後に反射が発動する。': 'Unique rule: Advance Moon Mirror by 1 stage. Reflection triggers after the third exclusive card resolves.',
  '専用ルール: 月鏡を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反射が発動する。': 'Unique rule: Advance Moon Mirror by 1 stage and gain 4 extra Block. Reflection triggers after the third exclusive card resolves.',
  '専用ルール: 命花壇を1段階進める。3回目の専用カード使用後に収穫が発動する。': 'Unique rule: Advance Life Flowerbed by 1 stage. Harvest triggers after the third exclusive card resolves.',
  '専用ルール: 命花壇を1段階進め、追加でHPを2回復する。3回目の専用カード使用後に収穫が発動する。': 'Unique rule: Advance Life Flowerbed by 1 stage and heal 2 extra HP. Harvest triggers after the third exclusive card resolves.',
  '専用ルール: 神鍛炉を1段階進める。3回目の専用カード使用後に鍛造完成効果が発動する。': 'Unique rule: Advance Divine Forge by 1 stage. Forge Completion triggers after the third exclusive card resolves.',
  '専用ルール: 禁札陣を1段階進める。3回目の専用カード使用後に封印完成効果が発動する。': 'Unique rule: Advance Forbidden Talisman Array by 1 stage. Seal Completion triggers after the third exclusive card resolves.',
  '専用ルール: 時環記録を1段階進める。3回目の専用カード使用後に再演効果が発動する。': 'Unique rule: Advance Time Ring Record by 1 stage. Replay triggers after the third exclusive card resolves.',
  '専用ルール: 精霊樹を1段階進める。3回目の専用カード使用後に契約完成効果が発動する。': 'Unique rule: Advance Spirit Tree by 1 stage. Contract Completion triggers after the third exclusive card resolves.',
  '専用ルール: 夢幻舞台を1段階進める。3回目の専用カード使用後にフィナーレが発動する。': 'Unique rule: Advance Dream Stage by 1 stage. Finale triggers after the third exclusive card resolves.',
  '専用ルール: 星界記録を1段階進める。3回目の専用カード使用後に解析完了効果が発動する。': 'Unique rule: Advance Astral Record by 1 stage. Analysis Completion triggers after the third exclusive card resolves.',
  '専用ルール: 蒼風護陣を1段階進める。3回目の専用カード使用後に反撃が発動する。': 'Unique rule: Advance Azure Wind Ward by 1 stage. Counterattack triggers after the third exclusive card resolves.',
  '専用ルール: 蒼風護陣を1段階進め、追加でブロック4を得る。3回目の専用カード使用後に反撃が発動する。': 'Unique rule: Advance Azure Wind Ward by 1 stage and gain 4 extra Block. Counterattack triggers after the third exclusive card resolves.',

  '専用ルール: 第一手。最初に使うと計画が1段階進む。': 'Unique rule: First Move. Play it first to advance the plan to stage 1.',
  '専用ルール: 第二手。第一手の次に使うと計画が2段階目へ進む。先に使うとリセット。': 'Unique rule: Second Move. Play it after First Move to advance the plan to stage 2. Playing it early resets the plan.',
  '専用ルール: 最終手。第二手の次に使うと完成効果が発動する。先に使うとリセット。': 'Unique rule: Final Move. Play it after Second Move to trigger the completion effect. Playing it early resets the plan.',

  '専用ルール: 清流調合を1段階進める。3回目の専用カード使用後に調合完成効果が発動する。': 'Unique rule: Advance Clear Stream Blend by 1 stage. Blend Completion triggers after the third exclusive card resolves.',
  '専用ルール: 分岐盤を1段階進める。3回目の専用カード使用後に観測完了効果が発動する。': 'Unique rule: Advance Branching Board by 1 stage. Observation Completion triggers after the third exclusive card resolves.',
  '専用ルール: 紅蓮決闘を1段階進める。3回目の専用カード使用後に決着効果が発動する。': 'Unique rule: Advance Crimson Duel by 1 stage. Finishing Blow triggers after the third exclusive card resolves.',
  '専用ルール: 幻奏譜を1段階進める。3回目の専用カード使用後にフィナーレが発動する。': 'Unique rule: Advance Illusion Score by 1 stage. Finale triggers after the third exclusive card resolves.',
  '専用ルール: 星界門を1段階進める。3回目の専用カード使用後に開門効果が発動する。': 'Unique rule: Advance Astral Gate by 1 stage. Gate Opening triggers after the third exclusive card resolves.',
  '専用ルール: 常夜契約を1段階進め、追加でHPを1支払う。3回目の専用カード使用後に契約完成効果が発動する。': 'Unique rule: Advance Eternal Night Pact by 1 stage and pay 1 extra HP. Pact Completion triggers after the third exclusive card resolves.',
};
