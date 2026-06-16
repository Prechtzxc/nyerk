"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Button } from "@/src/modules/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/modules/shared/components/ui/select"
import { cn } from "@/src/modules/shared/lib/utils"
import {
  Search,
  Users,
} from "lucide-react"

type CustomerStatus = "Active" | "Inactive"

type CustomerAccount = {
  id: string | number
  name: string
  email: string
  phone: string
  role: string
  status: CustomerStatus
  createdAt: string
  profilePicture?: string
}

const FALLBACK_CUSTOMERS: CustomerAccount[] = [
  {
    id: 1,
    name: "James Wilson",
    email: "james.wilson@email.com",
    phone: "+63 917 123 4567",
    role: "customer",
    status: "Active",
    createdAt: "2025-11-15T08:30:00.000Z",
  },
  {
    id: 2,
    name: "Emily Brown",
    email: "emily.brown@email.com",
    phone: "+63 918 234 5678",
    role: "customer",
    status: "Active",
    createdAt: "2025-12-03T14:20:00.000Z",
  },
  {
    id: 3,
    name: "Robert Taylor",
    email: "robert.taylor@email.com",
    phone: "+63 919 345 6789",
    role: "customer",
    status: "Active",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: 4,
    name: "Lisa Anderson",
    email: "lisa.anderson@email.com",
    phone: "+63 920 456 7890",
    role: "customer",
    status: "Active",
    createdAt: "2026-02-22T16:45:00.000Z",
  },
  {
    id: 5,
    name: "Michael Garcia",
    email: "michael.garcia@email.com",
    phone: "+63 921 567 8901",
    role: "customer",
    status: "Inactive",
    createdAt: "2025-08-05T09:15:00.000Z",
  },
]

const USER_STORAGE_KEYS = [
  "oneestela_registered_users",
  "oneestela_users_v1",
  "oneestela_customers_v1",
  "oneestela_registered_customers_v1",
  "oneestela_auth_users_v1",
]

function normalizeStatus(status?: string): CustomerStatus {
  return String(status || "").trim().toLowerCase() === "inactive" ? "Inactive" : "Active"
}

