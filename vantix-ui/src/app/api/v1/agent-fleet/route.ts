import { NextResponse } from "next/server";
import { DaemonFetchError, fetchDaemonAgentFleet } from "@/lib/fetcher";

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

export async function GET() {
  try {
    const data = await fetchDaemonAgentFleet();
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
