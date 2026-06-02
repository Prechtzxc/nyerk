"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  Star,
  Users,
  X,
  Filter,
  XCircle,
  ListChecks,
} from "lucide-react"

import { useAuth } from "@/src/modules/shared/auth/auth-context"
import {
  type Booking,
  calculateDaysBeforeEvent,
  getCancellationMessage,
  getRefundStatusLabel,
  isCancellationAllowed,
  isRefundEligible,
  useBookings,
} from "@/src/modules/client/contexts/booking-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import { ReserveDialog } from "@/src/modules/client/components/reserve-dialog"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/src/modules/shared/components/ui/dialog"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"
import { PAYMENT_LABELS, getPaymentMethodLabel } from "@/src/modules/shared/lib/labels"
import { cn } from "@/src/modules/shared/lib/utils"

type ReviewRecord = {
  id: string
  bookingId: string
  eventId?: string
  eventName: string
  venue?: string
  customerName?: string
  rating: number
  comment: string
  createdAt: string
}

type BookingFilter =
  | "all"
  | "current"
  | "pending"
  | "verifying"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "cancellation_requested"

const REVIEW_STORAGE_KEY = "oneestela_event_reviews_v1"
const REVIEW_EVENT_NAME = "oneestela_reviews_updated"
const PAGE_SIZE = 10

const FILTER_OPTIONS: { value: BookingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "current", label: "Current" },
  { value: "pending", label: "Pending Verification" },
  { value: "verifying", label: "Verifying" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancellation_requested", label: "Cancel Requested" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

function isDateInRange(value: string, from?: string, to?: string) {
  if (!from && !to) return true
  if (!value) return false
  const target = new Date(value).getTime()
  if (Number.isNaN(target)) return false
  if (from) {
    const fromTime = new Date(from).getTime()
    if (!Number.isNaN(fromTime) && target < fromTime) return false
  }
  if (to) {
    const toTime = new Date(to).getTime()
    if (!Number.isNaN(toTime) && target > toTime) return false
  }
  return true
}

function isCurrentBooking(booking: Booking) {
  const status = String(booking.status || "").toLowerCase()
  if (["completed", "cancelled", "declined"].includes(status)) return false
  const eventDate = booking.date ? new Date(booking.date).getTime() : NaN
  if (!Number.isNaN(eventDate)) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (eventDate < today.getTime()) return false
  }
  return true
}

function getBookingCustomerName(booking: Booking | null) {
  const userInfo = (booking as any)?.userInfo
  return userInfo?.name || userInfo?.fullName || userInfo?.email || "Customer"
}

function getBookingEventName(booking: Booking | null) {
  if (!booking) return "Booked Event"
  return booking.eventName || booking.eventType || booking.venue || "Booked Event"
}

function formatDate(date?: string) {
  if (!date) return "No date"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0)
  return `₱${Number.isFinite(amount) ? amount.toLocaleString("en-PH") : "0"}`
}

function safeParseReviews(value: string | null): ReviewRecord[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadReviews() {
  if (typeof window === "undefined") return []
  return safeParseReviews(window.localStorage.getItem(REVIEW_STORAGE_KEY))
}

function saveReviews(reviews: ReviewRecord[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews))
  window.dispatchEvent(new Event(REVIEW_EVENT_NAME))
}

