"use client";

import { cn } from "@/lib/utils";

/**
 * @description Animated progress bar with oracle-orange fill.
 * Clamps value between 0-100. Optionally shows a percentage label.
 * @param {ProgressBarProps} props
 * @param {number} props.value - Progress percentage (0-100)
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showLabel=false] - Whether to show the percentage text
 */
interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel = false }: ProgressBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-dark-700">
        <div
          className="h-full rounded-full bg-oracle-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-dark-400">{Math.round(value)}%</span>
      )}
    </div>
  );
}
