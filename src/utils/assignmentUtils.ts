import { AssignmentPayload, AssignmentUnit, GameMode } from '../types';

const ASSIGNMENT_PARAM = 'assignment';

const encodeBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const encodeAssignmentPayload = (assignment: AssignmentPayload) =>
  encodeBase64Url(JSON.stringify(assignment));

export const decodeAssignmentPayload = (encoded: string): AssignmentPayload | null => {
  try {
    const parsed = JSON.parse(decodeBase64Url(encoded));
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.units)) return null;
    const assignment = parsed as AssignmentPayload;
    return {
      ...assignment,
      units: assignment.units.map((unit) => ({
        ...unit,
        targetCorrect: Math.max(1, Number(unit.targetCorrect || 10)),
      })),
      customProblems: (assignment.customProblems || []).map((problem) => ({
        ...problem,
        question: String(problem.question || ''),
        answer: String(problem.answer || ''),
        options: Array.isArray(problem.options) ? problem.options.map((option) => String(option || '')) : [],
        imageUrl: problem.imageUrl ? String(problem.imageUrl) : undefined,
        imageAlt: problem.imageAlt ? String(problem.imageAlt) : undefined,
      })),
      customTargetCorrect: Math.max(1, Number(assignment.customTargetCorrect || (assignment.customProblems || []).length || 10)),
    };
  } catch (e) {
    return null;
  }
};

export const getAssignmentFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const encoded = getAssignmentEncodedFromUrl();
  return encoded ? decodeAssignmentPayload(encoded) : null;
};

export const getAssignmentEncodedFromUrl = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(ASSIGNMENT_PARAM);
};

export const createAssignmentUrl = (assignment: AssignmentPayload) => {
  const url = new URL(window.location.href);
  url.searchParams.set(ASSIGNMENT_PARAM, encodeAssignmentPayload(assignment));
  return url.toString();
};

export const getAssignmentModePool = (assignment: AssignmentPayload | null | undefined): string[] | undefined => {
  const modes = assignment?.units.flatMap((unit) => unit.modes) || [];
  const unique = Array.from(new Set(modes.filter(Boolean)));
  return unique.length > 0 ? unique : undefined;
};

export const getAssignmentRepresentativeMode = (assignment: AssignmentPayload | null | undefined): GameMode =>
  (getAssignmentModePool(assignment)?.[0] || GameMode.MATH_G1_1) as GameMode;

export const normalizeAssignmentUnit = (unit: { id: string; name: string; mode?: string; modes?: string[] }): AssignmentUnit => ({
  id: unit.id,
  name: unit.name,
  modes: unit.modes || (unit.mode ? [unit.mode] : []),
  targetCorrect: 10,
});
