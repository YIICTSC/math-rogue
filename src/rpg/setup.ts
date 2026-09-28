import type { AssignmentPayload } from "../types";

export interface RpgAdventureSetup {
  visualTheme: "elementary" | "high-school" | "magic";
  mode: string;
  modePool?: string[];
  answerMode: "CHOICE" | "INPUT" | "WRITING";
  difficultyLevel: number;
  assignment?: AssignmentPayload;
}

/** Normalize peer payloads before applying host settings on another device. */
export function normalizeRpgAdventureSetup(
  value: unknown,
): RpgAdventureSetup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const setup = value as Partial<RpgAdventureSetup> & {
    visualTheme?: unknown;
    mode?: unknown;
    modePool?: unknown;
    answerMode?: unknown;
    difficultyLevel?: unknown;
    assignment?: unknown;
  };
  const theme =
    typeof setup.visualTheme === "string"
      ? setup.visualTheme.trim().toLowerCase()
      : "";
  const visualTheme = ["elementary", "high-school", "magic"].includes(theme)
    ? (theme as RpgAdventureSetup["visualTheme"])
    : "elementary";
  const mode =
    typeof setup.mode === "string" && setup.mode.trim()
      ? setup.mode.trim()
      : "MULTIPLICATION";
  const pool =
    typeof setup.modePool === "string"
      ? [setup.modePool]
      : Array.isArray(setup.modePool)
        ? setup.modePool.filter((item): item is string => typeof item === "string")
        : undefined;
  const answerModeValue =
    typeof setup.answerMode === "string"
      ? setup.answerMode.trim().toUpperCase()
      : "";
  const answerMode = ["CHOICE", "INPUT", "WRITING"].includes(answerModeValue)
    ? (answerModeValue as RpgAdventureSetup["answerMode"])
    : "CHOICE";
  const numericDifficulty = Number(setup.difficultyLevel);
  const difficultyLevel = Number.isFinite(numericDifficulty)
    ? Math.min(10, Math.max(1, Math.floor(numericDifficulty)))
    : 1;
  const assignment =
    setup.assignment && typeof setup.assignment === "object"
      ? (setup.assignment as AssignmentPayload)
      : undefined;

  return {
    visualTheme,
    mode,
    ...(pool ? { modePool: pool } : {}),
    answerMode,
    difficultyLevel,
    ...(assignment ? { assignment } : {}),
  };
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
