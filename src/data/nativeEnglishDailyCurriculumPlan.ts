import { NATIVE_ENGLISH_GRADE_UNITS } from '../nativeEnglishUnitConfig';
import type { NativeEnglishSubjectId } from '../nativeEnglishUnitConfig';

export interface NativeEnglishDailyWeeklyPlan {
  week: number;
  subjectId: NativeEnglishSubjectId;
  unitId: string;
  label: string;
}

type NativeEnglishPlanSlot = {
  subjectId: NativeEnglishSubjectId;
  labelPrefix: string;
};

const PRIMARY_PATTERN: NativeEnglishPlanSlot[] = [
  { subjectId: 'NATIVE_ELA', labelPrefix: 'ELA Skill' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Math Fluency' },
  { subjectId: 'NATIVE_SCIENCE', labelPrefix: 'Science Discovery' },
  { subjectId: 'NATIVE_ELA', labelPrefix: 'ELA Reading' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Review: Math' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Math Practice' },
  { subjectId: 'NATIVE_ELA', labelPrefix: 'ELA Vocabulary' },
  { subjectId: 'NATIVE_SOCIAL', labelPrefix: 'Social Studies' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Math Word Problems' },
  { subjectId: 'NATIVE_ELA', labelPrefix: 'Review: ELA' },
  { subjectId: 'NATIVE_SCIENCE', labelPrefix: 'Science Lab' },
  { subjectId: 'NATIVE_JAPANESE', labelPrefix: 'Japanese' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Quarter Review' },
];

const UPPER_PATTERN: NativeEnglishPlanSlot[] = [
  { subjectId: 'NATIVE_ELA', labelPrefix: 'ELA Analysis' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Math Practice' },
  { subjectId: 'NATIVE_SCIENCE', labelPrefix: 'Science Concepts' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Math Word Problems' },
  { subjectId: 'NATIVE_ELA', labelPrefix: 'Review: ELA' },
  { subjectId: 'NATIVE_SOCIAL', labelPrefix: 'Social Studies' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Math Fluency' },
  { subjectId: 'NATIVE_ELA', labelPrefix: 'Writing and Evidence' },
  { subjectId: 'NATIVE_SCIENCE', labelPrefix: 'Science Data' },
  { subjectId: 'NATIVE_MATH', labelPrefix: 'Review: Math' },
  { subjectId: 'NATIVE_SOCIAL', labelPrefix: 'Civics and Geography' },
  { subjectId: 'NATIVE_JAPANESE', labelPrefix: 'Japanese' },
  { subjectId: 'NATIVE_ELA', labelPrefix: 'Quarter Review' },
];

const getPatternForGrade = (grade: number) => grade <= 2 ? PRIMARY_PATTERN : UPPER_PATTERN;

const createGradePlan = (grade: number): NativeEnglishDailyWeeklyPlan[] => {
  const subjectOffsets = new Map<NativeEnglishSubjectId, number>();
  const pattern = getPatternForGrade(grade);

  return Array.from({ length: 52 }, (_, index) => {
    const week = index + 1;
    const slot = pattern[index % pattern.length];
    const units = NATIVE_ENGLISH_GRADE_UNITS[slot.subjectId]?.[grade] || [];
    const currentOffset = subjectOffsets.get(slot.subjectId) || 0;
    const unit = units[currentOffset % Math.max(1, units.length)];
    subjectOffsets.set(slot.subjectId, currentOffset + 1);

    if (!unit) {
      throw new Error(`Missing native English daily unit for grade ${grade} ${slot.subjectId}`);
    }

    return {
      week,
      subjectId: slot.subjectId,
      unitId: unit.id,
      label: `${slot.labelPrefix}: ${unit.name}`,
    };
  });
};

export const NATIVE_ENGLISH_DAILY_WEEKLY_PLANS: Record<number, NativeEnglishDailyWeeklyPlan[]> = {
  1: createGradePlan(1),
  2: createGradePlan(2),
  3: createGradePlan(3),
  4: createGradePlan(4),
  5: createGradePlan(5),
  6: createGradePlan(6),
  7: createGradePlan(7),
  8: createGradePlan(8),
};
