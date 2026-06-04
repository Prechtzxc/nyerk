"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  Star,
  X,
  Filter,
  XCircle,
  ListChecks,
} from "lucide-react"

import { useAuth } from "@/src/modules/shared/auth/auth-context"
import {
  type Booking,
  type BookingReceipt,
  getCancellationMessage,
  isCancellationAllowed,
  isRefundEligible,
  canShowCancellationNotice,
  canRequestCancellation,
  useBookings,
} from "@/src/modules/client/contexts/booking-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import { ReserveDialog } from "@/src/modules/client/components/reserve-dialog"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/src/modules/shared/components/ui/dialog"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"
import { getPaymentMethodLabel } from "@/src/modules/shared/lib/labels"
import {
  ReceiptPaper,
  type ReceiptPaperData,
} from "@/src/modules/shared/components/receipt-paper"
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

function normalizeStatus(value: any) {
  return String(value || "").trim().toLowerCase()
}

function getBookingStatus(booking: any) {
  return normalizeStatus(booking.bookingStatus || booking.status)
}

function getBookingId(booking: any) {
  return String(
    booking.id ||
    booking.bookingId ||
    booking.referenceId ||
    booking.transactionId ||
    ""
  ).trim()
}

function getBookingTime(booking: any) {
  return new Date(
    booking.createdAt ||
    booking.bookingDate ||
    booking.eventDate ||
    booking.startDate ||
    booking.date ||
    0
  ).getTime()
}

function isPastBooking(booking: any) {
  return getBookingStatus(booking) === "completed"
}

