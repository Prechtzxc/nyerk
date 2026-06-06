"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  FileText,
  Filter,
  Inbox,
  Search,
  X,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/src/modules/shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/modules/shared/components/ui/select"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import { cn } from "@/src/modules/shared/lib/utils"
import { useBookings, type Booking } from "@/src/modules/client/contexts/booking-context"
import { getPaymentMethodLabel } from "@/src/modules/shared/lib/labels"

const BOOKING_STORAGE_KEY = "oneestela_global_bookings_v2"

function formatDate(date?: string) {
  if (!date) return "—"
  try {
    return new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(date))
  } catch {
    return date
  }
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0)
  return `₱${Number.isFinite(amount) ? amount.toLocaleString("en-PH") : "0"}`
}

function getStatusBadgeClass(status?: string) {
  const v = String(status || "").toLowerCase()
  if (["confirmed", "reservation_secured", "slot_secured", "slot_verified"].includes(v)) return "border-emerald-100 bg-emerald-50 text-emerald-700"
  if (["completed", "complete"].includes(v)) return "border-blue-100 bg-blue-50 text-blue-700"
  if (["pending", "verifying"].includes(v)) return "border-orange-100 bg-orange-50 text-orange-700"
  if (["cancellation_requested", "cancellation requested"].includes(v)) return "border-amber-100 bg-amber-50 text-amber-700"
  if (["cancelled", "declined"].includes(v)) return "border-rose-100 bg-rose-50 text-rose-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function getPaymentBadgeClass(paymentStatus?: string) {
  const v = String(paymentStatus || "").toLowerCase()
  if (["verified", "paid", "slot_verified", "partial"].includes(v)) return "border-emerald-100 bg-emerald-50 text-emerald-700"
  if (["for_review", "cash_pending", "slot_pending"].includes(v)) return "border-amber-100 bg-amber-50 text-amber-700"
  if (v === "rejected") return "border-rose-100 bg-rose-50 text-rose-700"
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function getStatusLabel(status?: string) {
  const v = String(status || "").toLowerCase()
  if (v === "pending") return "Pending"
  if (v === "verifying") return "Verifying"
  if (v === "confirmed") return "Confirmed"
  if (v === "completed" || v === "complete") return "Completed"
  if (v === "cancelled") return "Cancelled"
  if (v === "declined") return "Declined"
  if (v === "cancellation_requested") return "Cancel Requested"
  if (v === "reservation_secured") return "Reservation Secured"
  return String(status || "Unknown").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function getPaymentStatusLabel(paymentStatus?: string) {
  const v = String(paymentStatus || "").toLowerCase()
  if (v === "verified" || v === "paid" || v === "slot_verified") return "Verified"
  if (v === "for_review" || v === "cash_pending" || v === "slot_pending") return "For Review"
  if (v === "partial") return "Partial"
  if (v === "rejected") return "Rejected"
  if (v === "unpaid") return "Unpaid"
  if (!v) return "Not Set"
  return String(paymentStatus || "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTextLabel(value?: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isOfficeBooking(booking: Booking) {
  const text = [(booking as any)?.bookingType, (booking as any)?.rentalType, booking?.venue, booking?.eventType]
    .join(" ")
    .toLowerCase()
  return text.includes("office")
}

export default function AdminBookingsPage() {
  const { toast } = useToast()
  const bookingCtx = useBookings()
  const contextBookings = bookingCtx?.bookings || []
  const markContractSigned = bookingCtx?.markContractSigned

  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showContractConfirm, setShowContractConfirm] = useState(false)

  const urlStatusRef = useMemo(() => {
    if (typeof window === "undefined") return null
    const params = new URLSearchParams(window.location.search)
    return params.get("status")
  }, [])

  useEffect(() => {
    if (urlStatusRef) setStatusFilter(urlStatusRef)
  }, [urlStatusRef])

  useEffect(() => {
    const loadBookings = () => {
      if (contextBookings.length > 0) {
        setBookings(contextBookings)
        return
      }
      const stored = localStorage.getItem(BOOKING_STORAGE_KEY)
      if (stored) {
        try {
          setBookings(JSON.parse(stored))
        } catch {
          setBookings([])
        }
      }
    }

    loadBookings()

    window.addEventListener("storage", loadBookings)
    window.addEventListener("bookingsUpdated", loadBookings)
    window.addEventListener("oneestela_bookings_updated", loadBookings)

    return () => {
      window.removeEventListener("storage", loadBookings)
      window.removeEventListener("bookingsUpdated", loadBookings)
      window.removeEventListener("oneestela_bookings_updated", loadBookings)
    }
  }, [contextBookings])

  const persistBookings = (next: Booking[]) => {
    setBookings(next)
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event("oneestela_bookings_updated"))
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return [b.id, b.eventName, b.venue, b.userInfo?.name, b.userInfo?.email]
        .some((f) => f && String(f).toLowerCase().includes(q))
    })
  }, [bookings, statusFilter, searchQuery])

  const handleMarkCompleted = (id: string) => {
    const next = bookings.map((b) =>
      b.id === id
        ? { ...b, status: "completed" as const, bookingStatus: "Completed" as const, updatedAt: new Date().toISOString() }
        : b,
    )
    persistBookings(next)
    setSelectedBooking(next.find((b) => b.id === id) || null)
    toast({
      title: "Booking Completed",
      description: `Booking ${id} has been marked as completed.`,
      className: "border-none bg-emerald-500 text-white",
    })
  }

  const handleMarkContractSigned = () => {
    if (!selectedBooking || !markContractSigned) return
    const id = selectedBooking.id
    markContractSigned(id, "Administrator")
    setShowContractConfirm(false)

    const updated = bookings.map((b) =>
      b.id === id
        ? {
            ...b,
            contractStatus: "Signed" as const,
            contractSigned: true,
            contractSignedDate: new Date().toISOString(),
            contractSignedBy: "Administrator",
            contractSigningMethod: "Face-to-face",
            updatedAt: new Date().toISOString(),
          }
        : b,
    )
    persistBookings(updated)
    setSelectedBooking(updated.find((b) => b.id === id) || null)

    toast({
      title: "Contract Signed",
      description: `Contract for booking ${id} has been marked as signed.`,
      className: "border-none bg-blue-500 text-white",
    })
  }

  const statusCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      verifying: bookings.filter((b) => b.status === "verifying").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      cancellation_requested: bookings.filter((b) => b.status === "cancellation_requested").length,
    }
  }, [bookings])

  const STATUS_FILTERS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "verifying", label: "Verifying" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "cancellation_requested", label: "Cancel Requested" },
  ]

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
        <BookingDetailsModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => { setSelectedBooking(null); setShowContractConfirm(false) }}
          onMarkCompleted={handleMarkCompleted}
          onMarkContractSigned={() => setShowContractConfirm(true)}
        />

        <ContractSigningConfirmModal
          booking={selectedBooking}
          open={showContractConfirm}
          onCancel={() => setShowContractConfirm(false)}
          onConfirm={handleMarkContractSigned}
        />

        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
                Admin Booking Management
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Booking Management
              </h1>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                View and manage all customer bookings.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-orange-600 sm:w-[170px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {STATUS_FILTERS.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="font-bold">
                      {f.label} ({statusCounts[f.value as keyof typeof statusCounts]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[300px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookings..."
                  className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-xs focus-visible:ring-orange-600"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="flex min-h-[230px] flex-col items-center justify-center px-6 py-10 text-center">
              <Inbox className="mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-base font-black text-slate-900">No bookings found</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {searchQuery || statusFilter !== "all"
                  ? "No bookings match your current filters."
                  : "No bookings have been created yet."}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <AdminBookingCard
                key={booking.id}
                booking={booking}
                onView={() => setSelectedBooking(booking)}
              />
            ))
          )}
        </section>
      </div>
    </div>
  )
}