function hasReviewForBooking(reviews: ReviewRecord[], bookingId: string | number) {
  return reviews.some((review) => String(review.bookingId) === String(bookingId))
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isOfficeBooking(booking: Booking) {
  const text = [
    (booking as any)?.bookingType,
    (booking as any)?.rentalType,
    booking?.venue,
    booking?.eventType,
  ]
    .join(" ")
    .toLowerCase()
  return text.includes("office")
}

function formatContractTerm(value?: string) {
  if (!value) return "Office Rental"
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatTextLabel(value?: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusBadgeClass(status?: string) {
  const normalized = String(status || "").toLowerCase()
  if (["confirmed", "reservation_secured", "slot_verified", "slot_secured"].includes(normalized)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700"
  }
  if (["completed", "complete"].includes(normalized)) {
    return "border-blue-100 bg-blue-50 text-blue-700"
  }
  if (["pending", "verifying"].includes(normalized)) {
    return "border-orange-100 bg-orange-50 text-orange-700"
  }
  if (["cancellation_requested", "cancellation requested"].includes(normalized)) {
    return "border-amber-100 bg-amber-50 text-amber-700"
  }
  if (["cancelled", "declined"].includes(normalized)) {
    return "border-rose-100 bg-rose-50 text-rose-700"
  }
  return "border-slate-200 bg-slate-50 text-slate-600"
}

function getStatusLabel(status?: string) {
  const normalized = String(status || "").toLowerCase()
  if (normalized === "pending") return "Pending"
  if (normalized === "verifying") return "Verifying"
  if (normalized === "confirmed") return "Confirmed"
  if (normalized === "completed" || normalized === "complete") return "Completed"
  if (normalized === "cancelled") return "Cancelled"
  if (normalized === "declined") return "Declined"
  if (normalized === "cancellation_requested" || normalized === "cancellation requested")
    return "Cancel Req"
  if (normalized === "reservation_secured") return "Reservation Secured"
  return formatTextLabel(status || "Unknown")
}

function getPaymentStatusLabel(paymentStatus?: string) {
  const v = String(paymentStatus || "").toLowerCase()
  if (v === "verified" || v === "paid" || v === "slot_verified") return "Verified"
  if (v === "for_review" || v === "cash_pending" || v === "slot_pending") return "For Review"
  if (v === "partial") return "Partial"
  if (v === "rejected") return "Rejected"
  if (v === "unpaid") return "Unpaid"
  if (!v) return "Not Set"
  return formatTextLabel(paymentStatus)
}

function getPaymentBadgeClass(paymentStatus?: string) {
  const v = String(paymentStatus || "").toLowerCase()
  if (["verified", "paid", "slot_verified", "partial"].includes(v)) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700"
  }
  if (["for_review", "cash_pending", "slot_pending"].includes(v)) {
    return "border-amber-100 bg-amber-50 text-amber-700"
  }
  if (v === "rejected") return "border-rose-100 bg-rose-50 text-rose-700"
  if (!v) return "border-slate-200 bg-slate-50 text-slate-600"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function HorizontalBookingCard({
  booking,
  onPay,
  onView,
}: {
  booking: Booking
  onPay: (b: Booking) => void
  onView: (b: Booking) => void
}) {
  const isOfficeRental = isOfficeBooking(booking)
  const typeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking.eventType || "Event Venue Rental"
  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate
    ? formatDate((booking as any).endDate)
    : isOfficeRental
      ? startDate
      : startDate

  return (
    <div className="group flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div className="flex shrink-0 items-center gap-3 sm:w-[260px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          {isOfficeRental ? <FileText className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isOfficeRental ? "Rental" : "Event"}
          </p>
          <p className="truncate text-sm font-black text-slate-900">
            {booking.eventName || "Untitled"}
          </p>
          <p className="truncate text-[11px] font-bold text-orange-600">
            {typeLabel}
          </p>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Booking ID
          </p>
          <p className="mt-0.5 truncate text-xs font-black text-slate-800">
            {booking.id}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Venue
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-800">
            {booking.venue || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {isOfficeRental ? "Start Date" : "Event Date"}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-800">
            {startDate}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            End Date
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-800">
            {endDate}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
              getStatusBadgeClass(booking.status),
            )}
          >
            {getStatusLabel(booking.status)}
          </span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
              getPaymentBadgeClass(booking.paymentStatus),
            )}
          >
            {getPaymentStatusLabel(booking.paymentStatus)}
          </span>
        </div>
        <div className="flex gap-2">
          {booking.status === "pending" && (
            <Button
              onClick={() => onPay(booking)}
              className="h-9 rounded-lg bg-orange-600 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-orange-700"
            >
              <CreditCard className="mr-1 h-3.5 w-3.5" />
              Pay
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onView(booking)}
            className="h-9 rounded-lg border-slate-200 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}

function HistoryRow({
  booking,
  expanded,
  onToggle,
  onView,
}: {
  booking: Booking
  expanded: boolean
  onToggle: () => void
  onView: (b: Booking) => void
}) {
  const isOfficeRental = isOfficeBooking(booking)
  const typeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking.eventType || "Event Venue Rental"
  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate
    ? formatDate((booking as any).endDate)
    : isOfficeRental
      ? startDate
      : startDate

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-3 text-left transition hover:bg-slate-50 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-900">
            {booking.eventName || "Untitled"}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-orange-600">
            {typeLabel} · {booking.venue || "N/A"}
          </p>
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {isOfficeRental ? "Start" : "Event Date"}
          </p>
          <p className="text-[11px] font-bold text-slate-700">{startDate}</p>
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">End</p>
          <p className="text-[11px] font-bold text-slate-700">{endDate}</p>
        </div>
        <div className="hidden flex-wrap items-center gap-1 sm:flex">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
              getStatusBadgeClass(booking.status),
            )}
          >
            {getStatusLabel(booking.status)}
          </span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
              getPaymentBadgeClass(booking.paymentStatus),
            )}
          >
            {getPaymentStatusLabel(booking.paymentStatus)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest sm:hidden",
              getStatusBadgeClass(booking.status),
            )}
          >
            {getStatusLabel(booking.status)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="grid gap-3 border-t border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-2">
          <DetailItem label="Booking ID" value={booking.id} />
          <DetailItem label="Venue / Office" value={booking.venue || "N/A"} />
          <DetailItem label="Customer" value={getBookingCustomerName(booking)} />
          <DetailItem
            label="Amount"
            value={formatMoney((booking as any).totalPrice)}
          />
          <div className="sm:col-span-2">
            <Button
              variant="outline"
              onClick={() => onView(booking)}
              className="h-9 w-full rounded-lg border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-white sm:w-auto"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Open Full Details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs font-bold text-slate-800">{value}</p>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <p className="text-[11px] font-bold text-slate-500">
        Page <span className="font-black text-slate-900">{page}</span> of{" "}
        <span className="font-black text-slate-900">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 w-9 rounded-lg border-slate-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 w-9 rounded-lg border-slate-200"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function BookingDetailsModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking | null
  open: boolean
  onClose: () => void
}) {
  if (!booking) return null
  const isOfficeRental = isOfficeBooking(booking)
  const typeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking.eventType || "Event Venue Rental"
  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate
    ? formatDate((booking as any).endDate)
    : startDate

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
              Booking Details
            </p>
            <DialogTitle className="mt-1 truncate text-xl font-black text-slate-900">
              {booking.eventName || "Untitled Booking"}
            </DialogTitle>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              {typeLabel} · {booking.id}
            </p>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailItem label="Booking Date" value={formatDate(booking.createdAt)} />
            <DetailItem label={isOfficeRental ? "Start Date" : "Event Date"} value={startDate} />
            <DetailItem label="End Date" value={endDate} />
            <DetailItem label="Guests" value={`${booking.guestCount || 0} pax`} />
            <DetailItem label="Venue / Office" value={booking.venue || "N/A"} />
            <DetailItem
              label="Time"
              value={booking.time || `${booking.startTime || ""} - ${booking.endTime || ""}`}
            />
            <DetailItem
              label="Booking Status"
              value={
                <span
                  className={cn(
                    "inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                    getStatusBadgeClass(booking.status),
                  )}
                >
                  {getStatusLabel(booking.status)}
                </span>
              }
            />
            <DetailItem
              label="Payment Status"
              value={
                <span
                  className={cn(
                    "inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                    getPaymentBadgeClass(booking.paymentStatus),
                  )}
                >
                  {getPaymentStatusLabel(booking.paymentStatus)}
                </span>
              }
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Payment Summary
            </p>
            <div className="grid gap-2 text-xs font-bold text-slate-700 sm:grid-cols-3">
              <div>
                <span className="text-slate-400">Method:</span>{" "}
                {getPaymentMethodLabel(booking.paymentMethod)}
              </div>
              <div>
                <span className="text-slate-400">Type:</span>{" "}
                {formatTextLabel(booking.paymentType || "Pending")}
              </div>
              <div>
                <span className="text-slate-400">Total:</span>{" "}
                {formatMoney(booking.totalPrice)}
              </div>
            </div>
          </div>

          {booking.specialRequests && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Special Requests
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {booking.specialRequests}
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 rounded-xl border-slate-200 px-4 text-xs font-bold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const WriteReviewModal = ({
  open,
  booking,
  reviews,
  onClose,
  onSaved,
}: {
  open: boolean
  booking: Booking | null
  reviews: ReviewRecord[]
  onClose: () => void
  onSaved: (reviews: ReviewRecord[]) => void
}) => {
  const { toast } = useToast()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (!open) {
      setRating(5)
      setComment("")
    }
  }, [open])

  const eventName = getBookingEventName(booking)

  const handleSubmit = () => {
    if (!booking) return
    if (!comment.trim()) {
      toast({
        title: "Review required",
        description: "Please write a short review before submitting.",
        variant: "destructive",
      })
      return
    }
    if (hasReviewForBooking(reviews, booking.id)) {
      toast({
        title: "Already reviewed",
        description: "You already wrote a review for this booking.",
        variant: "destructive",
      })
      return
    }
    const nextReviews: ReviewRecord[] = [
      {
        id: createLocalId("review"),
        bookingId: String(booking.id),
        eventId: String((booking as any)?.eventId || (booking as any)?.venueId || ""),
        eventName,
        venue: booking.venue,
        customerName: getBookingCustomerName(booking),
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      },
      ...reviews,
    ]
    saveReviews(nextReviews)
    onSaved(nextReviews)
    toast({
      title: "Review submitted",
      description: "Your review has been added.",
      className: "bg-slate-900 text-white border-none",
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-md rounded-2xl border-0 bg-white p-6 shadow-2xl">
        <DialogTitle className="text-xl font-black text-slate-900">
          Write a Review
        </DialogTitle>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Share your experience for{" "}
          <span className="font-bold text-orange-600">{eventName}</span>.
        </p>
        <div className="mt-5 space-y-5">
          <div>
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Rating
            </Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-full p-1 transition hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-7 w-7",
                      value <= rating
                        ? "fill-orange-500 text-orange-500"
                        : "text-slate-300",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Review
            </Label>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us about your experience..."
              className="mt-2 min-h-[120px] resize-none rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-10 flex-1 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
            >
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const CancellationDialog = ({
  booking,
  reason,
  setReason,
  onClose,
  onSubmit,
}: {
  booking: Booking | null
  reason: string
  setReason: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) => {
  if (!booking) return null
  const allowed = isCancellationAllowed(booking.date)
  const refundEligible = isRefundEligible(booking.date)

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md rounded-2xl border-0 bg-white p-6 shadow-2xl">
        <DialogTitle className="text-xl font-black text-slate-900">
          Request Cancellation
        </DialogTitle>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">{booking.eventName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {booking.venue} · {formatDate(booking.date)}
          </p>
        </div>
        <div
          className={cn(
            "mt-4 rounded-2xl border p-4",
            allowed
              ? refundEligible
                ? "border-emerald-200 bg-emerald-50"
                : "border-orange-200 bg-orange-50"
              : "border-rose-200 bg-rose-50",
          )}
        >
          <div className="flex gap-3">
            <ShieldAlert
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                allowed
                  ? refundEligible
                    ? "text-emerald-600"
                    : "text-orange-600"
                  : "text-rose-600",
              )}
            />
            <p
              className={cn(
                "text-sm font-semibold leading-6",
                allowed
                  ? refundEligible
                    ? "text-emerald-700"
                    : "text-orange-800"
                  : "text-rose-700",
              )}
            >
              {getCancellationMessage(booking.date)}
            </p>
          </div>
        </div>
        {allowed && (
          <div className="mt-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Reason for cancellation *
            </Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Type your reason here..."
              className="mt-2 min-h-[110px] resize-none rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
          >
            Close
          </Button>
          <Button
            disabled={!allowed || !reason.trim()}
            onClick={onSubmit}
            className="h-10 flex-1 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { getUserBookings, requestCancellation } = useBookings()
  const { toast } = useToast()

  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Booking | null>(null)
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<BookingFilter>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)

  useEffect(() => {
    if (user) {
      setMyBookings(getUserBookings(user.id))
    } else {
      const stored = localStorage.getItem("oneestela_global_bookings_v2")
      if (stored) setMyBookings(JSON.parse(stored))
    }
  }, [user, getUserBookings])

  useEffect(() => {
    setReviews(loadReviews())
    const handleReviewsUpdated = () => setReviews(loadReviews())
    window.addEventListener(REVIEW_EVENT_NAME, handleReviewsUpdated)
    window.addEventListener("storage", handleReviewsUpdated)
    return () => {
      window.removeEventListener(REVIEW_EVENT_NAME, handleReviewsUpdated)
      window.removeEventListener("storage", handleReviewsUpdated)
    }
  }, [])

  const sortedBookings = useMemo(
    () =>
      [...myBookings].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [myBookings],
  )

  const currentBooking = useMemo(
    () => sortedBookings.find(isCurrentBooking) || null,
    [sortedBookings],
  )

  const historyBookings = useMemo(
    () => sortedBookings.filter((b) => !currentBooking || b.id !== currentBooking.id),
    [sortedBookings, currentBooking],
  )

  const searchMatch = (booking: Booking, query: string) => {
    if (!query) return true
    const q = query.toLowerCase().trim()
    const fields = [
      booking.id,
      booking.eventName,
      booking.eventType,
      booking.venue,
      getBookingCustomerName(booking),
      booking.status,
      booking.paymentStatus,
    ]
    return fields.some(
      (f) => f && String(f).toLowerCase().includes(q),
    )
  }

  const matchesFilter = (booking: Booking, f: BookingFilter) => {
    if (f === "all") return true
    if (f === "current") return isCurrentBooking(booking)
    return String(booking.status || "").toLowerCase() === f
  }

  const filteredHistory = useMemo(
    () =>
      historyBookings.filter(
        (b) =>
          matchesFilter(b, filter) &&
          searchMatch(b, searchQuery) &&
          isDateInRange(b.date, dateFrom || undefined, dateTo || undefined),
      ),
    [historyBookings, filter, searchQuery, dateFrom, dateTo],
  )

  const totalHistoryPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / PAGE_SIZE),
  )
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages)
  const paginatedHistory = useMemo(
    () =>
      filteredHistory.slice(
        (safeHistoryPage - 1) * PAGE_SIZE,
        safeHistoryPage * PAGE_SIZE,
      ),
    [filteredHistory, safeHistoryPage],
  )

  useEffect(() => {
    setHistoryPage(1)
  }, [searchQuery, filter, dateFrom, dateTo])

  const canWriteReview = (booking: Booking) => {
    const status = String(booking.status || "").toLowerCase()
    if (status !== "completed" && status !== "complete") return false
    if (isOfficeBooking(booking)) return false
    return !hasReviewForBooking(reviews, booking.id)
  }

  const handlePay = (booking: Booking) => {
    if (booking.status === "pending") {
      router.push(`/portal/payments?bookingId=${booking.id}`)
    } else {
      setPaymentTarget(booking)
    }
  }

  const handleCancel = (booking: Booking) => {
    setBookingToCancel(booking)
    setCancelReason("")
  }

  const handleReview = (booking: Booking) => {
    setReviewTarget(booking)
  }

  const handleView = (booking: Booking) => {
    setViewingBooking(booking)
  }

  const submitCancellation = () => {
    if (!bookingToCancel) return
    if (!isCancellationAllowed(bookingToCancel.date)) {
      toast({
        title: "Cancellation Not Available",
        description: getCancellationMessage(bookingToCancel.date),
        variant: "destructive",
      })
      return
    }
    if (!cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      })
      return
    }
    requestCancellation(bookingToCancel.id, cancelReason.trim())
    toast({
      title: "Cancellation Requested",
      description: isRefundEligible(bookingToCancel.date)
        ? "Admin will review your request. If approved, your cash refund can be claimed at the office after 1 week."
        : "Admin will review your cancellation request.",
      className: "bg-slate-900 text-white border-none",
    })
    setBookingToCancel(null)
    setCancelReason("")
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in fade-in space-y-6 p-4 duration-500 md:p-6">
      <WriteReviewModal
        open={!!reviewTarget}
        booking={reviewTarget}
        reviews={reviews}
        onClose={() => setReviewTarget(null)}
        onSaved={setReviews}
      />

      <CancellationDialog
        booking={bookingToCancel}
        reason={cancelReason}
        setReason={setCancelReason}
        onClose={() => {
          setBookingToCancel(null)
          setCancelReason("")
        }}
        onSubmit={submitCancellation}
      />

      <BookingDetailsModal
        booking={viewingBooking}
        open={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your space reservations.
          </p>
        </div>
        <ReserveDialog>
          <Button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 font-bold text-white shadow-sm transition-all hover:bg-orange-700 sm:w-auto">
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </ReserveDialog>
      </div>

      {/* Search + Filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by booking ID, customer, event, venue, or status..."
              className="h-10 rounded-xl border-slate-200 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDateFilter((v) => !v)}
            className={cn(
              "h-10 rounded-xl border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50",
              showDateFilter && "bg-orange-50 text-orange-700 border-orange-200",
            )}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Date Filter
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider transition",
                  active
                    ? "border-orange-300 bg-orange-100 text-orange-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {showDateFilter && (
          <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                From
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 h-9 rounded-lg border-slate-200 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                To
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 h-9 rounded-lg border-slate-200 text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom("")
                  setDateTo("")
                }}
                className="h-9 rounded-lg border-slate-200 px-3 text-xs font-bold"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Clear Dates
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Current Booking */}
      <section>
        <SectionHeader
          title="Current Booking"
          subtitle="Your active reservation"
          icon={<ListChecks className="h-4 w-4" />}
        />
        {currentBooking ? (
          <div className="mt-3">
            <HorizontalBookingCard
              booking={currentBooking}
              onPay={handlePay}
              onView={handleView}
            />
            {canWriteReview(currentBooking) && (
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => handleReview(currentBooking)}
                  className="h-9 rounded-lg bg-blue-600 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  Write a Review
                </Button>
              </div>
            )}
            {currentBooking.status !== "cancelled" &&
              currentBooking.status !== "completed" &&
              isCancellationAllowed(currentBooking.date) && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => handleCancel(currentBooking)}
                    className="h-9 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Request Cancellation
                  </Button>
                </div>
              )}
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Calendar className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-sm font-black text-slate-900">No active booking</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              You don&apos;t have any upcoming or active reservations. Once you make a new
              booking, it will appear here.
            </p>
            <ReserveDialog>
              <Button className="mt-4 h-9 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-orange-700">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Book Now
              </Button>
            </ReserveDialog>
          </div>
        )}
      </section>

      {/* Booking History */}
      <section>
        <SectionHeader
          title="Booking History"
          subtitle={`${filteredHistory.length} record${filteredHistory.length === 1 ? "" : "s"}`}
          icon={<Receipt className="h-4 w-4" />}
        />
        {filteredHistory.length === 0 ? (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <FileText className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-sm font-black text-slate-900">No matching bookings</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search, filter, or date range.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {paginatedHistory.map((booking) => (
              <HistoryRow
                key={booking.id}
                booking={booking}
                expanded={expandedBookingId === booking.id}
                onToggle={() =>
                  setExpandedBookingId(
                    expandedBookingId === booking.id ? null : booking.id,
                  )
                }
                onView={handleView}
              />
            ))}
            <Pagination
              page={safeHistoryPage}
              totalPages={totalHistoryPages}
              onPageChange={setHistoryPage}
            />
          </div>
        )}
      </section>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] font-semibold text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
