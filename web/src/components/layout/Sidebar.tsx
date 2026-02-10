"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { exercises } from "@/content/exercises";
import { useExerciseProgress } from "@/hooks/useExerciseProgress";
import type { Locale } from "@/types";
import { cn } from "@/lib/utils";

/**
 * @description Left sidebar listing all exercises with completion indicators.
 * Highlights the currently active exercise and shows progress bars for partially completed ones.
 * @param {SidebarProps} props
 * @param {string} [props.currentSlug] - Slug of the currently active exercise
 */
interface SidebarProps {
  currentSlug?: string;
}

export function Sidebar({ currentSlug }: SidebarProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const { getCompletionPercentage } = useExerciseProgress();

  return (
    <aside className="w-64 shrink-0 border-r border-dark-700 bg-dark-900 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dark-400">
        {t("exercises")}
      </h2>
      <nav className="space-y-1">
        {exercises.map((exercise, idx) => {
          const isActive = exercise.slug === currentSlug;
          const completion = getCompletionPercentage(
            exercise.slug,
            exercise.steps.length
          );
          const isComplete = completion === 100;

          return (
            <Link
              key={exercise.slug}
              href={`/${locale}/exercises/${exercise.slug}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-oracle-500/10 text-oracle-400"
                  : "text-dark-300 hover:bg-dark-800 hover:text-dark-100"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-dark-500" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {idx + 1}. {exercise.title[locale]}
                </div>
                {completion > 0 && completion < 100 && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-dark-700">
                    <div
                      className="h-full rounded-full bg-oracle-500 transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
