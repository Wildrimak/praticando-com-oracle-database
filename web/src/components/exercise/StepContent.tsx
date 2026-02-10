"use client";

import ReactMarkdown from "react-markdown";
import { useLocale, useTranslations } from "next-intl";
import { Lightbulb, Target } from "lucide-react";
import type { ExerciseStep, Locale } from "@/types";

/**
 * @description Renders exercise step content from bilingual Markdown.
 * Includes custom-styled markdown components (code, tables, blockquotes)
 * and optional hint/challenge callout boxes at the bottom.
 * @param {StepContentProps} props
 * @param {ExerciseStep} props.step - The step data with bilingual content, hint, and challenge
 */
interface StepContentProps {
  step: ExerciseStep;
}

export function StepContent({ step }: StepContentProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");

  return (
    <div className="exercise-content prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-dark-800 px-1.5 py-0.5 text-sm text-oracle-300" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg border border-dark-700 bg-dark-900 p-4 text-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="callout-insight">
              {children}
            </blockquote>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-3 text-xl font-bold text-oracle-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 text-lg font-semibold text-oracle-300">
              {children}
            </h3>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-dark-700 bg-dark-800 px-3 py-2 text-left font-medium text-dark-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-dark-700 px-3 py-2 text-dark-300">
              {children}
            </td>
          ),
        }}
      >
        {step.content[locale]}
      </ReactMarkdown>

      {step.hint && (
        <div className="mt-4 flex gap-3 rounded-lg border border-oracle-500/20 bg-oracle-500/5 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-oracle-400" />
          <div className="text-sm text-dark-300">
            <span className="font-medium text-oracle-400">{t("hint")}: </span>
            {step.hint[locale]}
          </div>
        </div>
      )}

      {step.challenge && (
        <div className="mt-4 flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <div className="text-sm text-dark-300">
            <span className="font-medium text-yellow-400">{t("challenge")}: </span>
            {step.challenge[locale]}
          </div>
        </div>
      )}
    </div>
  );
}
