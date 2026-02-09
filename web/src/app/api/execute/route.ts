import { NextRequest, NextResponse } from "next/server";
import { executeSql } from "@/lib/docker";
import { sanitizeSql } from "@/lib/sql-sanitizer";

// Simple in-memory rate limiter
const requestTimes = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastRequest = requestTimes.get(ip);
  if (lastRequest && now - lastRequest < 1000) {
    return true;
  }
  requestTimes.set(ip, now);

  // Clean old entries every 100 requests
  if (requestTimes.size > 100) {
    const cutoff = now - 60000;
    for (const [key, time] of requestTimes) {
      if (time < cutoff) requestTimes.delete(key);
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { output: "Rate limited. Please wait 1 second.", success: false, executionTime: 0 },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql || typeof sql !== "string") {
      return NextResponse.json(
        { output: "No SQL provided", success: false, executionTime: 0 },
        { status: 400 }
      );
    }

    // Sanitize SQL
    const sanitizeResult = sanitizeSql(sql);
    if (!sanitizeResult.safe) {
      return NextResponse.json(
        {
          output: `Blocked: ${sanitizeResult.reason}`,
          success: false,
          executionTime: 0,
        },
        { status: 403 }
      );
    }

    // Execute SQL
    const result = await executeSql(sql);

    return NextResponse.json({
      output: result.output,
      success: result.success,
      executionTime: result.executionTime,
    });
  } catch {
    return NextResponse.json(
      { output: "Internal server error", success: false, executionTime: 0 },
      { status: 500 }
    );
  }
}
