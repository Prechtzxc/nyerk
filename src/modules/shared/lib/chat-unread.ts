"use client"

const UNREAD_STORAGE_KEY = "oneestela_chat_unread_counts"

type UnreadMap = Record<string, number>

function readUnreadMap(): UnreadMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(UNREAD_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeUnreadMap(map: UnreadMap) {
  if (typeof window === "undefined") return
  localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new Event("oneestela_chat_unread_updated"))
}

export function getUnreadCount(scope: "client" | "admin"): number {
  const map = readUnreadMap()
  return Number(map[scope] || 0)
}

export function setUnreadCount(scope: "client" | "admin", value: number) {
  const map = readUnreadMap()
  const next = Math.max(0, Math.floor(value))
  if (next === 0) {
    delete map[scope]
  } else {
    map[scope] = next
  }
  writeUnreadMap(map)
}

export function incrementUnread(scope: "client" | "admin", by = 1) {
  const map = readUnreadMap()
  map[scope] = Math.max(0, Number(map[scope] || 0) + by)
  writeUnreadMap(map)
}

export function clearUnread(scope: "client" | "admin") {
  const map = readUnreadMap()
  delete map[scope]
  writeUnreadMap(map)
}

export function subscribeUnreadUpdates(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => callback()
  window.addEventListener("oneestela_chat_unread_updated", handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener("oneestela_chat_unread_updated", handler)
    window.removeEventListener("storage", handler)
  }
}
