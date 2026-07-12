import { NextRequest, NextResponse } from "next/server"
import "server-only"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import type { Auth } from "firebase-admin/auth"

let authInstance: Auth | null = null

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ ok: true, bodyReceived: !!body })
  } catch (parseError) {
    console.error("body parse error", parseError)
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    )
  }
}
