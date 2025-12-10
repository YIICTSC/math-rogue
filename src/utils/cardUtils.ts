
import { Card, CardType, TargetType } from '../types';

// Helper to determine the visual shape of a card for synthesis
export const getShapeFromCard = (card: Card): string => {
    if (card.textureRef) return card.textureRef.split('|')[0];
    
    const n = card.name;
    if (n.includes('薬') || n.includes('ポーション')) return 'POTION';
    if (n.includes('靴') || n.includes('足') || n.includes('ステップ') || n.includes('ダッシュ') || n.includes('ジャンプ')) return 'SHOE';
    if (n.includes('本') || n.includes('書') || n.includes('研究') || n.includes('学習')) return 'NOTEBOOK';
    if (n.includes('拳') || n.includes('パンチ') || n.includes('打') || n.includes('頭突き')) return 'FIST';
    if (n.includes('火') || n.includes('炎') || n.includes('熱')) return 'FLAME';
    if (n.includes('雷') || n.includes('電')) return 'LIGHTNING';
    
    if (card.type === CardType.ATTACK) return 'SWORD';
    if (card.type === CardType.SKILL) return 'SHIELD';
    if (card.type === CardType.POWER) return 'FLAME';
    return 'NOTEBOOK';
};

export const getUpgradedCard = (card: Card): Card => {
    if (card.upgraded) return card; // Prevent double upgrade

    const newCard = { ...card, upgraded: true };
    
    const hasDamage = (card.damage !== undefined && card.damage > 0);
    const hasBlock = (card.block !== undefined && card.block > 0);
    
    if (hasDamage) {
        newCard.damage = Math.floor(card.damage! * 1.3) + 2;
    }
    if (hasBlock) {
        newCard.block = Math.floor(card.block! * 1.3) + 2;
    }

    if (!hasDamage && !hasBlock && card.cost > 0) {
        newCard.cost = Math.max(0, card.cost - 1);
    } else if (card.cost === 0 && !hasDamage && !hasBlock) {
        if (newCard.draw) newCard.draw += 1;
        if (newCard.energy) newCard.energy += 1;
        if (newCard.vulnerable) newCard.vulnerable += 1;
        if (newCard.weak) newCard.weak += 1;
        if (newCard.poison) newCard.poison += 2;
        if (newCard.strength) newCard.strength += 1;
        if (newCard.poisonMultiplier) newCard.poisonMultiplier += 1;
        // Next turn effects
        if (newCard.nextTurnEnergy) newCard.nextTurnEnergy += 1;
        if (newCard.nextTurnDraw) newCard.nextTurnDraw += 1;
    }

    // Specific Card Upgrade Logic overrides
    if (card.name === 'ボディスラム' || card.name === 'BODY_SLAM') newCard.cost = 0; 
    if (card.name === '限界突破' || card.name === 'LIMIT_BREAK') newCard.exhaust = false;
    
    return newCard;
};

