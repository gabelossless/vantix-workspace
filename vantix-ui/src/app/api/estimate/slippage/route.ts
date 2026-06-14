import { NextResponse } from "next/server";
import { DaemonFetchError, fetchDaemonSlippageEstimate } from "@/lib/fetcher";
import type { Side } from "@/lib/api-types";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof DaemonFetchError) {
    return NextResponse.json(
      { error: error.message, kind: error.kind },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Unexpected error", kind: "unexpected_error" },
    { status: 500 },
  );
}

function parseSide(value: string | null): Side {
  return value?.toLowerCase() === "sell" ? "sell" : "buy";
}

function parseNotional(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50_000;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const side = parseSide(url.searchParams.get("side"));
    const notionalUsd = parseNotional(url.searchParams.get("notional_usd"));
    const data = await fetchDaemonSlippageEstimate(side, notionalUsd);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
