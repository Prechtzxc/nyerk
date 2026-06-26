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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

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
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string; role?: string }>
  signup: (input: SignupInput) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateProfilePicture: (dataUrl: string) => void
  removeProfilePicture: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || ""
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password."
    case "auth/email-already-in-use":
      return "An account with this email already exists."
    case "auth/weak-password":
      return "Password should be at least 6 characters."
    case "auth/invalid-email":
      return "Invalid email address."
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later."
    case "auth/network-request-failed":
      return "Network error. Please check your connection."
    default:
      return error?.message || "An unexpected error occurred."
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            setUser({
              id: firebaseUser.uid,
              fullName: data.fullName || "",
              name: data.fullName || "",
              email: data.email || firebaseUser.email || "",
              role: data.role || "client",
              profilePicture: data.profilePicture || "",
              createdAt: data.createdAt || new Date().toISOString(),
              status: data.status || "active",
              phone: data.phone || "",
            })
          }
        } catch {
          // Firestore read error — user authenticated but profile unavailable
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const login = useCallback(async (email: string, password?: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password!)

      const userDocRef = doc(db, "users", credential.user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        return { success: false, message: "User profile not found. Please contact support." }
      }

      const data = userDocSnap.data()
      const role = data.role || "client"

      console.log("[Auth] Login success", {
        uid: credential.user.uid,
        email: credential.user.email,
        role,
        currentRoute: window.location.pathname,
        targetRoute: role === "admin" || role === "staff" || role === "owner" ? "/dashboard" : "/portal",
      })

      setUser({
        id: credential.user.uid,
        fullName: data.fullName || "",
        name: data.fullName || "",
        email: data.email || credential.user.email || email,
        role: role as AppUser["role"],
        profilePicture: data.profilePicture || "",
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || "active",
        phone: data.phone || "",
      })

      return { success: true, role }
    } catch (error: any) {
      return { success: false, message: getFirebaseErrorMessage(error) }
    }
  }, [])

  const signup = useCallback(async (input: SignupInput) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, input.email, input.password)
      const uid = credential.user.uid

      const fullName = [input.firstName, input.middleName, input.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()

      const role = "client"

      const userData = {
        uid,
        email: input.email.toLowerCase().trim(),
        fullName,
        firstName: input.firstName,
        middleName: input.middleName || "",
        lastName: input.lastName,
        phone: input.phone || "",
        role,
        profilePicture: "",
        status: "active",
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "users", uid), userData)

      setUser({
        id: uid,
        fullName,
        name: fullName,
        email: input.email.toLowerCase().trim(),
        role: role as AppUser["role"],
        profilePicture: "",
        createdAt: userData.createdAt,
        status: "active",
        phone: input.phone || "",
      })

      return { success: true, role }
    } catch (error: any) {
      return { success: false, message: getFirebaseErrorMessage(error) }
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    window.location.replace("/")
  }, [])

  const updateProfilePicture = useCallback((_dataUrl: string) => {
    // Will be implemented with Firebase Storage in a future phase
  }, [])

  const removeProfilePicture = useCallback(() => {
    // Will be implemented with Firebase Storage in a future phase
  }, [])

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) {
      setUser(null)
      return
    }
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        setUser({
          id: auth.currentUser.uid,
          fullName: data.fullName || "",
          name: data.fullName || "",
          email: data.email || auth.currentUser.email || "",
          role: data.role || "client",
          profilePicture: data.profilePicture || "",
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "active",
          phone: data.phone || "",
        })
      }
    } catch {
      // ignore
    }
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
