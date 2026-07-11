import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db-init";

export async function GET() {
  try {
    await ensureDbInitialized();
    const tracks = await prisma.roadmapTrack.findMany({
      orderBy: { order: "asc" },
      include: {
        nodes: {
          orderBy: { order: "asc" },
        },
      },
    });
    return NextResponse.json(tracks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch roadmap" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { trackId, title } = body;

    if (!trackId || !title) {
      return NextResponse.json({ error: "trackId and title are required" }, { status: 400 });
    }

    // Get next order
    const lastNode = await prisma.roadmapNode.findFirst({
      where: { trackId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastNode?.order ?? 0) + 1;

    const node = await prisma.roadmapNode.create({
      data: {
        trackId,
        title,
        status: "not_started",
        order: nextOrder,
      },
    });

    return NextResponse.json(node);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add roadmap node" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { nodeId } = body;

    if (!nodeId) {
      return NextResponse.json({ error: "nodeId is required" }, { status: 400 });
    }

    const node = await prisma.roadmapNode.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      return NextResponse.json({ error: "Roadmap node not found" }, { status: 444 });
    }

    // Cycle status: not_started -> in_progress -> done -> not_started
    let nextStatus = "not_started";
    if (node.status === "not_started") {
      nextStatus = "in_progress";
    } else if (node.status === "in_progress") {
      nextStatus = "done";
    } else {
      nextStatus = "not_started";
    }

    const updatedNode = await prisma.roadmapNode.update({
      where: { id: nodeId },
      data: { status: nextStatus },
    });

    return NextResponse.json(updatedNode);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update node status" }, { status: 500 });
  }
}
