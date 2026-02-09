export type Locale = "pt-BR" | "en";

export type BilingualText = {
  "pt-BR": string;
  en: string;
};

export interface ExerciseStep {
  id: string;
  title: BilingualText;
  content: BilingualText;
  sql?: string;
  editable?: boolean;
  hint?: BilingualText;
  challenge?: BilingualText;
}

export interface Exercise {
  slug: string;
  icon: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  title: BilingualText;
  description: BilingualText;
  steps: ExerciseStep[];
}

export interface SqlExecutionResult {
  output: string;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface HealthCheckResult {
  containerRunning: boolean;
  oracleReady: boolean;
}

export interface ExerciseProgress {
  slug: string;
  completedSteps: string[];
  lastStepId?: string;
}
