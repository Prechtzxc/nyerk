"use client"

const PROFILE_PICTURE_KEY_PREFIX = "oneestela_profile_picture_"

function readAll(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PROFILE_PICTURE_KEY_PREFIX + "index")
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, string>) {
  if (typeof window === "undefined") return
  localStorage.setItem(PROFILE_PICTURE_KEY_PREFIX + "index", JSON.stringify(map))
  window.dispatchEvent(new Event("oneestela_profile_picture_updated"))
}

export function getProfilePicture(userId: string): string | null {
  if (!userId) return null
  const map = readAll()
  return map[userId] || null
}

export function setProfilePicture(userId: string, dataUrl: string) {
  if (!userId) return
  const map = readAll()
  map[userId] = dataUrl
  writeAll(map)
}

export function removeProfilePicture(userId: string) {
  if (!userId) return
  const map = readAll()
  delete map[userId]
  writeAll(map)
}

export function subscribeProfilePictureUpdates(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => callback()
  window.addEventListener("oneestela_profile_picture_updated", handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener("oneestela_profile_picture_updated", handler)
    window.removeEventListener("storage", handler)
  }
}

export const PROFILE_PICTURE_MAX_BYTES = 2 * 1024 * 1024

export function isValidImageFile(file: File): { ok: boolean; reason?: string } {
  if (!file) return { ok: false, reason: "No file selected." }
  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "Please select an image file only." }
  }
  if (file.size > PROFILE_PICTURE_MAX_BYTES) {
    return { ok: false, reason: "Image must be smaller than 2MB." }
  }
  return { ok: true }
}
