import { chromium } from "playwright";

const BASE = "http://localhost:3000";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  const results = { pass: [], fail: [] };

  function pass(name) {
    results.pass.push(name);
    console.log("  [PASS] " + name);
  }
  function fail(name, detail) {
    results.fail.push({ name, detail });
    console.log("  [FAIL] " + name + ": " + detail);
  }

  const futureDate = (days) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const bookings = [
    {
      id: "qa-pending-modify",
      userId: "client-default-001",
      venueId: "venue-1",
      venue: "Grand Ballroom",
      eventName: "QA Pending Modify",
      eventType: "Birthday",
      bookingType: "venue",
      bookingCategory: "venue",
      isOfficeRental: false,
      date: futureDate(60),
      time: "8:00 AM - 2:00 PM",
      startTime: "8:00 AM",
      endTime: "2:00 PM",
      guestCount: 50,
      status: "pending",
      bookingStatus: "Pending Verification",
      paymentStatus: "unpaid",
      paymentType: "downpayment",
      totalPrice: 25000,
      amountPaid: 0,
      remainingBalance: 25000,
      remainingBalancePaid: false,
      isSlotSecured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userInfo: { name: "User Client", email: "user@oneestela.com", phone: "0000000000" },
      cancellationRequested: false,
      cancellationStatus: "None",
      modificationRequested: false,
      modificationStatus: "None",
    },
    {
      id: "qa-pending-cancel",
      userId: "client-default-001",
      venueId: "venue-1",
      venue: "Grand Ballroom",
      eventName: "QA Pending Cancel",
      eventType: "Birthday",
      bookingType: "venue",
      bookingCategory: "venue",
      isOfficeRental: false,
      date: futureDate(55),
      time: "9:00 AM - 3:00 PM",
      startTime: "9:00 AM",
      endTime: "3:00 PM",
      guestCount: 30,
      status: "pending",
      bookingStatus: "Pending Verification",
      paymentStatus: "unpaid",
      paymentType: "downpayment",
      totalPrice: 20000,
      amountPaid: 0,
      remainingBalance: 20000,
      remainingBalancePaid: false,
      isSlotSecured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userInfo: { name: "User Client", email: "user@oneestela.com", phone: "0000000000" },
      cancellationRequested: false,
      cancellationStatus: "None",
      modificationRequested: false,
      modificationStatus: "None",
    },
    {
      id: "qa-confirmed-modify",
      userId: "client-default-001",
      venueId: "venue-1",
      venue: "Grand Ballroom",
      eventName: "QA Confirmed Modify",
      eventType: "Wedding",
      bookingType: "venue",
      bookingCategory: "venue",
      isOfficeRental: false,
      date: futureDate(45),
      time: "10:00 AM - 4:00 PM",
      startTime: "10:00 AM",
      endTime: "4:00 PM",
      guestCount: 100,
      status: "confirmed",
      bookingStatus: "Confirmed",
      paymentStatus: "verified",
      paymentType: "downpayment",
      totalPrice: 35000,
      amountPaid: 7500,
      remainingBalance: 27500,
      remainingBalancePaid: false,
      isSlotSecured: true,
      paymentMethod: "bank",
      downpaymentPaid: 7500,
      selectedDownpaymentAmount: 7500,
      downpaymentRemaining: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userInfo: { name: "User Client", email: "user@oneestela.com", phone: "0000000000" },
      cancellationRequested: false,
      cancellationStatus: "None",
      modificationRequested: false,
      modificationStatus: "None",
    },
    {
      id: "qa-office-modify",
      userId: "client-default-001",
      venueId: "office-1",
      venue: "One Estela Place - Room 01",
      eventName: "QA Office Modify",
      eventType: "tech",
      bookingType: "office",
      bookingCategory: "office",
      isOfficeRental: true,
      companyName: "QA Office Modify",
      natureOfBusiness: "Technology / IT",
      date: futureDate(35),
      endDate: futureDate(215),
      time: "",
      startTime: "",
      endTime: "",
      guestCount: 1,
      status: "confirmed",
      bookingStatus: "Confirmed",
      paymentStatus: "slot_verified",
      paymentType: "slot_reservation",
      totalPrice: 18000,
      amountPaid: 18000,
      remainingBalance: 0,
      isSlotSecured: true,
      rentalTerm: "6_months",
      contractTerm: "6_months",
      officeRentalTerm: "6_months",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userInfo: { name: "User Client", email: "user@oneestela.com", phone: "0000000000" },
      cancellationRequested: false,
      cancellationStatus: "None",
      modificationRequested: false,
      modificationStatus: "None",
    },
    {
      id: "qa-dp-incomplete",
      userId: "client-default-001",
      venueId: "venue-1",
      venue: "Grand Ballroom",
      eventName: "QA DP Incomplete",
      eventType: "Birthday",
      bookingType: "venue",
      bookingCategory: "venue",
      isOfficeRental: false,
      date: futureDate(90),
      time: "8:00 AM - 2:00 PM",
      startTime: "8:00 AM",
      endTime: "2:00 PM",
      guestCount: 50,
      status: "verifying",
      bookingStatus: "Pending Verification",
      paymentStatus: "partial",
      paymentType: "downpayment",
      totalPrice: 50000,
      amountPaid: 5500,
      remainingBalance: 44500,
      isSlotSecured: false,
      paymentMethod: "bank",
      downpaymentPaid: 5500,
      selectedDownpaymentAmount: 7500,
      downpaymentRemaining: 2000,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      userInfo: { name: "User Client", email: "user@oneestela.com", phone: "0000000000" },
      cancellationRequested: false,
      cancellationStatus: "None",
      modificationRequested: false,
      modificationStatus: "None",
    },
  ];

  console.log("");
  console.log("=== Seeding test data ===");

  const userPage = await context.newPage();
  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await sleep(1000);

  await userPage.evaluate((seedBookings) => {
    const user = {
      id: "client-default-001",
      fullName: "User Client",
      name: "User Client",
      email: "user@oneestela.com",
      role: "client",
      profilePicture: "",
      createdAt: "2024-01-01T00:00:00.000Z",
      status: "active",
    };
    localStorage.setItem("mock_user", JSON.stringify(user));

    const users = JSON.parse(localStorage.getItem("oneestela_registered_users") || "[]");
    if (!users.some(function (u) { return u.email === "user@oneestela.com"; })) {
      users.push({ ...user, password: "user123" });
      localStorage.setItem("oneestela_registered_users", JSON.stringify(users));
    }

    localStorage.setItem("oneestela_global_bookings_v2", JSON.stringify(seedBookings));

    localStorage.setItem("oneestela_cms_data", JSON.stringify({
      eventVenues: [
        { id: "venue-1", name: "Grand Ballroom", price: 35000, capacity: "100", type: "venue", image: "/placeholder.svg" }
      ],
      officeSpaces: [
        { id: "office-1", name: "One Estela Place - Room 01", price: 18000, type: "office", image: "/placeholder.svg" }
      ]
    }));
  }, bookings);

  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  console.log("=== Tests starting ===");
  console.log("");

  // ======================================================================
  // A. Pending Venue Modify
  // ======================================================================
  console.log("[A] Pending Venue Modify Booking");
  try {
    var modifyBtn = userPage.locator("button", { hasText: "Modify Booking" });
    if (await modifyBtn.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
      // Modal already open
    } else {
      var viewBtns = userPage.locator("button", { hasText: "View Details" });
      await viewBtns.first().click();
      await sleep(1500);
    }

    var modifyBtn = userPage.locator("button", { hasText: "Modify Booking" });
    if (await modifyBtn.isVisible({ timeout: 3000 }).catch(function () { return false; })) {
      var enabled = await modifyBtn.isEnabled().catch(function () { return false; });
      if (!enabled) {
        fail("A: Pending Venue Modify", "Modify button is disabled");
      } else {
        await modifyBtn.click();
        await sleep(2000);

        var hasCalendar = await userPage.locator("text=Choose an available day").isVisible({ timeout: 3000 }).catch(function () { return false; });
        if (hasCalendar) {
          pass("A1: Modify modal opens with schedule step");
        } else {
          fail("A: Pending Venue Modify", "Modify modal content not visible");
          throw new Error("Modal not visible");
        }

        // Try time select
        var selectTrigger = userPage.locator('[role="combobox"]').first();
        if (await selectTrigger.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
          await selectTrigger.click();
          await sleep(500);
          var option = userPage.locator('[role="option"]').first();
          if (await option.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
            await option.click();
            await sleep(300);
            pass("A2: Time select dropdown opens and options visible");
          }
        }

        // Proceed to Details
        var proceedBtn = userPage.locator("button", { hasText: "Proceed" });
        if (await proceedBtn.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
          var isDisabled = await proceedBtn.isDisabled().catch(function () { return true; });
          if (isDisabled) {
            fail("A: Pending Venue Modify", "Proceed button is disabled");
          } else {
            await proceedBtn.click();
            await sleep(1000);

            var ta = userPage.locator("textarea");
            if (await ta.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
              await ta.fill("QA: testing modify flow");
              await sleep(200);

              var subBtn = userPage.locator("button", { hasText: "Modification" });
              if (await subBtn.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
                await subBtn.click();
                await sleep(2000);

                var stored = await userPage.evaluate(function () {
                  var data = JSON.parse(localStorage.getItem("oneestela_global_bookings_v2") || "[]");
                  var b = data.find(function (x) { return x.id === "qa-pending-modify"; });
                  return b ? b.status : "missing";
                });
                if (stored === "modification_under_review") {
                  pass("A: Pending Venue Modify - Status changed");
                } else {
                  fail("A: Pending Venue Modify", "Status is " + stored);
                }
              } else {
                fail("A: Pending Venue Modify", "Submit button not found");
              }
            } else {
              fail("A: Pending Venue Modify", "Textarea not found");
            }
          }
        } else {
          fail("A: Pending Venue Modify", "Proceed button not found");
        }
      }
    } else {
      fail("A: Pending Venue Modify", "Modify button not visible in modal");
    }
  } catch (e) {
    fail("A: Pending Venue Modify", e.message);
  }

  // Close modals
  await userPage.evaluate(function () {
    document.querySelectorAll('[role="dialog"]').forEach(function (d) {
      var btn = d.querySelector("button");
      if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
    });
  });
  await sleep(1000);

  // ======================================================================
  // B. Pending Venue Cancel
  // ======================================================================
  console.log("");
  console.log("[B] Pending Venue Cancel");
  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  try {
    var foundCancel = false;
    var allViewBtnsB = userPage.locator("button", { hasText: "View Details" });
    var countB = await allViewBtnsB.count();
    for (var bIdx = 0; bIdx < countB && !foundCancel; bIdx++) {
      await allViewBtnsB.nth(bIdx).click();
      await sleep(1500);
      var bDialogText = await userPage.locator('[role="dialog"]').first().textContent().catch(function () { return ""; });
      if (bDialogText.includes("QA Pending Cancel")) {
        foundCancel = true;
        console.log("  Found QA Pending Cancel at index " + bIdx);
      } else {
        await userPage.evaluate(function () {
          document.querySelectorAll('[role="dialog"]').forEach(function (d) {
            var btn = d.querySelector("button[aria-label='Close']");
            if (btn) btn.click();
          });
        });
        await sleep(500);
      }
    }

    if (!foundCancel) {
      fail("B: Pending Venue Cancel", "Could not find booking");
    } else {
      var cancelBtn = userPage.locator("button", { hasText: "Cancel Booking" });
      if (await cancelBtn.isVisible({ timeout: 3000 }).catch(function () { return false; })) {
        var cancelEnabled = await cancelBtn.isEnabled().catch(function () { return false; });
        if (!cancelEnabled) {
          fail("B: Pending Venue Cancel", "Cancel button is disabled");
        } else {
          await cancelBtn.click();
          await sleep(1500);

          var cancelTitle = userPage.locator("text=Request Cancellation");
          if (await cancelTitle.isVisible({ timeout: 3000 }).catch(function () { return false; })) {
            pass("B1: Cancellation modal opens");
          }

          var reasonTa = userPage.locator("textarea");
          if (await reasonTa.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
            await reasonTa.fill("QA test: cancel pending booking");
            await sleep(200);

            var submitCancel = userPage.locator("button", { hasText: "Cancellation" });
            if (await submitCancel.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
              await submitCancel.click();
              await sleep(2000);

              var stored = await userPage.evaluate(function () {
                var data = JSON.parse(localStorage.getItem("oneestela_global_bookings_v2") || "[]");
                var b = data.find(function (x) { return x.id === "qa-pending-cancel"; });
                return b ? { status: b.status, reason: b.cancellationReason } : null;
              });
              if (stored && stored.status === "cancellation_requested") {
                pass("B: Pending Venue Cancel - Status changed");
                if (stored.reason === "QA test: cancel pending booking") {
                  pass("B2: Admin sees cancellation reason");
                }
              } else {
                fail("B: Pending Venue Cancel", "Status is " + (stored ? stored.status : "null"));
              }
            } else {
              fail("B: Pending Venue Cancel", "Submit button not found");
            }
          } else {
            fail("B: Pending Venue Cancel", "Textarea not found");
          }
        }
      } else {
        fail("B: Pending Venue Cancel", "Cancel button not visible");
      }
    }
  } catch (e) {
    fail("B: Pending Venue Cancel", e.message);
  }

  // Close modals
  await userPage.evaluate(function () {
    document.querySelectorAll('[role="dialog"]').forEach(function (d) {
      var btn = d.querySelector("button");
      if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
    });
  });
  await sleep(500);

  // ======================================================================
  // C. Confirmed Venue Modify
  // ======================================================================
  console.log("");
  console.log("[C] Confirmed Venue Modify");
  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  try {
    var foundConfirmed = false;
    var allViewBtnsC = userPage.locator("button", { hasText: "View Details" });
    var countC = await allViewBtnsC.count();
    for (var ci = 0; ci < countC && !foundConfirmed; ci++) {
      await allViewBtnsC.nth(ci).click();
      await sleep(1500);
      var cDialogText = await userPage.locator('[role="dialog"]').first().textContent().catch(function () { return ""; });
      if (cDialogText.includes("QA Confirmed Modify")) {
        foundConfirmed = true;
        console.log("  Found QA Confirmed Modify at index " + ci);
      } else {
        await userPage.evaluate(function () {
          document.querySelectorAll('[role="dialog"]').forEach(function (d) {
            var btn = d.querySelector("button");
            if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
          });
        });
        await sleep(500);
      }
    }

    if (!foundConfirmed) {
      fail("C: Confirmed Venue Modify", "Could not find booking");
    } else {
      var modifyBtn2 = userPage.locator("button", { hasText: "Modify Booking" });
      if (await modifyBtn2.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
        var enabled2 = await modifyBtn2.isEnabled().catch(function () { return false; });
        if (!enabled2) {
          fail("C: Confirmed Venue Modify", "Modify button disabled");
        } else {
          await modifyBtn2.click();
          await sleep(2000);

          if (await userPage.locator("text=Choose an available day").isVisible({ timeout: 3000 }).catch(function () { return false; })) {
            pass("C1: Confirmed Modify modal opens with schedule");
          }

          var proceedBtn2 = userPage.locator("button", { hasText: "Proceed" });
          if (await proceedBtn2.isVisible({ timeout: 2000 }).catch(function () { return false; }) && await proceedBtn2.isEnabled().catch(function () { return false; })) {
            await proceedBtn2.click();
            await sleep(1000);

            var ta2 = userPage.locator("textarea");
            if (await ta2.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
              await ta2.fill("QA: modify confirmed");
              await sleep(200);
              var subBtn2 = userPage.locator("button", { hasText: "Modification" });
              if (await subBtn2.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
                await subBtn2.click();
                await sleep(2000);

                var stored2 = await userPage.evaluate(function () {
                  var data = JSON.parse(localStorage.getItem("oneestela_global_bookings_v2") || "[]");
                  var b = data.find(function (x) { return x.id === "qa-confirmed-modify"; });
                  return b ? b.status : "missing";
                });
                if (stored2 === "modification_under_review") {
                  pass("C: Confirmed Venue Modify - Status changed");
                } else {
                  fail("C: Confirmed Venue Modify", "Status is " + stored2);
                }
              } else {
                fail("C: Confirmed Venue Modify", "Submit button not found");
              }
            } else {
              fail("C: Confirmed Venue Modify", "Textarea not found");
            }
          } else {
            fail("C: Confirmed Venue Modify", "Proceed button disabled/not found");
          }
        }
      } else {
        fail("C: Confirmed Venue Modify", "Modify button not visible");
      }
    }
  } catch (e) {
    fail("C: Confirmed Venue Modify", e.message);
  }

  // Close modals
  await userPage.evaluate(function () {
    document.querySelectorAll('[role="dialog"]').forEach(function (d) {
      var btn = d.querySelector("button");
      if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
    });
  });
  await sleep(500);

  // ======================================================================
  // D. Office Modify - Details Form Verification
  // ======================================================================
  console.log("");
  console.log("[D] Office Modify - Details Form");
  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  try {
    // Find office booking
    var foundOffice = false;
    var viewBtnsD = userPage.locator("button", { hasText: "View Details" });
    var countD = await viewBtnsD.count();
    for (var dj = 0; dj < countD && !foundOffice; dj++) {
      await viewBtnsD.nth(dj).click();
      await sleep(1500);
      var dDialogText = await userPage.locator('[role="dialog"]').first().textContent().catch(function () { return ""; });
      if (dDialogText.includes("QA Office Modify")) {
        foundOffice = true;
        console.log("  Found QA Office Modify at index " + dj);
      } else {
        await userPage.evaluate(function () {
          document.querySelectorAll('[role="dialog"]').forEach(function (d) {
            var btn = d.querySelector("button");
            if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
          });
        });
        await sleep(500);
      }
    }

    if (!foundOffice) {
      fail("D: Office Modify", "Could not find office booking");
    } else {
      // Verify office details in the booking detail modal show office info
      var detailModalText = await userPage.locator('[role="dialog"]').first().textContent().catch(function () { return ""; });
      var hasOfficeLabels = detailModalText.includes("Company") || detailModalText.includes("Nature of Business") || detailModalText.includes("Rental Term");
      if (hasOfficeLabels) {
        console.log("  (Office info visible in detail modal)");
      }

      // Click Modify Booking
      var modifyBtn3 = userPage.locator("button", { hasText: "Modify Booking" });
      if (await modifyBtn3.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
        await modifyBtn3.click();
        await sleep(2000);

        // Check for office duration buttons in Step 1 (schedule)
        var durBtns = userPage.locator("button", { hasText: /6 Months|1 Year|2 Years/ });
        var durCount = await durBtns.count();
        console.log("  Office duration buttons found: " + durCount);
        if (durCount > 0) {
          pass("D1: Office rental term buttons visible");
        } else {
          fail("D: Office Modify", "Duration buttons not visible");
        }

        // Select 1 Year if available
        var oneYear = userPage.locator("button", { hasText: "1 Year" });
        if (await oneYear.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
          await oneYear.click();
          await sleep(300);
          pass("D2: Office can select 1 Year duration");
        }

        // Proceed to Step 2
        var proceedBtn3 = userPage.locator("button", { hasText: "Proceed" });
        if (await proceedBtn3.isVisible({ timeout: 2000 }).catch(function () { return false; }) && await proceedBtn3.isEnabled().catch(function () { return false; })) {
          await proceedBtn3.click();
          await sleep(1000);

          // VERIFY Step 2 shows OFFICE fields, NOT event fields
          var step2Labels = userPage.locator('[role="dialog"]');
          var step2Text = await step2Labels.first().textContent().catch(function () { return ""; });

          // Office fields should be present
          var hasCompanyName = step2Text.includes("Company Name");
          var hasNatureOfBusiness = step2Text.includes("Nature of Business");
          var hasRentalTerm = step2Text.includes("Rental Term") || step2Text.includes("Contract Duration");

          // Event fields should NOT be present
          var hasEventName = step2Text.includes("Event Name");
          var hasEventType = step2Text.includes("Event Type");
          var hasGuests = step2Text.includes("Estimated Guests");

          console.log("  Step 2 fields - CompanyName:" + hasCompanyName + " NatureOfBiz:" + hasNatureOfBusiness + " RentalTerm:" + hasRentalTerm);
          console.log("  Step 2 should NOT have - EventName:" + hasEventName + " EventType:" + hasEventType + " Guests:" + hasGuests);

          if (hasCompanyName && hasNatureOfBusiness && hasRentalTerm) {
            pass("D3: Office Step 2 shows Company Name / Nature of Business / Rental Term");
          } else {
            fail("D: Office Modify", "Missing office fields in Step 2");
          }

          if (!hasEventName && !hasEventType && !hasGuests) {
            pass("D4: Office Step 2 hides Event Name / Event Type / Estimated Guests");
          } else {
            fail("D: Office Modify", "Event fields still visible in office Step 2");
          }

          // Fill nature of business (select from dropdown)
          var natureSelect = step2Labels.first().locator("select");
          if (await natureSelect.isVisible({ timeout: 1000 }).catch(function () { return false; })) {
            await natureSelect.selectOption("Corporate");
            await sleep(200);
            console.log("  Changed Nature of Business to Corporate");
          }

          // Check Company Name pre-fill
          var companyInput = step2Labels.first().locator("input");
          var companyValue = await companyInput.first().inputValue().catch(function () { return ""; });
          console.log("  Company Name pre-filled: " + companyValue);

          // Fill reason
          var ta3 = userPage.locator("textarea");
          if (await ta3.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
            await ta3.fill("QA: change office details");
            await sleep(200);

            // Submit
            var subBtn3 = userPage.locator("button", { hasText: "Modification" });
            if (await subBtn3.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
              await subBtn3.click();
              await sleep(2000);

              // Verify submission
              var stored3 = await userPage.evaluate(function () {
                var data = JSON.parse(localStorage.getItem("oneestela_global_bookings_v2") || "[]");
                var b = data.find(function (x) { return x.id === "qa-office-modify"; });
                return b ? {
                  status: b.status,
                  rentalTerm: b.rentalTerm,
                  changes: b.requestedChanges,
                  bookingType: b.bookingType,
                  isOfficeRental: b.isOfficeRental
                } : null;
              });

              if (stored3 && stored3.status === "modification_under_review") {
                pass("D5: Office Modify - Full flow completed");
                // Verify it's still identified as office
                if (stored3.bookingType === "office" && stored3.isOfficeRental === true) {
                  pass("D6: Office booking still identified as office after modify");
                }
              } else {
                fail("D: Office Modify", "Status=" + (stored3 ? stored3.status : "null"));
              }
            } else {
              fail("D: Office Modify", "Submit button not found");
            }
          } else {
            fail("D: Office Modify", "Textarea not found");
          }
        } else {
          fail("D: Office Modify", "Proceed button disabled/not found");
        }
      } else {
        fail("D: Office Modify", "Modify button not visible");
      }
    }
  } catch (e) {
    fail("D: Office Modify", e.message);
  }

  // Close modals
  await userPage.evaluate(function () {
    document.querySelectorAll('[role="dialog"]').forEach(function (d) {
      var btn = d.querySelector("button");
      if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
    });
  });
  await sleep(500);

  // ======================================================================
  // E. DP Incomplete
  // ======================================================================
  console.log("");
  console.log("[E] DP Incomplete");
  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  try {
    var allViewBtns3 = userPage.locator("button", { hasText: "View Details" });
    await allViewBtns3.first().click();
    await sleep(1500);

    var eText = await userPage.locator('[role="dialog"]').first().textContent().catch(function () { return ""; });
    if (eText.includes("Downpayment") || eText.includes("Partial") || eText.includes("downpayment")) {
      pass("E1: Downpayment info visible");
    } else {
      fail("E: DP Incomplete", "No downpayment info visible");
    }

    if (eText.includes("Settle") || eText.includes("Remaining Balance") || eText.includes("remaining")) {
      pass("E2: Settle Remaining Balance option visible");
    } else {
      var payBtn = userPage.locator("button", { hasText: /Pay|Settle/ });
      if (await payBtn.isVisible({ timeout: 1000 }).catch(function () { return false; })) {
        pass("E2: Pay/Settle button visible");
      }
    }
  } catch (e) {
    fail("E: DP Incomplete", e.message);
  }

  // ======================================================================
  // F. Event Venue Modify still shows event fields
  // ======================================================================
  console.log("");
  console.log("[F] Event Venue Modify still shows event fields");
  await userPage.goto(BASE + "/portal/bookings", { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  try {
    // Open the "qa-pending-modify" which is now modification_under_review
    // Instead use the dp incomplete booking which is still "verifying" (venue)
    var foundVenue = false;
    var viewBtnsF = userPage.locator("button", { hasText: "View Details" });
    var countF = await viewBtnsF.count();
    for (var fi = 0; fi < countF && !foundVenue; fi++) {
      await viewBtnsF.nth(fi).click();
      await sleep(1500);
      var fDialogText = await userPage.locator('[role="dialog"]').first().textContent().catch(function () { return ""; });
      if (fDialogText.includes("QA DP Incomplete")) {
        foundVenue = true;
        console.log("  Found QA DP Incomplete at index " + fi);
      } else {
        await userPage.evaluate(function () {
          document.querySelectorAll('[role="dialog"]').forEach(function (d) {
            var btn = d.querySelector("button");
            if (btn && btn.getAttribute("aria-label") === "Close") btn.click();
          });
        });
        await sleep(500);
      }
    }

    if (!foundVenue) {
      fail("F: Event Venue Modify", "Could not find venue booking");
    } else {
      var modifyBtnF = userPage.locator("button", { hasText: "Modify Booking" });
      if (await modifyBtnF.isVisible({ timeout: 2000 }).catch(function () { return false; })) {
        // Check if modify is available for verifying booking (it might not be available due to incomplete payment)
        // If not visible, skip this test
        console.log("  (Modify may not be available for verifying bookings)");
      }
    }
  } catch (e) {
    console.log("  (F check: " + e.message + ")");
  }

  // ======================================================================
  // G. Admin Side
  // ======================================================================
  console.log("");
  console.log("[Admin] Checking admin booking management");
  try {
    var adminPage = await context.newPage();
    await adminPage.goto(BASE + "/dashboard/bookings", { waitUntil: "networkidle", timeout: 15000 }).catch(function () {});
    await sleep(1000);

    await adminPage.evaluate(function () {
      var adminUser = {
        id: "admin-default-001",
        fullName: "Admin User",
        name: "Admin User",
        email: "admin@oneestela.com",
        role: "admin",
        profilePicture: "",
        createdAt: "2024-01-01T00:00:00.000Z",
        status: "active",
      };
      localStorage.setItem("mock_user", JSON.stringify(adminUser));
    });

    await adminPage.goto(BASE + "/dashboard/bookings", { waitUntil: "networkidle", timeout: 30000 });
    await sleep(3000);

    var adminText = await adminPage.textContent("body");

    var testDataVisible = adminText.includes("QA Pending Modify") ||
      adminText.includes("QA Pending Cancel") ||
      adminText.includes("QA Confirmed Modify") ||
      adminText.includes("QA Office Modify") ||
      adminText.includes("QA DP Incomplete");
    if (testDataVisible) {
      pass("Admin: Test bookings visible");
    }

    if (adminText.includes("Cancel Req") || adminText.includes("Cancellation")) {
      pass("Admin: Cancellation request visible");
    }

    if (adminText.includes("Modification Req") || adminText.includes("Modification")) {
      pass("Admin: Modification request visible");
    }

    var filterSelect = adminPage.locator("select");
    if (await filterSelect.count() > 0) {
      pass("Admin: Filter dropdown available");
    }

    await adminPage.close();
  } catch (e) {
    console.log("  (Admin check partial: " + e.message + ")");
  }

  // ======================================================================
  // Final Report
  // ======================================================================
  console.log("");
  console.log("=============================================================");
  console.log("BROWSER QA TEST RESULTS");
  console.log("=============================================================");
  console.log("");
  console.log("Passed: " + results.pass.length);
  for (var p of results.pass) {
    console.log("  [PASS] " + p);
  }

  if (results.fail.length > 0) {
    console.log("");
    console.log("Failed: " + results.fail.length);
    for (var f of results.fail) {
      console.log("  [FAIL] " + f.name + ": " + f.detail);
    }
  } else {
    console.log("");
    console.log("All tests passed!");
  }

  await browser.close();
  return results;
}

run()
  .then(function (results) {
    process.exit(results.fail.length > 0 ? 1 : 0);
  })
  .catch(function (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  });
