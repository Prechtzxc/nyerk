"use client"

import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Calendar, FileText, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import { useNotifications } from "../contexts/notification-context"
import type { NotificationType } from "../lib/notifications"
import { useEffect, useRef } from "react"

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

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationDropdown({ open, onClose }: Props) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onClose])

  function handleClick(n: { id?: string; isRead: boolean; link: string }) {
    if (n.id) markAsRead(n.id)
    router.push(n.link)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-32px)] sm:w-80 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-[11px] font-bold text-slate-500 hover:text-slate-700"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-8 w-8 text-slate-300" />
              <p className="text-xs font-semibold text-slate-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const IconComponent = typeIcons[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50",
                    !n.isRead && "bg-blue-50/60",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      !n.isRead ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400",
                    )}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-xs leading-tight",
                        !n.isRead ? "font-bold text-slate-800" : "font-medium text-slate-500",
                      )}
                    >
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                      {formatTimestamp(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}


