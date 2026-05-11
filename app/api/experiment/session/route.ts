import { NextRequest, NextResponse } from "next/server";
import { getExperimentStore } from "@/lib/experiment";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; taskId?: string };
    const email = body.email?.trim();
    const taskId = body.taskId?.trim();

    if (!email || !taskId) {
      return NextResponse.json({ error: "Email and taskId are required." }, { status: 400 });
    }

    const session = await getExperimentStore().createSession({ email, taskId });
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to create experiment session", error);
    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }
}
