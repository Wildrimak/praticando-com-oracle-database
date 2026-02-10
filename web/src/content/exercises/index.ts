/**
 * @description Exercise registry. Imports all exercise definitions and provides
 * a lookup function by slug. Exercises are ordered by difficulty/progression.
 * @module content/exercises
 */
import { exercise as explainPlan } from "./01-explain-plan";
import { exercise as creatingIndexes } from "./02-creating-indexes";
import { exercise as indexesJoins } from "./03-indexes-joins";
import { exercise as indexTypes } from "./04-index-types";
import { exercise as diagnostics } from "./05-diagnostics";
import type { Exercise } from "@/types";

export const exercises: Exercise[] = [
  explainPlan,
  creatingIndexes,
  indexesJoins,
  indexTypes,
  diagnostics,
];

/**
 * @description Finds an exercise by its URL slug.
 * @param {string} slug - The exercise slug (e.g., "explain-plan-basics")
 * @returns {Exercise | undefined} The matching exercise or undefined
 */
export function getExerciseBySlug(slug: string): Exercise | undefined {
  return exercises.find((e) => e.slug === slug);
}
