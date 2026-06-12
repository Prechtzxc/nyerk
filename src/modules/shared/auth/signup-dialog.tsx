"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/modules/shared/components/ui/dialog"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import { ProfilePictureUploader } from "@/src/modules/shared/components/profile-picture-uploader"

interface SignupDialogProps {
  className?: string
  children?: React.ReactNode
}

export function SignupDialog({ className, children }: SignupDialogProps) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profilePicture, setProfilePicture] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signup, isLoading } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("openSignupDialog", handleOpen)
    return () => window.removeEventListener("openSignupDialog", handleOpen)
  }, [])

  useEffect(() => {
    if (!open) {
      setFirstName("")
      setMiddleName("")
      setLastName("")
      setEmail("")
      setPhoneNumber("")
      setPassword("")
      setConfirmPassword("")
      setProfilePicture("")
      setErrorMsg("")
      setIsSubmitting(false)
    }
  }, [open])

  const handleSwitchToLogin = () => {
    setOpen(false)
    setTimeout(() => {
      window.dispatchEvent(new Event("openLoginDialog"))
    }, 150)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbersOnly = value.replace(/[^0-9]/g, "")
    if (numbersOnly.length <= 10) {
      setPhoneNumber(numbersOnly)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      setErrorMsg("Please fill in all required fields.")
      return
    }

    if (phoneNumber.length !== 10) {
      setErrorMsg("Phone number must be exactly 10 digits (e.g. 9123456789)")
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!")
      return
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.")
      return
    }

    const formattedPhone = `+63${phoneNumber}`

    setIsSubmitting(true)
    try {
      const result = await signup({
        firstName,
        middleName,
        lastName,
        email,
        phone: formattedPhone,
        password,
        profilePicture: profilePicture || "",
      })

      if (result.success) {
        setOpen(false)
        toast({
          title: "Account created",
          description: "Welcome to One Estela Place! Taking you to your portal...",
        })
        window.location.replace("/portal")
      } else {
        setErrorMsg(result.message || "Email is already taken. Please use a different one.")
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Sign up failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) setErrorMsg("")
    }}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className={`bg-slate-900 text-white hover:bg-slate-800 rounded-md px-6 ${className}`}>
            Sign Up
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader className="border-b border-slate-100 shrink-0 p-6 pb-5 text-center sm:text-center">
          <DialogTitle className="text-2xl font-black text-slate-900">Create Account</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Sign up to start booking events at One Estela Place
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 pt-4">
          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium p-3 rounded-md flex items-center gap-2 animate-in zoom-in-95 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
              <ProfilePictureUploader
                value={profilePicture}
                fallbackName={firstName || lastName || "You"}
                onChange={(dataUrl) => setProfilePicture(dataUrl || "")}
                onError={(message) => setErrorMsg(message)}
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">First Name *</Label>
                <Input id="firstName" placeholder="Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 px-4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Middle Name</Label>
                <Input id="middleName" placeholder="Optional" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 px-4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Last Name *</Label>
                <Input id="lastName" placeholder="Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 px-4" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address *</Label>
                <Input id="signup-email" type="email" placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 px-4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number *</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-bold text-sm select-none pointer-events-none">+63</span>
                  <Input id="phoneNumber" type="text" inputMode="numeric" placeholder="912 345 6789" value={phoneNumber} onChange={handlePhoneChange} required className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 pl-11 font-mono text-sm tracking-widest" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Create Password *</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Min. 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 px-4 pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm Password *</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-type password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11 rounded-md bg-slate-50 border-slate-200 focus-visible:ring-slate-900 px-4 pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-[11px] font-medium leading-5 text-slate-600">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  By creating an account, your profile picture (if uploaded) and basic details
                  will be saved locally to your browser so you stay signed in across refreshes.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-md font-bold mt-2"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating your account...
                </>
              ) : (
                "Complete Sign Up"
              )}
            </Button>

            <div className="text-center text-sm text-slate-500 pt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="font-bold text-slate-900 hover:underline hover:text-slate-700 transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
