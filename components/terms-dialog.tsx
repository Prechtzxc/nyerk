"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/modules/shared/components/ui/dialog"
import { ScrollArea } from "@/src/modules/shared/components/ui/scroll-area"

interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TERMS = [
  {
    title: "1. Booking & Reservations",
    body: "All bookings are subject to availability. A confirmed reservation requires a signed contract and a 30% non-refundable down payment. The remaining balance must be settled at least seven (7) days before the scheduled event.",
  },
  {
    title: "2. Cancellation & Refund",
    body: "Cancellations made more than 30 days before the event are eligible for a partial refund of the amount paid, less the non-refundable deposit. Cancellations made within 30 days of the event are non-refundable. Rescheduling is allowed once, free of charge, when requested at least 10 days in advance.",
  },
  {
    title: "3. Venue Use",
    body: "Smoking is strictly prohibited inside the venue. Noise levels must comply with local ordinances. All equipment and decorations brought in by the client must be removed immediately after the event. Any damages to the venue will be charged to the client.",
  },
  {
    title: "4. Guest Capacity & Safety",
    body: "Maximum occupancy limits must be observed at all times. The venue is fully ADA compliant. The management reserves the right to refuse entry or stop the event if safety regulations are violated.",
  },
  {
    title: "5. Outside Vendors",
    body: "Outside vendors are welcome but must be licensed and insured. Vendor information must be submitted at least 30 days before the event. Outside catering is permitted subject to venue guidelines.",
  },
  {
    title: "6. Payments",
    body: "We accept bank transfer, credit card, and payment at the office. Cheques must be issued at least 14 days before the event. Any returned cheque will incur a processing fee.",
  },
  {
    title: "7. Force Majeure",
    body: "In the event of natural disasters, government restrictions, or other circumstances beyond our control, the venue will work with the client to reschedule. Refunds will be handled on a case-by-case basis.",
  },
  {
    title: "8. Personal Data",
    body: "Personal information collected during the booking process will be used solely for event coordination and communication. We do not share client data with third parties without consent.",
  },
  {
    title: "9. Agreement",
    body: "By proceeding with a booking or sending an inquiry, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.",
  },
]

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] w-[92vw] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-slate-200 p-0">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-5">
          <DialogTitle className="text-xl font-black text-slate-900">
            Terms &amp; Conditions
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Please read carefully before sending an inquiry or confirming a booking.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-5">
          <div className="space-y-5 text-sm leading-relaxed text-slate-700">
            <p className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 text-slate-700">
              These Terms &amp; Conditions govern your use of One Estela Place.
              By submitting a contact form or finalizing a booking, you accept
              the policies described below.
            </p>

            {TERMS.map((section) => (
              <section key={section.title} className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-700"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
