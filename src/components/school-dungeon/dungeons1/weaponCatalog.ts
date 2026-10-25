import type {WeaponKind} from './mastery';
/** Explicit audit of every pre-mastery WEAPON ID. This also migrates legacy saves without renaming items. */
export const LEGACY_WEAPON_KINDS:Readonly<Record<string,WeaponKind>>={
 PENCIL_SWORD:'sword',METAL_BAT:'hammer',PROTRACTOR_EDGE:'chakram',OFUDA_RULER:'sword',VITAMIN_INJECT:'rapier',LADLE:'hammer',STAINLESS_PEN:'rapier',RICH_WATCH:'fist',
 WOOD_RULER:'sword',BRASS_TRIANGLE:'chakram',EXAM_CUTTER:'sword',SCIENCE_SCALPEL:'rapier',GYM_PICKAXE:'axe',BROOM_NAGINATA:'spear',FIRE_EXTINGUISHER_LANCE:'spear',DRAGON_WHISTLE_BLADE:'sword',KAMAITACHI_RULER:'sword',GHOST_ERASER:'sword',EYE_PATCH_COMPASS:'spear',CANTEEN_HAMMER:'hammer',BROKEN_UMBRELLA_SPEAR:'spear',REPORT_CARD_EDGE:'greatsword',CLEANING_MOP_HALBERD:'spear',DESK_LEG_AXE:'axe',MORNING_BELL_MACE:'hammer',GRADUATION_SHEARS:'greatsword',BLACKBOARD_BLADE:'greatsword',PRINCIPAL_POINTER:'staff',
 MATH_COMPASS_SABER:'sword',CHALKBOARD_ERASER_AXE:'axe',RECORDER_RAPIER:'rapier',ART_KNIFE:'sword',STAPLER_MACE:'hammer',LIBRARY_SPEAR:'spear',LAB_TONGS:'staff',BELL_RINGER:'hammer',FLOOR_POLISHER_BLADE:'greatsword',HOMEWORK_BINDER_CLUB:'hammer',
 STUDENT_E_PENCIL:'sword',STUDENT_E_RULER:'sword',STUDENT_E_BROOM:'spear',STUDENT_E_STAR_PENCIL:'sword',
 STUDENT_H_RAPIER:'rapier',STUDENT_H_POINTER:'staff',STUDENT_H_HAMMER:'hammer',STUDENT_H_BLADE:'sword',
 STUDENT_M_WAND:'staff',STUDENT_M_MOON:'rapier',STUDENT_M_BROOM:'spear',STUDENT_M_WAND_LAST:'staff',
 NURSE_PENCIL:'sword',DRAGON_RULER:'sword',
};
