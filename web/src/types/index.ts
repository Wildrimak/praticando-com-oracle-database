/**
 * @description Core type definitions for the Oracle Tuning Lab application.
 * @module types
 */

/** Supported application locales */
export type Locale = "pt-BR" | "en";

/** Text content available in both pt-BR and en */
export type BilingualText = {
  "pt-BR": string;
  en: string;
};

/** A single step within an exercise (theory + optional SQL) */
export interface ExerciseStep {
  /** Unique step identifier within the exercise */
  id: string;
  /** Step title in both languages */
  title: BilingualText;
  /** Markdown content explaining the concept */
  content: BilingualText;
  /** Pre-filled SQL code for the step */
  sql?: string;
  /** Whether the user can edit the SQL (false = read-only demonstration) */
  editable?: boolean;
  /** Optional hint shown below the content */
  hint?: BilingualText;
  /** Optional challenge prompt for advanced exploration */
  challenge?: BilingualText;
}

/** An exercise with metadata and ordered steps */
export interface Exercise {
  /** URL-friendly identifier (e.g., "explain-plan-basics") */
  slug: string;
  /** Lucide icon name for the exercise card */
  icon: string;
  /** Difficulty level for badge coloring */
  difficulty: "beginner" | "intermediate" | "advanced";
  /** Estimated completion time in minutes */
  estimatedTime: number;
  /** Exercise title in both languages */
  title: BilingualText;
  /** Exercise description in both languages */
  description: BilingualText;
  /** Ordered list of exercise steps */
  steps: ExerciseStep[];
}

/** Result from executing SQL via the /api/execute endpoint */
export interface SqlExecutionResult {
  /** Raw SQL*Plus output text */
  output: string;
  /** Server-side execution time in milliseconds */
  executionTime: number;
  /** Whether the execution completed without Oracle errors */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
}

/** Result from the /api/health endpoint */
export interface HealthCheckResult {
  /** Whether the Docker container is running */
  containerRunning: boolean;
  /** Whether Oracle is responding to queries */
  oracleReady: boolean;
}

/** Persisted progress for a single exercise (stored in localStorage) */
export interface ExerciseProgress {
  /** Exercise slug this progress belongs to */
  slug: string;
  /** Array of completed step IDs */
  completedSteps: string[];
  /** ID of the last visited step */
  lastStepId?: string;
}
