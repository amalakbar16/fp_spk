import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import {
  type AlternativeInput,
  computeNextAlternativeCode,
  createAlternative,
  getAllAlternatives,
} from "@/lib/spk-repository";

export async function GET() {
  try {
    const alternatives = await getAllAlternatives();
    return NextResponse.json({
      alternatives,
      nextCode: computeNextAlternativeCode(alternatives),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AlternativeInput;
    const created = await createAlternative(body);
    return NextResponse.json({ alternative: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
