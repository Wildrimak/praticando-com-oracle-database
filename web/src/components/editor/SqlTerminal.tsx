"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Terminal, Trash2 } from "lucide-react";
import type { SqlExecutionResult } from "@/types";
import { cn } from "@/lib/utils";

interface SqlTerminalProps {
  result: SqlExecutionResult | null;
  isExecuting: boolean;
  onClear: () => void;
}

function highlightPlanOutput(line: string): string {
  // Color-code execution plan operations
  if (/TABLE ACCESS FULL/i.test(line)) {
    return `<span class="plan-operation-fts">${escapeHtml(line)}</span>`;
  }
  if (/INDEX.*SCAN/i.test(line)) {
    return `<span class="plan-operation-index">${escapeHtml(line)}</span>`;
  }
  if (/HASH JOIN/i.test(line)) {
    return `<span class="plan-operation-hash">${escapeHtml(line)}</span>`;
  }
  if (/^(ORA-|SP2-|ERROR)/i.test(line.trim())) {
    return `<span class="text-red-400">${escapeHtml(line)}</span>`;
  }
  return escapeHtml(line);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function SqlTerminal({ result, isExecuting, onClear }: SqlTerminalProps) {
  const t = useTranslations("common");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result]);

  const highlightedOutput = result?.output
    ? result.output
        .split("\n")
        .map((line) => highlightPlanOutput(line))
        .join("\n")
    : "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dark-700 bg-dark-900 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5 text-dark-400" />
          <span className="text-xs text-dark-400">{t("output")}</span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span
              className={cn(
                "text-[10px]",
                result.success ? "text-green-500" : "text-red-400"
              )}
            >
              {result.executionTime}ms
            </span>
          )}
          <button
            onClick={onClear}
            className="rounded p-0.5 text-dark-500 transition-colors hover:bg-dark-800 hover:text-dark-300"
            title={t("clear")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={outputRef}
        className="min-h-0 flex-1 overflow-auto bg-dark-950 p-3"
      >
        {isExecuting && (
          <div className="flex items-center gap-2 text-oracle-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-oracle-500" />
            <span className="terminal-output text-sm">{t("running")}</span>
          </div>
        )}
        {!isExecuting && result && (
          <pre
            className="terminal-output text-sm text-dark-200"
            dangerouslySetInnerHTML={{ __html: highlightedOutput }}
          />
        )}
        {!isExecuting && !result && (
          <div className="flex h-full items-center justify-center text-sm text-dark-500">
            {t("ctrlEnter")}
          </div>
        )}
      </div>
    </div>
  );
}