export const synthesizeCards = (c1: Card, c2: Card): Card => {
      // 1. Name Synthesis
      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      
      // 2. Cost Logic
      const newCost = Math.max(c1.cost, c2.cost);
      
      // 3. Stats Summation
      const sum = (k: keyof Card) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);
      const newDamage = sum('damage');
      const newBlock = sum('block');
      const newDraw = sum('draw');
      const newEnergy = sum('energy');
      const newHeal = sum('heal');
      const newPoison = sum('poison');
      const newWeak = sum('weak');
      const newVulnerable = sum('vulnerable');
      const newStrength = sum('strength');
      const newSelfDamage = sum('selfDamage');
      const newPoisonMultiplier = sum('poisonMultiplier');
      
      // Advanced Logic Summation/Max
      const newStrengthScaling = Math.max((c1.strengthScaling || 0), (c2.strengthScaling || 0));
      const newFatalEnergy = sum('fatalEnergy');
      const newFatalPermanentDamage = sum('fatalPermanentDamage');
      const newFatalMaxHp = sum('fatalMaxHp');
      const newDamagePerStrike = sum('damagePerStrike');
      const newDamagePerCardInHand = sum('damagePerCardInHand');
      const newDamagePerAttackPlayed = sum('damagePerAttackPlayed');
      const newDamagePerCardInDraw = sum('damagePerCardInDraw');

      // 4. Boolean/Flag Merging (OR)
      const newExhaust = c1.exhaust || c2.exhaust;
      const newInnate = c1.innate || c2.innate;
      const newEthereal = c1.unplayable || c2.unplayable;
      const newLifesteal = c1.lifesteal || c2.lifesteal;
      const newUpgradeHand = c1.upgradeHand || c2.upgradeHand;
      const newUpgradeDeck = c1.upgradeDeck || c2.upgradeDeck;
      const newDoubleBlock = c1.doubleBlock || c2.doubleBlock;
      const newDoubleStrength = c1.doubleStrength || c2.doubleStrength;
      const newCapture = c1.capture || c2.capture;

      // 5. Multi-hit Logic (Additive)
      const extraHits1 = c1.playCopies || 0;
      const extraHits2 = c2.playCopies || 0;
      const newExtraHits = extraHits1 + extraHits2;
      const newTotalHits = 1 + newExtraHits;

      // 6. Type & Target Logic
      let newType = c1.type;
      // Priority: Attack > Power > Skill > Status > Curse
      if (newDamage > 0) newType = CardType.ATTACK;
      else if (c1.type === CardType.POWER || c2.type === CardType.POWER) newType = CardType.POWER;
      else newType = CardType.SKILL;

      let newTarget = TargetType.ENEMY;
      if (c1.target === TargetType.ALL_ENEMIES || c2.target === TargetType.ALL_ENEMIES) newTarget = TargetType.ALL_ENEMIES;
      else if (c1.target === TargetType.RANDOM_ENEMY || c2.target === TargetType.RANDOM_ENEMY) newTarget = TargetType.RANDOM_ENEMY;
      else if (c1.target === TargetType.ENEMY || c2.target === TargetType.ENEMY) newTarget = TargetType.ENEMY;
      else newTarget = TargetType.SELF;
      
      // Override target if damage exists but was originally self-targeting
      if ((newDamage > 0 || newPoison > 0 || newWeak > 0 || newVulnerable > 0) && newTarget === TargetType.SELF) {
          newTarget = TargetType.ENEMY;
      }

      // 7. Dynamic Description Generation
      const parts: string[] = [];
      if (newDamage > 0) {
          let text = `${newDamage}ダメージ`;
          if (newTarget === TargetType.ALL_ENEMIES) text = `全体に${text}`;
          else if (newTarget === TargetType.RANDOM_ENEMY) text = `ランダムな敵に${text}`;
          else if (newTarget === TargetType.SELF) text = `自分に${text}`;
          
          if (newTotalHits > 1) {
              text += `を${newTotalHits}回`;
          }
          if (newStrengthScaling > 1) text += `(筋力${newStrengthScaling}倍)`;
          parts.push(text);
      }
      if (newBlock > 0) parts.push(`ブロック${newBlock}`);
      if (newPoison > 0) parts.push(`ドクドク${newPoison}`);
      if (newWeak > 0) parts.push(`へろへろ${newWeak}`);
      if (newVulnerable > 0) parts.push(`びくびく${newVulnerable}`);
      if (newStrength > 0) parts.push(`ムキムキ${newStrength}`);
      if (newPoisonMultiplier > 0) parts.push(`毒を${newPoisonMultiplier}倍`);
      if (newDraw > 0) parts.push(`${newDraw}枚引く`);
      if (newEnergy > 0) parts.push(`E${newEnergy}を得る`);
      if (newHeal > 0) parts.push(`HP${newHeal}回復`);
      if (newSelfDamage > 0) parts.push(`自分に${newSelfDamage}ダメージ`);
      
      // Special logic descriptions
      if (newDamagePerStrike > 0) parts.push(`デッキの攻撃カード数x${newDamagePerStrike}ダメージ追加`);
      if (newDamagePerCardInHand > 0) parts.push(`手札枚数x${newDamagePerCardInHand}ダメージ追加`);
      if (newDamagePerAttackPlayed > 0) parts.push(`使用攻撃数x${newDamagePerAttackPlayed}ダメージ追加`);
      if (newDamagePerCardInDraw > 0) parts.push(`山札枚数x${newDamagePerCardInDraw}ダメージ追加`);
      if (newLifesteal) parts.push("HP吸収");
      if (newDoubleBlock) parts.push("ブロック2倍");
      if (newDoubleStrength) parts.push("筋力2倍");
      if (newCapture) parts.push("捕獲");
      if (newUpgradeHand) parts.push("手札強化");
      if (newUpgradeDeck) parts.push("デッキ強化");
      
      let description = parts.join("。") + (parts.length > 0 ? "。" : "");
      if (parts.length === 0) description = "効果なし。";

      // 8. Visual Synthesis (Texture Ref)
      const shapeSource = c1.textureRef ? c1.textureRef.split('|')[0] : getShapeFromCard(c1);
      const colorSource = c2.textureRef ? (c2.textureRef.split('|')[1] || c2.textureRef.split('|')[0]) : c2.name;
      const newTextureRef = `${shapeSource}|${colorSource}|${newType}`;

      return {
          id: `synth-${Date.now()}-${Math.random()}`,
          name: newName,
          cost: newCost,
          type: newType,
          target: newTarget,
          description: description,
          rarity: 'SPECIAL',
          damage: newDamage || undefined,
          block: newBlock || undefined,
          draw: newDraw || undefined,
          energy: newEnergy || undefined,
          heal: newHeal || undefined,
          poison: newPoison || undefined,
          weak: newWeak || undefined,
          vulnerable: newVulnerable || undefined,
          strength: newStrength || undefined,
          poisonMultiplier: newPoisonMultiplier || undefined,
          selfDamage: newSelfDamage || undefined,
          playCopies: newExtraHits > 0 ? newExtraHits : undefined,
          exhaust: newExhaust,
          innate: newInnate,
          unplayable: newEthereal,
          // Advanced props
          strengthScaling: newStrengthScaling > 1 ? newStrengthScaling : undefined,
          lifesteal: newLifesteal,
          upgradeHand: newUpgradeHand,
          upgradeDeck: newUpgradeDeck,
          doubleBlock: newDoubleBlock,
          doubleStrength: newDoubleStrength,
          capture: newCapture,
          fatalEnergy: newFatalEnergy || undefined,
          fatalPermanentDamage: newFatalPermanentDamage || undefined,
          fatalMaxHp: newFatalMaxHp || undefined,
          damagePerStrike: newDamagePerStrike || undefined,
          damagePerCardInHand: newDamagePerCardInHand || undefined,
          damagePerAttackPlayed: newDamagePerAttackPlayed || undefined,
          damagePerCardInDraw: newDamagePerCardInDraw || undefined,
          
          textureRef: newTextureRef
      };
};
