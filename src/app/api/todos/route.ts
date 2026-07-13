import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDbInitialized } from "@/lib/db-init";

function parseLocalDate(dateStr?: string | null) {
  if (!dateStr) {
    const todayStr = new Date().toLocaleDateString("en-CA");
    return new Date(`${todayStr}T00:00:00.000Z`);
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function GET(request: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const targetDate = parseLocalDate(dateStr);

    const todos = await prisma.todo.findMany({
      where: {
        date: targetDate,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(todos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { text, date } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const targetDate = parseLocalDate(date);

    const todo = await prisma.todo.create({
      data: {
        date: targetDate,
        text: text.trim(),
        completed: false,
      },
    });

    return NextResponse.json(todo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create todo" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const { id, completed, text } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Todo ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (completed !== undefined) {
      updateData.completed = !!completed;
    }
    if (text !== undefined && typeof text === "string") {
      updateData.text = text.trim();
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(todo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Todo ID is required" }, { status: 400 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete todo" }, { status: 500 });
  }
}
