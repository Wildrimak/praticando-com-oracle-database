"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";

/**
 * @description Toggle button that switches the app between pt-BR and en locales.
 * Replaces the locale segment in the URL path and navigates to the new route.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === "pt-BR" ? "en" : "pt-BR";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-dark-300 transition-colors hover:bg-dark-800 hover:text-dark-100"
      title={locale === "pt-BR" ? "Switch to English" : "Mudar para Português"}
    >
      <Languages className="h-3.5 w-3.5" />
      <span>{locale === "pt-BR" ? "EN" : "PT"}</span>
    </button>
  );
}
