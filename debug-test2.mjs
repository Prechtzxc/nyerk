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
  // Need all required CMS fields to prevent normalization from clearing our data
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
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
})

const consoleLogs = []
context.on("console", (msg) => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
})

const pageErrors = []
context.on("pageerror", (err) => {
  pageErrors.push(`PAGE ERROR: ${err.message}\n${err.stack}`)
})

const page = await context.newPage()

// Set up localStorage before any app JS runs
await page.addInitScript(
  ({ booking, cmsData, authUser }) => {
    localStorage.setItem("oneestela_global_bookings_v2", JSON.stringify([booking]))
    localStorage.setItem("oneestela_cms_data", JSON.stringify(cmsData))
    localStorage.setItem("oneestela_registered_users", JSON.stringify([authUser]))
    localStorage.setItem("mock_user", JSON.stringify(authUser))
  },
  { booking: BOOKING, cmsData: CMS_DATA, authUser: AUTH_USER }
)

// Navigate and wait for full load
await page.goto(`${BASE}/portal/bookings`, { waitUntil: "networkidle" })
await page.waitForTimeout(3000)

// Check localStorage to verify our data is intact
const lsCheck = await page.evaluate(() => ({
  booking: JSON.parse(localStorage.getItem("oneestela_global_bookings_v2") || "null"),
  cms: JSON.parse(localStorage.getItem("oneestela_cms_data") || "null"),
  user: JSON.parse(localStorage.getItem("mock_user") || "null"),
}))

console.log("=== localStorage verification ===")
console.log("Booking userId:", lsCheck.booking?.[0]?.userId)
console.log("CMS contract:", lsCheck.cms?.eventVenueContract?.fileName)
console.log("User email:", lsCheck.user?.email)

// Click booking card
const card = page.locator("body").locator("div").filter({ hasText: "Test Wedding" }).first()
const cardCount = await card.count()
console.log("\nBooking card count:", cardCount)

if (cardCount > 0) {
  await card.click()
  await page.waitForTimeout(2500)

  await page.screenshot({ path: "debug2_01_modal_open.png", fullPage: true })

  // Check what's visible
  const visibleText = await page.evaluate(() => document.body.innerText)
  console.log("\n=== Visible text after clicking card ===")
  // Find lines containing key terms
  const lines = visibleText.split("\n")
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes("contract") || lower.includes("payment") || lower.includes("verified") || lower.includes("wedding")) {
      console.log("  ", line.trim())
    }
  }

  // Check the parent's hasContract / isPaymentVerified at runtime
  const runtimeState = await page.evaluate(() => {
    // Read CMS data directly from localStorage
    const rawCms = localStorage.getItem("oneestela_cms_data")
    const cms = rawCms ? JSON.parse(rawCms) : null
    
    // Read the contract
    const contractFile = cms?.eventVenueContract
    const hasContract = contractFile?.fileUrl && contractFile?.fileName
    
    return {
      cmsPresent: !!cms,
      contractFileName: contractFile?.fileName,
      contractFileUrlFirst100: contractFile?.fileUrl?.substring(0, 100),
      contractFileType: contractFile?.fileType,
      hasContract,
    }
  })
  
  console.log("\n=== CMS/Contract runtime state ===")
  console.log(JSON.stringify(runtimeState, null, 2))

  // Check for View Contract button by scanning all buttons
  const allBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button")).map(b => ({
      text: b.textContent?.trim(),
      visible: b.offsetParent !== null,
      rect: b.getBoundingClientRect(),
    }))
  })
  
  console.log("\n=== All visible buttons ===")
  for (const btn of allBtns) {
    if (btn.visible) {
      console.log(`  "${btn.text}" @ (${Math.round(btn.rect.left)},${Math.round(btn.rect.top)}) ${Math.round(btn.rect.width)}x${Math.round(btn.rect.height)}`)
    }
  }

  // Check for any section with "Contract" heading
  const contractSections = await page.evaluate(() => {
    const elements = document.querySelectorAll("section, div")
    const results = []
    for (const el of elements) {
      if (el.textContent?.toLowerCase().includes("contract") && el.offsetParent !== null) {
        results.push({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 200),
          visible: el.offsetParent !== null,
        })
      }
    }
    return results
  })
  
  console.log("\n=== Visible 'Contract' sections ===")
  for (const sec of contractSections.slice(0, 5)) {
    console.log(`  <${sec.tag}> visible=${sec.visible}`)
    console.log(`    "${sec.text}"`)
  }
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
