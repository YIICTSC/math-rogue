import type { GameId } from '../card-club/catalog';
import type { TableGame } from '../traditional-games/model';
import type { Copy, Service } from './campaign';
import type { ItemId } from './catalog';

type Position = readonly [x: number, y: number];
type Patch = readonly [x: number, y: number, width: number, height: number];
export type FurniturePiece = readonly [art: string, x: number, y: number, width?: number, height?: number];

type RoomPlan = {
  floor?: 'stone';
  rugs?: readonly Patch[];
  walls?: readonly Patch[];
  furniture: readonly FurniturePiece[];
  resident: Position;
};
type ShopPlan = RoomPlan & { counter: Position; trial?: Position };

type Game =
  | { family: 'furniture'; game: 'connectfour' | 'reversi' }
  | { family: 'cards'; game: GameId }
  | { family: 'traditional'; game: TableGame };
export type HouseGame = Game & {
  name: Copy;
  invitation: Copy;
  table: FurniturePiece;
  reward: { gold: number; item: ItemId; quantity: number };
};
type HousePlan = RoomPlan & {
  name: Copy;
  portrait: string;
  keepsake: Position;
  game: HouseGame;
};

export const SHOP_INTERIORS: Record<Exclude<Service, 'home'>, ShopPlan> = {
  inn: {
    walls: [[5, 2, 1, 3], [11, 2, 1, 3]], rugs: [[7, 2, 3, 7]],
    furniture: [['bed', 2, 2, 2, 2], ['linenBasket', 2, 4], ['bed', 13, 2, 2, 2], ['wardrobe', 13, 5, 2],
      ['counter', 9, 5, 2], ['teaCart', 3, 6], ['floorlamp', 6, 2], ['shoeCabinet', 11, 8, 2]],
    counter: [10, 6], resident: [10, 4],
  },
  armory: {
    floor: 'stone', rugs: [[4, 3, 2, 5]],
    furniture: [['swordRack', 2, 2, 2], ['armorStand', 5, 2], ['armorStand', 8, 2], ['swordRack', 11, 2, 2],
      ['workbench', 12, 5, 2], ['anvil', 13, 6], ['counter', 4, 5, 3], ['archeryTarget', 2, 7], ['barrels', 13, 8]],
    counter: [5, 6], resident: [5, 4],
  },
  cards: {
    rugs: [[6, 4, 7, 3]],
    furniture: [['bookshelf', 2, 2, 2], ['desk', 5, 2, 2], ['memory', 9, 2, 2, 2], ['clock', 13, 2],
      ['counter', 10, 5, 3], ['table', 3, 5, 2, 2], ['chair', 5, 6], ['flowers', 7, 3], ['floorlamp', 13, 8]],
    counter: [11, 6], resident: [12, 4],
  },
  items: {
    rugs: [[2, 6, 4, 2]],
    furniture: [['herbCabinet', 2, 2, 2], ['barrels', 5, 2], ['barrels', 7, 2], ['herbCabinet', 12, 2, 2],
      ['counter', 3, 4, 3], ['picnicBasket', 2, 7], ['washBasin', 11, 6], ['barrels', 13, 8], ['plant', 10, 2]],
    counter: [4, 5], resident: [4, 3],
  },
  library: {
    floor: 'stone', rugs: [[6, 2, 3, 5]],
    furniture: [['bookshelf', 2, 2, 3], ['bookshelf', 2, 4, 3], ['bookshelf', 2, 6, 3],
      ['bookshelf', 11, 2, 3], ['bookshelf', 11, 4, 3], ['desk', 12, 6, 2], ['desk', 6, 3, 2],
      ['globe', 9, 2], ['floorlamp', 12, 8], ['candelabrum', 3, 8]],
    counter: [7, 4], resident: [7, 2],
  },
  guild: {
    floor: 'stone', rugs: [[9, 3, 5, 5]],
    furniture: [['swordRack', 2, 2, 2], ['counter', 4, 3, 2], ['archeryTarget', 11, 2],
      ['trainingDummy', 13, 2], ['trainingDummy', 13, 5], ['armorStand', 9, 2], ['barrels', 2, 7], ['coatRack', 5, 8]],
    counter: [5, 4], resident: [5, 2], trial: [12, 7],
  },
  forge: {
    floor: 'stone', walls: [[7, 2, 1, 2]], rugs: [[10, 6, 4, 2]],
    furniture: [['bakingOven', 2, 2, 2], ['workbench', 4, 2, 2], ['anvil', 4, 5], ['barrels', 2, 6],
      ['draftingTable', 11, 2, 2], ['treasureChest', 13, 3], ['counter', 10, 5, 3], ['floorlamp', 13, 8]],
    counter: [11, 6], resident: [11, 4],
  },
  tavern: {
    rugs: [[2, 4, 5, 4]],
    furniture: [['stove', 11, 2, 2], ['sink', 13, 2, 2], ['counter', 10, 4, 4], ['table', 3, 4, 2, 2],
      ['chair', 2, 5], ['chair', 5, 5], ['table', 4, 7, 2, 2], ['barrels', 2, 2], ['teaCart', 13, 7], ['candelabrum', 7, 2]],
    counter: [11, 5], resident: [11, 3],
  },
  notice: {
    rugs: [[7, 2, 3, 6]],
    furniture: [['mapCabinet', 6, 2, 3], ['painting', 9, 2], ['desk', 3, 4, 2], ['barrels', 2, 7],
      ['coatRack', 10, 8], ['wardrobe', 12, 2, 2], ['treasureChest', 13, 5], ['globe', 10, 3], ['lantern', 3, 2]],
    counter: [8, 3], resident: [4, 3],
  },
};

