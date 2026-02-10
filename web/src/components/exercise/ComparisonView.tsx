"use client";

import { cn } from "@/lib/utils";

/**
 * @description Side-by-side comparison view for before/after SQL execution results.
 * Shows two terminal-style panels with colored indicators (red = before, green = after).
 * @param {ComparisonViewProps} props
 * @param {string} props.beforeOutput - SQL output before optimization
 * @param {string} props.afterOutput - SQL output after optimization
 * @param {string} props.beforeLabel - Label for the "before" panel
 * @param {string} props.afterLabel - Label for the "after" panel
 */
interface ComparisonViewProps {
  beforeOutput: string;
  afterOutput: string;
  beforeLabel: string;
  afterLabel: string;
}

export function ComparisonView({
  beforeOutput,
  afterOutput,
  beforeLabel,
  afterLabel,
}: ComparisonViewProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col rounded-lg border border-dark-700">
        <div className="flex items-center gap-2 border-b border-dark-700 bg-dark-900 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-dark-300">
            {beforeLabel}
          </span>
        </div>
        <pre className="terminal-output flex-1 overflow-auto p-3 text-xs text-dark-300">
          {beforeOutput}
        </pre>
      </div>
      <div className="flex flex-col rounded-lg border border-dark-700">
        <div className="flex items-center gap-2 border-b border-dark-700 bg-dark-900 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-dark-300">
            {afterLabel}
          </span>
        </div>
        <pre
          className={cn(
            "terminal-output flex-1 overflow-auto p-3 text-xs text-dark-300"
          )}
        >
          {afterOutput}
        </pre>
      </div>
    </div>
  );
}
