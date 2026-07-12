import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"

export async function GET() {
  return NextResponse.json({ ok: true })
}
