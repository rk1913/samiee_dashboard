import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db-init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const requirements = await prisma.customRequirement.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(requirements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch requirements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { name, type, targetVal, required } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Requirement name is required" }, { status: 400 });
    }
    if (type !== "boolean" && type !== "numeric") {
      return NextResponse.json({ error: "Invalid type. Must be 'boolean' or 'numeric'" }, { status: 400 });
    }

    const target = type === "boolean" ? 1.0 : parseFloat(targetVal);
    if (type === "numeric" && (isNaN(target) || target < 0)) {
      return NextResponse.json({ error: "Numeric target must be a non-negative number" }, { status: 400 });
    }

    const requirement = await prisma.customRequirement.create({
      data: {
        name: name.trim(),
        type,
        targetVal: target,
        required: required !== false,
      },
    });

    return NextResponse.json(requirement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create requirement" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Requirement ID is required" }, { status: 400 });
    }

    await prisma.customRequirement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete requirement" }, { status: 500 });
  }
}
