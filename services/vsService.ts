
import { Player } from '../types';
import { CARDS_LIBRARY, RELIC_LIBRARY, CHARACTERS } from '../constants';

/**
 * プレイヤーデータをQRコード用の超短縮文字列に変換
 */
export const encodePlayerData = (player: Player): string => {
    try {
        const data = {
            i: player.id || 'WARRIOR', // character id
            m: player.maxHp,            // max hp
            c: player.currentHp,        // current hp
            s: player.strength,         // strength
            r: player.relics.map(r => r.id), // relic ids
            // カード名をライブラリのキーに変換して圧縮
            d: player.deck.map(c => {
                const key = Object.keys(CARDS_LIBRARY).find(k => CARDS_LIBRARY[k].name === c.name) || 'STRIKE';
                return { k: key, u: c.upgraded ? 1 : 0 };
            })
        };
        
        const json = JSON.stringify(data);
        
        // Unicode対応のBase64エンコード (TextEncoderを使用)
        const uint8 = new TextEncoder().encode(json);
        let binString = "";
        for (let i = 0; i < uint8.length; i++) {
            binString += String.fromCharCode(uint8[i]);
        }
        return btoa(binString);
    } catch (e) {
        console.error("Encoding failed", e);
        return "";
    }
};

/**
 * 文字列からプレイヤーデータを復元
 */
export const decodePlayerData = (encoded: string): Player | null => {
    try {
        // Unicode対応のBase64デコード
        const binString = atob(encoded);
        const uint8 = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
            uint8[i] = binString.charCodeAt(i);
        }
        const json = JSON.parse(new TextDecoder().decode(uint8));
        
        const charId = json.i || 'WARRIOR';
        const charTemplate = CHARACTERS.find(c => c.id === charId) || CHARACTERS[0];

        // キーからデッキを復元
        const deck = json.d.map((item: { k: string, u: number }) => {
            const template = CARDS_LIBRARY[item.k];
            if (!template) return null;
            let card = { ...template, id: `vs-${Math.random()}` };
            if (item.u === 1) {
                card.upgraded = true;
                if (card.damage) card.damage = Math.floor(card.damage * 1.3) + 2;
                if (card.block) card.block = Math.floor(card.block * 1.3) + 2;
            }
            return card;
        }).filter((c: any) => c !== null);

        const relics = json.r.map((rid: string) => {
            return RELIC_LIBRARY[rid];
        }).filter((r: any) => r !== undefined);

        return {
            id: charId,
            maxHp: json.m,
            currentHp: json.c,
            maxEnergy: 3,
            currentEnergy: 3,
            block: 0,
            strength: json.s,
            gold: 0,
            deck: deck,
            hand: [],
            discardPile: [],
            drawPile: [],
            relics: relics,
            potions: [],
            imageData: charTemplate.imageData,
            powers: {},
            echoes: 0,
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0,
            typesPlayedThisTurn: [],
            relicCounters: {},
            turnFlags: {},
            floatingText: null,
            nextTurnEnergy: 0,
            nextTurnDraw: 0
        };
    } catch (e) {
        console.error("Failed to decode player data", e);
        return null;
    }
};
