export type AnimalMoment = {
  pose: "greet" | "roll" | "sleep" | "hop" | "walk" | "run" | "eat" | "drink" | "groom" | "sit" | "paw" | "bow";
  until: number;
};
export function animalPose(
  animal: { id: string; kind?:string; bond: number; moment?: AnimalMoment },
  time: number,
) {
  if (animal.moment && animal.moment.until > time) return animal.moment.pose;
  const n = Math.floor(time / 9) + animal.id.length;
  if(animal.bond>=20&&n%6===4&&animal.kind&&/cat|tabby|calico/.test(animal.kind))return 'groom';
  return animal.bond < 20
    ? "sleep"
    : (["greet", "sleep", "greet", "hop", "roll", "greet"] as const)[n % 6];
}
