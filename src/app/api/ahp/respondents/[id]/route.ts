import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import {
  type AhpRespondentInput,
  deleteAhpRespondent,
  updateAhpRespondent,
} from "@/lib/spk-repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: "ID responden tidak valid." },
        { status: 400 }
      );
    }
    const body = (await request.json()) as AhpRespondentInput;
    const updated = await updateAhpRespondent(numericId, body);
    return NextResponse.json({ respondent: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: "ID responden tidak valid." },
        { status: 400 }
      );
    }
    await deleteAhpRespondent(numericId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
