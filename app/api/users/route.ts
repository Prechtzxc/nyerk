import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const result = await adminAuth.listUsers(1000)
    const users = result.users.map((u) => ({
      uid: u.uid,
      displayName: u.displayName || "",
      email: u.email || "",
      phoneNumber: u.phoneNumber || "",
      disabled: u.disabled,
      creationTime: u.metadata.creationTime || "",
    }))
    users.sort((a, b) => {
      const tA = a.creationTime ? new Date(a.creationTime).getTime() : 0
      const tB = b.creationTime ? new Date(b.creationTime).getTime() : 0
      return tB - tA
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error("[API/users] listUsers error:", error)
    return NextResponse.json({ users: [], error: "Failed to list users" }, { status: 500 })
  }
}
