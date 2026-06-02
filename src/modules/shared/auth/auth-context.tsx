"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  AUTH_STORAGE,
  clearAuthSession,
  findRegisteredUserByEmail,
  getCurrentUser,
  readProfilePictureIndex,
  setCurrentUser,
  setProfilePictureIndex,
  upsertRegisteredUser,
  type StoredUser,
} from "@/src/modules/shared/lib/auth-storage"

export interface AppUser {
  id: string
  fullName: string
  name: string
  email: string
  role: "customer" | "client" | "admin" | "staff" | "owner"
  profilePicture: string
  createdAt: string
  status: "active" | "inactive"
  phone?: string
}

export type AppRole = AppUser["role"]

export interface SignupInput {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone?: string
  password: string
  role?: AppRole
  profilePicture?: string
}

export interface AuthContextValue {
  user: AppUser | null
  isLoading: boolean
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>
  signup: (input: SignupInput) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateProfilePicture: (dataUrl: string) => void
  removeProfilePicture: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_USERS: Record<string, string> = {
  "rafkarloy52@gmail.com": "Raffy",
  "charmee@gmail.com": "Charmee",
  "christian@gmail.com": "Christian",
  "johndoe@gmail.com": "John Doe",
}

function makeId(email: string): string {
  return email.toLowerCase().trim()
}

function buildName(firstName: string, middleName?: string, lastName?: string): string {
  const parts = [firstName.trim(), middleName?.trim(), lastName?.trim()].filter(Boolean)
  return parts.join(" ")
}

function toAppUser(stored: StoredUser): AppUser {
  return {
    id: stored.id,
    fullName: stored.fullName || stored.name,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    profilePicture: stored.profilePicture || "",
    createdAt: stored.createdAt,
    status: stored.status,
    phone: stored.phone,
  }
}

function persistUser(user: AppUser) {
  const stored: StoredUser = {
    id: user.id,
    fullName: user.fullName,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    status: user.status,
    phone: user.phone,
  }
  upsertRegisteredUser(stored)
  setCurrentUser(stored)
}

function applyProfilePicture(user: AppUser, dataUrl: string | null): AppUser {
  if (!user.id) return user
  const map = readProfilePictureIndex()
  if (dataUrl) {
    map[user.id] = dataUrl
  } else {
    delete map[user.id]
  }
  setProfilePictureIndex(map)
  const updated: AppUser = { ...user, profilePicture: dataUrl || "" }
  const stored: StoredUser = {
    id: updated.id,
    fullName: updated.fullName,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    profilePicture: updated.profilePicture,
    createdAt: updated.createdAt,
    status: updated.status,
    phone: updated.phone,
  }
  upsertRegisteredUser(stored)
  setCurrentUser(stored)
  return updated
}

function resolveInitialUser(): AppUser | null {
  if (typeof window === "undefined") return null
  const stored = getCurrentUser()
  if (stored) {
    const map = readProfilePictureIndex()
    const picture = stored.profilePicture || map[stored.id] || ""
    return { ...toAppUser(stored), profilePicture: picture }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(resolveInitialUser())
    setIsLoading(false)

    const handleUpdate = () => {
      setUser(resolveInitialUser())
    }
    const handleProfileUpdate = () => {
      setUser((current) => (current ? applyProfilePicture(current, null) : current))
    }
    window.addEventListener(AUTH_STORAGE.authEvent, handleUpdate)
    window.addEventListener("storage", handleUpdate)
    window.addEventListener(AUTH_STORAGE.profileEvent, handleProfileUpdate)
    return () => {
      window.removeEventListener(AUTH_STORAGE.authEvent, handleUpdate)
      window.removeEventListener("storage", handleUpdate)
      window.removeEventListener(AUTH_STORAGE.profileEvent, handleProfileUpdate)
    }
  }, [])

  const login = useCallback(
    async (email: string, _password?: string) => {
      const cleanEmail = email.toLowerCase().trim()
      if (!cleanEmail) {
        return { success: false, message: "Please enter your email." }
      }

      const registered = findRegisteredUserByEmail(cleanEmail)
      let nextUser: AppUser | null = null

      if (registered) {
        nextUser = toAppUser(registered)
        const map = readProfilePictureIndex()
        if (!nextUser.profilePicture && map[registered.id]) {
          nextUser = { ...nextUser, profilePicture: map[registered.id] }
        }
      } else if (cleanEmail.includes("admin")) {
        nextUser = {
          id: `admin-${makeId(cleanEmail)}`,
          fullName: "Admin User",
          name: "Admin User",
          email: cleanEmail,
          role: "admin",
          profilePicture: "",
          createdAt: new Date().toISOString(),
          status: "active",
        }
      } else {
        const matchedName = DEMO_USERS[cleanEmail] || cleanEmail.split("@")[0]
        nextUser = {
          id: makeId(cleanEmail),
          fullName: matchedName,
          name: matchedName,
          email: cleanEmail,
          role: "client",
          profilePicture: "",
          createdAt: new Date().toISOString(),
          status: "active",
        }
      }

      if (!nextUser) {
        return { success: false, message: "Invalid credentials." }
      }

      setUser(nextUser)
      persistUser(nextUser)
      return { success: true }
    },
    []
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      const cleanEmail = input.email.toLowerCase().trim()
      if (!input.firstName || !input.lastName || !cleanEmail || !input.password) {
        return { success: false, message: "Please fill in all required fields." }
      }
      if (findRegisteredUserByEmail(cleanEmail)) {
        return { success: false, message: "Email is already taken. Please use a different one." }
      }

      const role: AppRole = input.role
        ? input.role
        : cleanEmail.includes("admin")
          ? "admin"
          : "client"

      const fullName = buildName(input.firstName, input.middleName, input.lastName)
      const nextUser: AppUser = {
        id: makeId(cleanEmail),
        fullName,
        name: fullName,
        email: cleanEmail,
        role,
        profilePicture: input.profilePicture || "",
        createdAt: new Date().toISOString(),
        status: "active",
        phone: input.phone,
      }

      persistUser(nextUser)
      if (input.profilePicture) {
        const map = readProfilePictureIndex()
        map[nextUser.id] = input.profilePicture
        setProfilePictureIndex(map)
      }
      setUser(nextUser)
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    clearAuthSession()
    if (typeof window !== "undefined") {
      window.location.replace("/")
    }
  }, [])

  const updateProfilePicture = useCallback(
    (dataUrl: string) => {
      setUser((current) => (current ? applyProfilePicture(current, dataUrl) : current))
    },
    []
  )

  const removeProfilePicture = useCallback(() => {
    setUser((current) => (current ? applyProfilePicture(current, null) : current))
  }, [])

  const refreshUser = useCallback(() => {
    setUser(resolveInitialUser())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      signup,
      logout,
      updateProfilePicture,
      removeProfilePicture,
      refreshUser,
    }),
    [user, isLoading, login, signup, logout, updateProfilePicture, removeProfilePicture, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
