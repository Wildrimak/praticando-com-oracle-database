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

export function getExerciseBySlug(slug: string): Exercise | undefined {
  return exercises.find((e) => e.slug === slug);
}
