import { getThemedEndingVariants } from '../src/data/themedEndingSequences.ts';

const characters = ['WARRIOR', 'CARETAKER', 'ASSASSIN', 'DODGEBALL', 'BARD', 'LIBRARIAN', 'CHEF', 'GARDENER', 'MAGE'];
for (const theme of ['elementary', 'high-school']) {
  const firstPages = [];
  for (const characterId of characters) {
    const variants = getThemedEndingVariants(theme, characterId, characterId);
    if (variants.length !== 5 || variants.some((variant) => variant.pages.length !== 3)) {
      throw new Error(`${theme}/${characterId}: ending page count is incomplete`);
    }
    for (const variant of variants) {
      const [first, second, third] = variant.pages;
      if (!first.text || !first.textHiragana || !first.textEnglish || !second.text || !third.text) {
        throw new Error(`${theme}/${characterId}/${variant.id}: localized copy is incomplete`);
      }
      firstPages.push(first.text);
    }
  }
  if (new Set(firstPages).size !== characters.length * 5) {
    throw new Error(`${theme}: character/tone ending scenes are not unique`);
  }
}

console.log('Themed ending copy verification passed.');
