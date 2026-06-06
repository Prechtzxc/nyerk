"use client"

import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/src/modules/shared/components/ui/dialog"
import { Button } from "@/src/modules/shared/components/ui/button"
import { X, FileText, MapPin, Calendar, Clock, CreditCard, CheckCircle } from "lucide-react"
import { cn } from "@/src/modules/shared/lib/utils"
import { type Booking } from "@/src/modules/client/contexts/booking-context"

function formatDate(date?: string) {
  if (!date) return "—"
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0)
  return `₱${Number.isFinite(amount) ? amount.toLocaleString("en-PH") : "0"}`
}

function getPaymentStatusLabel(paymentStatus?: string) {
  const v = String(paymentStatus || "").toLowerCase()
  if (v === "verified" || v === "paid" || v === "slot_verified") return "Verified"
  if (v === "for_review" || v === "cash_pending" || v === "slot_pending") return "For Review"
  if (v === "partial") return "Partial"
  if (v === "rejected") return "Rejected"
  if (v === "unpaid") return "Unpaid"
  if (!v) return "Not Set"
  return v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ContractPreviewModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking | null
  open: boolean
  onClose: () => void
}) {
  if (!booking) return null

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
              Contract Preview
            </p>
            <DialogTitle className="mt-1 text-xl font-black text-slate-900">
              One Estela Place Contract Agreement
            </DialogTitle>
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
          <div className="mx-auto max-w-[680px] rounded-xl border-2 border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                One Estela Place
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-orange-600">
                Contract Agreement
              </p>
              <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-orange-500" />
            </div>

            <div className="mb-5 rounded-lg bg-slate-50 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <FileText className="h-4 w-4 text-orange-500" />
                Reservation Details
              </p>
              <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Booking ID</p>
                  <p className="text-sm font-black text-slate-900">#{booking.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Name</p>
                  <p className="text-sm font-black text-slate-900">
                    {(booking as any)?.userInfo?.name || booking.eventName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event Name</p>
                  <p className="text-sm font-black text-slate-900">{booking.eventName || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Event Type</p>
                  <p className="text-sm font-black text-slate-900">{booking.eventType || "Event Venue Rental"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <MapPin className="mr-1 inline h-3 w-3 text-slate-400" />
                    Venue
                  </p>
                  <p className="text-sm font-black text-slate-900">{booking.venue || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Calendar className="mr-1 inline h-3 w-3 text-slate-400" />
                    Event Date
                  </p>
                  <p className="text-sm font-black text-slate-900">{formatDate(booking.date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Clock className="mr-1 inline h-3 w-3 text-slate-400" />
                    Start Time
                  </p>
                  <p className="text-sm font-black text-slate-900">{booking.startTime || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Clock className="mr-1 inline h-3 w-3 text-slate-400" />
                    End Time
                  </p>
                  <p className="text-sm font-black text-slate-900">{booking.endTime || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <CreditCard className="mr-1 inline h-3 w-3 text-slate-400" />
                    Total Amount
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    {booking.totalPrice ? formatMoney(booking.totalPrice) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <CheckCircle className="mr-1 inline h-3 w-3 text-slate-400" />
                    Payment Status
                  </p>
                  <p className="text-sm font-black text-emerald-600">
                    {getPaymentStatusLabel(booking.paymentStatus)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                Terms and Conditions Summary
              </p>
              <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  The client agrees to the scheduled date and time as stated in this agreement.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  Full payment must be completed at least 7 days before the event date.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  Cancellation requests made 14 days before the event may be eligible for a refund.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  The venue shall be used in accordance with One Estela Place&apos;s rules and regulations.
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  Any damage to the property shall be the responsibility of the client.
                </li>
              </ul>
            </div>

            <div className="mb-5 rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-amber-800">
                Important Notice
              </p>
              <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-amber-700">
                The customer must visit the One Estela Place office to sign the official contract.
                This system-generated contract preview is not yet the final signed contract.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-dashed border-slate-300 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Signature
                </p>
                <div className="mt-4 h-10 border-b border-slate-200" />
                <p className="mt-1 text-[10px] text-slate-400">
                  Print Name: {(booking as any)?.userInfo?.name || "________________"}
                </p>
                <p className="mt-2 text-[10px] text-slate-400">Date: _______________</p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Authorized Representative
                </p>
                <div className="mt-4 h-10 border-b border-slate-200" />
                <p className="mt-1 text-[10px] text-slate-400">Print Name: ________________</p>
                <p className="mt-2 text-[10px] text-slate-400">Date: _______________</p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-100 p-4 text-center">
              <p className="text-xs font-bold text-slate-500">
                Please proceed to the One Estela Place office to sign the official contract.
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                This preview is for review purposes only and does not replace onsite contract signing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-10 rounded-lg border-slate-200 px-5 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