function isCurrentBooking(booking: any) {
  return !isPastBooking(booking)
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

const RECEIPTS_STORAGE_KEY = "oneestela_e_receipts_v1"

function readStoredReceipts(): BookingReceipt[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECEIPTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getStoredReceiptByBookingId(
  bookingId: string,
): BookingReceipt | undefined {
  return readStoredReceipts().find((r) => r.bookingId === bookingId)
}

function HorizontalBookingCard({
  booking,
  onView,
}: {
  booking: Booking
  onView: (b: Booking) => void
}) {
  const isOfficeRental = isOfficeBooking(booking)
  const typeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking.eventType || "Event Venue Rental"
  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate
    ? formatDate((booking as any).endDate)
    : startDate

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
            {typeLabel}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-4 sm:gap-x-3">
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">Booking ID</p>
          <p className="whitespace-normal break-words text-xs font-black text-slate-800">{booking.id}</p>
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
          onClick={() => onView(booking)}
          className="h-8 shrink-0 whitespace-nowrap rounded-lg border-slate-200 px-2.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
        >
          View Details
        </Button>
      </div>
    </div>
  )
}

function HistoryRow({
  booking,
  onView,
}: {
  booking: Booking
  onView: (b: Booking) => void
}) {
  const isOfficeRental = isOfficeBooking(booking)
  const typeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking.eventType || "Event Venue Rental"
  const startDate = formatDate(booking.date)

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-orange-200 sm:gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        {isOfficeRental ? <FileText className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-black text-slate-900">
          {booking.eventName || "Untitled"}
        </p>
        <p className="text-[10px] font-semibold text-slate-500 sm:text-[11px]">
          {booking.id}
          <span className="hidden sm:inline">
            {" · "}{typeLabel}{" · "}{booking.venue || "N/A"}{" · "}{startDate}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
            getStatusBadgeClass(booking.status),
          )}
        >
          {getStatusLabel(booking.status)}
        </span>
        <Button
          variant="outline"
          onClick={() => onView(booking)}
          className="h-8 shrink-0 whitespace-nowrap rounded-lg border-slate-200 px-2.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
        >
          View Details
        </Button>
      </div>
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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words text-xs font-bold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function PaymentSummaryCard({
  booking,
  bankRef,
}: {
  booking: Booking
  bankRef: string | null
}) {
  const rawAmountPaid =
    (booking as any)?.amountPaid || (booking as any)?.downPayment || 0
  const amountPaid = Number(rawAmountPaid) || 0
  const totalPrice = Number(booking.totalPrice) || 0
  const hasPaid = amountPaid > 0
  const hasTotal = totalPrice > 0
  const remaining = hasTotal && hasPaid ? Math.max(0, totalPrice - amountPaid) : null

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Payment Summary
        </p>
      </div>

      <div className="grid gap-y-3 gap-x-6 sm:grid-cols-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Method
          </p>
          <p className="text-xs font-bold text-slate-800">
            {booking.paymentMethod
              ? getPaymentMethodLabel(booking.paymentMethod)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Type
          </p>
          <p className="text-xs font-bold text-slate-800">
            {booking.paymentType
              ? formatTextLabel(booking.paymentType)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Total Amount
          </p>
          <p className="text-xs font-bold text-slate-800">
            {hasTotal ? formatMoney(totalPrice) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Amount Paid
          </p>
          <p className="text-xs font-bold text-slate-800">
            {hasPaid ? formatMoney(amountPaid) : "—"}
          </p>
        </div>
        {remaining !== null && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
              Remaining Balance
            </p>
            <p className="text-xs font-bold text-amber-700">
              {remaining > 0 ? formatMoney(remaining) : "—"}
            </p>
          </div>
        )}
      </div>

      {bankRef && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Bank Reference
          </p>
          <p className="mt-0.5 text-xs font-bold text-slate-900">{bankRef}</p>
        </div>
      )}
    </div>
  )
}

function BookingDetailsModal({
  booking,
  open,
  onClose,
  onPay,
  onCancel,
  onViewReceipt,
}: {
  booking: Booking | null
  open: boolean
  onClose: () => void
  onPay?: (b: Booking) => void
  onCancel?: (b: Booking) => void
  onViewReceipt?: (b: Booking) => void
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
  const showNotice = canShowCancellationNotice(booking) && !booking.cancellationStatus
  const bankRef =
    (booking as any)?.bankReferenceNumber || (booking as any)?.referenceNumber || null
  const payStatus = String(booking.paymentStatus || "").toLowerCase()

  const showPay =
    onPay &&
    payStatus !== "verified" &&
    payStatus !== "paid" &&
    payStatus !== "slot_verified" &&
    booking.status !== "completed" &&
    booking.status !== "cancelled"

  const showCancelAction =
    onCancel &&
    booking.status !== "completed" &&
    booking.status !== "cancelled" &&
    booking.cancellationStatus !== "Under Review" &&
    booking.cancellationStatus !== "Approved" &&
    (payStatus === "verified" || (booking as any).isSlotSecured)

  const hasReceipt = !!(
    booking.receipt || getStoredReceiptByBookingId(booking.id)
  )
  const showReceipt =
    onViewReceipt &&
    (payStatus === "verified" ||
      payStatus === "paid" ||
      payStatus === "slot_verified" ||
      hasReceipt)

  const timeValue =
    booking.time ||
    `${booking.startTime || ""}${booking.startTime && booking.endTime ? " – " : ""}${booking.endTime || ""}` ||
    "—"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100vh-32px)] max-h-[calc(100dvh-32px)] w-[calc(100vw-2rem)] max-w-[800px] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-xl"
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
              {typeLabel}{" "}
              <span className="mx-1.5 text-slate-300">·</span> #
              {booking.id}
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

        <div className="flex-1 overflow-y-auto px-6 py-5 pb-20">
          <div className="mb-6 flex flex-wrap items-center gap-2">
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
            {booking.cancellationStatus &&
              booking.cancellationStatus !== "None" && (
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

          <div className="mb-6 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Booking Information
              </p>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <DetailItem
                label="Booking Date"
                value={formatDate(booking.createdAt) || "—"}
              />
              <DetailItem
                label={isOfficeRental ? "Start Date" : "Event Date"}
                value={startDate || "—"}
              />
              <DetailItem label="End Date" value={endDate || "—"} />
              <DetailItem
                label="Venue / Office"
                value={booking.venue || "—"}
              />
              <DetailItem
                label="Guests"
                value={
                  booking.guestCount ? `${booking.guestCount} pax` : "—"
                }
              />
              <DetailItem label="Time" value={timeValue} />
              <DetailItem label="Booking ID" value={`#${booking.id}`} />
              <DetailItem label="Event Type" value={typeLabel} />
            </div>
          </div>

          <PaymentSummaryCard booking={booking} bankRef={bankRef} />

          {booking.specialRequests && (
            <div className="mt-5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Special Requests
                </p>
              </div>
              <p className="text-xs font-semibold leading-relaxed text-slate-700">
                {booking.specialRequests}
              </p>
            </div>
          )}

          {showNotice && (
            <div className="mt-5 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-xs font-semibold leading-5 text-amber-800">
                  <p className="mb-1.5 font-black uppercase tracking-wider">
                    Important Notice
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[11px]">
                    <li>
                      Cancellation requests made 14 days before the event date
                      may be eligible for a refund.
                    </li>
                    <li>
                      Cancellations made within 7 days before the scheduled
                      event date are non-refundable.
                    </li>
                    <li>
                      Remaining balances must be fully settled at least 7 days
                      before the event date.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {booking.cancellationStatus &&
            booking.cancellationStatus !== "None" && (
              <div className="mt-5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cancellation / Refund Status
                  </p>
                </div>
                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cancellation</span>
                    <span className="font-bold text-slate-900">
                      {booking.cancellationStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Refund</span>
                    <span className="font-bold text-slate-900">
                      {booking.refundStatus || "Not Applicable"}
                    </span>
                  </div>
                  {booking.refundEligibilityNote && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Eligibility</span>
                      <span className="font-bold text-slate-900">
                        {booking.refundEligibilityNote}
                      </span>
                    </div>
                  )}
                  {booking.daysBeforeEventAtCancellation !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Days before event
                      </span>
                      <span className="font-bold text-slate-900">
                        {booking.daysBeforeEventAtCancellation} days
                      </span>
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
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          {showCancelAction && (
            <Button
              variant="outline"
              onClick={() => {
                onCancel(booking)
                onClose()
              }}
              className="h-10 rounded-lg border-rose-200 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel Booking
            </Button>
          )}
          {showReceipt && (
            <Button
              variant="outline"
              onClick={() => {
                onViewReceipt(booking)
                onClose()
              }}
              className="h-10 rounded-lg border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <Receipt className="mr-1.5 h-3.5 w-3.5" />
              View Receipt
            </Button>
          )}
          {showPay && (
            <Button
              onClick={() => {
                onPay(booking)
                onClose()
              }}
              className="h-10 rounded-lg bg-orange-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
            >
              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
              Pay Now
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReceiptModal({
  receipt,
  open,
  onClose,
  booking,
}: {
  receipt: BookingReceipt | null
  open: boolean
  onClose: () => void
  booking?: Booking | null
}) {
  if (!receipt) return null

  const isOfficeRental = booking ? isOfficeBooking(booking) : false

  const totalAmount =
    (booking as any)?.totalPrice ??
    (booking as any)?.totalAmount ??
    (booking as any)?.amount ??
    (booking as any)?.price ??
    null

  const amountPaid =
    receipt.amountPaid ??
    receipt.paymentAmount ??
    (booking as any)?.amountPaid ??
    (booking as any)?.paymentAmount ??
    (booking as any)?.downPayment ??
    null

  const remainingBalance =
    (booking as any)?.remainingBalance ??
    (totalAmount != null && amountPaid != null
      ? Math.max(0, Number(totalAmount) - Number(amountPaid))
      : null)

  const timeStr = booking
    ? booking.time ||
      `${booking.startTime || ""}${booking.startTime && booking.endTime ? " – " : ""}${booking.endTime || ""}` ||
      "—"
    : "—"

  const payStatus = String(
    receipt.paymentStatus || booking?.paymentStatus || "",
  ).toLowerCase()
  const isVerified =
    payStatus === "verified" ||
    payStatus === "paid" ||
    payStatus === "slot_verified"

  const eventTypeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking?.eventType || receipt.bookingType || "Event Venue Rental"

  const paymentTypeLabel = booking?.paymentType
    ? formatTextLabel(booking.paymentType)
    : receipt.paymentPurpose || "Booking Payment"

  const paperData: ReceiptPaperData = {
    fullName: receipt.fullName || booking?.userInfo?.name || "Client",
    email: booking?.userInfo?.email || null,
    contactNumber: booking?.userInfo?.phone || null,
    receiptNo: receipt.receiptNumber,
    generatedAt: receipt.dateGenerated || receipt.dateIssued,
    bookingId: receipt.bookingId,
    eventType: eventTypeLabel,
    venue: booking?.venue || "—",
    eventDate: booking?.date || receipt.startDate || "—",
    reservationTime: timeStr,
    paymentMethod: receipt.paymentMethod
      ? getPaymentMethodLabel(receipt.paymentMethod)
      : "—",
    bankReference: (booking as any)?.bankReferenceNumber || null,
    paymentTypeLabel,
    totalAmount,
    amountPaid,
    remainingBalance,
    paymentStatus: receipt.paymentStatus || "—",
    isVerified,
    isOfficeRental,
    contractTerm: receipt.contractTerm || null,
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100vh-32px)] max-h-[calc(100dvh-32px)] w-[calc(100vw-2rem)] max-w-[820px] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 pt-6 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              E-Receipt
            </p>
            <DialogTitle className="mt-1 font-mono text-lg font-black tracking-tight text-slate-900">
              {receipt.receiptNumber}
            </DialogTitle>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              {receipt.bookingId}
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

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <ReceiptPaper {...paperData} />
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
  const [reasonError, setReasonError] = useState(false)

  if (!booking) return null
  const allowed = isCancellationAllowed(booking.date)
  const refundEligible = isRefundEligible(booking.date)

  const handleSubmit = () => {
    if (!reason.trim()) {
      setReasonError(true)
      return
    }
    setReasonError(false)
    onSubmit()
  }

  const handleReasonChange = (value: string) => {
    setReason(value)
    if (reasonError && value.trim()) setReasonError(false)
  }

  const startDate = formatDate(booking.date)
  const endDate = (booking as any)?.endDate
    ? formatDate((booking as any).endDate)
    : startDate

  return (
    <Dialog open={!!booking} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100vh-32px)] max-h-[calc(100dvh-32px)] w-[calc(100vw-2rem)] max-w-[600px] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 pt-6 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Cancellation
            </p>
            <DialogTitle className="mt-1 text-lg font-black tracking-tight text-slate-900">
              Request Cancellation
            </DialogTitle>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Please review the cancellation policy before submitting your request.
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

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="p-4">
            <p className="text-sm font-black text-slate-900">{booking.eventName || "Untitled"}</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Booking ID</span>
                <span className="font-bold text-slate-800">{booking.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Venue</span>
                <span className="font-bold text-slate-800">{booking.venue || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Event Date</span>
                <span className="font-bold text-slate-800">{startDate}</span>
              </div>
              {endDate !== startDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-400">End Date</span>
                  <span className="font-bold text-slate-800">{endDate}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-xs font-semibold leading-5 text-amber-800">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest">
                  Important Notice
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Cancellation requests made 14 days before the event date may be eligible for a refund.</li>
                  <li>Cancellations made within 7 days before the scheduled event date are non-refundable.</li>
                  <li>Remaining balances must be fully settled at least 7 days before the event date.</li>
                </ul>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "p-4",
              allowed
                ? refundEligible
                  ? "bg-emerald-50"
                  : "bg-orange-50"
                : "bg-rose-50",
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
                  "text-xs font-semibold leading-5",
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
            <div>
              <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Reason for Cancellation *
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Type your reason here..."
                className={cn(
                  "mt-2 w-full resize-none rounded-xl border bg-white p-4 text-sm focus-visible:ring-2 focus-visible:ring-orange-500",
                  reasonError
                    ? "border-rose-300 focus-visible:ring-rose-500"
                    : "border-slate-200",
                )}
                style={{ minHeight: 120, maxHeight: 180 }}
              />
              {reasonError && (
                <p className="mt-1.5 text-[11px] font-semibold text-rose-600">
                  Please provide a reason for cancellation.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 rounded-lg border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-10 rounded-lg bg-orange-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
          >
            Submit Cancellation Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { getUserBookings, requestCancellation, issueReceipt } =
    useBookings()
  const { toast } = useToast()

  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Booking | null>(null)
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)
  const [receiptToView, setReceiptToView] = useState<BookingReceipt | null>(
    null,
  )
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState<BookingFilter>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [showHistory, setShowHistory] = useState(false)

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

  const { currentBooking, otherActiveBookings, historyBookings } = useMemo(() => {
    const allCurrent = sortedBookings.filter(isCurrentBooking)

    const sortedCurrent = [...allCurrent]
      .sort((a, b) => getBookingTime(b) - getBookingTime(a))

    const current = sortedCurrent[0] || null
    const currentId = current ? getBookingId(current) : ""

    return {
      currentBooking: current,
      otherActiveBookings: sortedCurrent.filter((b) => getBookingId(b) !== currentId),
      historyBookings: sortedBookings.filter(isPastBooking),
    }
  }, [sortedBookings])

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

  const handleViewReceipt = (booking: Booking) => {
    const existing =
      booking.receipt || getStoredReceiptByBookingId(booking.id)
    if (existing) {
      setReceiptToView(existing)
      setReceiptBooking(booking)
      return
    }
    const payStatus = String(booking.paymentStatus || "").toLowerCase()
    if (
      payStatus === "verified" ||
      payStatus === "paid" ||
      payStatus === "slot_verified" ||
      payStatus === "partial"
    ) {
      issueReceipt(booking.id)
      setTimeout(() => {
        const updated = getStoredReceiptByBookingId(booking.id)
        if (updated) {
          setReceiptToView(updated)
          setReceiptBooking(booking)
        } else {
          toast({
            title: "Receipt Not Available",
            description:
              "Unable to generate receipt. Please contact support.",
            variant: "destructive",
          })
        }
      }, 150)
    } else {
      toast({
        title: "Receipt Not Available",
        description:
          "Receipt will be available after payment verification.",
        variant: "destructive",
      })
    }
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

  const historyEmpty = filteredHistory.length === 0
  const hasHistoryRecords = historyBookings.length > 0
  const hasOtherActive = otherActiveBookings.length > 0

  return (
    <div className="mx-auto min-w-0 w-full max-w-7xl animate-in fade-in space-y-6 p-4 duration-500 md:p-6">
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
        onPay={handlePay}
        onCancel={handleCancel}
        onViewReceipt={handleViewReceipt}
      />

      <ReceiptModal
        receipt={receiptToView}
        open={!!receiptToView}
        onClose={() => {
          const prevBooking = receiptBooking
          setReceiptToView(null)
          setReceiptBooking(null)
          if (prevBooking) setViewingBooking(prevBooking)
        }}
        booking={receiptBooking}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your space reservations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReserveDialog>
            <Button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 font-bold text-white shadow-sm transition-all hover:bg-orange-700">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </ReserveDialog>
          {hasHistoryRecords && (
            <Button
              variant="outline"
              onClick={() => setShowHistory((v) => !v)}
              className="h-11 whitespace-nowrap rounded-xl border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <Receipt className="mr-1.5 h-3.5 w-3.5" />
              {showHistory ? "Hide Booking History" : "View Booking History"}
            </Button>
          )}
        </div>
      </div>

      {/* Current Booking */}
      {!showHistory && (
        <section>
          <SectionHeader
          title="Current Booking"
          subtitle="Your active reservation"
          icon={<ListChecks className="h-4 w-4" />}
        />
        {currentBooking ? (
          <div className="mt-3 space-y-3">
            <HorizontalBookingCard
              booking={currentBooking}
              onView={handleView}
            />
            {canWriteReview(currentBooking) && (
              <div className="flex justify-end">
                <Button
                  onClick={() => handleReview(currentBooking)}
                  className="h-9 rounded-lg bg-blue-600 px-3 text-[11px] font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  Write a Review
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Calendar className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-sm font-black text-slate-900">No current booking found.</h3>
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
      )}

      {/* Other Current Bookings */}
      {!showHistory && hasOtherActive && (
        <section>
          <SectionHeader
            title="Other Current Bookings"
            subtitle="Other active reservations that are still ongoing."
            icon={<ListChecks className="h-4 w-4" />}
          />
          <div className="mt-3 space-y-2">
            {otherActiveBookings.map((booking) => (
              <HistoryRow
                key={booking.id}
                booking={booking}
                onView={handleView}
              />
            ))}
          </div>
        </section>
      )}

      {/* Booking History (hidden by default) */}
      {showHistory && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, event, venue, status..."
                className="h-9 rounded-xl border-slate-200 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as BookingFilter)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-500"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => setShowDateFilter((v) => !v)}
              className={cn(
                "h-9 shrink-0 rounded-xl border-slate-200 px-3 text-xs font-bold",
                showDateFilter && "bg-orange-50 text-orange-700 border-orange-200",
              )}
            >
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Date
            </Button>
          </div>

          {showDateFilter && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-lg border-slate-200 text-xs"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-lg border-slate-200 text-xs"
                placeholder="To"
              />
              <Button
                variant="outline"
                onClick={() => { setDateFrom(""); setDateTo("") }}
                className="h-9 rounded-lg border-slate-200 px-3 text-xs font-bold"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}

          <section>
            <SectionHeader
              title="Booking History"
              subtitle={`${filteredHistory.length} record${filteredHistory.length === 1 ? "" : "s"}`}
              icon={<Receipt className="h-4 w-4" />}
            />

          {historyEmpty ? (
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
        </>
      )}
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