function getName(user: any) {
  const fullName =
    user?.name ||
    user?.fullName ||
    user?.customerName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`

  return String(fullName || "Unnamed Customer").trim()
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.charAt(0) || ""
  const second = words.length > 1 ? words[words.length - 1]?.charAt(0) : ""

  return `${first}${second}`.toUpperCase() || "CU"
}

function getRoleBadgeClass(role: string) {
  const r = role.toLowerCase()
  if (r === "admin" || r === "staff" || r === "owner") return "border-purple-200 bg-purple-50 text-purple-700"
  return "border-slate-200 bg-slate-100 text-slate-600"
}

function getStatusBadgeClass(status: CustomerStatus) {
  return status === "Active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500"
}

function getProfilePicture(user: any): string | undefined {
  if (user?.profilePicture) return user.profilePicture
  if (typeof window === "undefined") return undefined
  try {
    const raw = window.localStorage.getItem("oneestela_profile_picture_index")
    if (!raw) return undefined
    const map = JSON.parse(raw)
    const uid = user?.id || user?.uid || user?.customerId
    if (uid && map?.[uid]) return map[uid]
  } catch {
    // ignore
  }
  return undefined
}

function normalizeCustomer(user: any, index: number): CustomerAccount {
  const name = getName(user)
  const role = String(user?.role || user?.userType || user?.type || "customer").toLowerCase()

  return {
    id: user?.id || user?.uid || user?.customerId || user?.email || index + 1,
    name,
    email: String(user?.email || "No email provided"),
    phone: String(user?.phone || user?.contactNumber || user?.mobile || "No phone provided"),
    role,
    status: normalizeStatus(user?.status),
    createdAt: user?.createdAt || user?.created_at || user?.registeredDate || "",
    profilePicture: getProfilePicture(user),
  }
}

function removeDuplicateCustomers(customers: CustomerAccount[]) {
  const map = new Map<string, CustomerAccount>()

  customers.forEach((customer) => {
    const key = customer.email.toLowerCase()

    if (!map.has(key)) {
      map.set(key, customer)
    }
  })

  return Array.from(map.values())
}

function loadCustomersFromLocalStorage() {
  if (typeof window === "undefined") return FALLBACK_CUSTOMERS

  const customers: CustomerAccount[] = []

  USER_STORAGE_KEYS.forEach((key) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.users)
          ? parsed.users
          : Array.isArray(parsed?.customers)
            ? parsed.customers
            : []

      list.forEach((item: any, index: number) => {
        const role = String(item?.role || item?.userType || item?.type || "customer").toLowerCase()
        const isCustomer = !role || role.includes("customer") || role.includes("client") || role.includes("user")

        if (isCustomer) {
          customers.push(normalizeCustomer(item, index))
        }
      })
    } catch {
      // Ignore invalid LocalStorage item.
    }
  })

  return customers.length > 0 ? removeDuplicateCustomers(customers) : FALLBACK_CUSTOMERS
}

function UserCard({ customer }: { customer: CustomerAccount }) {
  return (
    <div className="group flex w-full max-w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div className="flex shrink-0 items-center gap-3 sm:w-[220px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 ring-2 ring-white shadow-sm">
          {customer.profilePicture ? (
            <img src={customer.profilePicture} alt={customer.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-black uppercase">{getInitials(customer.name)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            User
          </p>
          <p className="break-words whitespace-normal text-sm font-black text-slate-900">
            {customer.name}
          </p>
          <p className="break-words whitespace-normal text-[11px] font-bold text-slate-500">
            {customer.phone !== "No phone provided" ? customer.phone : ""}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-2 gap-y-1.5 sm:grid-cols-3 sm:gap-x-3">
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">Email</p>
          <p className="whitespace-normal break-words text-xs font-black text-slate-800">{customer.email}</p>
        </div>
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">Role</p>
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
              getRoleBadgeClass(customer.role),
            )}
          >
            {customer.role === "customer" || customer.role === "client" || customer.role === "user" ? "Customer" : customer.role}
          </span>
        </div>
        <div className="min-w-0 max-w-full">
          <p className="whitespace-normal break-words text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
              getStatusBadgeClass(customer.status),
            )}
          >
            {customer.status}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1">
        <div className="text-right">
          <p className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest text-slate-400">Last Activity</p>
          <p className="whitespace-nowrap text-xs font-semibold text-slate-400">N/A</p>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    setCustomers(loadCustomersFromLocalStorage())
  }, [])

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return customers
      .filter((customer) => {
        const matchesStatus = statusFilter === "all" || customer.status === statusFilter

        const searchableText = [
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.status,
        ]
          .join(" ")
          .toLowerCase()

        const matchesSearch = !keyword || searchableText.includes(keyword)

        return matchesStatus && matchesSearch
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "Active" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [customers, searchTerm, statusFilter])

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
        <section className="border-b border-slate-200 pb-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
            Admin Users Information
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            User Information
          </h1>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Read-only view of registered customer accounts and contact details.
          </p>
        </section>

        <div className="mt-5 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search user..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 text-xs font-bold text-slate-700 focus-visible:ring-orange-600 sm:w-[300px]"
            />
          </div>

          <div className="w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-orange-600 sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all" className="font-bold">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
              }}
              className="h-10 rounded-xl border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Clear
            </Button>
          )}
        </div>

        {filteredCustomers.length > 0 ? (
          <section className="space-y-3">
            {filteredCustomers.map((customer, idx) => (
              <UserCard key={idx} customer={customer} />
            ))}
          </section>
        ) : (
          <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-black text-slate-700">No users found</h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              {searchTerm || statusFilter !== "all"
                ? "Try clearing your filters or search keyword."
                : "Registered customers will appear here once available."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
