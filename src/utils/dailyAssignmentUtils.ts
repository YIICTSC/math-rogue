import { AssignmentPayload, AssignmentUnit, StudentProfile } from '../types';
import { UPPER_PROBLEM_CATEGORIES, getCurrentUnitsForCategory } from '../components/ModeSelectionScreen';
import { CURRICULUM_WEEKLY_PLANS } from '../data/dailyCurriculumPlan';
import type { SubjectCategoryType } from '../subjectConfig';

export const STUDENT_GRADE_OPTIONS = [
  '小学1年生',
  '小学2年生',
  '小学3年生',
  '小学4年生',
  '小学5年生',
  '小学6年生',
  '中学1年生',
  '中学2年生',
  '中学3年生',
  '高校以上',
  '大人',
] as const;

const PROMOTABLE_GRADES = STUDENT_GRADE_OPTIONS.slice(0, 9);
const DAILY_TARGET_CORRECT = 20;
const DAILY_TOTAL_TARGET_CORRECT = 50;
const CHALLENGE_TARGET_CORRECT = DAILY_TOTAL_TARGET_CORRECT - DAILY_TARGET_CORRECT;
const CHALLENGE_PICK_THRESHOLD = 50;

export const getCurrentSchoolYear = (date = new Date()) => {
  const year = date.getFullYear();
  return date.getMonth() >= 3 ? year : year - 1;
};

export const isAdultProfile = (profile: StudentProfile | null | undefined) => profile?.grade === '大人';

export const promoteStudentProfileForSchoolYear = (
  profile: StudentProfile,
  currentSchoolYear = getCurrentSchoolYear()
): StudentProfile => {
  if (!profile.grade) return profile;
  const savedSchoolYear = Number(profile.schoolYear || currentSchoolYear);
  if (savedSchoolYear >= currentSchoolYear) {
    return { ...profile, schoolYear: savedSchoolYear };
  }

  let nextGrade = profile.grade;
  for (let year = savedSchoolYear; year < currentSchoolYear; year += 1) {
    const index = PROMOTABLE_GRADES.indexOf(nextGrade as typeof PROMOTABLE_GRADES[number]);
    if (index === -1) break;
    nextGrade = PROMOTABLE_GRADES[index + 1] || '高校以上';
  }

  return { ...profile, grade: nextGrade, schoolYear: currentSchoolYear };
};

const getGradeNumber = (grade: string): number | null => {
  const elementary = grade.match(/^小学([1-6])年生$/);
  if (elementary) return Number(elementary[1]);
  const juniorHigh = grade.match(/^中学([1-3])年生$/);
  if (juniorHigh) return Number(juniorHigh[1]) + 6;
  return null;
};

const getEndOfToday = (date: Date) => {
  const due = new Date(date);
  due.setHours(23, 59, 0, 0);
  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
};

const getLocalDateId = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSchoolYearWeekIndex = (date: Date) => {
  const startYear = getCurrentSchoolYear(date);
  const schoolYearStart = new Date(startYear, 3, 1);
  const elapsedDays = Math.max(0, Math.floor((date.getTime() - schoolYearStart.getTime()) / 86400000));
  return Math.min(51, Math.floor(elapsedDays / 7));
};

const toAssignmentUnit = (
  unit: { id: string; name: string; mode?: string; modes?: string[] },
  prefix: string,
  targetCorrect: number,
): AssignmentUnit => ({
  id: `${prefix}:${unit.id}:${targetCorrect}`,
  name: unit.name,
  modes: unit.modes || (unit.mode ? [unit.mode] : []),
  targetCorrect,
});

const getUpperUnits = (adult: boolean) => {
  const categories = adult
    ? UPPER_PROBLEM_CATEGORIES.filter((category) => ['UPPER_PRACTICAL', 'UPPER_INFORMATION', 'UPPER_ESSAY'].includes(category.id))
    : UPPER_PROBLEM_CATEGORIES;
  return categories.flatMap((category) => category.subModes.map((subMode) => ({
    id: `${category.id}:${subMode.id}`,
    name: `${category.name} / ${subMode.name}`,
    modes: [subMode.mode],
  })));
};

