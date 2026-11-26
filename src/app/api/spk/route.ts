import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getFullSpkState } from "@/lib/spk-repository";

export async function GET() {
  try {
    const state = await getFullSpkState();
    return NextResponse.json(state);
  } catch (err) {
    return handleApiError(err);
  }
}
