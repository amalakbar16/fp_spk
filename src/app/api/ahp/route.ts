import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getAllAhpRespondents } from "@/lib/spk-repository";

export async function GET() {
  try {
    const { criteria, respondents, groupAhp } = await getAllAhpRespondents();
    return NextResponse.json({ criteria, respondents, ahp: groupAhp });
  } catch (err) {
    return handleApiError(err);
  }
}
