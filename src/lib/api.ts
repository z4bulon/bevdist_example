import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleApiError(err: unknown, route?: string) {
  if (err instanceof ZodError) {
    const msg = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    logger.warn(`Validation error${route ? ` [${route}]` : ""}`, { details: msg });
    return apiError(msg, 422);
  }
  logger.error(`Unhandled exception${route ? ` [${route}]` : ""}`, {
    message: err instanceof Error ? err.message : String(err),
  });
  return apiError("Internal server error", 500);
}
