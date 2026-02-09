"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { exercises } from "@/content/exercises";
import { useExerciseProgress } from "@/hooks/useExerciseProgress";
import { ProgressBar } from "@/components/common/ProgressBar";

export default function ExercisesPage() {
  const t = useTranslations("common");
  const { getOverallPercentage } = useExerciseProgress();

  const overall = getOverallPercentage(
    exercises.map((e) => ({ slug: e.slug, totalSteps: e.steps.length }))
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark-100">
                {t("exercises")}
              </h1>
              <p className="mt-1 text-sm text-dark-400">{t("subtitle")}</p>
            </div>
            <div className="w-48">
              <div className="mb-1 text-right text-xs text-dark-400">
                {t("overallProgress")}
              </div>
              <ProgressBar value={overall} showLabel />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.slug}
                exercise={exercise}
                index={index}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
