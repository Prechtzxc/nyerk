"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Trash2, ImageIcon, AlertCircle } from "lucide-react"
import {
  isValidImageFile,
  PROFILE_PICTURE_MAX_BYTES,
} from "@/src/modules/shared/lib/profile-picture"
import { cn } from "@/src/modules/shared/lib/utils"

interface ProfilePictureUploaderProps {
  value: string
  fallbackName: string
  onChange: (dataUrl: string | null) => void
  onError?: (message: string) => void
  size?: "sm" | "md" | "lg"
  label?: string
  hint?: string
}

const SIZE_MAP = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
}

const ICON_BUTTON_SIZE = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
}

export function ProfilePictureUploader({
  value,
  fallbackName,
  onChange,
  onError,
  size = "lg",
  label = "Profile Picture",
  hint,
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setLocalError(null)
  }, [value])

  const handleFile = async (file?: File | null) => {
    setLocalError(null)
    if (!file) return
    const validation = isValidImageFile(file)
    if (!validation.ok) {
      const reason = validation.reason || "Please select a valid image file."
      setLocalError(reason)
      onError?.(reason)
      return
    }
    setIsUploading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error("Failed to read file."))
        reader.readAsDataURL(file)
      })
      onChange(dataUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to read the file."
      setLocalError(message)
      onError?.(message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {value ? (
          <img
            src={value}
            alt={fallbackName}
            className={cn(
              SIZE_MAP[size],
              "rounded-full object-cover ring-4 ring-white shadow-md",
            )}
          />
        ) : (
          <div
            className={cn(
              SIZE_MAP[size],
              "flex items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200 text-2xl font-black uppercase text-orange-700 ring-4 ring-white shadow-md",
            )}
          >
            {fallbackName?.charAt(0) || "U"}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            ICON_BUTTON_SIZE[size],
            "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-orange-600 text-white shadow-md ring-2 ring-white transition hover:bg-orange-700 disabled:opacity-60",
          )}
          aria-label="Upload profile picture"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {value ? "Change Photo" : "Upload Photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={isUploading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs font-bold text-slate-700">{label}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
          {hint ||
            `JPG, JPEG, PNG, or WEBP · max ${Math.round(PROFILE_PICTURE_MAX_BYTES / 1024 / 1024)}MB`}
        </p>
      </div>

      {localError && (
        <div className="flex w-full max-w-xs items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{localError}</p>
        </div>
      )}
    </div>
  )
}
