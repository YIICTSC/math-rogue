import type { KochoEnemyVoiceAction } from './enemyVoices';

export interface KochoVoiceEnemy {
    id: string;
    name: string;
    hp: number;
    bossPhase?: number;
    intent?: { type: string; timer: number };
}
export interface KochoEnemyVoiceEvent { name: string; action: KochoEnemyVoiceAction; priority: number }

/** Derive one committed event per update, never from speculative state updaters. */
export function selectKochoEnemyVoice(previous: KochoVoiceEnemy[], current: KochoVoiceEnemy[], turnAdvanced: boolean): KochoEnemyVoiceEvent | undefined {
    const events: KochoEnemyVoiceEvent[] = [];
    for (const enemy of current) {
        const before = previous.find(e => e.id === enemy.id);
        if (enemy.hp > 0 && (!before || before.hp <= 0 || before.name !== enemy.name)) {
            events.push({name: enemy.name, action: 'spawn', priority: enemy.bossPhase ? 2.9 : 2.5});
        } else if (before && before.hp > 0 && enemy.hp > 0 && turnAdvanced && before.intent && before.intent.timer <= 1 && enemy.intent?.type === 'WAIT') {
            const action = before.intent.type === 'SPECIAL' || before.intent.type === 'SUMMON' ? 'skill'
                : before.intent.type === 'ATTACK' ? 'attack' : undefined;
            if (action) events.push({name: enemy.name, action, priority: action === 'skill' ? 2.8 : 2.5});
        }
        if (before && before.hp > enemy.hp && enemy.hp > 0) events.push({name: enemy.name, action: 'damage', priority: 0.5});
    }
    for (const before of previous) {
        const after = current.find(e => e.id === before.id);
        if (before.hp > 0 && (!after || after.hp <= 0)) events.push({name: before.name, action: 'defeat', priority: 0.75});
    }
    return events.sort((a,b) => b.priority - a.priority)[0];
}
