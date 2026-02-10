"use client";

import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, StandardSQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { useTranslations } from "next-intl";
import { Play, Loader2 } from "lucide-react";

/**
 * @description SQL code editor powered by CodeMirror with Oracle SQL syntax highlighting.
 * Supports Ctrl+Enter / Cmd+Enter to execute, optional read-only mode, and a run button.
 * @param {SqlEditorProps} props
 * @param {string} props.value - Current SQL content in the editor
 * @param {(value: string) => void} props.onChange - Called when editor content changes
 * @param {() => void} props.onExecute - Called when user triggers execution (button or keyboard shortcut)
 * @param {boolean} props.isExecuting - Whether a query is currently running (disables run button)
 * @param {boolean} [props.readOnly=false] - When true, editor is non-editable (demonstration steps)
 */
interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  isExecuting: boolean;
  readOnly?: boolean;
}

export function SqlEditor({
  value,
  onChange,
  onExecute,
  isExecuting,
  readOnly = false,
}: SqlEditorProps) {
  const t = useTranslations("common");

  const executeKeymap = keymap.of([
    {
      key: "Ctrl-Enter",
      run: () => {
        onExecute();
        return true;
      },
    },
    {
      key: "Mod-Enter",
      run: () => {
        onExecute();
        return true;
      },
    },
  ]);

  const handleChange = useCallback(
    (val: string) => {
      if (!readOnly) onChange(val);
    },
    [onChange, readOnly]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dark-700 bg-dark-900 px-3 py-1.5">
        <span className="text-xs text-dark-400">{t("editor")}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-dark-500">{t("ctrlEnter")}</span>
          <button
            onClick={onExecute}
            disabled={isExecuting || !value.trim()}
            className="flex items-center gap-1.5 rounded-md bg-oracle-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-oracle-600 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("running")}
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                {t("runSql")}
              </>
            )}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeMirror
          value={value}
          onChange={handleChange}
          theme={oneDark}
          extensions={[sql({ dialect: StandardSQL }), executeKeymap]}
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
          }}
          className="h-full"
          height="100%"
        />
      </div>
    </div>
  );
}
