import raw from './voiceCatalog.json?raw';
export interface TheaterVoice {id:string;actor:string;path:string;source:string;text:string;label:string;duration:number;}
// Keep the large generated recording index out of TypeScript's inferred JSON types.
const voices: TheaterVoice[]=JSON.parse(raw);
export default voices;
