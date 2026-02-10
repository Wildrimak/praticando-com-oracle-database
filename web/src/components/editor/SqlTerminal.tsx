"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Terminal, Trash2 } from "lucide-react";
import type { SqlExecutionResult } from "@/types";
import { cn } from "@/lib/utils";
import {
  parseSqlOutput,
  isExplainPlanOutput,
  type ParsedBlock,
  type TableResult,
} from "@/lib/sql-output-parser";

/**
 * @description Terminal output panel that displays SQL execution results.
 * Renders tabular data as HTML `<table>` with zebra striping and horizontal scroll.
 * Renders EXPLAIN PLAN output and errors as `<pre>` with color-coded highlighting.
 * @param {SqlTerminalProps} props
 * @param {SqlExecutionResult | null} props.result - The SQL execution result to display
 * @param {boolean} props.isExecuting - Whether a query is currently running
 * @param {() => void} props.onClear - Callback to clear the terminal output
 */

interface SqlTerminalProps {
  result: SqlExecutionResult | null;
  isExecuting: boolean;
  onClear: () => void;
}

/**
 * @description Color-codes a single line of execution plan output.
 * TABLE ACCESS FULL = red, INDEX SCAN = green, HASH JOIN = yellow, errors = red.
 * @param {string} line - A single line of SQL output
 * @returns {string} HTML string with color spans applied
 */
function highlightPlanOutput(line: string): string {
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

/**
 * @description Escapes HTML special characters to prevent XSS in dangerouslySetInnerHTML.
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe string
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @description Renders a TableResult as an HTML table with zebra striping.
 * @param {object} props
 * @param {TableResult} props.table - Parsed table data with headers, rows, and footer
 */
function ResultTable({ table }: { table: TableResult }) {
  return (
    <div className="result-table-wrapper">
      <table className="result-table">
        <thead>
          <tr>
            {table.headers.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.footer && (
        <div className="mt-1 text-xs text-dark-500">{table.footer}</div>
      )}
    </div>
  );
}

/**
 * @description Renders a parsed block (table or text with highlighting).
 * @param {object} props
 * @param {ParsedBlock} props.block - A single parsed output block
 */
function OutputBlock({ block }: { block: ParsedBlock }) {
  if (block.type === "table" && block.rows.length > 0) {
    return <ResultTable table={block} />;
  }

  if (block.type === "text" && block.content) {
    const highlighted = block.content
      .split("\n")
      .map((line) => highlightPlanOutput(line))
      .join("\n");

    return (
      <pre
        className="terminal-output text-sm text-dark-200"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  }

  return null;
}

export function SqlTerminal({ result, isExecuting, onClear }: SqlTerminalProps) {
  const t = useTranslations("common");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result]);

  // Decide rendering mode: plan highlighting (pre) vs structured tables
  const renderOutput = () => {
    if (!result?.output) return null;

    // EXPLAIN PLAN and error output always uses highlighted pre
    if (isExplainPlanOutput(result.output) || !result.success) {
      const highlighted = result.output
        .split("\n")
        .map((line) => highlightPlanOutput(line))
        .join("\n");

      return (
        <pre
          className="terminal-output text-sm text-dark-200"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      );
    }

    // Parse structured output for table rendering
    const blocks = parseSqlOutput(result.output);
    return (
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <OutputBlock key={i} block={block} />
        ))}
      </div>
    );
  };

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
        {!isExecuting && result && renderOutput()}
        {!isExecuting && !result && (
          <div className="flex h-full items-center justify-center text-sm text-dark-500">
            {t("ctrlEnter")}
          </div>
        )}
      </div>
    </div>
  );
}
