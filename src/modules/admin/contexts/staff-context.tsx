"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { StaffPermissions } from "@/src/modules/shared/types/permissions"
import { DEFAULT_STAFF_PERMISSIONS } from "@/src/modules/shared/types/permissions"

export type StaffAccount = {
  id: string
  uid: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  position: string
  role: "staff"
  status: "active" | "inactive"
  permissions: StaffPermissions
  createdAt: string
  lastActive?: string
}

type StaffContextValue = {
  staff: StaffAccount[]
  loading: boolean
  addStaff: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    position: string
    phone?: string
    permissions: StaffPermissions
  }) => Promise<string | null>
  updateStaff: (uid: string, data: Partial<StaffAccount>) => Promise<void>
  deactivateStaff: (uid: string) => Promise<void>
  activateStaff: (uid: string) => Promise<void>
  deleteStaff: (uid: string) => Promise<void>
  toggleStaffPermission: (uid: string, permission: keyof StaffPermissions) => Promise<void>
}

const StaffContext = createContext<StaffContextValue | null>(null)

export const StaffProvider = ({ children }: { children: React.ReactNode }) => {
  const [staff, setStaff] = useState<StaffAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "staff"))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const loaded: StaffAccount[] = []
        snapshot.forEach((docSnap) => {
          const d = docSnap.data()
          const permissions: StaffPermissions = {
            ...DEFAULT_STAFF_PERMISSIONS,
            ...(d.permissions || {}),
          }
          loaded.push({
            id: docSnap.id,
            uid: docSnap.id,
            firstName: d.firstName || "",
            lastName: d.lastName || "",
            fullName: d.fullName || "",
            email: d.email || "",
            phone: d.phone || "",
            position: d.position || "",
            role: "staff",
            status: d.status === "inactive" ? "inactive" : "active",
            permissions,
            createdAt: d.createdAt || "",
            lastActive: d.lastActive || "",
          })
        })
        setStaff(loaded)
        setLoading(false)
      },
      (error) => {
        console.error("[StaffContext] Firestore snapshot error:", error)
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const addStaff: StaffContextValue["addStaff"] = async (data) => {
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim()
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName,
        }),
      })
      const contentType = res.headers.get("content-type") || ""
      console.log("[StaffContext] addStaff response:", { status: res.status, contentType })
      if (!contentType.includes("application/json")) {
        const text = await res.text()
        console.error("[StaffContext] addStaff non-JSON response body:", text)
        throw new Error(`Expected JSON but got ${contentType} (${res.status}): ${text.slice(0, 500)}`)
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create staff")

      const uid: string = json.uid
      const now = new Date().toISOString()
      const userDocRef = doc(db, "users", uid)
      await setDoc(userDocRef, {
        uid,
        email: data.email.toLowerCase().trim(),
        fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || "",
        position: data.position,
        role: "staff",
        status: "active",
        permissions: data.permissions,
        createdAt: now,
        lastActive: now,
        createdAtServer: serverTimestamp(),
      })

      return uid
    } catch (error) {
      console.error("[StaffContext] addStaff error:", error)
      throw error
    }
  }

  const updateStaff: StaffContextValue["updateStaff"] = async (uid, data) => {
    try {
      const userDocRef = doc(db, "users", uid)
      const updateData: Record<string, any> = {}
      if (data.firstName !== undefined) updateData.firstName = data.firstName
      if (data.lastName !== undefined) updateData.lastName = data.lastName
      if (data.fullName !== undefined) updateData.fullName = data.fullName
      if (data.email !== undefined) updateData.email = data.email
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.position !== undefined) updateData.position = data.position
      if (data.permissions !== undefined) updateData.permissions = data.permissions
      await updateDoc(userDocRef, updateData)
    } catch (error) {
      console.error("[StaffContext] updateStaff error:", error)
      throw error
    }
  }

  const deactivateStaff: StaffContextValue["deactivateStaff"] = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid)
      await updateDoc(userDocRef, { status: "inactive" })
      await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, disabled: true }),
      })
    } catch (error) {
      console.error("[StaffContext] deactivateStaff error:", error)
      throw error
    }
  }

  const activateStaff: StaffContextValue["activateStaff"] = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid)
      await updateDoc(userDocRef, { status: "active" })
      await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, disabled: false }),
      })
    } catch (error) {
      console.error("[StaffContext] activateStaff error:", error)
      throw error
    }
  }

  const deleteStaff: StaffContextValue["deleteStaff"] = async (uid) => {
    try {
      await fetch(`/api/staff?uid=${uid}`, { method: "DELETE" })
      const userDocRef = doc(db, "users", uid)
      await deleteDoc(userDocRef)
    } catch (error) {
      console.error("[StaffContext] deleteStaff error:", error)
      throw error
    }
  }

  const toggleStaffPermission: StaffContextValue["toggleStaffPermission"] = async (uid, permission) => {
    try {
      const userDocRef = doc(db, "users", uid)
      const member = staff.find((s) => s.uid === uid)
      if (!member) return
      const current = member.permissions[permission]
      const updatePath = `permissions.${permission}`
      await updateDoc(userDocRef, { [updatePath]: !current })
    } catch (error) {
      console.error("[StaffContext] toggleStaffPermission error:", error)
      throw error
    }
  }

  const value: StaffContextValue = {
    staff,
    loading,
    addStaff,
    updateStaff,
    deactivateStaff,
    activateStaff,
    deleteStaff,
    toggleStaffPermission,
  }

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}

export const useStaff = (): StaffContextValue => {
  const context = useContext(StaffContext)
  if (!context) throw new Error("useStaff must be used within a StaffProvider")
  return context
}
