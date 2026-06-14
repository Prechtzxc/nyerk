import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  // Seed admin + maintenance record
  await page.goto(BASE)
  await page.evaluate(() => {
    localStorage.clear()

    localStorage.setItem('mock_user', JSON.stringify({
      id: 'admin-default-001', fullName: 'Admin', name: 'Admin',
      email: 'admin@oneestela.com', password: 'admin123',
      role: 'admin', profilePicture: '', status: 'active',
      createdAt: new Date('2024-01-01').toISOString(),
    }))

    localStorage.setItem('oneestela_global_maintenance_v2', JSON.stringify([{
      id: 'maint_test', type: 'venue', spaceId: 'v1', spaceName: 'Conference Hall',
      date: '2026-07-20', status: 'Active',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }]))
  })

  // Switch to user
  await page.evaluate(() => {
    localStorage.setItem('mock_user', JSON.stringify({
      id: 'client-default-001', fullName: 'User Client', name: 'User Client',
      email: 'user@oneestela.com', password: 'user123',
      role: 'client', profilePicture: '', status: 'active',
      createdAt: new Date('2024-01-01').toISOString(),
    }))
  })

  await page.goto(`${BASE}/portal/bookings`)
  await page.waitForTimeout(4000)

  // Verify localStorage
  const recordsInLS = await page.evaluate(() => {
    const raw = localStorage.getItem('oneestela_global_maintenance_v2')
    return raw ? JSON.parse(raw).length : 0
  })
  console.log('Records in localStorage:', recordsInLS)

  // Open dialog
  await page.locator('button:has-text("Book Now")').first().click()
  await page.waitForTimeout(1500)

  // Click Venue
  await page.locator('button:has-text("Venue")').click()
  await page.waitForTimeout(1500)

  // Select first venue (The Milestone Event, id=v1)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const target = btns.find(b => b.textContent.includes('Select') && b.textContent.includes('Venue'))
    if (target) target.click()
  })
  await page.waitForTimeout(3000)

  // Debug calendar output
  const debug = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
    const h5 = document.querySelector('h5')
    const monthText = h5 ? h5.textContent : 'none'
    const dayBtns = btns.filter(b => /^[0-9]+$/.test((b.textContent || '').trim()))
    const dayDetails = dayBtns.map(b => ({
      day: (b.textContent || '').trim(),
      title: b.title,
      disabled: b.disabled,
    }))
    return { monthText, totalDays: dayDetails.length, days: dayDetails }
  })

  console.log('Month:', debug.monthText)
  console.log('Total day buttons:', debug.totalDays)
  const maintDays = debug.days.filter(d => d.title === 'Maintenance')
  console.log('Maintenance days:', maintDays.length)
  if (maintDays.length > 0) {
    console.log('  - Day', maintDays[0].day)
  }
  // Show day 20 specifically
  const day20 = debug.days.find(d => d.day === '20')
  console.log('Day 20:', JSON.stringify(day20))

  await browser.close()
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