const getGradeCategoryUnits = (gradeNumber: number, categoryId: SubjectCategoryType | 'KANJI') => {
  if (categoryId === 'KANJI') {
    return [{
      id: `KANJI:${gradeNumber}`,
      name: `${gradeNumber <= 6 ? `小学${gradeNumber}年` : `中学${gradeNumber - 6}年`}の漢字`,
      modes: [`KANJI_${gradeNumber}`],
    }];
  }
  return getCurrentUnitsForCategory(categoryId, gradeNumber).map((unit) => ({
    id: `${categoryId}:${unit.id}`,
    name: unit.name,
    modes: unit.modes || (unit.mode ? [unit.mode] : []),
  })).map((unit) => ({
    ...unit,
    modes: unit.modes || [],
  })).filter((unit) => unit.modes.length > 0);
};

const getGradeUnits = (gradeNumber: number) => {
  const categoryIds = [
    'MATH_GRADES',
    'KOKUGO_GRADES',
    'KANJI',
    gradeNumber <= 2 ? 'LIFE' : 'SCIENCE',
    ...(gradeNumber >= 3 ? ['SOCIAL', 'ENGLISH'] : []),
    'SUMMARY',
  ] as Array<SubjectCategoryType | 'KANJI'>;

  return categoryIds.flatMap((categoryId) => getGradeCategoryUnits(gradeNumber, categoryId));
};

const getCorrectCountForUnit = (unit: { modes: string[] }, modeCorrectCounts: Record<string, number>) =>
  unit.modes.reduce((total, mode) => total + Math.max(0, Number(modeCorrectCounts[mode] || 0)), 0);

export const createDailyAssignment = (
  profile: StudentProfile,
  modeCorrectCounts: Record<string, number>,
  date = new Date(),
): AssignmentPayload | null => {
  if (!profile.grade) return null;
  const gradeNumber = getGradeNumber(profile.grade);
  const adult = profile.grade === '大人';
  const baseUnits = gradeNumber ? getGradeUnits(gradeNumber) : getUpperUnits(adult);
  if (baseUnits.length === 0) return null;

  const dateId = getLocalDateId(date);
  const schoolYearWeekIndex = getSchoolYearWeekIndex(date);
  const weeklyPlan = gradeNumber ? CURRICULUM_WEEKLY_PLANS[gradeNumber]?.[schoolYearWeekIndex] : undefined;
  const weeklyUnits = weeklyPlan && gradeNumber
    ? getGradeCategoryUnits(gradeNumber, weeklyPlan.categoryId)
    : [];
  const seasonalBase = weeklyUnits.length > 0
    ? weeklyUnits[weeklyPlan!.unitOffset % weeklyUnits.length]
    : baseUnits[schoolYearWeekIndex % baseUnits.length];
  const challengeBase = [...baseUnits]
    .filter((unit) => unit.id !== seasonalBase.id)
    .sort((a, b) => {
      const aCount = getCorrectCountForUnit(a, modeCorrectCounts);
      const bCount = getCorrectCountForUnit(b, modeCorrectCounts);
      const aActive = aCount > 0 && aCount < CHALLENGE_PICK_THRESHOLD;
      const bActive = bCount > 0 && bCount < CHALLENGE_PICK_THRESHOLD;
      if (aActive !== bActive) return aActive ? -1 : 1;
      if (aActive && bActive) return bCount - aCount;
      return aCount - bCount;
    })[0] || seasonalBase;

  const units = [
    toAssignmentUnit(seasonalBase, 'daily', DAILY_TARGET_CORRECT),
    toAssignmentUnit({
      ...challengeBase,
      name: `チャレンジ: ${challengeBase.name}`,
    }, 'daily-challenge', CHALLENGE_TARGET_CORRECT),
  ];

  return {
    id: `daily-${profile.grade}-${dateId}`,
    title: `${profile.grade} デイリー課題 ${dateId}`,
    units,
    customProblems: [],
    dueAt: getEndOfToday(date),
    gameMode: 'FREE',
    answerMode: 'CHOICE',
    createdAt: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
  };
};
