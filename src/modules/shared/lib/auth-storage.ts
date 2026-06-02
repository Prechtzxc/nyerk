"use client"

const STORAGE_KEY_CURRENT_USER = "mock_user"
const STORAGE_KEY_REGISTERED_USERS = "oneestela_registered_users"
const STORAGE_KEY_PROFILE_PICTURE_INDEX = "oneestela_profile_picture_index"
const STORAGE_KEY_AUTH_EVENT = "oneestela_auth_updated"
const STORAGE_KEY_PROFILE_EVENT = "oneestela_profile_picture_updated"

const AUTH_SESSION_KEYS = [
  "oneestela_current_user",
  "oneestela_auth_user",
  "oneestela_user",
  "oneestela_session",
  "oneestela_user_session",
  "currentUser",
  "authUser",
  "user",
  "rememberedEmail",
  "oneestela_chat_loaded",
  "oneestela_booking_loaded",
]

export const AUTH_STORAGE = {
  currentUser: STORAGE_KEY_CURRENT_USER,
  registeredUsers: STORAGE_KEY_REGISTERED_USERS,
  profilePictureIndex: STORAGE_KEY_PROFILE_PICTURE_INDEX,
  authEvent: STORAGE_KEY_AUTH_EVENT,
  profileEvent: STORAGE_KEY_PROFILE_EVENT,
}

export function clearAuthSession() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
    AUTH_SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
    window.dispatchEvent(new Event(STORAGE_KEY_AUTH_EVENT))
  } catch {
  }
}

export function readRegisteredUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTERED_USERS)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : []
  } catch {
    return []
  }
}

export function writeRegisteredUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(users))
  window.dispatchEvent(new Event(STORAGE_KEY_AUTH_EVENT))
}

export function upsertRegisteredUser(user: StoredUser) {
  const list = readRegisteredUsers()
  const idx = list.findIndex((u) => u.id === user.id)
  if (idx >= 0) list[idx] = user
  else list.push(user)
  writeRegisteredUsers(list)
}

export function findRegisteredUserByEmail(email: string): StoredUser | null {
  const cleanEmail = email.toLowerCase().trim()
  return readRegisteredUsers().find((u) => u.email.toLowerCase() === cleanEmail) ?? null
}

export function setCurrentUser(user: StoredUser) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
  window.dispatchEvent(new Event(STORAGE_KEY_AUTH_EVENT))
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
    if (!raw) return null
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function setProfilePictureIndex(map: Record<string, string>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_PROFILE_PICTURE_INDEX, JSON.stringify(map))
  window.dispatchEvent(new Event(STORAGE_KEY_PROFILE_EVENT))
}

export function readProfilePictureIndex(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE_PICTURE_INDEX)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export interface StoredUser {
  id: string
  fullName: string
  name: string
  email: string
  password?: string
  role: "customer" | "client" | "admin" | "staff" | "owner"
  profilePicture: string
  createdAt: string
  status: "active" | "inactive"
  phone?: string
  middleName?: string
}
