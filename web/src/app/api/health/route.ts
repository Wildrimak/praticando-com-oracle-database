/**
 * @description Health check API route (GET /api/health).
 * Returns { containerRunning, oracleReady } indicating Docker container and Oracle DB status.
 * @module api/health
 */
import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/docker";

/** @description Checks Oracle container and database health. Polled by ConnectionStatus every 30s. */
export async function GET() {
  try {
    const result = await checkHealth();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { containerRunning: false, oracleReady: false },
      { status: 500 }
    );
  }
}
