"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/src/modules/shared/components/ui/dialog"
import { X, FileText, Download, AlertCircle, Loader2 } from "lucide-react"
import { type Booking } from "@/src/modules/client/contexts/booking-context"
import { useCMS } from "@/src/modules/admin/contexts/cms-context"
import { renderAsync } from "docx-preview"
import { Button } from "@/src/modules/shared/components/ui/button"

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

export function ContractPreviewModal({
  booking,
  open,
  onClose,
}: {
  booking: Booking | null
  open: boolean
  onClose: () => void
}) {
  const { cmsData } = useCMS()

  console.log("[ContractPreviewModal] open:", open, "booking:", booking?.id)

  if (!booking) return null

  const officeBooking = isOfficeBooking(booking)
  const contractFile = officeBooking
    ? cmsData?.officeRentalContract
    : cmsData?.eventVenueContract
  const hasContract = contractFile?.fileUrl && contractFile?.fileName

  console.log("[ContractPreviewModal]", {
    open,
    bookingId: booking.id,
    venue: booking.venue,
    officeBooking,
    contractFile,
    hasContract,
    fileUrl: contractFile?.fileUrl?.slice(0, 100),
    fileType: contractFile?.fileType,
    fileName: contractFile?.fileName,
    cmsDataPresent: !!cmsData,
  })

  const isPDF = hasContract && contractFile.fileType === "application/pdf"
  const isImage = hasContract && contractFile.fileType.startsWith("image/")
  const isDOCX = hasContract && contractFile.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

  const docxContainerRef = useRef<HTMLDivElement>(null)
  const [docxLoading, setDocxLoading] = useState(false)
  const [docxError, setDocxError] = useState(false)

  useEffect(() => {
    if (!open || !hasContract || !isDOCX || !docxContainerRef.current) return

    setDocxLoading(true)
    setDocxError(false)

    const loadDocx = async () => {
      try {
        const response = await fetch(contractFile.fileUrl)
        const blob = await response.blob()
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = ""
          await renderAsync(blob, docxContainerRef.current)
        }
      } catch {
        setDocxError(true)
      } finally {
        setDocxLoading(false)
      }
    }

    loadDocx()
  }, [open, hasContract, isDOCX, contractFile?.fileUrl])

  const handleDownload = () => {
    if (!contractFile) return
    const a = document.createElement("a")
    a.href = contractFile.fileUrl
    a.download = contractFile.fileName
    a.click()
  }

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
              {hasContract ? contractFile.fileName : "One Estela Place Contract Agreement"}
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
          {hasContract ? (
            <>
              {isPDF ? (
                <iframe
                  src={contractFile.fileUrl}
                  className="h-[70vh] w-full rounded-lg border border-slate-200"
                  title="Contract PDF"
                />
              ) : isImage ? (
                <div className="flex items-center justify-center">
                  <img
                    src={contractFile.fileUrl}
                    alt="Contract"
                    className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
              ) : isDOCX ? (
                <div className="flex items-center justify-center">
                  {docxLoading && (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                      <p className="text-sm font-semibold text-slate-500">Loading document...</p>
                    </div>
                  )}
                  {docxError && (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                      <AlertCircle className="mb-3 h-12 w-12 text-amber-500" />
                      <h3 className="text-lg font-black text-slate-700">
                        Preview is not available for this file type.
                      </h3>
                    </div>
                  )}
                  <div
                    ref={docxContainerRef}
                    className={docxLoading || docxError ? "hidden" : "w-full"}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <AlertCircle className="mb-3 h-12 w-12 text-amber-500" />
                  <h3 className="text-lg font-black text-slate-700">
                    Preview is not available for this file type.
                  </h3>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <FileText className="mb-3 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-black text-slate-700">
                No contract document available
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                A contract document has not been uploaded for this booking type yet.
              </p>
            </div>
          )}
        </div>

        {hasContract && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <Button
              type="button"
              onClick={handleDownload}
              className="h-10 rounded-xl bg-orange-600 px-5 text-xs font-bold text-white hover:bg-orange-700"
            >
              <Download className="mr-1.5 h-4 w-4" /> Download Contract
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
