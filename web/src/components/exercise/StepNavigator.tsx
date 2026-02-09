"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepNavigatorProps {
  currentStep: number;
  totalSteps: number;
  isStepComplete: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleComplete: () => void;
}

export function StepNavigator({
  currentStep,
  totalSteps,
  isStepComplete,
  onPrevious,
  onNext,
  onToggleComplete,
}: StepNavigatorProps) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center justify-between border-t border-dark-700 bg-dark-900 px-4 py-2">
      <button
        onClick={onPrevious}
        disabled={currentStep === 0}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100 disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("previous")}
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleComplete}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
            isStepComplete
              ? "text-green-400 hover:bg-dark-800"
              : "text-dark-400 hover:bg-dark-800 hover:text-dark-200"
          )}
        >
          {isStepComplete ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
          {isStepComplete ? t("completed") : t("markComplete")}
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === currentStep
                  ? "bg-oracle-500"
                  : i < currentStep
                    ? "bg-oracle-500/40"
                    : "bg-dark-600"
              )}
            />
          ))}
        </div>

        <span className="text-xs text-dark-500">
          {t("step")} {currentStep + 1} {t("of")} {totalSteps}
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={currentStep === totalSteps - 1}
        className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100 disabled:opacity-30"
      >
        {t("next")}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