function AdminBookingCard({
  booking,
  onView,
}: {
  booking: Booking
  onView: () => void
}) {
  const isOfficeRental = isOfficeBooking(booking)
  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate ? formatDate((booking as any).endDate) : startDate

  return (
    <div className="group flex w-full max-w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div className="flex shrink-0 items-center gap-3 sm:w-[200px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          {isOfficeRental ? <FileText className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isOfficeRental ? "Rental" : "Event"}
          </p>
          <p className="break-words whitespace-normal text-sm font-black text-slate-900">
            {booking.eventName || "Untitled"}
          </p>
          <p className="break-words whitespace-normal text-[11px] font-bold text-orange-600">
            {booking.id}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-4 sm:gap-x-3">
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">Customer</p>
          <p className="whitespace-normal break-words text-xs font-black text-slate-800">{booking.userInfo?.name || "—"}</p>
          <p className="whitespace-normal break-words text-[10px] font-bold text-slate-500">{booking.userInfo?.email || "—"}</p>
        </div>
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">Venue</p>
          <p className="whitespace-normal break-words text-xs font-bold text-slate-800">{booking.venue || "N/A"}</p>
        </div>
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">
            {isOfficeRental ? "Start Date" : "Event Date"}
          </p>
          <p className="whitespace-normal break-words text-xs font-bold text-slate-800">{startDate}</p>
        </div>
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">End Date</p>
          <p className="whitespace-normal break-words text-xs font-bold text-slate-800">{endDate}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1">
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
            getStatusBadgeClass(booking.status),
          )}
        >
          {getStatusLabel(booking.status)}
        </span>
        <Button
          variant="outline"
          onClick={onView}
          className="h-8 shrink-0 whitespace-nowrap rounded-lg border-slate-200 px-2.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
        >
          View Details
        </Button>
      </div>
    </div>
  )
}

