import { NextRequest, NextResponse } from "next/server";
import { getExperimentStore } from "@/lib/experiment";
import type { CartItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      endedAt?: string;
      durationMs?: number;
      cartFinal?: CartItem[];
    };

    if (!body.sessionId || !body.endedAt || typeof body.durationMs !== "number" || !Array.isArray(body.cartFinal)) {
      return NextResponse.json({ error: "Missing required finish fields." }, { status: 400 });
    }

    const session = await getExperimentStore().finishSession({
      sessionId: body.sessionId,
      endedAt: body.endedAt,
      durationMs: body.durationMs,
      cartFinal: body.cartFinal
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to finish experiment session", error);
    return NextResponse.json({ error: "Failed to finish session." }, { status: 500 });
  }
}
