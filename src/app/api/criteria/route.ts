import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { getAllCriteria, updateCriterion } from "@/lib/spk-repository";
import type { AttributeType } from "@/lib/types";

export async function GET() {
  try {
    const criteria = await getAllCriteria();
    return NextResponse.json({ criteria });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: number;
      name?: string;
      attributeType?: AttributeType;
      unit?: string;
      scaleDescription?: string;
    };

    if (!body.id || !body.name?.trim() || !body.unit?.trim() || !body.scaleDescription?.trim()) {
      return NextResponse.json(
        { error: "ID, nama, satuan, dan skala penilaian kriteria wajib diisi." },
        { status: 400 }
      );
    }

    if (body.attributeType !== "benefit" && body.attributeType !== "cost") {
      return NextResponse.json(
        { error: "Jenis atribut harus 'benefit' atau 'cost'." },
        { status: 400 }
      );
    }

    const criteria = await updateCriterion({
      id: Number(body.id),
      name: body.name,
      attributeType: body.attributeType,
      unit: body.unit,
      scaleDescription: body.scaleDescription,
    });
    return NextResponse.json({ criteria });
  } catch (err) {
    return handleApiError(err);
  }
}
