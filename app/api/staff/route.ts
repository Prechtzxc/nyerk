import { NextRequest, NextResponse } from "next/server"
import "server-only"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import type { Auth } from "firebase-admin/auth"
import type { ServiceAccount } from "firebase-admin"

let authInstance: Auth | null = null

function getAdminAuth(): Auth {
  if (authInstance) return authInstance

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Required env vars: " +
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.",
    )
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    })
  }

  authInstance = getAuth()
  return authInstance
}

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
