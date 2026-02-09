import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  Database,
  ArrowRight,
  Terminal,
  BookOpen,
  Zap,
  Search,
  ListPlus,
  GitMerge,
  Layers,
  Stethoscope,
} from "lucide-react";
import { exercises } from "@/content/exercises";
import type { Locale } from "@/types";

const icons = [Search, ListPlus, GitMerge, Layers, Stethoscope];

const difficultyColors = {
  beginner: "text-green-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

export default function HomePage() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-oracle-500" />
            <span className="text-lg font-bold text-oracle-500">
              {t("title")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/exercises`}
              className="text-sm text-dark-300 hover:text-oracle-400"
            >
              {t("exercises")}
            </Link>
            <Link
              href={locale === "pt-BR" ? "/en" : "/pt-BR"}
              className="text-xs text-dark-400 hover:text-dark-200"
            >
              {locale === "pt-BR" ? "EN" : "PT"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-dark-700">
        <div className="absolute inset-0 bg-gradient-to-br from-oracle-500/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-oracle-500/10 ring-1 ring-oracle-500/20">
            <Database className="h-10 w-10 text-oracle-500" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-dark-50 md:text-5xl">
            Oracle Tuning Lab
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-dark-400">
            {t("heroDescription")}
          </p>
          <Link
            href={`/${locale}/exercises`}
            className="inline-flex items-center gap-2 rounded-lg bg-oracle-500 px-6 py-3 font-medium text-white transition-colors hover:bg-oracle-600"
          >
            {t("startLearning")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-dark-700 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-dark-700 bg-dark-900 p-6">
              <Terminal className="mb-4 h-8 w-8 text-oracle-500" />
              <h3 className="mb-2 text-lg font-semibold text-dark-100">
                {locale === "pt-BR" ? "SQL Interativo" : "Interactive SQL"}
              </h3>
              <p className="text-sm text-dark-400">
                {locale === "pt-BR"
                  ? "Execute SQL diretamente no browser contra um banco Oracle real."
                  : "Execute SQL directly in the browser against a real Oracle database."}
              </p>
            </div>
            <div className="rounded-xl border border-dark-700 bg-dark-900 p-6">
              <BookOpen className="mb-4 h-8 w-8 text-oracle-500" />
              <h3 className="mb-2 text-lg font-semibold text-dark-100">
                {locale === "pt-BR" ? "Passo a Passo" : "Step by Step"}
              </h3>
              <p className="text-sm text-dark-400">
                {locale === "pt-BR"
                  ? "5 exercícios guiados, do básico ao avançado, com explicações claras."
                  : "5 guided exercises, from basic to advanced, with clear explanations."}
              </p>
            </div>
            <div className="rounded-xl border border-dark-700 bg-dark-900 p-6">
              <Zap className="mb-4 h-8 w-8 text-oracle-500" />
              <h3 className="mb-2 text-lg font-semibold text-dark-100">
                {locale === "pt-BR" ? "Resultado Real" : "Real Results"}
              </h3>
              <p className="text-sm text-dark-400">
                {locale === "pt-BR"
                  ? "Veja planos de execução reais com destaque para operações importantes."
                  : "See real execution plans with highlighting for important operations."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exercises */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-dark-100">
            {t("whatYouWillLearn")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((ex, i) => {
              const Icon = icons[i];
              return (
                <Link
                  key={ex.slug}
                  href={`/${locale}/exercises/${ex.slug}`}
                  className="group flex flex-col rounded-xl border border-dark-700 bg-dark-900 p-6 transition-all hover:border-oracle-500/50"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-oracle-500/10">
                      <Icon className="h-5 w-5 text-oracle-500" />
                    </div>
                    <span
                      className={`text-xs font-medium ${difficultyColors[ex.difficulty]}`}
                    >
                      {t(`difficulty.${ex.difficulty}`)}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold text-dark-100 group-hover:text-oracle-400">
                    {i + 1}. {ex.title[locale]}
                  </h3>
                  <p className="mb-3 flex-1 text-sm text-dark-400">
                    {ex.description[locale]}
                  </p>
                  <div className="flex items-center justify-between text-xs text-dark-500">
                    <span>
                      ~{ex.estimatedTime} {t("minutes")} · {ex.steps.length}{" "}
                      {t("step")}s
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="border-t border-dark-700 py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-xl font-bold text-dark-100">
            {t("setupRequired")}
          </h2>
          <p className="mb-6 text-sm text-dark-400">{t("setupInstructions")}</p>
          <div className="mx-auto max-w-lg rounded-lg border border-dark-700 bg-dark-900 p-4 text-left">
            <code className="terminal-output text-sm text-green-400">
              $ docker compose up -d
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-dark-500">
          {t("footerText")}
        </div>
      </footer>
    </div>
  );
}
