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
    const { email, password, fullName } = body as { email?: string; password?: string; fullName?: string }

    if (!email || !password || !fullName) {
      console.log("[POST /api/staff] STEP 1b: missing fields")
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName" },
        { status: 400 },
      )
    }

    console.log("[POST /api/staff] STEP 2: initializing Firebase Admin SDK")
    let auth
    try {
      auth = getAdminAuth()
    } catch (initError) {
      console.error("[POST /api/staff] STEP 2 FAILED: getAdminAuth() threw", initError)
      return NextResponse.json(
        {
          error: initError instanceof Error ? initError.message : String(initError),
          step: "getAdminAuth",
        },
        { status: 500 },
      )
    }
    console.log("[POST /api/staff] STEP 2 OK: got Admin Auth instance")
    return NextResponse.json({ ok: true, hasAuth: !!auth })
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
