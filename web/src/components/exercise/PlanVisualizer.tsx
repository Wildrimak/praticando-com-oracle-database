"use client";

import { cn } from "@/lib/utils";

interface PlanLine {
  operation: string;
  cost?: string;
  rows?: string;
  type: "fts" | "index" | "hash" | "sort" | "other";
}

function parsePlanOutput(output: string): PlanLine[] {
  const lines = output.split("\n");
  const planLines: PlanLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("-") || trimmed.startsWith("Plan") || trimmed.startsWith("Id")) continue;

    let type: PlanLine["type"] = "other";
    if (/TABLE ACCESS FULL/i.test(trimmed)) type = "fts";
    else if (/INDEX.*SCAN/i.test(trimmed)) type = "index";
    else if (/HASH JOIN/i.test(trimmed)) type = "hash";
    else if (/SORT/i.test(trimmed)) type = "sort";

    // Extract cost and rows from plan output
    const costMatch = trimmed.match(/\|\s*(\d+)\s*\|/);
    const rowsMatch = trimmed.match(/\|\s*(\d+[KMG]?)\s*\|/);

    planLines.push({
      operation: trimmed,
      cost: costMatch?.[1],
      rows: rowsMatch?.[1],
      type,
    });
  }

  return planLines;
}

const typeColors = {
  fts: "border-red-500 bg-red-500/10 text-red-400",
  index: "border-green-500 bg-green-500/10 text-green-400",
  hash: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
  sort: "border-blue-500 bg-blue-500/10 text-blue-400",
  other: "border-dark-600 bg-dark-800 text-dark-300",
};

const typeLabels = {
  fts: "Full Table Scan",
  index: "Index Scan",
  hash: "Hash Join",
  sort: "Sort",
  other: "",
};

interface PlanVisualizerProps {
  output: string;
}

export function PlanVisualizer({ output }: PlanVisualizerProps) {
  const lines = parsePlanOutput(output);

  if (lines.length === 0) return null;

  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            "rounded border-l-2 px-3 py-1.5 font-mono text-xs",
            typeColors[line.type]
          )}
        >
          <div className="flex items-center justify-between">
            <span>{line.operation}</span>
            {line.type !== "other" && (
              <span className="ml-2 text-[10px] font-medium uppercase opacity-60">
                {typeLabels[line.type]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
