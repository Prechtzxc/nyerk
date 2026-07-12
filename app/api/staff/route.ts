import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/staff] UNCAUGHT error:", error)
    const message = error instanceof Error ? error.message : "Failed to create staff"
    return NextResponse.json(
      {
        error: message,
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : null
            : undefined,
      },
      { status: 500 },
    )
  }
}
