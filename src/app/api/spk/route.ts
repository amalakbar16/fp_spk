import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getFullSpkState } from "@/lib/spk-repository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") ?? "average";
    const state = await getFullSpkState(source);
    return NextResponse.json(state);
  } catch (err) {
    return handleApiError(err);
  }
}
