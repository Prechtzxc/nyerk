import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  try {
    console.log("[POST /api/staff] STEP 1: parsing request body")
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[POST /api/staff] STEP 1 FAILED: body parse error", parseError)
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      )
    }
    console.log("[POST /api/staff] STEP 1 OK: body parsed", { hasEmail: !!body.email, hasPassword: !!body.password, hasFullName: !!body.fullName })
    return NextResponse.json({ ok: true, body: !!body })
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
