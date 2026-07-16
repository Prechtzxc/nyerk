"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCheck,
  FileText,
  Search,
  XCircle,
} from "lucide-react"

import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { useNotifications } from "@/src/modules/shared/contexts/notification-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/modules/shared/components/ui/select"
import { cn } from "@/src/modules/shared/lib/utils"
import type { NotificationType } from "@/src/modules/shared/lib/notifications"

const typeIcons: Record<NotificationType, typeof Bell> = {
  booking_submitted: Calendar,
  booking_approved: Calendar,
  booking_rejected: XCircle,
  modification_requested: Calendar,
  modification_approved: Calendar,
  modification_declined: XCircle,
  cancellation_requested: Calendar,
  cancellation_approved: Calendar,
  cancellation_declined: XCircle,
  payment_submitted: FileText,
  payment_approved: FileText,
  payment_rejected: XCircle,
  remaining_balance_submitted: FileText,
  remaining_balance_approved: FileText,
  remaining_balance_rejected: XCircle,
  maintenance_conflict: AlertTriangle,
  balance_reminder: Bell,
}

const typeLabels: Record<string, string> = {
  booking_submitted: "Booking Request",
  booking_approved: "Booking Approved",
  booking_rejected: "Booking Rejected",
  modification_requested: "Modification Request",
  modification_approved: "Modification Approved",
  modification_declined: "Modification Declined",
  cancellation_requested: "Cancellation Request",
  cancellation_approved: "Cancellation Approved",
  cancellation_declined: "Cancellation Declined",
  payment_submitted: "Payment Submitted",
  payment_approved: "Payment Approved",
  payment_rejected: "Payment Rejected",
  remaining_balance_submitted: "Balance Submitted",
  remaining_balance_approved: "Balance Approved",
  remaining_balance_rejected: "Balance Rejected",
  maintenance_conflict: "Maintenance Conflict",
  balance_reminder: "Balance Reminder",
}

function formatTimestamp(ts: any): string {
  if (!ts) return ""
  const date = ts?.toDate ? ts.toDate() : new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const PAGE_SIZE = 10

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user && user.role === "staff" && !user.permissions?.dashboard) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const types = useMemo(() => {
    const set = new Set(notifications.map((n) => n.type))
    return ["all", ...Array.from(set).sort()]
  }, [notifications])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return notifications.filter((n) => {
      const matchesType = typeFilter === "all" || n.type === typeFilter
      const matchesSearch =
        !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.bookingId && n.bookingId.toLowerCase().includes(q)) ||
        (n.relatedUserName && n.relatedUserName.toLowerCase().includes(q))
      return matchesType && matchesSearch
    })
  }, [notifications, typeFilter, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
              Admin Notifications
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
              Notification History
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              View all system notifications. {unreadCount} unread.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              className="h-9 rounded-xl bg-orange-600 px-4 text-xs font-black text-white shadow-sm hover:bg-orange-700"
            >
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-xs focus-visible:ring-orange-600"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-orange-600 sm:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all" className="font-bold">All Types</SelectItem>
            {types.filter((t) => t !== "all").map((t) => (
              <SelectItem key={t} value={t}>
                {typeLabels[t] || t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-xs font-bold text-slate-500">
          {filtered.length} notification{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-base font-black text-slate-900">No notifications</h3>
            <p className="mt-1 text-sm text-slate-500">
              No notifications match your search or filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((n) => {
              const IconComponent = typeIcons[n.type] ?? Bell
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50",
                    !n.isRead && "bg-blue-50/40",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      !n.isRead ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400",
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm leading-tight",
                      !n.isRead ? "font-bold text-slate-800" : "font-medium text-slate-500",
                    )}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
                      <span>{formatTimestamp(n.createdAt)}</span>
                      {n.bookingId && (
                        <>
                          <span>·</span>
                          <span>Booking: {n.bookingId}</span>
                        </>
                      )}
                      {n.relatedUserName && (
                        <>
                          <span>·</span>
                          <span>By: {n.relatedUserName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className={cn(
                        "rounded px-1.5 py-0.5",
                        !n.isRead ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500",
                      )}>
                        {typeLabels[n.type] || n.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {!n.isRead && (
                      <button
                        onClick={() => n.id && markAsRead(n.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-[11px] font-bold text-slate-500">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - safePage) <= 1) return true
                  return false
                })
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-xs text-slate-400">…</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                          page === safePage
                            ? "bg-orange-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  )
                })}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
