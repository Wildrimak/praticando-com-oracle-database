"use client";

import { useState, useCallback, useRef } from "react";
import { StepContent } from "./StepContent";
import { StepNavigator } from "./StepNavigator";
import { SqlEditor } from "../editor/SqlEditor";
import { SqlTerminal } from "../editor/SqlTerminal";
import { useSqlExecution } from "@/hooks/useSqlExecution";
import { useExerciseProgress } from "@/hooks/useExerciseProgress";
import type { Exercise, Locale } from "@/types";
import { useLocale } from "next-intl";

/**
 * @description Main exercise workspace container with split-panel layout.
 * Left side shows step content (markdown), right side shows SQL editor (top) and
 * terminal output (bottom) with a draggable resize handle between them.
 * @param {ExerciseWorkspaceProps} props
 * @param {Exercise} props.exercise - The exercise data including all steps
 */

interface ExerciseWorkspaceProps {
  exercise: Exercise;
}

const MIN_EDITOR_PERCENT = 20;
const MAX_EDITOR_PERCENT = 80;
const DEFAULT_EDITOR_PERCENT = 40;

export function ExerciseWorkspace({ exercise }: ExerciseWorkspaceProps) {
  const locale = useLocale() as Locale;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { execute, isExecuting, result, clearResult } = useSqlExecution();
  const { currentProgress, toggleStepComplete, setLastStep } =
    useExerciseProgress(exercise.slug);

  const step = exercise.steps[currentStepIndex];
  const [sqlValue, setSqlValue] = useState(step.sql || "");

  // Resizable panel state
  const [editorPercent, setEditorPercent] = useState(DEFAULT_EDITOR_PERCENT);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

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

  /** @description Starts the resize drag operation for the editor/terminal split */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !rightPanelRef.current) return;
      const rect = rightPanelRef.current.getBoundingClientRect();
      const relativeY = moveEvent.clientY - rect.top;
      const percent = (relativeY / rect.height) * 100;
      const clamped = Math.min(MAX_EDITOR_PERCENT, Math.max(MIN_EDITOR_PERCENT, percent));
      setEditorPercent(clamped);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, []);

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

        {/* Right panel: editor + terminal with resizable split */}
        <div ref={rightPanelRef} className="flex w-[45%] flex-col">
          <div style={{ height: `${editorPercent}%` }} className="min-h-0">
            <SqlEditor
              value={sqlValue}
              onChange={setSqlValue}
              onExecute={handleExecute}
              isExecuting={isExecuting}
              readOnly={step.editable === false}
            />
          </div>
          <div
            className="resize-handle-horizontal"
            onMouseDown={handleResizeStart}
          />
          <div style={{ height: `${100 - editorPercent}%` }} className="min-h-0">
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
