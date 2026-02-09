import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/docker";

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
