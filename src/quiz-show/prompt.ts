import type { ShowView } from './types';
/** Keep rule/category instructions in settings; preserve the question's meaning. */
export function onAirPrompt(round: NonNullable<ShowView['round']>): string {
  if (!['CONSENSUS', 'MAJORITY', 'WOLF'].includes(round.mode)) return round.prompt;
  const prompt = round.prompt;
  const example = /^(.+)：代表を一つだけ(?:書こう|言う)。$/.exec(prompt);
  if (example) return `${example[1].replaceAll('食べ物', 'たべもの')}といえば？`;
  const hira = /^(.+)：だいひょうをひとつだけ。$/.exec(prompt);
  if (hira) return `${hira[1]}といえば？`;
  const english = /^(.+): Name one classic example\.$/.exec(prompt);
  if (english) return `What comes to mind for ${english[1]}?`;
  const exciting = /^(.+)：一番わくわくするものを一つ。$/.exec(prompt);
  if (exciting) return `${exciting[1]}で一番わくわくするのは？`;
  const adventure = /^(.+)：冒険に役立ちそうなものを一つ。$/.exec(prompt);
  if (adventure) return `冒険に役立ちそうな${adventure[1]}は？`;
  const association = /^「([^」]+)」で連想をそろえるなら？$/.exec(prompt);
  if (association) return `${association[1]}といえば？`;
  return prompt;
}
