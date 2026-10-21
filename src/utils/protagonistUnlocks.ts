import { storageService } from "../services/storageService";
import type { ProtagonistId } from "../three/protagonistCatalog";

// Same display order as CHARACTERS / getThemedCharacters and the two magic
// gender tabs in CharacterSelectionScreen. Each tab starts with two travelers.
const school = [
  "warrior",
  "caretaker",
  "assassin",
  "dodgeball",
  "bard",
  "librarian",
  "chef",
  "gardener",
  "mage",
];
const female = [
  "akari",
  "shizuku",
  "hiyori",
  "rei",
  "madoka",
  "koharu",
  "mirai",
  "sera",
  "tsubasa",
];
const male = [
  "ren",
  "soma",
  "minato",
  "riku",
  "yamato",
  "leon",
  "elliot",
  "sakuya",
];

export function protagonistUnlockRequirement(
  id: string,
): { theme: "elementary" | "high-school" | "magic"; clears: number } | null {
  const theme = id.startsWith("elementary-")
    ? "elementary"
    : id.startsWith("high-school-")
      ? "high-school"
      : id.startsWith("magic-")
        ? "magic"
        : null;
  if (!theme) return null;
  const name = id.slice(theme.length + 1);
  const order =
    theme === "magic" ? (male.includes(name) ? male : female) : school;
  const index = order.indexOf(name);
  return index < 0 ? null : { theme, clears: Math.max(0, index - 1) };
}

export function isProtagonistUnlocked(id: string): id is ProtagonistId {
  const requirement = protagonistUnlockRequirement(id);
  return (
    !!requirement &&
    storageService.getThemeClearCount(requirement.theme) >= requirement.clears
  );
}
