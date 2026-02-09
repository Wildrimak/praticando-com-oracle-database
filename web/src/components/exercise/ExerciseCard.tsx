"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Search,
  ListPlus,
  GitMerge,
  Layers,
  Stethoscope,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { Exercise, Locale } from "@/types";
import { useExerciseProgress } from "@/hooks/useExerciseProgress";
import { ProgressBar } from "../common/ProgressBar";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  ListPlus,
  GitMerge,
  Layers,
  Stethoscope,
};

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const { getCompletionPercentage } = useExerciseProgress();
  const Icon = iconMap[exercise.icon] || Search;
  const completion = getCompletionPercentage(exercise.slug, exercise.steps.length);

  return (
    <Link
      href={`/${locale}/exercises/${exercise.slug}`}
      className="group flex flex-col rounded-xl border border-dark-700 bg-dark-900 p-6 transition-all hover:border-oracle-500/50 hover:shadow-lg hover:shadow-oracle-500/5"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-oracle-500/10">
          <Icon className="h-5 w-5 text-oracle-500" />
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            difficultyColors[exercise.difficulty]
          )}
        >
          {t(`difficulty.${exercise.difficulty}`)}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-dark-100 group-hover:text-oracle-400">
        {index + 1}. {exercise.title[locale]}
      </h3>

      <p className="mb-4 flex-1 text-sm leading-relaxed text-dark-400">
        {exercise.description[locale]}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-dark-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{exercise.estimatedTime} {t("minutes")}
          </span>
          <span>
            {exercise.steps.length} {t("step")}s
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-dark-500 transition-transform group-hover:translate-x-1 group-hover:text-oracle-400" />
      </div>

      {completion > 0 && (
        <ProgressBar value={completion} showLabel className="mt-3" />
      )}
    </Link>
  );
}
