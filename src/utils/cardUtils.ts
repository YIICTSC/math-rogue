

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
    if (n.includes('目') || n.includes('視') || n.includes('予見')) return 'EYE';
    
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

    // Power / Effect scaling
    // if (newCard.magicNumber) newCard.magicNumber += 1; // Generic hook if added later
    
    if (newCard.strength) newCard.strength += 1;
    if (newCard.draw) newCard.draw += 1;
    if (newCard.energy) newCard.energy += 1;
    if (newCard.vulnerable) newCard.vulnerable += 1;
    if (newCard.weak) newCard.weak += 1;
    if (newCard.poison) newCard.poison += 2;
    if (newCard.poisonMultiplier) newCard.poisonMultiplier += 1;
    
    if (newCard.applyPower) {
        newCard.applyPower = { ...newCard.applyPower, amount: newCard.applyPower.amount + 1 };
    }
    if (newCard.addCardToHand) {
        newCard.addCardToHand = { ...newCard.addCardToHand, count: newCard.addCardToHand.count + 1 };
    }

    if (!hasDamage && !hasBlock && card.cost > 0) {
        newCard.cost = Math.max(0, card.cost - 1);
    }

    // Specific Card Upgrade Logic overrides
    if (card.name === 'ボディスラム' || card.name === 'BODY_SLAM') newCard.cost = 0; 
    if (card.name === '限界突破' || card.name === 'LIMIT_BREAK') newCard.exhaust = false;
    if (card.name === '触媒' || card.name === 'CATALYST') newCard.poisonMultiplier = 3;
    
    return newCard;
};

