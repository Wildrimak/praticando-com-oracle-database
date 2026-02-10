/** @description i18n routing configuration. Supported locales: pt-BR (default), en. */
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
});
