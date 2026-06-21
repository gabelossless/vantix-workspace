import { NextRequest, NextResponse } from "next/server";
import { DaemonFetchError, fetchDaemonCapitalSearch } from "@/lib/fetcher";

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const limitRaw = searchParams.get("limit");
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = limitRaw ? Number(limitRaw) : undefined;

  try {
    const data = await fetchDaemonCapitalSearch(q, limit, cursor);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
