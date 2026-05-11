import { NextRequest, NextResponse } from "next/server";
import { getExperimentStore } from "@/lib/experiment";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { sessionId?: string; startedAt?: string };
    if (!body.sessionId || !body.startedAt) {
      return NextResponse.json({ error: "sessionId and startedAt are required." }, { status: 400 });
    }

    const session = await getExperimentStore().startSession(body.sessionId, body.startedAt);
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to start experiment session", error);
    return NextResponse.json({ error: "Failed to start session." }, { status: 500 });
  }
}