function BookingDetailsModal({
  booking,
  open,
  onClose,
  onMarkCompleted,
  onMarkContractSigned,
}: {
  booking: Booking | null
  open: boolean
  onClose: () => void
  onMarkCompleted: (id: string) => void
  onMarkContractSigned: () => void
}) {
  if (!booking) return null

  const isPaymentVerified = (() => {
    const ps = String(booking.paymentStatus || "").toLowerCase()
    return (
      ps === "verified" ||
      ps === "paid" ||
      ps === "partial" ||
      ps === "slot_verified" ||
      booking.isSlotSecured === true
    )
  })()

  const isOfficeRental = isOfficeBooking(booking)
  const typeLabel = isOfficeRental ? "Office Space Rental" : booking.eventType || "Event Venue Rental"
  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate ? formatDate((booking as any).endDate) : startDate
  const isCompleted = String(booking.status || "").toLowerCase() === "completed"
  const isCancelled = String(booking.status || "").toLowerCase() === "cancelled"
  const canComplete = !isCompleted && !isCancelled

  const timeValue =
    booking.time ||
    `${booking.startTime || ""}${booking.startTime && booking.endTime ? " – " : ""}${booking.endTime || ""}` ||
    "—"

  const bankRef = (booking as any)?.bankReferenceNumber || (booking as any)?.referenceNumber || null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100vh-32px)] max-h-[calc(100dvh-32px)] w-[calc(100vw-2rem)] max-w-[950px] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 pt-6 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Booking Details
            </p>
            <DialogTitle className="mt-1 truncate text-xl font-black text-slate-900">
              {booking.eventName || "Untitled Booking"}
            </DialogTitle>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              {typeLabel} <span className="mx-1.5 text-slate-300">·</span> #{booking.id}
            </p>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-4 sm:px-6 sm:py-5 sm:pb-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-block rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                getStatusBadgeClass(booking.status),
              )}
            >
              {getStatusLabel(booking.status)}
            </span>
            <span
              className={cn(
                "inline-block rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                getPaymentBadgeClass(booking.paymentStatus),
              )}
            >
              {getPaymentStatusLabel(booking.paymentStatus)}
            </span>
            {booking.cancellationStatus && booking.cancellationStatus !== "None" && (
              <>
                <span className="inline-block rounded-md border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                  Cancel: {booking.cancellationStatus}
                </span>
                {booking.refundStatus && (
                  <span className="inline-block rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                    Refund: {booking.refundStatus}
                  </span>
                )}
              </>
            )}
          </div>

          {(booking.contractStatus === "Signed" || booking.contractSigned) && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract</p>
              </div>
              <div className="space-y-2">
                <span
                  className={cn(
                    "inline-block rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                    "border-emerald-100 bg-emerald-50 text-emerald-700",
                  )}
                >
                  Contract Status: Signed
                </span>
                {booking.contractSignedDate && (
                  <p className="text-xs font-semibold text-slate-700">
                    Signed Date: {formatDate(booking.contractSignedDate)}
                  </p>
                )}
                {booking.contractSignedBy && (
                  <p className="text-xs font-semibold text-slate-700">
                    Signed By: {booking.contractSignedBy}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-500">
                  Signing Method: Face-to-face
                </p>
              </div>
            </div>
          )}

          {isPaymentVerified && !(booking.contractStatus === "Signed" || booking.contractSigned) && !isCancelled && !isCompleted && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract</p>
              </div>
              <div className="space-y-3">
                <span
                  className={cn(
                    "inline-block rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                    "border-orange-100 bg-orange-50 text-orange-700",
                  )}
                >
                  Contract Status: Pending Signature
                </span>
                <p className="text-xs font-semibold text-orange-700">
                  Contract signing must be completed onsite at the One Estela Place office.
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  The customer must personally sign the official contract at the One Estela Place office.
                </p>
                <Button
                  onClick={onMarkContractSigned}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Mark Contract as Signed
                </Button>
              </div>
            </div>
          )}

          {!isPaymentVerified && !(booking.contractStatus === "Signed" || booking.contractSigned) && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract</p>
              </div>
              <span
                className={cn(
                  "inline-block rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                  "border-slate-200 bg-slate-50 text-slate-600",
                )}
              >
                Contract Status: Not Available
              </span>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Contract will be available once payment is verified.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
            <div className="rounded-xl border border-slate-100 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booking Information</p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Customer</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{booking.userInfo?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{booking.userInfo?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Booking Date</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{formatDate(booking.createdAt) || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isOfficeRental ? "Start Date" : "Event Date"}</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{startDate || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">End Date</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{endDate || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Venue / Office</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{booking.venue || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Guests</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{booking.guestCount ? `${booking.guestCount} pax` : "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{timeValue}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Booking ID</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">#{booking.id}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Event Type</p>
                  <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{typeLabel}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100">
              <PaymentSummaryCard booking={booking} bankRef={bankRef} />
            </div>
          </div>

          {booking.specialRequests && (
            <div className="mt-5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Special Requests</p>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-slate-700">{booking.specialRequests}</p>
            </div>
          )}

          {booking.cancellationStatus && booking.cancellationStatus !== "None" && (
            <div className="mt-5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cancellation / Refund Status</p>
              </div>
              <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cancellation</span>
                  <span className="font-bold text-slate-900">{booking.cancellationStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Refund</span>
                  <span className="font-bold text-slate-900">{booking.refundStatus || "Not Applicable"}</span>
                </div>
                {booking.refundEligibilityNote && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Eligibility</span>
                    <span className="font-bold text-slate-900">{booking.refundEligibilityNote}</span>
                  </div>
                )}
                {booking.daysBeforeEventAtCancellation !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Days before event</span>
                    <span className="font-bold text-slate-900">{booking.daysBeforeEventAtCancellation} days</span>
                  </div>
                )}
                {booking.refundClaimNote && (
                  <div className="mt-2 rounded-lg bg-amber-100/50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    {booking.refundClaimNote}
                  </div>
                )}
                {booking.cancellationDeclineReason && (
                  <div className="mt-2 rounded-lg bg-rose-100/50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                    Decline Reason: {booking.cancellationDeclineReason}
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.modificationRequested && booking.modificationStatus && booking.modificationStatus !== "None" && (
            <div className="mt-5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modification Status</p>
              </div>
              <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-slate-900">{booking.modificationStatus}</span>
                </div>
                {booking.modificationReason && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reason</span>
                    <span className="font-bold text-slate-900">{booking.modificationReason}</span>
                  </div>
                )}
                {booking.modificationDeclineReason && (
                  <div className="mt-2 rounded-lg bg-rose-100/50 px-3 py-2 text-[11px] font-semibold text-rose-700">
                    Decline Reason: {booking.modificationDeclineReason}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-lg border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Close
            </Button>
            {canComplete && (
              <Button
                onClick={() => onMarkCompleted(booking.id)}
                className="h-10 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Mark as Completed
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PaymentSummaryCard({
  booking,
  bankRef,
}: {
  booking: Booking
  bankRef: string | null
}) {
  const rawAmountPaid = (booking as any)?.amountPaid || (booking as any)?.downPayment || 0
  const amountPaid = Number(rawAmountPaid) || 0
  const totalPrice = Number(booking.totalPrice) || 0
  const hasPaid = amountPaid > 0
  const hasTotal = totalPrice > 0
  const remaining = hasTotal && hasPaid ? Math.max(0, totalPrice - amountPaid) : null

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Summary</p>
      </div>

      <div className="grid gap-y-3 gap-x-6 sm:grid-cols-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Method</p>
          <p className="text-xs font-bold text-slate-800">
            {booking.paymentMethod ? getPaymentMethodLabel(booking.paymentMethod) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Type</p>
          <p className="text-xs font-bold text-slate-800">
            {booking.paymentType ? formatTextLabel(booking.paymentType) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
          <p className="text-xs font-bold text-slate-800">{hasTotal ? formatMoney(totalPrice) : "—"}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Amount Paid</p>
          <p className="text-xs font-bold text-slate-800">{hasPaid ? formatMoney(amountPaid) : "—"}</p>
        </div>
        {remaining !== null && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Remaining Balance</p>
            <p className="text-xs font-bold text-amber-700">{remaining > 0 ? formatMoney(remaining) : "—"}</p>
          </div>
        )}
      </div>

      {bankRef && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bank Reference</p>
          <p className="mt-0.5 text-xs font-bold text-slate-900">{bankRef}</p>
        </div>
      )}
    </div>
  )
}

function ContractSigningConfirmModal({
  booking,
  open,
  onCancel,
  onConfirm,
}: {
  booking: Booking | null
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="w-[calc(100vw-28px)] max-w-[520px] rounded-2xl border-0 bg-white p-0 shadow-2xl [&>button]:hidden">
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText className="h-8 w-8" />
          </div>

          <DialogTitle className="text-2xl font-black text-slate-950">
            Mark Contract as Signed?
          </DialogTitle>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Are you sure you want to mark this contract as signed? This should only be done after
            the customer has signed the official contract face-to-face at the One Estela Place office.
          </p>

          {booking && (
            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Booking ID</span>
                <span className="font-bold text-slate-900">{booking.id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Customer</span>
                <span className="font-bold text-slate-900">{booking.userInfo?.name || "No Name"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Event</span>
                <span className="font-bold text-slate-900">{booking.eventName || "Untitled"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Contract Status</span>
                <span className="font-bold text-slate-900">{booking.contractStatus === "Signed" ? "Signed" : "Pending Signature"}</span>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="h-11 rounded-xl border-slate-200 text-sm font-black text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="h-11 rounded-xl bg-blue-600 text-sm font-black text-white hover:bg-blue-700"
            >
              Yes, Mark as Signed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
