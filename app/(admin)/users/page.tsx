"use client"

import { useState, useEffect } from "react"
import { Users } from "lucide-react"

interface UserRecord {
  uid: string
  displayName: string
  email: string
  phoneNumber: string
  disabled: boolean
  creationTime: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("[UsersPage] API fetch error:", err)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="border-b border-slate-200 pb-5 mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
            Admin Users Information
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            User Information
          </h1>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Read-only view of registered customer accounts and contact details.
          </p>
        </section>

        {loading ? (
          <div className="flex min-h-[230px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center mt-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-black text-slate-700">No users found</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              Registered customers will appear here once Firebase Authentication is connected.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {users.map((u) => (
              <div key={u.uid} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-black text-sm uppercase">
                  {(u.displayName || u.email || "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4 sm:gap-x-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Name</p>
                    <p className="text-xs font-black text-slate-800 truncate">{u.displayName || "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{u.email || "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{u.phoneNumber || "—"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    <p className={`text-xs font-bold truncate ${u.disabled ? "text-red-600" : "text-emerald-600"}`}>
                      {u.disabled ? "Disabled" : "Active"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
