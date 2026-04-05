import { NextRequest, NextResponse } from "next/server";
import { getEntry } from "@/lib/data";

/**
 * GET /api/arc/task/[taskId]
 * Get task details including payment status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    // Get task
    const task = getEntry("tasks", taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        task,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Arc get-task error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to get task" },
      { status: 500 }
    );
  }
}
