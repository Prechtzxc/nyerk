"use client"

import { type ChangeEvent, useRef, useState } from "react"
import { Download, FileText, ImageIcon, Trash2, Upload, X } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { useToast } from "@shared/hooks/use-toast"
import { useCMS } from "@admin/contexts/cms-context"
import { CMSSectionHeader } from "./cms-section-header"

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-purple-500" />
  return <FileText className="h-5 w-5 text-red-500" />
}

function FileUploader({
  label,
  contract,
  onUpdate,
}: {
  label: string
  contract: { fileName: string; fileType: string; fileUrl: string }
  onUpdate: (data: { fileName: string; fileType: string; fileUrl: string }) => void
}) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid File", description: "Upload PDF, DOCX, or image files.", variant: "destructive" })
      event.target.value = ""
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({ title: "File Too Large", description: "Max 10MB.", variant: "destructive" })
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onUpdate({
        fileName: file.name,
        fileType: file.type,
        fileUrl: String(reader.result || ""),
      })
      event.target.value = ""
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    onUpdate({ fileName: "", fileType: "", fileUrl: "" })
    setPreviewUrl(null)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-black text-slate-900">{label}</h3>
      </div>
      <div className="p-4">
        {contract.fileUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {getFileIcon(contract.fileType)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{contract.fileName}</p>
                <p className="text-[10px] font-semibold text-slate-500">
                  {contract.fileType.startsWith("image/") ? "Image" : contract.fileType === "application/pdf" ? "PDF" : "DOCX"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(contract.fileUrl, "_blank")}
                className="h-8 flex-1 rounded-lg border-slate-200 text-[10px] font-bold"
              >
                <FileText className="mr-1 h-3 w-3" /> Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = contract.fileUrl
                  a.download = contract.fileName
                  a.click()
                }}
                className="h-8 flex-1 rounded-lg border-slate-200 text-[10px] font-bold"
              >
                <Download className="mr-1 h-3 w-3" /> Download
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="h-8 rounded-lg border-rose-200 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="mr-1 h-3 w-3" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 py-8 transition hover:border-orange-300 hover:bg-orange-50/30">
            <input ref={inputRef} type="file" accept=".pdf,.docx,image/*" onChange={handleFile} hidden />
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">Upload Contract File</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">PDF, DOCX, or Image — max 10MB</p>
            </div>
          </label>
        )}
      </div>
    </div>
  )
}

export function CMSContractsTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { cmsData, updateEventVenueContract, updateOfficeRentalContract } = useCMS()

  return (
    <div>
      <CMSSectionHeader
        title="Contract Documents"
        description="Upload contract files for Event Venue and Office Rental bookings. These files will be available for users to view and download when their booking requires contract signing."
        currentSection="contracts"
        onNavigate={onNavigate}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <FileUploader
          label="Event Venue Contract"
          contract={cmsData.eventVenueContract}
          onUpdate={updateEventVenueContract}
        />
        <FileUploader
          label="Office Rental Contract"
          contract={cmsData.officeRentalContract}
          onUpdate={updateOfficeRentalContract}
        />
      </div>
    </div>
  )
}
