"use client";

import { useTranslations } from "next-intl";
import { Database } from "lucide-react";

/** @description Simple footer with Oracle Tuning Lab branding and GitHub link. */
export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t border-dark-700 bg-dark-950 py-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <Database className="h-4 w-4" />
          <span>{t("footerText")}</span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-dark-400 transition-colors hover:text-oracle-400"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
