export type AnimalMoment = {
  pose: "greet" | "roll" | "sleep" | "hop";
  until: number;
};
export function animalPose(
  animal: { id: string; bond: number; moment?: AnimalMoment },
  time: number,
) {
  if (animal.moment && animal.moment.until > time) return animal.moment.pose;
  const n = Math.floor(time / 9) + animal.id.length;
  return animal.bond < 20
    ? "sleep"
    : (["greet", "sleep", "greet", "hop", "roll", "greet"] as const)[n % 6];
}
