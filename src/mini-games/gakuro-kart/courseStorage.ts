import { validCustomCourse, type CustomCourse } from "./track";
const KEY = "gakuro-gp-courses-v1";
export function loadCourses(): CustomCourse[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data)
      ? data.filter(validCustomCourse).slice(0, 12)
      : [];
  } catch {
    return [];
  }
}
export function saveCourse(course: CustomCourse): boolean {
  if (!validCustomCourse(course)) return false;
  try {
    const courses = loadCourses().filter((c) => c.name !== course.name);
    localStorage.setItem(
      KEY,
      JSON.stringify([course, ...courses].slice(0, 12)),
    );
    return true;
  } catch {
    return false;
  }
}
export function deleteCourse(name: string) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(loadCourses().filter((c) => c.name !== name)),
    );
  } catch {}
}
