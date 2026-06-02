"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type React from "react"

export interface PaymentProof {
  id: string
  bookingId: string
  amount: number
  paymentAmount?: number
  paymentMethod: "bank" | "cash"
  referenceNumber?: string
  paymentReference?: string
  proofImageUrl?: string
  notes?: string
  adminNote?: string
  fileName?: string
  fileSize?: number
  paymentDate?: string
  uploadedAt?: string
  status: "pending" | "verified" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

interface NewPaymentProofInput {
  bookingId: string
  amount: number
  paymentMethod: "bank" | "cash"
  referenceNumber?: string
  paymentReference?: string
  proofImageUrl?: string
  fileName?: string
  fileSize?: number
  notes?: string
  paymentDate?: string
  uploadedAt?: string
  file?: File | null
  paymentDetails?: Record<string, unknown>
}

interface PaymentProofContextValue {
  proofs: PaymentProof[]
  uploadPaymentProof: (input: NewPaymentProofInput | string, file?: File | null, paymentDetails?: Record<string, unknown>) => PaymentProof
  getPaymentProofByBooking: (bookingId: string) => PaymentProof | undefined
  getPaymentProofsByBooking: (bookingId: string) => PaymentProof[]
  reviewPaymentProof: (id: string, status: "verified" | "rejected", reviewer: string, rejectionReason?: string) => void
  removePaymentProof: (id: string) => void
  clearAll: () => void
}

const STORAGE_KEY = "oneestela_payment_proofs_v1"

const PaymentProofContext = createContext<PaymentProofContextValue | undefined>(undefined)

function readStored(): PaymentProof[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PaymentProof[]) : []
  } catch {
    return []
  }
}

function writeStored(proofs: PaymentProof[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(proofs))
  } catch {
    // ignore
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `proof_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function PaymentProofProvider({ children }: { children: React.ReactNode }) {
  const [proofs, setProofs] = useState<PaymentProof[]>([])

  useEffect(() => {
    setProofs(readStored())
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setProofs(readStored())
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const uploadPaymentProof = useCallback(
    (input: NewPaymentProofInput | string, file?: File | null, paymentDetails?: Record<string, unknown>) => {
      const now = new Date().toISOString()
      const normalized: NewPaymentProofInput =
        typeof input === "string"
          ? {
              bookingId: input,
              amount: Number(paymentDetails?.amount ?? 0),
              paymentMethod: (paymentDetails?.paymentMethod as "bank" | "cash") ?? "bank",
              referenceNumber: paymentDetails?.referenceNumber as string | undefined,
              fileName: file?.name,
              fileSize: file?.size,
              paymentDate: (paymentDetails?.paymentDate as string) ?? now,
              notes: paymentDetails?.notes as string | undefined,
            }
          : input

      const entry: PaymentProof = {
        id: makeId(),
        bookingId: normalized.bookingId,
        amount: normalized.amount,
        paymentAmount: normalized.amount,
        paymentMethod: normalized.paymentMethod,
        referenceNumber: normalized.referenceNumber?.trim(),
        paymentReference: normalized.paymentReference?.trim() || normalized.referenceNumber?.trim(),
        proofImageUrl: normalized.proofImageUrl,
        fileName: normalized.fileName ?? file?.name,
        fileSize: normalized.fileSize ?? file?.size,
        notes: normalized.notes,
        paymentDate: normalized.paymentDate || now,
        uploadedAt: normalized.uploadedAt || now,
        submittedAt: now,
        status: "pending",
      }
      setProofs((current) => {
        const next = [entry, ...current]
        writeStored(next)
        return next
      })
      return entry
    },
    []
  )

  const getPaymentProofByBooking = useCallback(
    (bookingId: string) => proofs.find((proof) => proof.bookingId === bookingId),
    [proofs]
  )

  const getPaymentProofsByBooking = useCallback(
    (bookingId: string) => proofs.filter((proof) => proof.bookingId === bookingId),
    [proofs]
  )

  const reviewPaymentProof = useCallback(
    (id: string, status: "verified" | "rejected", reviewer: string, rejectionReason?: string) => {
      setProofs((current) => {
        const next = current.map((proof) =>
          proof.id === id
            ? {
                ...proof,
                status,
                reviewedAt: new Date().toISOString(),
                reviewedBy: reviewer,
                rejectionReason: status === "rejected" ? rejectionReason : undefined,
              }
            : proof
        )
        writeStored(next)
        return next
      })
    },
    []
  )

  const removePaymentProof = useCallback((id: string) => {
    setProofs((current) => {
      const next = current.filter((proof) => proof.id !== id)
      writeStored(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setProofs([])
    writeStored([])
  }, [])

  const value: PaymentProofContextValue = {
    proofs,
    uploadPaymentProof,
    getPaymentProofByBooking,
    getPaymentProofsByBooking,
    reviewPaymentProof,
    removePaymentProof,
    clearAll,
  }

  return <PaymentProofContext.Provider value={value}>{children}</PaymentProofContext.Provider>
}

export function usePaymentProof(): PaymentProofContextValue {
  const ctx = useContext(PaymentProofContext)
  if (!ctx) {
    throw new Error("usePaymentProof must be used within a PaymentProofProvider")
  }
  return ctx
}
