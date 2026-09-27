import type { AssignmentPayload } from "../types";

export interface RpgAdventureSetup {
  visualTheme: "elementary" | "high-school" | "magic";
  mode: string;
  modePool?: string[];
  answerMode: "CHOICE" | "INPUT" | "WRITING";
  difficultyLevel: number;
  assignment?: AssignmentPayload;
}

export function isRpgAdventureSetup(
  value: unknown,
): value is RpgAdventureSetup {
  if (!value || typeof value !== "object") return false;
  const setup = value as Partial<RpgAdventureSetup>;
  return (
    ["elementary", "high-school", "magic"].includes(setup.visualTheme || "") &&
    typeof setup.mode === "string" &&
    (setup.modePool === undefined ||
      (Array.isArray(setup.modePool) &&
        setup.modePool.every((mode) => typeof mode === "string"))) &&
    ["CHOICE", "INPUT", "WRITING"].includes(setup.answerMode || "") &&
    Number.isInteger(setup.difficultyLevel) &&
    setup.difficultyLevel > 0
  );
}

export function cloneRpgAdventureSetup(setup: RpgAdventureSetup) {
  return {
    ...setup,
    ...(setup.modePool ? { modePool: [...setup.modePool] } : {}),
    ...(setup.assignment
      ? {
          assignment: {
            ...setup.assignment,
            units: setup.assignment.units.map((unit) => ({
              ...unit,
              modes: [...unit.modes],
              ...(unit.filters
                ? {
                    filters: {
                      ...unit.filters,
                      values: [...unit.filters.values],
                    },
                  }
                : unit.filters === null
                  ? { filters: null }
                  : {}),
            })),
            customProblems: setup.assignment.customProblems.map((problem) => ({
              ...problem,
              options: [...problem.options],
            })),
            ...(setup.assignment.managementPortal
              ? { managementPortal: { ...setup.assignment.managementPortal } }
              : {}),
          },
        }
      : {}),
  };
}
