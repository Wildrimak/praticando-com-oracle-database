"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExerciseProgress } from "@/types";

const STORAGE_KEY = "oracle-tuning-lab-progress";

function loadProgress(): ExerciseProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProgress(progress: ExerciseProgress[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useExerciseProgress(slug?: string) {
  const [allProgress, setAllProgress] = useState<ExerciseProgress[]>([]);

  useEffect(() => {
    setAllProgress(loadProgress());
  }, []);

  const getProgress = useCallback(
    (exerciseSlug: string): ExerciseProgress | undefined => {
      return allProgress.find((p) => p.slug === exerciseSlug);
    },
    [allProgress]
  );

  const currentProgress = slug ? getProgress(slug) : undefined;

  const markStepComplete = useCallback(
    (stepId: string) => {
      if (!slug) return;
      setAllProgress((prev) => {
        const existing = prev.find((p) => p.slug === slug);
        let updated: ExerciseProgress[];
        if (existing) {
          if (existing.completedSteps.includes(stepId)) return prev;
          updated = prev.map((p) =>
            p.slug === slug
              ? { ...p, completedSteps: [...p.completedSteps, stepId], lastStepId: stepId }
              : p
          );
        } else {
          updated = [...prev, { slug, completedSteps: [stepId], lastStepId: stepId }];
        }
        saveProgress(updated);
        return updated;
      });
    },
    [slug]
  );

  const toggleStepComplete = useCallback(
    (stepId: string) => {
      if (!slug) return;
      setAllProgress((prev) => {
        const existing = prev.find((p) => p.slug === slug);
        let updated: ExerciseProgress[];
        if (existing) {
          const isComplete = existing.completedSteps.includes(stepId);
          updated = prev.map((p) =>
            p.slug === slug
              ? {
                  ...p,
                  completedSteps: isComplete
                    ? p.completedSteps.filter((s) => s !== stepId)
                    : [...p.completedSteps, stepId],
                }
              : p
          );
        } else {
          updated = [...prev, { slug, completedSteps: [stepId], lastStepId: stepId }];
        }
        saveProgress(updated);
        return updated;
      });
    },
    [slug]
  );

  const setLastStep = useCallback(
    (stepId: string) => {
      if (!slug) return;
      setAllProgress((prev) => {
        const existing = prev.find((p) => p.slug === slug);
        let updated: ExerciseProgress[];
        if (existing) {
          updated = prev.map((p) =>
            p.slug === slug ? { ...p, lastStepId: stepId } : p
          );
        } else {
          updated = [...prev, { slug, completedSteps: [], lastStepId: stepId }];
        }
        saveProgress(updated);
        return updated;
      });
    },
    [slug]
  );

  const getCompletionPercentage = useCallback(
    (exerciseSlug: string, totalSteps: number): number => {
      const progress = allProgress.find((p) => p.slug === exerciseSlug);
      if (!progress || totalSteps === 0) return 0;
      return Math.round((progress.completedSteps.length / totalSteps) * 100);
    },
    [allProgress]
  );

  const getOverallPercentage = useCallback(
    (exercises: { slug: string; totalSteps: number }[]): number => {
      if (exercises.length === 0) return 0;
      const totalSteps = exercises.reduce((sum, e) => sum + e.totalSteps, 0);
      const completedSteps = exercises.reduce((sum, e) => {
        const p = allProgress.find((p) => p.slug === e.slug);
        return sum + (p ? p.completedSteps.length : 0);
      }, 0);
      if (totalSteps === 0) return 0;
      return Math.round((completedSteps / totalSteps) * 100);
    },
    [allProgress]
  );

  return {
    allProgress,
    currentProgress,
    markStepComplete,
    toggleStepComplete,
    setLastStep,
    getProgress,
    getCompletionPercentage,
    getOverallPercentage,
  };
}
