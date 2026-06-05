import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, handleSyncEvent } from "@/lib/sync";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-sync-signature") || "";
  const body = await request.text();

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const { event_type, payload } = JSON.parse(body);
    await handleSyncEvent(event_type, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process sync event" },
      { status: 500 }
    );
  }
}
