import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

function getFutureDateStr(monthsAhead = 1, day = 20) {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsAhead)
  d.setDate(day)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 80 })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  const maintenanceDate = getFutureDateStr(1, 20)
  const maintMonth = parseInt(maintenanceDate.split('-')[1])
  const maintDay = parseInt(maintenanceDate.split('-')[2])
  console.log(`Future maintenance date: ${maintenanceDate} (month=${maintMonth}, day=${maintDay})`)

  // Admin auth
  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('mock_user', JSON.stringify({
      id: "admin-default-001", fullName: "Admin", name: "Admin",
      email: "admin@oneestela.com", password: "admin123",
      role: "admin", profilePicture: "", status: "active",
      createdAt: new Date("2024-01-01").toISOString(),
    }))
  })

  // =============================================
  // STEPS 1-9: Admin maintenance
  // =============================================
  console.log('\n=== STEPS 1-9: Admin Maintenance ===')
  await page.goto(`${BASE}/dashboard/bookings`)
  await page.waitForTimeout(3000)
  await page.locator('button:has-text("Calendar")').click()
  await page.waitForTimeout(1000)

  // 3: Select Event Venue
  await page.locator('button:has-text("Event Venue")').click()
  await page.waitForTimeout(500)

  // 4: Verify venue dropdown shows venues only
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return
    const combobox = dialog.querySelector('[role="combobox"]')
    if (combobox) combobox.click()
  })
  await page.waitForTimeout(400)
  const spaceOpts = await page.evaluate(() => Array.from(document.querySelectorAll('[role="option"]')).map(el => el.textContent || ''))
  console.log(`  4. Venue options: ${spaceOpts.join(', ')}`)
  const venuesOnly = spaceOpts.every(v => !/Office Room/i.test(v)) && spaceOpts.length >= 3
  console.log(`     Venues only (no offices): ${venuesOnly}`)

  // Close dropdown via Esc
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  // 5-6: Navigate to maintenance month, click date
  // Admin calendar starts at current month (June)
  // Need to advance 1 month to reach July
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Next month"]')
    if (btn) btn.click()
  })
  await page.waitForTimeout(300)

  // Click day 20
  await page.evaluate((day) => {
    const btns = Array.from(document.querySelectorAll('button[title="Available"]'))
    const target = btns.find(b => b.textContent && parseInt(b.textContent.trim()) === day)
    if (target) target.click()
  }, maintDay)
  console.log(`  5-6. Date clicked: ${maintDay}`)

  // 7: Add reason
  await page.locator('textarea').fill('Annual plumbing inspection')
  console.log('  7. Reason added')

  // 8: Save
  await page.locator('button:has-text("Block Maintenance")').click()
  await page.waitForTimeout(1500)

  // 9: Verify
  const maintShown = await page.evaluate(() => document.querySelectorAll('button[title="Maintenance"]').length)
  console.log(`  9. Maintenance days shown: ${maintShown}`)

  const legendOk = await page.evaluate(() => {
    const t = document.body.textContent || ''
    return t.includes('Available') && t.includes('Selected') && t.includes('Maintenance') && t.includes('Past Date')
  })
  console.log(`     Legend (all 4): ${legendOk}`)

  const recordShown = await page.locator('text=Annual plumbing inspection').isVisible()
  console.log(`     Existing list shows reason: ${recordShown}`)

  // Close modal
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Close')
    if (btn) btn.click()
  })
  await page.waitForTimeout(600)

  // =============================================
  // STEPS 10-12, 17: User calendar
  // =============================================
  console.log('\n=== STEPS 10-12, 17: User Calendar Maintenance ===')
  await page.evaluate(() => {
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
  await page.locator('button:has-text("Venue")').click()
  await page.waitForTimeout(1000)

  // Select first venue (The Milestone Event, id=v1)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => b.textContent.includes('Select') && b.textContent.includes('Venue'))
    if (target) target.click()
  })
  await page.waitForTimeout(3000)

  // User calendar starts at July (1 month ahead)
  // Check maintenance for day 20
  const calDebug = await page.evaluate(() => {
    const h5 = document.querySelector('h5')
    const btns = Array.from(document.querySelectorAll('button'))
    const dayBtns = btns.filter(b => /^[0-9]+$/.test((b.textContent || '').trim()))
    const day20 = dayBtns.find(b => (b.textContent || '').trim() === '20')
    return {
      monthText: h5 ? h5.textContent : 'none',
      day20Title: day20?.title || 'not found',
      day20Disabled: day20?.disabled || false,
    }
  })
  console.log(`  10-12. Calendar month: ${calDebug.monthText}`)
  console.log(`         Day 20: title="${calDebug.day20Title}" disabled=${calDebug.day20Disabled}`)
  console.log(`         Maintenance blocked: ${calDebug.day20Title === 'Maintenance day' && calDebug.day20Disabled}`)

  // 17: Check legend
  const legendHasMaint = await page.evaluate(() => (document.body.textContent || '').includes('Maint'))
  console.log(`  17. Calendar legend shows Maintenance: ${legendHasMaint}`)

  // =============================================
  // STEPS 13-14: Unrelated venue not blocked
  // =============================================
  console.log('\n=== STEPS 13-14: Unrelated venue not blocked ===')
  // Go back and select a different venue
  await page.evaluate(() => {
    const backBtn = document.querySelector('button[aria-label="Go Back"]')
    if (backBtn) backBtn.click()
  })
  await page.waitForTimeout(1000)

  // Click on different venue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const targets = btns.filter(b => b.textContent.includes('Select') && b.textContent.includes('Venue'))
    if (targets.length > 1) targets[1].click()
  })
  await page.waitForTimeout(3000)

  const otherVenue = await page.evaluate(() => {
    const h5 = document.querySelector('h5')
    const btns = Array.from(document.querySelectorAll('button'))
    const dayBtns = btns.filter(b => /^[0-9]+$/.test((b.textContent || '').trim()))
    const day20 = dayBtns.find(b => (b.textContent || '').trim() === '20')
    return {
      monthText: h5 ? h5.textContent : 'none',
      day20Title: day20?.title || 'not found',
    }
  })
  console.log(`  13-14. Other venue calendar month: ${otherVenue.monthText}`)
  console.log(`         Day 20: title="${otherVenue.day20Title}"`)
  console.log(`         NOT blocked (should be Available): ${otherVenue.day20Title === 'Available'}`)

  // Close dialog
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Close"]')
    if (btn) btn.click()
  })
  await page.waitForTimeout(500)

  // =============================================
  // STEPS 15-16: Office + submit block
  // =============================================
  console.log('\n=== STEP 15: Office Space ===')
  await page.evaluate(() => {
    localStorage.setItem('mock_user', JSON.stringify({
      id: "admin-default-001", fullName: "Admin", name: "Admin",
      email: "admin@oneestela.com", password: "admin123",
      role: "admin", profilePicture: "", status: "active",
      createdAt: new Date("2024-01-01").toISOString(),
    }))
  })
  await page.goto(`${BASE}/dashboard/bookings`)
  await page.waitForTimeout(3000)
  await page.locator('button:has-text("Calendar")').click()
  await page.waitForTimeout(1000)

  await page.locator('button:has-text("Office Space")').click()
  await page.waitForTimeout(500)

  // Open space dropdown
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return
    const combobox = dialog.querySelector('[role="combobox"]')
    if (combobox) combobox.click()
  })
  await page.waitForTimeout(300)
  const officeOpts = await page.evaluate(() => Array.from(document.querySelectorAll('[role="option"]')).map(el => el.textContent || ''))
  console.log(`  15. Office options: ${officeOpts.slice(0, 3).join(', ')}...`)
  const hasOffices = officeOpts.some(v => /Office/i.test(v))
  console.log(`      Office rooms shown: ${hasOffices}`)

  // Select first office
  await page.evaluate(() => {
    const opt = document.querySelector('[role="option"]')
    if (opt) opt.click()
  })
  await page.waitForTimeout(500)

  // Navigate to July
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Next month"]')
    if (btn) btn.click()
  })
  await page.waitForTimeout(300)

  // Click day 20
  await page.evaluate((day) => {
    const btns = Array.from(document.querySelectorAll('button[title="Available"]'))
    const target = btns.find(b => b.textContent && parseInt(b.textContent.trim()) === day)
    if (target) target.click()
  }, maintDay)
  await page.waitForTimeout(300)

  await page.locator('button:has-text("Block Maintenance")').click()
  await page.waitForTimeout(1500)
  console.log('      Office maintenance saved')

  // =============================================
  // FINAL VERIFICATION
  // =============================================
  console.log('\n=== Final Verification ===')
  const allRecords = await page.evaluate(() => {
    const raw = localStorage.getItem('oneestela_global_maintenance_v2')
    return raw ? JSON.parse(raw) : []
  })
  console.log(`  Total records: ${allRecords.length}`)
  for (const r of allRecords) {
    const valid = !!(r.id && r.spaceId && r.spaceName && r.date && r.status === 'Active')
    console.log(`  - ${r.spaceName} (${r.type}) date=${r.date} valid=${valid} reason=${r.reason || ''}`)
  }

  // === PASS/FAIL SUMMARY ===
  let passed = 0, failed = 0
  const check = (name, condition) => {
    if (condition) { passed++; console.log(`  ✅ ${name}`) }
    else { failed++; console.log(`  ❌ ${name}`) }
  }

  check('Venue type selector shows venues only', venuesOnly)
  check('Admin calendar legend shows (Available+Selected+Maintenance+Past)', legendOk)
  check('Existing maintenance list shows record', recordShown)
  check('Admin calendar marks maintenance day', maintShown > 0)
  check('User calendar: maintenance date is blocked for same venue', calDebug.day20Title === 'Maintenance day' && calDebug.day20Disabled)
  check('User calendar legend references Maintenance', legendHasMaint)
  check('Other venue NOT blocked on same date', otherVenue.day20Title === 'Available')
  check('Office space option shows office rooms', hasOffices)
  check('Venue maintenance record valid (id+spaceId+spaceName+date+status)', allRecords[0] && allRecords[0].id && allRecords[0].spaceId && allRecords[0].spaceName && allRecords[0].date && allRecords[0].status === 'Active')
  check('Office maintenance record valid', allRecords[1] && allRecords[1].id && allRecords[1].spaceId && allRecords[1].spaceName && allRecords[1].date && allRecords[1].status === 'Active')
  check('Records stored in oneestela_global_maintenance_v2', allRecords.length === 2)

  console.log(`\nResults: ${passed}/${passed + failed} passed`)

  // Clean up
  await page.evaluate(() => localStorage.removeItem('oneestela_global_maintenance_v2'))
  console.log('  Test data cleaned up')

  await browser.close()
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Test failed:', err.message)
  process.exit(1)
})
