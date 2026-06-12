"use client"
import React, { createContext, useContext, useState } from "react"

export type StaffAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  role: "admin" | "staff" | "manager";
  status: "active" | "inactive";
  lastActive: string;
}

const mockStaffData: { staff: StaffAccount[] } = {
  staff: [
    {
      id: "1",
      firstName: "System",
      lastName: "Admin",
      email: "admin@oneestela.com",
      position: "Administrator",
      role: "admin",
      status: "active",
      lastActive: "Just now"
    },
    {
      id: "2",
      firstName: "Front",
      lastName: "Desk",
      email: "frontdesk@oneestela.com",
      position: "Front Desk Officer",
      role: "staff",
      status: "active",
      lastActive: "2 hours ago"
    }
  ]
}

type StaffContextValue = {
  staff: StaffAccount[]
  setStaff: React.Dispatch<React.SetStateAction<StaffAccount[]>>
  addStaff: (data: Omit<StaffAccount, "id" | "role" | "lastActive"> & { status: "active" | "inactive" }) => void
  updateStaff: (id: string, data: Partial<StaffAccount>) => void
  deactivateStaff: (id: string) => void
  activateStaff: (id: string) => void
}

const StaffContext = createContext<StaffContextValue | null>(null)

export const StaffProvider = ({ children }: { children: React.ReactNode }) => {
  const [staff, setStaff] = useState<StaffAccount[]>(mockStaffData.staff)

  const addStaff: StaffContextValue["addStaff"] = (data) => {
    const entry: StaffAccount = {
      id: `staff-${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      position: data.position,
      role: "staff",
      status: data.status,
      lastActive: "Just now",
    }
    setStaff((current) => [...current, entry])
  }

  const updateStaff: StaffContextValue["updateStaff"] = (id, data) => {
    setStaff((current) =>
      current.map((member) => (member.id === id ? { ...member, ...data } : member))
    )
  }

  const deactivateStaff = (id: string) => {
    setStaff((current) =>
      current.map((member) => (member.id === id ? { ...member, status: "inactive" } : member))
    )
  }

  const activateStaff = (id: string) => {
    setStaff((current) =>
      current.map((member) => (member.id === id ? { ...member, status: "active" } : member))
    )
  }

  const value: StaffContextValue = {
    staff,
    setStaff,
    addStaff,
    updateStaff,
    deactivateStaff,
    activateStaff,
  }

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}

export const useStaff = (): StaffContextValue => {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error("useStaff must be used within a StaffProvider")
  }
  return context
}