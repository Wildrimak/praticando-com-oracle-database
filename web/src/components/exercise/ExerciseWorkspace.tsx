"use client";

import { useState, useCallback } from "react";
import { StepContent } from "./StepContent";
import { StepNavigator } from "./StepNavigator";
import { SqlEditor } from "../editor/SqlEditor";
import { SqlTerminal } from "../editor/SqlTerminal";
import { useSqlExecution } from "@/hooks/useSqlExecution";
import { useExerciseProgress } from "@/hooks/useExerciseProgress";
import type { Exercise, Locale } from "@/types";
import { useLocale } from "next-intl";

interface ExerciseWorkspaceProps {
  exercise: Exercise;
}

export function ExerciseWorkspace({ exercise }: ExerciseWorkspaceProps) {
  const locale = useLocale() as Locale;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { execute, isExecuting, result, clearResult } = useSqlExecution();
  const { currentProgress, toggleStepComplete, setLastStep } =
    useExerciseProgress(exercise.slug);

  const step = exercise.steps[currentStepIndex];
  const [sqlValue, setSqlValue] = useState(step.sql || "");

  const handleStepChange = useCallback(
    (newIndex: number) => {
      setCurrentStepIndex(newIndex);
      const newStep = exercise.steps[newIndex];
      setSqlValue(newStep.sql || "");
      setLastStep(newStep.id);
      clearResult();
    },
    [exercise.steps, setLastStep, clearResult]
  );

  const handleExecute = useCallback(() => {
    if (sqlValue.trim()) {
      execute(sqlValue);
    }
  }, [execute, sqlValue]);

  const isStepComplete = currentProgress?.completedSteps.includes(step.id) ?? false;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Left panel: content */}
        <div className="flex w-[55%] flex-col border-r border-dark-700">
          <div className="flex items-center border-b border-dark-700 bg-dark-900 px-6 py-3">
            <h1 className="text-lg font-bold text-dark-100">
              {step.title[locale]}
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <StepContent step={step} />
          </div>
        </div>

        {/* Right panel: editor + terminal */}
        <div className="flex w-[45%] flex-col">
          <div className="h-[50%] border-b border-dark-700">
            <SqlEditor
              value={sqlValue}
              onChange={setSqlValue}
              onExecute={handleExecute}
              isExecuting={isExecuting}
              readOnly={step.editable === false}
            />
          </div>
          <div className="h-[50%]">
            <SqlTerminal
              result={result}
              isExecuting={isExecuting}
              onClear={clearResult}
            />
          </div>
        </div>
      </div>

      <StepNavigator
        currentStep={currentStepIndex}
        totalSteps={exercise.steps.length}
        isStepComplete={isStepComplete}
        onPrevious={() => handleStepChange(currentStepIndex - 1)}
        onNext={() => handleStepChange(currentStepIndex + 1)}
        onToggleComplete={() => toggleStepComplete(step.id)}
      />
    </div>
  );
}
