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
  userInfo: { name: "User Client", email: "user@oneestela.com", phone: "09171234567" },
}

const CMS_DATA = {
  eventVenueContract: {
    fileName: "Venue Contract.pdf",
    fileType: "application/pdf",
    fileUrl: DATA_URL_PDF,
  },
  officeRentalContract: { fileName: "", fileType: "", fileUrl: "" },
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
context.on("console", (msg) => { consoleLogs.push(`[${msg.type()}] ${msg.text()}`) })
const pageErrors = []
context.on("pageerror", (err) => { pageErrors.push(`PAGE ERROR: ${err.message}\n${err.stack}`) })

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

// Step 1: Click "View Details"
const viewDetailsBtn = page.getByRole("button", { name: /view details/i })
await viewDetailsBtn.first().click()
await page.waitForTimeout(1500)

// Step 2: Click "View Contract"
const viewContractBtn = page.getByRole("button", { name: /view contract/i })
const vcCount = await viewContractBtn.count()
console.log("View Contract buttons found:", vcCount)

if (vcCount > 0) {
  console.log("View Contract button text:", await viewContractBtn.first().textContent())
  console.log("View Contract button visible:", await viewContractBtn.first().isVisible())
  
  const vcRect = await viewContractBtn.first().boundingBox()
  console.log("View Contract rect:", vcRect)
  
  await viewContractBtn.first().click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: "debug4_02_after_view_contract.png", fullPage: true })

  // Step 3: Check runtime state after click
  const runtimeState = await page.evaluate(() => {
    // Check all dialog portals
    const portals = document.querySelectorAll('[data-slot="dialog-portal"]')
    const portalInfo = Array.from(portals).map((p, i) => ({
      index: i,
      display: getComputedStyle(p).display,
      childCount: p.children.length,
      firstChildTag: p.children[0]?.tagName || 'none',
      firstChildClass: p.children[0]?.className || 'none',
    }))

    // Check dialog content elements
    const contents = document.querySelectorAll('[data-slot="dialog-content"]')
    const contentInfo = Array.from(contents).map((c, i) => ({
      index: i,
      display: getComputedStyle(c).display,
      opacity: getComputedStyle(c).opacity,
      zIndex: getComputedStyle(c).zIndex,
      transform: getComputedStyle(c).transform,
      textLength: (c.textContent || '').length,
      textPreview: (c.textContent || '').substring(0, 200),
      overflow: getComputedStyle(c).overflow,
      maxHeight: getComputedStyle(c).maxHeight,
    }))

    // Check overlays
    const overlays = document.querySelectorAll('[data-slot="dialog-overlay"]')
    const overlayInfo = Array.from(overlays).map((o, i) => ({
      index: i,
      display: getComputedStyle(o).display,
      opacity: getComputedStyle(o).opacity,
      zIndex: getComputedStyle(o).zIndex,
    }))

    // Check body overflow
    const bodyOverflow = getComputedStyle(document.body).overflow

    return { portalInfo, contentInfo, overlayInfo, bodyOverflow }
  })

  console.log("\n=== PORTALS ===")
  console.log(JSON.stringify(runtimeState.portalInfo, null, 2))
  console.log("\n=== CONTENTS ===")
  console.log(JSON.stringify(runtimeState.contentInfo, null, 2))
  console.log("\n=== OVERLAYS ===")
  console.log(JSON.stringify(runtimeState.overlayInfo, null, 2))
  console.log("\nBody overflow:", runtimeState.bodyOverflow)

  // Step 4: Check if iframe exists (for PDF)
  const iframes = await page.locator("iframe").count()
  console.log("\nIframes in page:", iframes)

  // Step 5: Get all element attributes for debugging
  if (iframes > 0) {
    const iframeInfo = await page.evaluate(() => {
      const frames = document.querySelectorAll("iframe")
      return Array.from(frames).map(f => ({
        src: f.src?.substring(0, 100),
        className: f.className,
        style: f.getAttribute("style") || "none",
      }))
    })
    console.log("Iframe info:", JSON.stringify(iframeInfo, null, 2))
  }

  // Check what the full page text shows now
  const pageText = await page.evaluate(() => document.body.innerText)
  console.log("\n=== PAGE TEXT AFTER CLICK ===")
  console.log(pageText.substring(pageText.length - 2000))
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
