"use client"

import { Users } from "lucide-react"

export default function UsersPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="border-b border-slate-200 pb-5">
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

        <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center mt-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-slate-700">No users found</h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Registered customers will appear here once Firebase Authentication is connected.
          </p>
        </div>
      </div>
    </div>
  )
}
