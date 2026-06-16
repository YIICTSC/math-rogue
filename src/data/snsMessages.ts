import { ROMANCE_TARGETS } from './romanceTargets';

export const SNS_MESSAGES = ROMANCE_TARGETS.flatMap((target) => [
  { id: `${target.id}_01`, targetId: target.id, requiredAffection: 0, text: `${target.name}: 今日は会えてよかった。無理はするなよ。` },
  { id: `${target.id}_02`, targetId: target.id, requiredAffection: 40, text: `${target.name}: 次の勉強、よければ一緒にやらないか？` },
  { id: `${target.id}_03`, targetId: target.id, requiredAffection: 80, text: `${target.name}: 話したいことがある。放課後、少し時間をくれる？` },
]);
