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
  return NextResponse.json({ ok: true, message: "staff API route is alive" })
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

    const { email, password, fullName } = body as {
      email?: string
      password?: string
      fullName?: string
    }

    if (!email || !password || !fullName) {
      console.log("[POST /api/staff] STEP 1b: missing fields")
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName" },
        { status: 400 },
      )
    }

    console.log("[POST /api/staff] STEP 2: getting Firebase Admin Auth instance")
    let auth: Auth
    try {
      auth = getAdminAuth()
    } catch (initError) {
      console.error("[POST /api/staff] STEP 2 FAILED: getAdminAuth() threw", initError)
      return NextResponse.json(
        {
          error:
            initError instanceof Error
              ? initError.message
              : "Failed to initialize Firebase Admin SDK",
          step: "getAdminAuth",
        },
        { status: 500 },
      )
    }

    console.log("[POST /api/staff] STEP 3: creating Firebase user")
    let userRecord
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName,
      })
    } catch (createError) {
      console.error("[POST /api/staff] STEP 3 FAILED: createUser threw", createError)
      const errorCode =
        createError instanceof Error && "code" in createError
          ? (createError as any).code
          : undefined
      return NextResponse.json(
        {
          error:
            createError instanceof Error
              ? createError.message
              : "Failed to create user",
          step: "createUser",
          code: errorCode,
        },
        { status: 409 },
      )
    }

    console.log(
      "[POST /api/staff] STEP 3 OK: user created with uid",
      userRecord.uid,
    )
    return NextResponse.json({ uid: userRecord.uid })
  } catch (error) {
    console.error("[POST /api/staff] UNCAUGHT error:", error)
    const message =
      error instanceof Error ? error.message : "Failed to create staff"
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
