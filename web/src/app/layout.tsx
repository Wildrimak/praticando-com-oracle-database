/**
 * @description Root layout for the Next.js application.
 * Imports global CSS and sets HTML metadata. Passes children through to
 * the locale-specific layout which provides the `<html>` and `<body>` tags.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oracle Tuning Lab",
  description:
    "Interactive platform to learn Oracle Database Tuning hands-on",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
