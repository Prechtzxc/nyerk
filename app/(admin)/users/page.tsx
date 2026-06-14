"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Button } from "@/src/modules/shared/components/ui/button"
import {
  Search,
  Users,
  ChevronDown,
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A"
  try {
    return new Intl.DateTimeFormat("en-PH", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(dateStr))
  } catch {
    return "N/A"
  }
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

export default function UsersPage() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>("all")

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
    <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
      <div className="mb-5 border-b border-slate-200 pb-5">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-600">
          Admin Users Information
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
          User Information
        </h1>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          Read-only view of registered customer accounts and contact details.
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search user..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-11 w-full rounded-xl border-slate-200 bg-white pl-9 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-[300px]"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | CustomerStatus)}
            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:w-[170px]"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        {(searchTerm || statusFilter !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold border-slate-200 text-slate-700"
          >
            Clear
          </Button>
        )}
      </div>

      {filteredCustomers.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  <th className="px-4 py-3 w-[200px]">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 w-[100px]">Role</th>
                  <th className="px-4 py-3 w-[90px]">Status</th>
                  <th className="px-4 py-3 w-[130px]">Registered</th>
                  <th className="px-4 py-3 w-[100px]">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-50 text-sm transition hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 ring-2 ring-white shadow-sm">
                          {customer.profilePicture ? (
                            <img src={customer.profilePicture} alt={customer.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black uppercase">{getInitials(customer.name)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="break-words whitespace-normal text-sm font-black text-slate-900">{customer.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="break-words whitespace-normal text-xs font-semibold text-slate-600">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${getRoleBadgeClass(customer.role)}`}>
                        {customer.role === "customer" || customer.role === "client" || customer.role === "user" ? "Customer" : customer.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusBadgeClass(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap text-xs font-semibold text-slate-600">{formatDate(customer.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-400">N/A</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-3 sm:hidden">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600 ring-2 ring-white shadow-sm">
                    {customer.profilePicture ? (
                      <img src={customer.profilePicture} alt={customer.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-black uppercase">{getInitials(customer.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words whitespace-normal text-sm font-black text-slate-900">{customer.name}</p>
                    <p className="whitespace-normal break-words text-[11px] font-semibold text-slate-500">{customer.email}</p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusBadgeClass(customer.status)}`}>
                    {customer.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${getRoleBadgeClass(customer.role)}`}>
                    {customer.role === "customer" || customer.role === "client" || customer.role === "user" ? "Customer" : customer.role}
                  </span>
                  <span>Registered: {formatDate(customer.createdAt)}</span>
                  <span>· Last Activity: N/A</span>
                </div>
              </div>
            ))}
          </div>
        </>
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
  )
}