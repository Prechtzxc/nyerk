import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName" },
        { status: 400 },
      )
    }

    const userRecord = await getAdminAuth().createUser({
      email,
      password,
      displayName: fullName,
    })

    return NextResponse.json({ uid: userRecord.uid })
  } catch (error) {
    console.error("[API/staff] POST error:", error)
    const message = error instanceof Error ? error.message : "Failed to create staff"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { uid, disabled } = body

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 })
    }

    await getAdminAuth().updateUser(uid, { disabled: !!disabled })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API/staff] PATCH error:", error)
    const message = error instanceof Error ? error.message : "Failed to update staff"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")

    if (!uid) {
      return NextResponse.json({ error: "Missing uid query parameter" }, { status: 400 })
    }

    await getAdminAuth().deleteUser(uid)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API/staff] DELETE error:", error)
    const message = error instanceof Error ? error.message : "Failed to delete staff"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
