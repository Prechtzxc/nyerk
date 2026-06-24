"use client"

import { X, Download, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/src/modules/shared/components/ui/dialog"
import { Button } from "@/src/modules/shared/components/ui/button"
import type { ContractFile } from "@/src/modules/admin/contexts/cms-context"

export function ContractFileViewer({
  open,
  onClose,
  file,
  label,
}: {
  open: boolean
  onClose: () => void
  file: ContractFile | null
  label?: string
}) {
  if (!file || !file.fileUrl) return null

  const isPDF = file.fileType === "application/pdf"
  const isImage = file.fileType.startsWith("image/")

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = file.fileUrl
    a.download = file.fileName || "contract"
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[900px] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 pt-6 pb-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
              Contract Preview
            </p>
            <DialogTitle className="mt-1 truncate text-lg font-black text-slate-900">
              {file.fileName}
            </DialogTitle>
            {label && (
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
            )}
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

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {isPDF ? (
            <iframe
              src={file.fileUrl}
              className="h-[70vh] w-full rounded-lg border border-slate-200"
              title="Contract PDF"
            />
          ) : isImage ? (
            <div className="flex items-center justify-center">
              <img
                src={file.fileUrl}
                alt="Contract"
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <AlertCircle className="mb-3 h-12 w-12 text-amber-500" />
              <h3 className="text-lg font-black text-slate-700">
                Preview unavailable for DOCX files.
              </h3>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Please download the file to view it.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button
            type="button"
            onClick={handleDownload}
            className="h-10 rounded-xl bg-orange-600 px-5 text-xs font-bold text-white hover:bg-orange-700"
          >
            <Download className="mr-1.5 h-4 w-4" /> Download Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
