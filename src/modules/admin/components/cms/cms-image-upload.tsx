"use client"

import { type ChangeEvent } from "react"
import { ImageIcon, Upload, X } from "lucide-react"
import { useToast } from "@shared/hooks/use-toast"

const MAX_IMAGE_SIZE_BYTES = 2.5 * 1024 * 1024

function getImageSource(value?: string) {
  return value && value.trim() ? value : "/placeholder.jpg"
}

export function CMSImageUpload({
  label, value, note, accent = "orange", onValueChange,
}: {
  label: string; value?: string; note?: string; accent?: "orange" | "blue" | "purple" | "rose"; onValueChange: (v: string) => void
}) {
  const { toast } = useToast()

  const accentColors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-300",
    blue: "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300",
    purple: "bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-300",
    rose: "bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-300",
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid File", description: "Upload an image.", variant: "destructive" }); event.target.value = ""; return }
    if (file.size > MAX_IMAGE_SIZE_BYTES) { toast({ title: "Image Too Large", description: "Max 2.5MB.", variant: "destructive" }); event.target.value = ""; return }
    const reader = new FileReader()
    reader.onload = () => { onValueChange(String(reader.result || "")); event.target.value = "" }
    reader.readAsDataURL(file)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</label>
        <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
      </div>

      <div className="flex flex-col gap-3">
        {value ? (
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={getImageSource(value)} alt={label} className="h-32 w-full object-cover"
              onError={(e) => { e.currentTarget.src = "/placeholder.jpg" }} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition hover:opacity-100">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFile} hidden />
                <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-slate-800 shadow">
                  <Upload className="h-3 w-3" /> Replace
                </span>
              </label>
              <button type="button" onClick={() => onValueChange("")}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-rose-600 shadow hover:bg-rose-50">
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white py-5 transition ${accentColors[accent].replace(/bg-\w+-50/g, "hover:" + (accent === "orange" ? "bg-orange-50/30" : accent === "blue" ? "bg-blue-50/30" : accent === "purple" ? "bg-purple-50/30" : "bg-rose-50/30"))}`}>
            <input type="file" accept="image/*" onChange={handleFile} hidden />
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentColors[accent]}`}>
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Upload Photo</p>
              <p className="text-[10px] font-semibold text-slate-500">Click to browse (max 2.5MB)</p>
            </div>
          </label>
        )}

        {note && <p className="text-[11px] font-medium text-slate-500">{note}</p>}
      </div>
    </div>
  )
}

export function CMSPanoramaUpload({ value, onValueChange }: { value?: string; onValueChange: (v: string) => void }) {
  const { toast } = useToast()
  const MAX_BYTES = 10 * 1024 * 1024

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid File", description: "Upload an image.", variant: "destructive" }); event.target.value = ""; return }
    if (file.size > MAX_BYTES) { toast({ title: "File Too Large", description: "Max 10MB.", variant: "destructive" }); event.target.value = ""; return }
    const reader = new FileReader()
    reader.onload = () => { onValueChange(String(reader.result || "")); event.target.value = "" }
    reader.readAsDataURL(file)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">360 Panorama Image</label>
        <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
      </div>

      <div className="flex flex-col gap-3">
        {value ? (
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
            <img src={value} alt="Panorama" className="h-28 w-full object-cover" onError={(e) => { e.currentTarget.src = "/placeholder.jpg" }} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition hover:opacity-100">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFile} hidden />
                <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-slate-800 shadow"><Upload className="h-3 w-3" /> Replace</span>
              </label>
              <button type="button" onClick={() => onValueChange("")}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-rose-600 shadow hover:bg-rose-50"><X className="h-3 w-3" /> Remove</button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white py-4 transition hover:border-purple-300 hover:bg-purple-50/30">
            <input type="file" accept="image/*" onChange={handleFile} hidden />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Upload className="h-4 w-4" /></div>
            <div>
              <p className="text-xs font-bold text-slate-700">Upload 360 Panorama</p>
              <p className="text-[10px] font-semibold text-slate-500">Wide 360 image, max 10MB</p>
            </div>
          </label>
        )}
      </div>
    </div>
  )
}