export const synthesizeCards = (c1: Card, c2: Card): Card => {
      // 1. Name Synthesis
      const len1 = Math.floor(Math.random() * 3) + 2; 
      const len2 = Math.floor(Math.random() * 3) + 2; 
      const part1 = c1.name.substring(0, Math.min(len1, c1.name.length));
      const part2 = c2.name.substring(Math.max(0, c2.name.length - len2));
      const newName = part1 + part2;
      
      // 2. Cost Logic (Max of both)
      const newCost = Math.max(c1.cost, c2.cost);
      
      // 3. Helper for Summation
      const sum = (k: keyof Card) => ((c1[k] as number) || 0) + ((c2[k] as number) || 0);
      
      // Basic Stats
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
      // Strength Scaling: If both have scaling, we sum the effectiveness (minus base 1). e.g. 3x + 1x -> 3x. 3x + 3x -> 5x? Let's simply MAX for safety or Additive.
      // Let's make it additive for fun: (Scale1 - 1) + (Scale2 - 1) + 1. Default scale is 1.
      const s1 = c1.strengthScaling || 1;
      const s2 = c2.strengthScaling || 1;
      const newStrengthScaling = (s1 - 1) + (s2 - 1) + 1;

      const newFatalEnergy = sum('fatalEnergy');
      const newFatalPermanentDamage = sum('fatalPermanentDamage');
      const newFatalMaxHp = sum('fatalMaxHp');
      
      // Scaling Damages
      const newDamagePerStrike = sum('damagePerStrike');
      const newDamagePerCardInHand = sum('damagePerCardInHand');
      const newDamagePerAttackPlayed = sum('damagePerAttackPlayed');
      const newDamagePerCardInDraw = sum('damagePerCardInDraw');

      // Next Turn Effects
      const newNextTurnEnergy = sum('nextTurnEnergy');
      const newNextTurnDraw = sum('nextTurnDraw');

      // Prompts
      const newPromptsDiscard = sum('promptsDiscard');
      const newPromptsCopy = sum('promptsCopy');
      // promptsExhaust is special (99 = hand). If either is 99, result is 99. Else sum.
      const newPromptsExhaust = (c1.promptsExhaust === 99 || c2.promptsExhaust === 99) ? 99 : sum('promptsExhaust');

      // 4. Boolean/Flag Merging (OR)
      const newExhaust = c1.exhaust || c2.exhaust;
      const newInnate = c1.innate || c2.innate;
      const newEthereal = c1.unplayable || c2.unplayable; // 'unplayable' often maps to Ethereal/Curse logic in this app
      const newLifesteal = c1.lifesteal || c2.lifesteal;
      const newUpgradeHand = c1.upgradeHand || c2.upgradeHand;
      const newUpgradeDeck = c1.upgradeDeck || c2.upgradeDeck;
      const newDoubleBlock = c1.doubleBlock || c2.doubleBlock;
      const newDoubleStrength = c1.doubleStrength || c2.doubleStrength;
      const newCapture = c1.capture || c2.capture;
      const newDamageBasedOnBlock = c1.damageBasedOnBlock || c2.damageBasedOnBlock;

      // 5. Multi-hit Logic (Additive)
      const extraHits1 = c1.playCopies || 0;
      const extraHits2 = c2.playCopies || 0;
      const newExtraHits = extraHits1 + extraHits2;
      const newTotalHits = 1 + newExtraHits;

      // 6. Object Merging (Power, Card Gen)
      // applyPower: If IDs match, sum amounts. If different, prioritize Power types, else C1.
      let newApplyPower = undefined;
      if (c1.applyPower || c2.applyPower) {
          if (c1.applyPower && c2.applyPower) {
              if (c1.applyPower.id === c2.applyPower.id) {
                  newApplyPower = { id: c1.applyPower.id, amount: c1.applyPower.amount + c2.applyPower.amount };
              } else {
                  // Conflict: Pick the one from the POWER card, or the one with higher amount, or just C1.
                  // Strategy: Prioritize the one that isn't just a generic debuff if possible?
                  // Simple strategy: C1 wins unless C2 is a POWER card and C1 isn't.
                  if (c2.type === CardType.POWER && c1.type !== CardType.POWER) newApplyPower = c2.applyPower;
                  else newApplyPower = c1.applyPower;
              }
          } else {
              newApplyPower = c1.applyPower || c2.applyPower;
          }
      }

      // addCardToHand (Blade Dance etc)
      let newAddCardToHand = undefined;
      if (c1.addCardToHand || c2.addCardToHand) {
          if (c1.addCardToHand && c2.addCardToHand && c1.addCardToHand.cardName === c2.addCardToHand.cardName) {
              newAddCardToHand = { 
                  ...c1.addCardToHand, 
                  count: c1.addCardToHand.count + c2.addCardToHand.count 
              };
          } else {
              // Priority: C1
              newAddCardToHand = c1.addCardToHand || c2.addCardToHand;
          }
      }

      const newAddCardToDraw = c1.addCardToDraw || c2.addCardToDraw; // Simplified: No sum for draw pile adding yet to avoid clutter
      const newAddCardToDiscard = c1.addCardToDiscard || c2.addCardToDiscard;

      // Merge Play Condition
      // If both have one, prioritize DRAW_PILE_EMPTY as it is usually associated with stronger effects (Grand Finale vs Clash)
      let newPlayCondition = undefined;
      if (c1.playCondition === 'DRAW_PILE_EMPTY' || c2.playCondition === 'DRAW_PILE_EMPTY') {
          newPlayCondition = 'DRAW_PILE_EMPTY';
      } else {
          newPlayCondition = c1.playCondition || c2.playCondition;
      }

      // 7. Type & Target Logic
      let newType = c1.type;
      // Priority: Attack > Power > Skill > Status > Curse
      if (newDamage > 0) newType = CardType.ATTACK;
      else if (c1.type === CardType.POWER || c2.type === CardType.POWER) newType = CardType.POWER;
      else newType = CardType.SKILL;

      let newTarget = TargetType.ENEMY;
      // Priority: All Enemies > Random > Enemy > Self
      if (c1.target === TargetType.ALL_ENEMIES || c2.target === TargetType.ALL_ENEMIES) newTarget = TargetType.ALL_ENEMIES;
      else if (c1.target === TargetType.RANDOM_ENEMY || c2.target === TargetType.RANDOM_ENEMY) newTarget = TargetType.RANDOM_ENEMY;
      else if (c1.target === TargetType.ENEMY || c2.target === TargetType.ENEMY) newTarget = TargetType.ENEMY;
      else newTarget = TargetType.SELF;
      
      // Override target if damage/debuff exists but was originally self-targeting
      if ((newDamage > 0 || newPoison > 0 || newWeak > 0 || newVulnerable > 0) && newTarget === TargetType.SELF) {
          newTarget = TargetType.ENEMY;
      }

      // 8. Dynamic Description Generation
      const parts: string[] = [];
      
      if (newDamage > 0) {
          let text = `${newDamage}ダメージ`;
          if (newTarget === TargetType.ALL_ENEMIES) text = `全体に${text}`;
          else if (newTarget === TargetType.RANDOM_ENEMY) text = `ランダムな敵に${text}`;
          else if (newTarget === TargetType.SELF) text = `自分に${text}`; // Reflection?
          
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
      
      // Advanced Logic Descriptions
      if (newDamageBasedOnBlock) parts.push("ブロック値分のダメージ");
      if (newDamagePerStrike > 0) parts.push(`デッキの攻撃カード数x${newDamagePerStrike}ダメージ追加`);
      if (newDamagePerCardInHand > 0) parts.push(`手札枚数x${newDamagePerCardInHand}ダメージ追加`);
      if (newDamagePerAttackPlayed > 0) parts.push(`使用攻撃数x${newDamagePerAttackPlayed}ダメージ追加`);
      if (newDamagePerCardInDraw > 0) parts.push(`山札枚数x${newDamagePerCardInDraw}ダメージ追加`);
      
      if (newLifesteal) parts.push("HP吸収");
      if (newDoubleBlock) parts.push("ブロック2倍");
      if (newDoubleStrength) parts.push("筋力2倍");
      if (newCapture) parts.push("捕獲");
      if (newUpgradeHand) parts.push("手札全体を強化");
      if (newUpgradeDeck) parts.push("デッキ全体を強化");
      
      // Generation / Actions
      if (newAddCardToHand) parts.push(`${newAddCardToHand.cardName}を${newAddCardToHand.count}枚手札に加える`);
      if (newAddCardToDraw) parts.push(`${newAddCardToDraw.cardName}を山札に加える`);
      if (newAddCardToDiscard) parts.push(`${newAddCardToDiscard.cardName}を捨て札に加える`);
      
      if (newPromptsDiscard > 0) parts.push(`手札を${newPromptsDiscard}枚捨てる`);
      if (newPromptsExhaust > 0) parts.push(newPromptsExhaust === 99 ? "手札を全て廃棄" : `手札を${newPromptsExhaust}枚廃棄`);
      if (newPromptsCopy > 0) parts.push("カードをコピー");
      
      // Fatal Effects
      if (newFatalEnergy > 0) parts.push(`撃破時E${newFatalEnergy}`);
      if (newFatalPermanentDamage > 0) parts.push(`撃破時威力+${newFatalPermanentDamage}`);
      if (newFatalMaxHp > 0) parts.push(`撃破時最大HP+${newFatalMaxHp}`);

      // Next Turn
      if (newNextTurnEnergy > 0) parts.push(`次ターンE+${newNextTurnEnergy}`);
      if (newNextTurnDraw > 0) parts.push(`次ターン${newNextTurnDraw}枚ドロー`);

      // Power
      if (newApplyPower) {
          // Try to map ID to readable name if possible, or generic
          const powerNameMap: Record<string, string> = {
              'DEMON_FORM': '悪魔化', 'ECHO_FORM': '反響', 'BARRICADE': 'バリケード',
              'CORRUPTION': '堕落', 'FEEL_NO_PAIN': '無痛', 'RUPTURE': '破裂',
              'EVOLVE': '進化', 'NOXIOUS_FUMES': '有毒ガス', 'AFTER_IMAGE': '残像',
              'THOUSAND_CUTS': '千切れ', 'TOOLS_OF_THE_TRADE': '商売道具', 'ENVENOM': '猛毒',
              'STATIC_DISCHARGE': '静電放電', 'BUFFER': 'バッファー', 'CREATIVE_AI': '創造的AI',
              'DEVA_FORM': 'デバ化', 'MASTER_REALITY': '真なる理', 'INTANGIBLE': '無敵',
              'ARTIFACT': 'アーティファクト', 'ACCURACY': '精度上昇', 'INFINITE_BLADES': '無限の刃'
          };
          const pName = powerNameMap[newApplyPower.id] || newApplyPower.id;
          parts.push(`${pName}${newApplyPower.amount}を得る`);
      }

      // Add condition description
      if (newPlayCondition === 'DRAW_PILE_EMPTY') parts.push("山札0の時のみ");
      if (newPlayCondition === 'HAND_ONLY_ATTACKS') parts.push("手札が攻撃のみの時");

      if (newExhaust) parts.push("廃棄");
      if (newInnate) parts.push("天賦");
      if (newEthereal) parts.push("虚無");

      let description = parts.join("。") + (parts.length > 0 ? "。" : "");
      if (parts.length === 0) description = "効果なし。";

      // 9. Visual Synthesis (Texture Ref)
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
          
          // Basic
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
          
          // Flags
          exhaust: newExhaust,
          innate: newInnate,
          unplayable: newEthereal,
          playCondition: newPlayCondition as any,
          
          // Advanced props
          strengthScaling: newStrengthScaling > 1 ? newStrengthScaling : undefined,
          lifesteal: newLifesteal,
          upgradeHand: newUpgradeHand,
          upgradeDeck: newUpgradeDeck,
          doubleBlock: newDoubleBlock,
          doubleStrength: newDoubleStrength,
          capture: newCapture,
          damageBasedOnBlock: newDamageBasedOnBlock,
          applyPower: newApplyPower,
          
          // Generation
          addCardToHand: newAddCardToHand,
          addCardToDraw: newAddCardToDraw,
          addCardToDiscard: newAddCardToDiscard,
          
          // Complex / Fatal
          fatalEnergy: newFatalEnergy || undefined,
          fatalPermanentDamage: newFatalPermanentDamage || undefined,
          fatalMaxHp: newFatalMaxHp || undefined,
          damagePerStrike: newDamagePerStrike || undefined,
          damagePerCardInHand: newDamagePerCardInHand || undefined,
          damagePerAttackPlayed: newDamagePerAttackPlayed || undefined,
          damagePerCardInDraw: newDamagePerCardInDraw || undefined,
          
          // Prompts
          promptsDiscard: newPromptsDiscard || undefined,
          promptsCopy: newPromptsCopy || undefined,
          promptsExhaust: newPromptsExhaust || undefined,

          // Next Turn
          nextTurnEnergy: newNextTurnEnergy || undefined,
          nextTurnDraw: newNextTurnDraw || undefined,
          
          textureRef: newTextureRef
      };
};