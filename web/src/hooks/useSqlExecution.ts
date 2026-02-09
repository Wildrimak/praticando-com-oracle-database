"use client";

import { useState, useCallback } from "react";
import type { SqlExecutionResult } from "@/types";

export function useSqlExecution() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<SqlExecutionResult | null>(null);
  const [history, setHistory] = useState<SqlExecutionResult[]>([]);

  const execute = useCallback(async (sql: string) => {
    setIsExecuting(true);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });

      const data = await response.json();
      const executionResult: SqlExecutionResult = {
        output: data.output,
        executionTime: data.executionTime,
        success: data.success,
        error: !data.success ? data.output : undefined,
      };

      setResult(executionResult);
      setHistory((prev) => [...prev, executionResult]);
      return executionResult;
    } catch (err) {
      const errorResult: SqlExecutionResult = {
        output: err instanceof Error ? err.message : "Connection error",
        executionTime: 0,
        success: false,
        error: "Failed to connect to server",
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return { execute, isExecuting, result, history, clearResult };
}
