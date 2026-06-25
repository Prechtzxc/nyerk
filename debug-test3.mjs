import { chromium } from "playwright"

const BASE = "http://localhost:3456"

const DATA_URL_PDF = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxOTAKJSVFT0YK"

const BOOKING = {
  id: "test-booking-001",
  userId: "client-default-001",
  venue: "Private Event Hall",
  eventName: "Test Wedding",
  eventType: "Wedding",
  guestCount: 50,
  date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
  endDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "22:00",
  status: "confirmed",
  bookingStatus: "confirmed",
  paymentStatus: "verified",
  totalPrice: 50000,
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  isSlotSecured: true,
  cancellationRequested: false,
  userInfo: {
    name: "User Client",
    email: "user@oneestela.com",
    phone: "09171234567",
  },
}

const CMS_DATA = {
  eventVenueContract: {
    fileName: "Venue Contract.pdf",
    fileType: "application/pdf",
    fileUrl: DATA_URL_PDF,
  },
  officeRentalContract: {
    fileName: "",
    fileType: "",
    fileUrl: "",
  },
  homepage: { heroHeadline: "Test", heroSubheadline: "Test" },
  about: { content: "" },
  footer: { content: "" },
  venues: [],
  offices: [],
  faqs: [],
  pastEvents: [],
  pastClientBookings: [],
  policies: [],
}

const AUTH_USER = {
  id: "client-default-001",
  fullName: "User Client",
  name: "User Client",
  email: "user@oneestela.com",
  role: "client",
  profilePicture: "",
  createdAt: new Date("2024-01-01").toISOString(),
  status: "active",
  password: "user123",
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })

const consoleLogs = []
context.on("console", (msg) => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
})
const pageErrors = []
context.on("pageerror", (err) => {
  pageErrors.push(`PAGE ERROR: ${err.message}\n${err.stack}`)
})

const page = await context.newPage()

await page.addInitScript(
  ({ booking, cmsData, authUser }) => {
    localStorage.setItem("oneestela_global_bookings_v2", JSON.stringify([booking]))
    localStorage.setItem("oneestela_cms_data", JSON.stringify(cmsData))
    localStorage.setItem("oneestela_registered_users", JSON.stringify([authUser]))
    localStorage.setItem("mock_user", JSON.stringify(authUser))
  },
  { booking: BOOKING, cmsData: CMS_DATA, authUser: AUTH_USER }
)

await page.goto(`${BASE}/portal/bookings`, { waitUntil: "networkidle" })
await page.waitForTimeout(2000)

// Click "View Details" button directly
const viewDetailsBtn = page.getByRole("button", { name: /view details/i })
const vdCount = await viewDetailsBtn.count()
console.log("View Details buttons:", vdCount)

if (vdCount > 0) {
  await viewDetailsBtn.first().click()
  await page.waitForTimeout(2000)

  await page.screenshot({ path: "debug3_01_after_view_details.png", fullPage: true })

  // Get ALL visible text on the page
  const pageText = await page.evaluate(() => document.body.innerText)
  console.log("\n=== FULL PAGE TEXT ===")
  console.log(pageText)

  // Runtime check - what does the BookingDetailsModal see?
  const deets = await page.evaluate(() => {
    const bookingRaw = localStorage.getItem("oneestela_global_bookings_v2")
    const bookings = bookingRaw ? JSON.parse(bookingRaw) : []
    const booking = bookings[0]
    if (!booking) return { error: "no booking" }
    
    const ps = String(booking.paymentStatus || "").toLowerCase()
    const isPaymentVerified = ps === "verified" || ps === "paid" || ps === "partial" || ps === "slot_verified" || booking.isSlotSecured === true
    
    const cmsRaw = localStorage.getItem("oneestela_cms_data")
    const cms = cmsRaw ? JSON.parse(cmsRaw) : null
    
    const isOfficeRental = (["bookingType", "rentalType", "venue", "eventType"]
      .map(k => String(booking[k] || ""))
      .join(" ")
      .toLowerCase()
      .includes("office"))
    
    const contract = isOfficeRental
      ? cms?.officeRentalContract
      : cms?.eventVenueContract
    const hasContract = contract?.fileUrl && contract?.fileName
    
    return {
      paymentStatus: booking.paymentStatus,
      isSlotSecured: booking.isSlotSecured,
      isPaymentVerified,
      isOfficeRental,
      contractFileName: contract?.fileName,
      hasContract,
      fileUrlPrefix: contract?.fileUrl?.substring(0, 50),
      fileType: contract?.fileType,
    }
  })
  
  console.log("\n=== RUNTIME CHECK ===")
  console.log(JSON.stringify(deets, null, 2))

  // Check DOM for dialog content
  const dialogPortals = await page.evaluate(() => {
    const portals = document.querySelectorAll('[data-slot="dialog-portal"]')
    return Array.from(portals).map(p => ({
      innerHTML: p.innerHTML.substring(0, 400),
      display: getComputedStyle(p).display,
    }))
  })
  console.log("\n=== DIALOG PORTALS ===")
  console.log(JSON.stringify(dialogPortals, null, 2))

  // Check if BookingDetailsModal actually became visible
  const dialogContents = await page.evaluate(() => {
    const contents = document.querySelectorAll('[data-slot="dialog-content"]')
    return Array.from(contents).map(c => ({
      display: getComputedStyle(c).display,
      opacity: getComputedStyle(c).opacity,
      zIndex: getComputedStyle(c).zIndex,
      text: c.textContent?.substring(0, 300),
    }))
  })
  console.log("\n=== DIALOG CONTENTS ===")
  console.log(JSON.stringify(dialogContents, null, 2))

  // Check if there's a section with "Contract" heading
  const contractHeading = await page.evaluate(() => {
    // Find any element containing "CONTRACT" (the uppercase label)
    const all = document.querySelectorAll("*")
    for (const el of all) {
      if (el.children.length === 0) continue // skip leaf nodes
      const text = el.textContent || ""
      if (text.includes("CONTRACT") && getComputedStyle(el).display !== "none") {
        return {
          tag: el.tagName,
          text: text.substring(0, 500),
          visible: el.offsetParent !== null,
          rect: el.getBoundingClientRect(),
        }
      }
    }
    return null
  })
  console.log("\n=== CONTRACT HEADING ===")
  console.log(JSON.stringify(contractHeading, null, 2))
}

console.log("\n====== CONSOLE LOGS ======")
for (const log of consoleLogs) {
  console.log(log)
}
console.log("\n====== PAGE ERRORS ======")
for (const err of pageErrors) {
  console.log(err)
}

await browser.close()
