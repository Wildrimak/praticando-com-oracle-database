"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Database } from "lucide-react";
import { ConnectionStatus } from "../common/ConnectionStatus";
import { LanguageSwitcher } from "../common/LanguageSwitcher";

/**
 * @description Sticky top header with Oracle Tuning Lab branding, navigation link to
 * exercises, Oracle connection status indicator, and language switcher.
 */
export function Header() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-50 border-b border-dark-700 bg-dark-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-oracle-500" />
          <span className="text-lg font-bold text-oracle-500">
            {t("title")}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/exercises"
            className="text-sm text-dark-300 transition-colors hover:text-oracle-400"
          >
            {t("exercises")}
          </Link>
          <ConnectionStatus />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
