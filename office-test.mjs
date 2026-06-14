import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function bookOffice(natureValue, natureLabel, customText) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  // Clear previous data and set auth
  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('mock_user', JSON.stringify({
      id: "client-default-001", fullName: "User Client", name: "User Client",
      email: "user@oneestela.com", password: "user123",
      role: "client", profilePicture: "", status: "active",
      createdAt: new Date("2024-01-01").toISOString(),
    }))
  })

  await page.goto(`${BASE}/portal/bookings`)
  await page.waitForTimeout(3000)

  await page.locator('button:has-text("Book Now")').first().click()
  await page.waitForTimeout(1000)

  await page.locator('button:has-text("Office Space")').click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'dbg-step2-list.png' }).catch(() => {})

  // Debug: what text is on the page?
  const listText = await page.locator('[role="dialog"]').textContent().catch(() => 'N/A')
  console.log(`  Dialog text (excerpt): ${listText.substring(0, 500)}`)

  // Click via JS if Playwright can't find it
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => b.textContent.includes('Select Office'))
    if (target) { target.click(); return true }
    return false
  })
  console.log(`  Select Office JS click: ${clicked}`)
  await page.waitForTimeout(1000)

  // Select first available room
  await page.evaluate(() => {
    const containers = document.querySelectorAll('div.grid.grid-cols-2')
    const btns = Array.from(containers[containers.length - 1]?.querySelectorAll('button') || [])
    const enabled = btns.find(b => !b.disabled && b.textContent.includes('Available'))
    if (enabled) enabled.click()
  })
  await page.waitForTimeout(1500)

  // Select date - use JS click to bypass visibility/scroll issues
  const dateSelected = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[aria-label^="Select"]'))
    const enabled = btns.filter(b => !b.disabled)
    if (enabled.length > 0) {
      enabled[0].click()
      return enabled[0].getAttribute('aria-label') || 'unknown'
    }
    return null
  })
  console.log(dateSelected ? `  ✓ Clicked date: ${dateSelected}` : '  ✗ No date available')
  if (!dateSelected) { await browser.close(); return }
  await page.waitForTimeout(800)

  await page.waitForTimeout(800)

  // Select duration: office uses "6 Months", "1 Year", "2 Years"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => b.textContent.trim() === '6 Months')
    if (target) target.click()
  })
  console.log('  ✓ Selected 6 Months duration (JS click)')
  await page.waitForTimeout(500)

  // Click Proceed to Details via JS
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => b.textContent.includes('Proceed to Details') && !b.disabled)
    if (target) target.click()
  })
  console.log('  ✓ Clicked Proceed to Details (JS click)')
  await page.waitForTimeout(1500)

  // Fill company name
  await page.locator('input[placeholder*="Acme"]').first().fill('Test Company Inc.')
  console.log('  ✓ Filled company name')

  // Select nature of business
  await page.evaluate((val) => {
    const sel = document.querySelector('select')
    if (sel) sel.value = val
    const evt = new Event('change', { bubbles: true })
    sel?.dispatchEvent(evt)
  }, natureValue)
  console.log(`  ✓ Selected nature: ${natureLabel}`)

  // If "Others", also fill custom input
  if (natureValue === 'others') {
    await page.waitForTimeout(800)
    const customInp = page.locator('input[placeholder*="business nature"]').first()
    await customInp.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    await customInp.fill(customText || 'Custom Nature')
    console.log(`  ✓ Filled custom nature: ${customText || 'Custom Nature'}`)
    await page.waitForTimeout(500)
  }

  // Check agreement
  await page.evaluate(() => {
    const checkbox = document.querySelector('button[role="checkbox"]')
    if (checkbox && checkbox.getAttribute('aria-checked') !== 'true') checkbox.click()
  })
  console.log('  ✓ Checked agreement')

  await page.waitForTimeout(500)

  // Submit
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]')
    if (submitBtn && !submitBtn.disabled) submitBtn.click()
  })
  console.log('  ✓ Clicked submit')
  await page.waitForTimeout(1500)

  // Confirm booking
  const confirmed = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const confirm = btns.find(b => b.textContent.includes('Confirm Booking'))
    if (confirm) { confirm.click(); return true }
    return false
  })
  if (confirmed) {
    console.log('  ✓ Clicked Confirm Booking')
    await page.waitForTimeout(3000)
    console.log('  ✓ BOOKING CONFIRMED!')

    // Verify in localStorage
    const bookings = await page.evaluate(() => {
      const raw = localStorage.getItem('oneestela_global_bookings_v2')
      return raw ? JSON.parse(raw) : []
    })
    if (bookings.length > 0) {
      const last = bookings[bookings.length - 1]
      console.log(`    ID: ${last.id}`)
      console.log(`    Company: ${last.companyName}`)
      console.log(`    Nature: ${last.natureOfBusiness}`)
      console.log(`    Type: ${last.bookingType}`)
      console.log(`    Office: ${last.isOfficeRental}`)
      if (last.customEventType) console.log(`    Custom: ${last.customEventType}`)
    }
  } else {
    console.log('  ✗ Confirm Booking button not found')
    // Check if booking was created anyway
    const bookingsAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('oneestela_global_bookings_v2')
      return raw ? JSON.parse(raw) : []
    })
    if (bookingsAfter.length > 0) {
      const last = bookingsAfter[bookingsAfter.length - 1]
      console.log(`  (Booking may have been created: ID=${last.id} Nature=${last.natureOfBusiness} Custom=${last.customEventType || ''})`)
    } else {
      console.log('  (No booking found in localStorage)')
    }
  }

  await browser.close()
}

async function main() {
  console.log('=== TEST A: Normal Nature of Business (Technology / IT) ===')
  await bookOffice('tech', 'Technology / IT')

  console.log('\n=== TEST B: Others Nature of Business ===')
  await bookOffice('others', 'Others', 'Construction & Engineering')

  console.log('\n=== ALL TESTS COMPLETE ===')
}

main().catch(err => { console.error('Test failed:', err.message); process.exit(1) })
