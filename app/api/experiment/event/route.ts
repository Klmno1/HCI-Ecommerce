import { NextRequest, NextResponse } from "next/server";
import { getExperimentStore } from "@/lib/experiment";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      action?: string;
      timestamp?: string;
      relativeMs?: number;
      page?: string;
      target?: string;
      label?: string;
      value?: Record<string, unknown>;
    };

    if (!body.sessionId || !body.action || !body.timestamp || typeof body.relativeMs !== "number" || !body.page) {
      return NextResponse.json({ error: "Missing required event fields." }, { status: 400 });
    }

    const session = await getExperimentStore().appendEvent({
      sessionId: body.sessionId,
      action: body.action as never,
      timestamp: body.timestamp,
      relativeMs: body.relativeMs,
      page: body.page,
      target: body.target,
      label: body.label,
      value: body.value
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to append experiment event", error);
    return NextResponse.json({ error: "Failed to save event." }, { status: 500 });
  }
}
