"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { useChat } from "@/src/modules/shared/contexts/chat-context"
import { GlobalProvider } from "@/src/modules/shared/components/global-provider"

import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CreditCard,
  BarChart,
  Users,
  Settings,
  UserCheck,
  LogOut,
  Search,
  Bell,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import { getUnreadCount, subscribeUnreadUpdates } from "@/src/modules/shared/lib/chat-unread"
import { cn } from "@/src/modules/shared/lib/utils"
import { LogoutConfirmDialog } from "@/src/modules/shared/components/logout-confirm-dialog"
import { UserAvatar } from "@/src/modules/shared/components/user-avatar"

const ADMIN_MENU = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, key: "dashboard", exact: true },
  { name: "Booking Management", href: "/dashboard/bookings", icon: BookOpen, key: "bookings" },
  { name: "Chat Support", href: "/dashboard/chat", icon: MessageSquare, key: "chat" },
  { name: "Payment Verification", href: "/dashboard/payments", icon: CreditCard, key: "payments" },
  { name: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart, key: "reports" },
  { name: "Staff Management", href: "/dashboard/staff", icon: Users, key: "staff" },
  { name: "CMS Settings", href: "/dashboard/cms", icon: Settings, key: "cms" },
  { name: "Users Information", href: "/users", icon: UserCheck, key: "users" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user, isLoading } = useAuth()
  const { messages } = useChat()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    setChatUnread(getUnreadCount("admin"))
    return subscribeUnreadUpdates(() => {
      setChatUnread(getUnreadCount("admin"))
    })
  }, [])

  useEffect(() => {
    const unreadFromMessages =
      messages?.filter((m: any) => m.sender === "client" && !m.isRead).length || 0
    if (unreadFromMessages > 0 && chatUnread === 0) {
      setChatUnread(unreadFromMessages)
    }
  }, [messages, chatUnread])

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, isLoading, router])

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
  }

  if (isLoading || !user) return null

  const profilePicture = user.profilePicture

  return (
    <GlobalProvider>
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50">
        <header className="z-50 flex h-16 shrink-0 items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white shadow-lg">
          <div className="flex h-full w-64 shrink-0 items-center gap-3 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white leading-tight">
                One Estela Place
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-300">
                Admin Console
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 px-6">
            <div className="relative hidden items-center md:flex">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search admin records..."
                className="h-9 w-[240px] rounded-full border-transparent bg-white/10 pl-9 text-xs text-white placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-orange-500/50"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-white hover:bg-white/10"
              onClick={() => router.push("/dashboard/chat")}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {chatUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black tabular-nums text-white shadow-md ring-2 ring-slate-900">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </Button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 transition hover:bg-white/15"
            >
              <UserAvatar
                name={user.name}
                picture={profilePicture}
                className="h-8 w-8"
                ringClassName="ring-2 ring-white/30"
              />
              <div className="hidden text-left md:block">
                <p className="text-[11px] font-bold capitalize leading-tight text-white">
                  {user.name}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-orange-300">
                  Admin
                </p>
              </div>
            </Link>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4">
              <UserAvatar
                name={user.name}
                picture={profilePicture}
                className="h-10 w-10"
                ringClassName="ring-2 ring-white"
                fallbackClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{user.name}</p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Administrator
                </p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {ADMIN_MENU.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                const showChatBadge = item.key === "chat" && chatUnread > 0

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-bold transition-all",
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-600 hover:bg-orange-50/60 hover:text-orange-700",
                    )}
                  >
                    {isActive && (
                      <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-orange-700" />
                    )}
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 transition-colors",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-orange-500",
                        )}
                      />
                      {item.name}
                    </div>
                    {showChatBadge && (
                      <span
                        className={cn(
                          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums",
                          isActive
                            ? "bg-white text-orange-700"
                            : "bg-rose-500 text-white",
                        )}
                      >
                        {chatUnread > 99 ? "99+" : chatUnread}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-slate-100 bg-slate-50/50 p-3">
              <Button
                type="button"
                variant="ghost"
                className="flex h-10 w-full items-center justify-start rounded-lg px-3 text-[14px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </aside>

          <main className="relative flex-1 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>

        <LogoutConfirmDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          onConfirm={handleConfirmLogout}
          description="Are you sure you want to log out of the admin console? You will be returned to the home page."
        />
      </div>
    </GlobalProvider>
  )
}