export const HOUSE_INTERIORS: Record<string, HousePlan> = {
  '0:0': {
    name: ['根っこの家', 'Root House'], portrait: 'chronicle-verdant',
    walls: [[6, 2, 1, 2]], rugs: [[9, 4, 5, 4]],
    furniture: [['bed', 2, 2, 2, 2], ['wardrobe', 4, 2, 2], ['fireplace', 2, 5, 2],
      ['rockingChair', 4, 6], ['plant', 13, 2], ['stove', 8, 2, 2], ['chair', 13, 6], ['flowers', 3, 8]],
    resident: [12, 4], keepsake: [4, 4],
    game: { family: 'furniture', game: 'connectfour', name: ['四目並べ', 'Connect Four'], table: ['connectfour', 10, 5, 2, 2],
      invitation: ['この輪っか、庭の木で作ったんだ。旅の前に四目並べを一局どう？', 'I made these rings from our garden tree. Fancy a game of Connect Four before you go?'],
      reward: { gold: 24, item: 'tonic', quantity: 2 } },
  },
  '1:0': {
    name: ['置時計の家', 'Clock House'], portrait: 'chronicle-clockwork', floor: 'stone',
    walls: [[10, 2, 1, 3]], rugs: [[3, 5, 4, 4]],
    furniture: [['clock', 2, 2], ['workbench', 4, 2, 2], ['orrery', 7, 2], ['bed', 12, 2, 2, 2],
      ['wardrobe', 12, 5, 2], ['chair', 3, 6], ['hourglass', 6, 4], ['desk', 11, 7, 2]],
    resident: [6, 6], keepsake: [13, 6],
    game: { family: 'traditional', game: 'austrian-draw', name: ['オーストリア式ドミノ', 'Austrian Draw Dominoes'], table: ['table', 4, 6, 2, 2],
      invitation: ['巻き直した時計が鳴るまで、ドミノを並べない？ 牌は父の作業台から出てきたものなんだ。', 'Dominoes while we wait for the clock to chime? I found the set in my father’s workbench.'],
      reward: { gold: 36, item: 'salve', quantity: 2 } },
  },
  '2:0': {
    name: ['窓辺の書斎', 'Window Study'], portrait: 'chronicle-puzzle',
    walls: [[11, 2, 1, 3]], rugs: [[9, 5, 5, 4]],
    furniture: [['bookshelf', 2, 2, 3], ['stainedGlass', 6, 1, 2], ['desk', 5, 3, 2], ['floorlamp', 7, 3],
      ['rockingChair', 3, 6], ['bed', 12, 2, 2, 2], ['crystalDisplay', 13, 4], ['chair', 13, 8]],
    resident: [13, 6], keepsake: [4, 5],
    game: { family: 'cards', game: 'crazyeight', name: ['クレイジーエイト', 'Crazy Eights'], table: ['memory', 10, 6, 2, 2],
      invitation: ['本を閉じて、札を開こうか。八の札だけは、家の精霊にも内緒ね。', 'Let’s close the book and deal some cards. Keep your eights a secret, even from the house spirit.'],
      reward: { gold: 42, item: 'tonic', quantity: 3 } },
  },
  '2:3': {
    name: ['橋畔の灯の家', 'Bridge-Lamp House'], portrait: 'chronicle-constellation',
    walls: [[11, 2, 1, 2], [7, 4, 1, 2]], rugs: [[3, 5, 4, 3], [9, 3, 2, 6]],
    furniture: [['candelabrum', 2, 2], ['lantern', 4, 2], ['bed', 12, 2, 2, 2], ['sink', 12, 5, 2],
      ['teaCart', 11, 7], ['floorlamp', 5, 3], ['chair', 3, 7], ['plant', 13, 8]],
    resident: [5, 5], keepsake: [13, 6],
    game: { family: 'cards', game: 'royalcassino', name: ['ロイヤルカシノ', 'Royal Casino'], table: ['memory', 4, 6, 2, 2],
      invitation: ['橋の灯りを数えるうちに、足し算が得意になったの。ロイヤルカシノで腕試ししない？', 'Counting the bridge lamps made me good at sums. Want to try me at Royal Casino?'],
      reward: { gold: 50, item: 'dew', quantity: 1 } },
  },
  '3:0': {
    name: ['舟窓の家', 'Porthole House'], portrait: 'chronicle-story',
    walls: [[6, 2, 1, 3]], rugs: [[9, 3, 5, 5]],
    furniture: [['painting', 3, 1, 2], ['bed', 2, 2, 2, 2], ['aquarium', 8, 2, 2], ['globe', 12, 2],
      ['barrels', 2, 6], ['sink', 3, 6, 2], ['chair', 13, 5], ['mapCabinet', 11, 8, 2]],
    resident: [12, 4], keepsake: [4, 4],
    game: { family: 'traditional', game: 'crokinole', name: ['クロキノール', 'Crokinole'], table: ['table', 10, 5, 2, 2],
      invitation: ['波のないところで円盤を弾くのは、案外むずかしいよ。クロキノールで勝負しよう。', 'Sliding a disc with no waves to help is harder than it sounds. How about Crokinole?'],
      reward: { gold: 56, item: 'oil', quantity: 2 } },
  },
  '4:0': {
    name: ['雲綿の織り部屋', 'Cloud-Cotton House'], portrait: 'chronicle-cards',
    rugs: [[3, 3, 5, 5], [10, 5, 4, 3]],
    furniture: [['sewingMachine', 3, 2, 2], ['linenBasket', 2, 4], ['foldingScreen', 9, 2, 2],
      ['futon', 12, 2, 2, 2], ['sofa', 12, 5, 2], ['plushSheep', 13, 7], ['lantern', 6, 1],
      ['chair', 3, 6], ['rockingChair', 10, 7]],
    resident: [6, 4], keepsake: [13, 4],
    game: { family: 'furniture', game: 'reversi', name: ['リバーシ', 'Reversi'], table: ['reversi', 4, 5, 2, 2],
      invitation: ['雲綿を干したら休憩。表も裏も違う色の石で、リバーシをしようよ。', 'The cotton is out to dry. Join me for Reversi with these two-colored stones?'],
      reward: { gold: 65, item: 'salve', quantity: 3 } },
  },
  '5:0': {
    name: ['継ぎ木の家', 'Rebuilt House'], portrait: 'chronicle-foundry', floor: 'stone',
    walls: [[5, 2, 1, 3], [10, 7, 1, 2]], rugs: [[7, 3, 6, 4]],
    furniture: [['futon', 2, 2, 2, 2], ['stove', 7, 2, 2], ['desk', 12, 2, 2], ['workbench', 2, 6, 2],
      ['plant', 6, 5], ['chair', 11, 6], ['painting', 13, 7], ['fireplace', 12, 8, 2]],
    resident: [10, 4], keepsake: [3, 5],
    game: { family: 'traditional', game: 'peeper', name: ['ピーパー', 'Peeper'], table: ['table', 8, 5, 2, 2],
      invitation: ['廃材で作ったこの机、やっとがたつきが直ったよ。試しにピーパーを一局つき合って。', 'I finally stopped this salvaged table from wobbling. Try it out with a round of Peeper?'],
      reward: { gold: 72, item: 'dew', quantity: 2 } },
  },
  '6:0': {
    name: ['古地図の家', 'House of Old Charts'], portrait: 'chronicle-archive',
    walls: [[11, 2, 1, 3]], rugs: [[3, 4, 5, 4]],
    furniture: [['mapCabinet', 2, 2, 2], ['painting', 5, 2], ['globe', 7, 2], ['draftingTable', 9, 3, 2],
      ['bed', 13, 2, 2, 2], ['bookshelf', 12, 6, 3], ['chair', 3, 6], ['telescope', 12, 8], ['lantern', 9, 8]],
    resident: [6, 5], keepsake: [13, 5],
    game: { family: 'cards', game: 'ginrummy', name: ['ジンラミー', 'Gin Rummy'], table: ['memory', 4, 5, 2, 2],
      invitation: ['地図の断片をつなぐのと、ラミーで札をそろえるのは似ているよ。手を休めて一局どう？', 'Piecing maps together feels like building sets in rummy. Put the maps aside and play a hand with me?'],
      reward: { gold: 84, item: 'dew', quantity: 2 } },
  },
};
