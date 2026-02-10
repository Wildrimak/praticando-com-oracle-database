/**
 * @description Next.js middleware for internationalization (i18n).
 * Detects locale from URL path and redirects to the default locale (pt-BR) if missing.
 * Excludes /api, /_next, and static file routes from locale processing.
 */
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
