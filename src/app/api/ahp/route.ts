import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import {
  getAhpState,
  resetAhpMatrix,
  saveAhpPairs,
} from "@/lib/spk-repository";

export async function GET() {
  try {
    const state = await getAhpState();
    return NextResponse.json(state);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      pairs?: Array<{
        rowCriterionId: number;
        colCriterionId: number;
        value: number;
      }>;
    };

    if (body.action === "reset") {
      const state = await resetAhpMatrix();
      return NextResponse.json(state);
    }

    if (!Array.isArray(body.pairs) || body.pairs.length === 0) {
      return NextResponse.json(
        { error: "Data pasangan perbandingan AHP tidak valid." },
        { status: 400 }
      );
    }

    const state = await saveAhpPairs(body.pairs);
    return NextResponse.json(state);
  } catch (err) {
    return handleApiError(err);
  }
}
