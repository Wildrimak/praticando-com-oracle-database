"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

export function ConnectionStatus() {
  const t = useTranslations("common");
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setStatus(data.oracleReady ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <button
      onClick={checkHealth}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-dark-800"
      title={t("connectionStatus")}
    >
      {status === "checking" && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-dark-400" />
          <span className="text-dark-400">{t("checking")}</span>
        </>
      )}
      {status === "connected" && (
        <>
          <Wifi className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">{t("connected")}</span>
        </>
      )}
      {status === "disconnected" && (
        <>
          <WifiOff className="h-3.5 w-3.5 text-red-500" />
          <span className="text-red-500">{t("disconnected")}</span>
        </>
      )}
    </button>
  );
}
