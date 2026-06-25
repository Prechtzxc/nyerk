import { chromium } from "playwright"

const BASE = "http://localhost:3456"

// Minimal valid PDF as data URL
const DATA_URL_PDF = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXI8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxOTAKJSVFT0YK"

const BOOKING = {
  id: "test-booking-001",
  userId: "client-default-001",
  venue: "Private Event Hall",
  eventName: "Test Wedding",
  eventType: "Wedding",
  guestCount: 50,
  date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
  startTime: "10:00",
  endTime: "22:00",
  status: "confirmed",
  bookingStatus: "confirmed",
  paymentStatus: "verified",
  totalPrice: 50000,
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  isSlotSecured: true,
  cancellationRequested: false,
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
  homepage: {
    heroHeadline: "Test",
    heroSubheadline: "Test",
  },
  about: {},
  footer: {},
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
  storageState: undefined,
})

// Collect all console messages
const consoleLogs = []
context.on("console", (msg) => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
})

// Collect all page errors
const pageErrors = []
context.on("pageerror", (err) => {
  pageErrors.push(`PAGE ERROR: ${err.message}\n${err.stack}`)
})

const page = await context.newPage()

// ---------- Step 1: Set up localStorage before app loads ----------
await page.addInitScript(
  ({ booking, cmsData, authUser }) => {
    // Seed booking data
    localStorage.setItem("oneestela_global_bookings_v2", JSON.stringify([booking]))
    // Seed CMS data
    localStorage.setItem("oneestela_cms_data", JSON.stringify(cmsData))
    // Seed registered users (so seedDefaultAccounts works)
    localStorage.setItem("oneestela_registered_users", JSON.stringify([authUser]))
    // Set current user (log in)
    localStorage.setItem("mock_user", JSON.stringify(authUser))
  },
  { booking: BOOKING, cmsData: CMS_DATA, authUser: AUTH_USER }
)

// Navigate
await page.goto(`${BASE}/portal/bookings`, { waitUntil: "networkidle" })
await page.waitForTimeout(2000)

// ---------- Step 2: Take screenshots and gather evidence ----------
await page.screenshot({ path: "debug_01_initial.png", fullPage: true })

// Log the page title
console.log("PAGE TITLE:", await page.title())

// Check if we see booking cards
const bodyText = await page.textContent("body")
console.log("BODY TEXT (first 500):", bodyText.slice(0, 500))

// ---------- Step 3: Find and click a booking card ----------
// Look for buttons/links with booking info
const bookingCards = await page.locator('[class*="rounded-2xl"]').all()
console.log("Rounded cards found:", bookingCards.length)

// Try clicking the first booking card to open details
// The booking card likely has an "onClick" or a button
const viewDetailsButtons = await page.getByRole("button", { name: /details/i }).all()
console.log("'Details' buttons:", viewDetailsButtons.length)

if (viewDetailsButtons.length === 0) {
  // Try other selectors
  const allButtons = await page.getByRole("button").all()
  console.log("Total buttons:", allButtons.length)
  for (const btn of allButtons) {
    const text = await btn.textContent()
    console.log("  Button text:", text?.trim())
  }
}

// Try by text content
const bookingCard = page.locator("body").locator("div").filter({ hasText: "Test Wedding" }).first()
const bookingCardExists = await bookingCard.count()
console.log("Booking card found:", bookingCardExists)

if (bookingCardExists > 0) {
  // Click on the booking card
  await bookingCard.click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: "debug_02_after_click_card.png", fullPage: true })
  console.log("After clicking booking card")
}

// ---------- Step 4: Look for "View Contract" button ----------
const viewContractBtns = page.getByRole("button", { name: /view contract/i })
const vcCount = await viewContractBtns.count()
console.log("'View Contract' buttons:", vcCount)

if (vcCount > 0) {
  console.log("View Contract button text:", await viewContractBtns.first().textContent())
  await viewContractBtns.first().click()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "debug_03_after_view_contract.png", fullPage: true })
  console.log("Clicked View Contract")
}

// ---------- Step 5: Capture all console output ----------
console.log("\n====== CONSOLE LOGS ======")
for (const log of consoleLogs) {
  console.log(log)
}

console.log("\n====== PAGE ERRORS ======")
for (const err of pageErrors) {
  console.log(err)
}

// ---------- Step 6: Inspect DOM for modals ----------
// Check for Radix Dialog portals
const portalCount = await page.locator('[data-slot="dialog-portal"]').count()
console.log("\nDialog portals found:", portalCount)

for (let i = 0; i < portalCount; i++) {
  const portal = page.locator('[data-slot="dialog-portal"]').nth(i)
  const html = await portal.innerHTML()
  console.log(`Portal ${i}:`, html.substring(0, 500))
  const display = await portal.evaluate(el => window.getComputedStyle(el).display)
  const visibility = await portal.evaluate(el => window.getComputedStyle(el).visibility)
  const opacity = await portal.evaluate(el => window.getComputedStyle(el).opacity)
  console.log(`  display:${display} visibility:${visibility} opacity:${opacity}`)
}

// Check for dialog content
const dialogContent = page.locator('[data-slot="dialog-content"]')
const dcCount = await dialogContent.count()
console.log("\nDialog content elements:", dcCount)

for (let i = 0; i < dcCount; i++) {
  const dc = dialogContent.nth(i)
  const display = await dc.evaluate(el => window.getComputedStyle(el).display)
  const zIndex = await dc.evaluate(el => window.getComputedStyle(el).zIndex)
  const html = await dc.innerHTML()
  console.log(`Content ${i}: display=${display}, z-index=${zIndex}`)
  console.log(`  HTML:`, html.substring(0, 300))
}

// Check for overlays
const overlays = page.locator('[data-slot="dialog-overlay"]')
const overlayCount = await overlays.count()
console.log("\nDialog overlays:", overlayCount)
for (let i = 0; i < overlayCount; i++) {
  const ov = overlays.nth(i)
  const display = await ov.evaluate(el => window.getComputedStyle(el).display)
  const zIndex = await ov.evaluate(el => window.getComputedStyle(el).zIndex)
  console.log(`Overlay ${i}: display=${display}, z-index=${zIndex}`)
}

// Check for iframes / docx preview containers
const iframes = await page.locator("iframe").count()
console.log("\nIframes found:", iframes)
const docxContainers = await page.locator('[class*="docx"]').count()
console.log("DOCX containers:", docxContainers)

await browser.close()
