import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import {
  type AhpRespondentInput,
  computeNextRespondentCode,
  getAllAhpRespondents,
  createAhpRespondent,
  resetAhpRespondents,
} from "@/lib/spk-repository";

export async function GET() {
  try {
    const data = await getAllAhpRespondents();
    return NextResponse.json({
      ...data,
      nextCode: computeNextRespondentCode(data.respondents),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AhpRespondentInput;
    const created = await createAhpRespondent(body);
    return NextResponse.json({ respondent: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "reset") {
      const data = await resetAhpRespondents();
      return NextResponse.json({
        ...data,
        nextCode: computeNextRespondentCode(data.respondents),
      });
    }
    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
