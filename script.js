function toUSFormat(isoDate) {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

function toISOFormat(usDate) {
  if (!usDate) return "";
  const parts = usDate.split("/");
  if (parts.length !== 3) return usDate;
  return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
}

function escapeHtml(value) {
  if (!value) return "";
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function updateRegistrationState() {
  const regDataRaw = localStorage.getItem("happyCelebrationRegistration");
  const registerCard = document.querySelector('[data-panel="register"]');
  const greetingBanner = document.querySelector("#greetingBanner");
  const userProfileBtn = document.querySelector("#userProfileBtn");

  if (regDataRaw) {
    const data = JSON.parse(regDataRaw);
    if (userProfileBtn) {
      userProfileBtn.classList.add("logged-in");
      if (data.fullName) {
        userProfileBtn.textContent = data.fullName.trim().charAt(0).toUpperCase();
      } else {
        userProfileBtn.textContent = "👤";
      }
    }

    if (registerCard) {
      const spanText = registerCard.querySelector("span:last-of-type");
      if (spanText) {
        spanText.textContent = "My Profile";
      }
      const icon = registerCard.querySelector(".icon");
      if (icon) {
        icon.style.background = "linear-gradient(135deg, var(--gold-300), var(--rose-line))";
      }
    }

    if (!greetingBanner) {
      const banner = document.createElement("div");
      banner.id = "greetingBanner";
      banner.style.cssText = `
        background: linear-gradient(135deg, rgba(245, 199, 110, 0.15), rgba(178, 31, 63, 0.25));
        border: 1px solid rgba(245, 199, 110, 0.4);
        border-radius: 12px;
        padding: 10px 16px;
        margin: 12px 0 16px;
        text-align: center;
        color: var(--gold-100);
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      `;
      banner.innerHTML = `Welcome back, <span style="color: #fff; text-shadow: 0 0 8px var(--gold-300);">${escapeHtml(data.fullName)}</span>! (${escapeHtml(data.role)})`;
      
      const sparkle = document.querySelector(".sparkle");
      if (sparkle) {
        sparkle.after(banner);
      }
    } else {
      greetingBanner.innerHTML = `Welcome back, <span style="color: #fff; text-shadow: 0 0 8px var(--gold-300);">${escapeHtml(data.fullName)}</span>! (${escapeHtml(data.role)})`;
    }

    // Dynamic Upcoming Event Reminders & Countdown Banner
    renderCountdownBanner();

  } else {
    if (userProfileBtn) {
      userProfileBtn.classList.remove("logged-in");
      userProfileBtn.textContent = "👤";
    }

    if (registerCard) {
      const spanText = registerCard.querySelector("span:last-of-type");
      if (spanText) {
        spanText.textContent = "Register";
      }
      const icon = registerCard.querySelector(".icon");
      if (icon) {
        icon.style.background = "";
      }
    }
    if (greetingBanner) {
      greetingBanner.remove();
    }
    const countdownBanner = document.querySelector("#countdownBanner");
    if (countdownBanner) {
      countdownBanner.remove();
    }
  }
}

function renderCountdownBanner() {
  const existingCountdown = document.querySelector("#countdownBanner");
  if (existingCountdown) {
    existingCountdown.remove();
  }

  let members = [];
  try {
    const raw = localStorage.getItem("happyCelebrationFamily");
    members = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  if (!Array.isArray(members)) {
    members = [];
  }

  const mockToday = new Date(2026, 5, 6); // Mock today is June 6, 2026
  const list = [];

  members.forEach(m => {
    if (m.birthDate) {
      const parts = m.birthDate.split("/");
      if (parts.length === 3) {
        const bMon = parseInt(parts[0], 10) - 1;
        const bDay = parseInt(parts[1], 10);
        list.push({
          name: `${m.name}'s Birthday`,
          target: m.name,
          type: "Birthday",
          month: bMon,
          day: bDay
        });
      }
    }
    if (m.anniversaryDate && m.spouseId) {
      const spouse = members.find(s => s.id === m.spouseId);
      // Deduplicate anniversary: only render once per couple
      if (spouse && m.id < spouse.id) {
        const parts = m.anniversaryDate.split("/");
        if (parts.length === 3) {
          const aMon = parseInt(parts[0], 10) - 1;
          const aDay = parseInt(parts[1], 10);
          list.push({
            name: `${m.name} & ${spouse.name}'s Anniversary`,
            target: m.name,
            type: "Anniversary",
            month: aMon,
            day: aDay
          });
        }
      }
    }
  });

  let nextEvent = null;
  let minDays = Infinity;

  list.forEach(ev => {
    let evDate = new Date(2026, ev.month, ev.day);
    if (evDate < mockToday) {
      evDate = new Date(2027, ev.month, ev.day);
    }
    const diffTime = evDate - mockToday;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < minDays) {
      minDays = diffDays;
      nextEvent = { 
        ...ev, 
        daysLeft: diffDays, 
        dateText: `${String(ev.month + 1).padStart(2, '0')}/${String(ev.day).padStart(2, '0')}/${evDate.getFullYear()}` 
      };
    }
  });

  const banner = document.createElement("div");
  banner.id = "countdownBanner";
  banner.className = "countdown-banner";

  if (nextEvent) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateString = `${monthNames[nextEvent.month]} ${nextEvent.day}`;
    
    banner.innerHTML = `
      <div class="countdown-content">
        <span class="countdown-label">✦ Upcoming Event ✦</span>
        <span class="countdown-text">
          <strong>${escapeHtml(nextEvent.name)}</strong> on ${dateString}
          <span class="countdown-days-badge">${nextEvent.daysLeft} ${nextEvent.daysLeft === 1 ? 'day' : 'days'} left</span>
        </span>
      </div>
      <button class="countdown-btn" type="button" id="countdownBookBtn">Book Now</button>
    `;

    const trigger = document.querySelector("#greetingBanner") || document.querySelector(".sparkle");
    if (trigger) {
      trigger.after(banner);
    }

    banner.querySelector("#countdownBookBtn").addEventListener("click", () => {
      window.prefilledBooking = {
        name: nextEvent.target,
        eventType: nextEvent.type,
        date: nextEvent.dateText
      };
      openPanel("book");
    });
  } else {
    // Helpful reminder to configure family tree dates if empty
    banner.style.borderStyle = "dashed";
    banner.style.background = "rgba(245, 199, 110, 0.05)";
    banner.innerHTML = `
      <div class="countdown-content">
        <span class="countdown-label">✦ Family Event Reminders ✦</span>
        <span class="countdown-text" style="font-size: 11px; color: var(--soft);">
          Configure birthdays & anniversaries to see countdowns.
        </span>
      </div>
      <button class="countdown-btn" type="button" id="countdownAddBtn" style="background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.25); box-shadow: none;">Add Dates</button>
    `;

    const trigger = document.querySelector("#greetingBanner") || document.querySelector(".sparkle");
    if (trigger) {
      trigger.after(banner);
    }

    banner.querySelector("#countdownAddBtn").addEventListener("click", () => {
      openPanel("family");
    });
  }
}

const panels = {
  book: {
    title: "Book Event",
    kicker: "Reservation",
    template: "bookTemplate",
    setup(root) {
      // Base Prices Data
      const defaultBasePrices = {
        "Birthday": { baseSetup: 5000, perGuest: 500, description: "Includes basic theme decor, birthday cake, standard sound system, and party snacks." },
        "Wedding": { baseSetup: 50000, perGuest: 1500, description: "Includes stage decoration, standard lighting, catering service, bride/groom seating setup, and welcoming flowers." },
        "Anniversary": { baseSetup: 8000, perGuest: 600, description: "Includes romantic stage setup, photo display zone, anniversary cake, live music background, and fine dining buffet." },
        "Corporate Celebration": { baseSetup: 15000, perGuest: 1000, description: "Includes stage branding, projector & AV system, mocktail bar, host/emcee, and corporate dinner buffet." }
      };

      function getBasePrices() {
        try {
          const raw = localStorage.getItem("happyCelebrationBasePrices");
          if (raw) {
            const parsed = JSON.parse(raw);
            // Ensure all required fields exist
            for (const key in defaultBasePrices) {
              if (!parsed[key]) parsed[key] = { ...defaultBasePrices[key] };
            }
            return parsed;
          }
        } catch (e) {}
        return { ...defaultBasePrices };
      }

      function saveBasePrices(prices) {
        try {
          localStorage.setItem("happyCelebrationBasePrices", JSON.stringify(prices));
        } catch (e) {}
      }

      // Check Admin Role
      function checkIsAdmin() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("admin") && params.get("admin") === "true") return true;
        if (params.has("role") && params.get("role") === "organizer") return true;
        try {
          const regData = localStorage.getItem("happyCelebrationRegistration");
          if (regData) {
            const data = JSON.parse(regData);
            if (data.role === "Organizer") return true;
          }
        } catch(e) {}
        return false;
      }

      const isAdmin = checkIsAdmin();

      // Elements
      const bookNowTabBtn = root.querySelector("#bookNowTabBtn");
      const basePricesTabBtn = root.querySelector("#basePricesTabBtn");
      const bookNowView = root.querySelector("#bookNowView");
      const basePricesView = root.querySelector("#basePricesView");

      const form = root.querySelector("#bookingForm");
      const note = root.querySelector("#bookingNote");

      const monthSel = root.querySelector("#bookingMonth");
      const daySel = root.querySelector("#bookingDay");
      const yearSel = root.querySelector("#bookingYear");
      
      const eventTypeSel = root.querySelector("#bookingEventType");
      const guestsInput = root.querySelector("#bookingGuests");

      const quoteBaseSetup = root.querySelector("#quoteBaseSetup");
      const quotePerGuest = root.querySelector("#quotePerGuest");
      const quoteTotal = root.querySelector("#quoteTotal");

      // Tab Switching
      if (bookNowTabBtn && basePricesTabBtn) {
        bookNowTabBtn.addEventListener("click", () => {
          bookNowTabBtn.classList.add("active");
          basePricesTabBtn.classList.remove("active");
          bookNowView.style.display = "flex";
          basePricesView.style.display = "none";
          // Re-calculate live quote when switching back
          updateLiveQuote();
        });

        basePricesTabBtn.addEventListener("click", () => {
          basePricesTabBtn.classList.add("active");
          bookNowTabBtn.classList.remove("active");
          bookNowView.style.display = "none";
          basePricesView.style.display = "flex";
          renderPricingSheet();
        });
      }

      // Populate Days (1 to 31)
      if (daySel) {
        daySel.innerHTML = '<option value="">Day</option>';
        for (let i = 1; i <= 31; i++) {
          const val = String(i).padStart(2, '0');
          const opt = document.createElement("option");
          opt.value = val;
          opt.textContent = i;
          daySel.appendChild(opt);
        }
      }

      // Populate Years (current year to current year + 5)
      if (yearSel) {
        yearSel.innerHTML = '<option value="">Year</option>';
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i <= currentYear + 5; i++) {
          const opt = document.createElement("option");
          opt.value = i;
          opt.textContent = i;
          yearSel.appendChild(opt);
        }
      }

      // Auto-prefill fields if shortcuts were clicked
      if (window.prefilledBooking) {
        if (form.name) form.name.value = window.prefilledBooking.name || "";
        if (eventTypeSel) eventTypeSel.value = window.prefilledBooking.eventType || "Birthday";
        if (window.prefilledBooking.date && monthSel && daySel && yearSel) {
          const parts = window.prefilledBooking.date.split("/");
          if (parts.length === 3) {
            monthSel.value = parts[0];
            daySel.value = parts[1];
            yearSel.value = parts[2];
          }
        }
        if (guestsInput) guestsInput.value = 100;
        window.prefilledBooking = null; // Clear prefill
      }

      // Live Quote Functionality
      function updateLiveQuote() {
        if (!eventTypeSel || !guestsInput || !quoteBaseSetup || !quotePerGuest || !quoteTotal) return;
        const prices = getBasePrices();
        const eventType = eventTypeSel.value || "Birthday";
        const guests = parseInt(guestsInput.value, 10) || 0;

        const config = prices[eventType] || defaultBasePrices[eventType];
        const setupFee = config.baseSetup;
        const perGuestFee = config.perGuest;
        const totalPerGuest = perGuestFee * guests;
        const total = setupFee + totalPerGuest;

        quoteBaseSetup.textContent = `₹${setupFee.toLocaleString('en-IN')}`;
        quotePerGuest.textContent = `₹${totalPerGuest.toLocaleString('en-IN')} (₹${perGuestFee.toLocaleString('en-IN')} × ${guests} guests)`;
        quoteTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
      }

      if (eventTypeSel) eventTypeSel.addEventListener("change", updateLiveQuote);
      if (guestsInput) guestsInput.addEventListener("input", updateLiveQuote);
      
      // Run once initially
      updateLiveQuote();

      // Render Pricing Tab Sheet
      function renderPricingSheet() {
        if (!basePricesView) return;
        const prices = getBasePrices();
        basePricesView.innerHTML = "";

        Object.keys(prices).forEach(key => {
          const config = prices[key];
          const card = document.createElement("div");
          card.className = "pricing-card";

          if (isAdmin) {
            // Render editable inputs
            card.innerHTML = `
              <div class="pricing-card-header">
                <span class="pricing-card-title">${key}</span>
                <span class="pricing-card-badge">Admin Mode</span>
              </div>
              <div class="pricing-card-grid">
                <label class="pricing-field-label">
                  <span>Base Setup Fee (₹)</span>
                  <input type="number" class="pricing-card-input setup-input" value="${config.baseSetup}" min="0" required>
                </label>
                <label class="pricing-field-label">
                  <span>Per Guest Fee (₹)</span>
                  <input type="number" class="pricing-card-input guest-input" value="${config.perGuest}" min="0" required>
                </label>
              </div>
              <label class="pricing-field-label">
                <span>Included Services & Description</span>
                <textarea class="pricing-card-textarea desc-input" required>${escapeHtml(config.description)}</textarea>
              </label>
              <button class="primary-action pricing-card-save-btn" type="button">Save Prices</button>
            `;

            // Setup Save Listener
            card.querySelector(".pricing-card-save-btn").addEventListener("click", () => {
              const setupVal = parseInt(card.querySelector(".setup-input").value, 10);
              const guestVal = parseInt(card.querySelector(".guest-input").value, 10);
              const descVal = card.querySelector(".desc-input").value;

              if (isNaN(setupVal) || setupVal < 0 || isNaN(guestVal) || guestVal < 0 || !descVal.trim()) {
                alert("Please fill in valid pricing values and description.");
                return;
              }

              const allPrices = getBasePrices();
              allPrices[key] = {
                baseSetup: setupVal,
                perGuest: guestVal,
                description: descVal.trim()
              };
              saveBasePrices(allPrices);

              // Flash a success indication
              const btn = card.querySelector(".pricing-card-save-btn");
              const oldText = btn.textContent;
              btn.textContent = "Saved ✓";
              btn.style.background = "#2e7d32";
              setTimeout(() => {
                btn.textContent = oldText;
                btn.style.background = "";
              }, 1200);

              // Also update the live quote card in the background
              updateLiveQuote();
            });

          } else {
            // Render view-only card
            card.innerHTML = `
              <div class="pricing-card-header">
                <span class="pricing-card-title">${key}</span>
                <span class="pricing-card-badge">Base Package</span>
              </div>
              <div class="pricing-card-grid">
                <div class="pricing-field-label">
                  <span>Base Setup Fee</span>
                  <span class="pricing-field-val">₹${config.baseSetup.toLocaleString('en-IN')}</span>
                </div>
                <div class="pricing-field-label">
                  <span>Per Guest Fee</span>
                  <span class="pricing-field-val">₹${config.perGuest.toLocaleString('en-IN')} / guest</span>
                </div>
              </div>
              <div class="pricing-card-description">
                ${escapeHtml(config.description)}
              </div>
            `;
          }

          basePricesView.appendChild(card);
        });
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        // Assemble date string as MM/DD/YYYY
        const m = monthSel ? monthSel.value : "";
        const d = daySel ? daySel.value : "";
        const y = yearSel ? yearSel.value : "";
        
        if (!m || !d || !y) {
          note.textContent = "Please select a valid Month, Day, and Year.";
          note.style.color = "#ff9aa2";
          return;
        }

        const dateString = `${m}/${d}/${y}`;
        const data = Object.fromEntries(new FormData(form));
        
        // Remove individual selector fields from saved form payload
        delete data.bookingMonth;
        delete data.bookingDay;
        delete data.bookingYear;
        
        // Attach the composite date string
        data.date = dateString;

        // Calculate and attach final price quote estimate for billing context
        const prices = getBasePrices();
        const evType = data.eventType || "Birthday";
        const guestsNum = parseInt(data.guests, 10) || 0;
        const config = prices[evType] || defaultBasePrices[evType];
        data.estimatedTotal = config.baseSetup + (config.perGuest * guestsNum);

        localStorage.setItem("happyCelebrationBooking", JSON.stringify(data));
        note.textContent = `Booking request saved. Estimated Total: ₹${data.estimatedTotal.toLocaleString('en-IN')}. We will contact you shortly.`;
        note.style.color = "";
      });
    },
  },
  gallery: {
    title: "Gallery",
    kicker: "Memories",
    template: "galleryTemplate",
  },
  about: {
    title: "About Us",
    kicker: "Our Story",
    template: "aboutTemplate",
  },
  family: {
    title: "Family Tree",
    kicker: "Generations",
    template: "familyTemplate",
    setup(root) {
      function escapeHtml(value) {
        if (!value) return "";
        return value.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }[char]));
      }

      try {
        // Tab elements
        const editorTabBtn = root.querySelector("#editorTabBtn");
        const previewTabBtn = root.querySelector("#previewTabBtn");
        const syncTabBtn = root.querySelector("#syncTabBtn");

        const familyEditorView = root.querySelector("#familyEditorView");
        const familyPreviewView = root.querySelector("#familyPreviewView");
        const familySyncView = root.querySelector("#familySyncView");

        const addMemberBtn = root.querySelector("#addMemberBtn");
        const membersListList = root.querySelector("#membersListList");

        // Canvas & Zoom controls
        const treeCanvas = root.querySelector("#treeCanvas");
        const treeCanvasWrapper = root.querySelector("#treeCanvasWrapper");
        const clearTreeBtn = root.querySelector("#clearTreeBtn");
        const clearTreeZoomBtn = root.querySelector("#clearTreeZoomBtn");
        const exportCsvBtn = root.querySelector("#exportCsvBtn");
        const zoomLabel = root.querySelector("#zoomLabel");
        const zoomInBtn = root.querySelector("#zoomInBtn");
        const zoomOutBtn = root.querySelector("#zoomOutBtn");
        const zoomFitBtn = root.querySelector("#zoomFitBtn");

        // Modal elements
        const treeModal = root.querySelector("#treeModal");
        const modalTitle = root.querySelector("#modalTitle");
        const modalForm = root.querySelector("#modalForm");
        const modalActionType = root.querySelector("#modalActionType");
        const modalTargetId = root.querySelector("#modalTargetId");
        
        // Modal Details fields
        const modalName = root.querySelector("#modalName");
        const modalMaleBtn = root.querySelector("#modalMaleBtn");
        const modalFemaleBtn = root.querySelector("#modalFemaleBtn");
        const modalRelationsSection = root.querySelector("#modalRelationsSection");
        const modalAddSpouseBtn = root.querySelector("#modalAddSpouseBtn");
        const modalAddChildBtn = root.querySelector("#modalAddChildBtn");
        const modalSpouseContainer = root.querySelector("#modalSpouseContainer");
        const modalSpouseName = root.querySelector("#modalSpouseName");
        const modalChildrenSection = root.querySelector("#modalChildrenSection");
        const modalAddChildRowBtn = root.querySelector("#modalAddChildRowBtn");
        const modalChildrenList = root.querySelector("#modalChildrenList");

        // Modal Dates fields (Dropdown selects)
        const modalBirthMonth = root.querySelector("#modalBirthMonth");
        const modalBirthDay = root.querySelector("#modalBirthDay");
        const modalBirthYear = root.querySelector("#modalBirthYear");

        const modalAnniversaryLabel = root.querySelector("#modalAnniversaryLabel");
        const modalAnniversaryMonth = root.querySelector("#modalAnniversaryMonth");
        const modalAnniversaryDay = root.querySelector("#modalAnniversaryDay");
        const modalAnniversaryYear = root.querySelector("#modalAnniversaryYear");

        const modalPhone = root.querySelector("#modalPhone");
        const modalEmail = root.querySelector("#modalEmail");

        const googleSheetUrlInput = root.querySelector("#googleSheetUrlInput");
        const saveSyncConfigBtn = root.querySelector("#saveSyncConfigBtn");
        const pushToSheetsBtn = root.querySelector("#pushToSheetsBtn");
        const pullFromSheetsBtn = root.querySelector("#pullFromSheetsBtn");
        const copyAppsScriptBtn = root.querySelector("#copyAppsScriptBtn");
        const generateWaLinkBtn = root.querySelector("#generateWaLinkBtn");
        const syncStatusMessage = root.querySelector("#syncStatusMessage");

        const treeSearchInput = root.querySelector("#treeSearchInput");
        const treeSearchSuggestions = root.querySelector("#treeSearchSuggestions");
        const clearSearchBtn = root.querySelector("#clearSearchBtn");

        const profileCardOverlay = root.querySelector("#profileCardOverlay");
        const profileCloseBtn = root.querySelector("#profileCloseBtn");
        const profileAvatar = root.querySelector("#profileAvatar");
        const profileName = root.querySelector("#profileName");
        const profileRelation = root.querySelector("#profileRelation");
        const profileBirthDate = root.querySelector("#profileBirthDate");
        const profileAnniversaryRow = root.querySelector("#profileAnniversaryRow");
        const profileAnniversaryDate = root.querySelector("#profileAnniversaryDate");
        const profilePhone = root.querySelector("#profilePhone");
        const profileEmail = root.querySelector("#profileEmail");
        const profileCallAction = root.querySelector("#profileCallAction");
        const profileWaAction = root.querySelector("#profileWaAction");
        const profileEmailAction = root.querySelector("#profileEmailAction");
        const profileEditBtn = root.querySelector("#profileEditBtn");

        // Populate modal Days selects (1 to 31)
        [modalBirthDay, modalAnniversaryDay].forEach(daySel => {
          if (daySel) {
            for (let i = 1; i <= 31; i++) {
              const val = String(i).padStart(2, '0');
              const opt = document.createElement("option");
              opt.value = val;
              opt.textContent = i;
              daySel.appendChild(opt);
            }
          }
        });

        // Populate modal Birth Years (current down to 1900)
        if (modalBirthYear) {
          const currentYear = new Date().getFullYear();
          for (let i = currentYear; i >= 1900; i--) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = i;
            modalBirthYear.appendChild(opt);
          }
        }

        // Populate modal Anniversary Years (current down to 1940)
        if (modalAnniversaryYear) {
          const currentYear = new Date().getFullYear();
          for (let i = currentYear; i >= 1940; i--) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = i;
            modalAnniversaryYear.appendChild(opt);
          }
        }

        function checkIsAdmin() {
          const params = new URLSearchParams(window.location.search);
          if (params.has("admin") && params.get("admin") === "true") return true;
          if (params.has("role") && params.get("role") === "organizer") return true;
          
          try {
            const regData = localStorage.getItem("happyCelebrationRegistration");
            if (regData) {
              const data = JSON.parse(regData);
              if (data.role === "Organizer") return true;
            }
          } catch(e) {}
          return false;
        }
        
        const isAdmin = checkIsAdmin();

        // Admin vs Customer segregation
        if (!isAdmin) {
          if (syncTabBtn) syncTabBtn.style.display = "none";
          if (exportCsvBtn) exportCsvBtn.style.display = "none";
          if (clearTreeBtn) clearTreeBtn.style.display = "none";
        }
        
        const modalSubmitBtn = root.querySelector("#modalSubmitBtn");
        const modalCancelBtn = root.querySelector("#modalCancelBtn");
        const modalDeleteBtn = root.querySelector("#modalDeleteBtn");

        let members = [];
        try {
          const raw = localStorage.getItem("happyCelebrationFamily");
          members = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(members)) {
            members = [];
          }
        } catch (e) {
          members = [];
        }

        // Migration and default properties check
        let migrated = false;
        members = members.map(m => {
          if (!m || typeof m !== "object") return null;
          let needsUpdate = false;
          const updated = { ...m };
          if (!updated.id) {
            updated.id = "mem_" + Math.random().toString(36).substr(2, 9);
            needsUpdate = true;
          }
          if (!updated.gender) {
            const lowerRelation = (updated.relation || "").toLowerCase();
            if (lowerRelation.includes("grandma") || lowerRelation.includes("mother") || lowerRelation.includes("daughter") || lowerRelation.includes("wife") || lowerRelation.includes("aunt") || lowerRelation.includes("female")) {
              updated.gender = "Female";
            } else {
              updated.gender = "Male";
            }
            needsUpdate = true;
          }
          if (updated.spouseId === undefined) {
            updated.spouseId = "";
            needsUpdate = true;
          }
          if (updated.parentId === undefined) {
            updated.parentId = "";
            needsUpdate = true;
          }
          if (updated.birthDate === undefined) {
            updated.birthDate = "";
            needsUpdate = true;
          }
          if (updated.anniversaryDate === undefined) {
            updated.anniversaryDate = "";
            needsUpdate = true;
          }
          if (needsUpdate) {
            migrated = true;
          }
          return updated;
        }).filter(Boolean);

        if (migrated) {
          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
        }

        // Load initial sync configuration
        const savedSyncConfig = localStorage.getItem("happyCelebrationSyncConfig");
        if (savedSyncConfig && googleSheetUrlInput) {
          const config = JSON.parse(savedSyncConfig);
          googleSheetUrlInput.value = config.googleSheetUrl || "";
        }

        // Tab Switching Event Listeners
        editorTabBtn.addEventListener("click", () => {
          editorTabBtn.classList.add("active");
          previewTabBtn.classList.remove("active");
          if (syncTabBtn) syncTabBtn.classList.remove("active");
          
          familyEditorView.style.display = "flex";
          familyPreviewView.style.display = "none";
          if (familySyncView) familySyncView.style.display = "none";
          renderMemberList();
        });

        previewTabBtn.addEventListener("click", () => {
          previewTabBtn.classList.add("active");
          editorTabBtn.classList.remove("active");
          if (syncTabBtn) syncTabBtn.classList.remove("active");
          
          familyEditorView.style.display = "none";
          familyPreviewView.style.display = "block";
          if (familySyncView) familySyncView.style.display = "none";
          renderTree();
          setTimeout(fitToScreen, 50);
        });

        if (syncTabBtn) {
          syncTabBtn.addEventListener("click", () => {
            syncTabBtn.classList.add("active");
            editorTabBtn.classList.remove("active");
            previewTabBtn.classList.remove("active");
            
            familyEditorView.style.display = "none";
            familyPreviewView.style.display = "none";
            familySyncView.style.display = "block";
            
            // Re-load stored Google Sheet config
            const syncConfig = localStorage.getItem("happyCelebrationSyncConfig");
            if (syncConfig) {
              const config = JSON.parse(syncConfig);
              googleSheetUrlInput.value = config.googleSheetUrl || "";
            }
          });
        }

        addMemberBtn.addEventListener("click", () => {
          openModal("add-root");
        });

        // Zoom functionality
        let zoomLevel = 1.0;
        
        function applyZoom() {
          const prevTransform = treeCanvas.style.transform;
          treeCanvas.style.transform = "none";
          const wrapperWidth = treeCanvasWrapper.clientWidth;
          const canvasWidth = treeCanvas.scrollWidth || treeCanvas.offsetWidth;
          const canvasHeight = treeCanvas.scrollHeight || treeCanvas.offsetHeight;
          
          const zoomedWidth = canvasWidth * zoomLevel;
          const zoomedHeight = canvasHeight * zoomLevel;
          
          if (zoomedWidth > wrapperWidth && wrapperWidth > 0) {
            treeCanvas.style.transformOrigin = "top left";
            treeCanvas.classList.add("overflowing");
          } else {
            treeCanvas.style.transformOrigin = "top center";
            treeCanvas.classList.remove("overflowing");
          }
          
          treeCanvas.style.transform = `scale(${zoomLevel})`;
          treeCanvasWrapper.style.height = `${zoomedHeight + 64}px`;
          zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
        }

        zoomInBtn.addEventListener("click", () => {
          zoomLevel = Math.min(2.0, zoomLevel + 0.1);
          applyZoom();
        });

        zoomOutBtn.addEventListener("click", () => {
          zoomLevel = Math.max(0.3, zoomLevel - 0.1);
          applyZoom();
        });

        function fitToScreen() {
          if (!members.length) {
            zoomLevel = 1.0;
            applyZoom();
            return;
          }
          treeCanvas.style.transform = "none";
          const wrapperWidth = treeCanvasWrapper.clientWidth;
          const canvasWidth = treeCanvas.scrollWidth || treeCanvas.offsetWidth;
          
          if (canvasWidth > wrapperWidth && wrapperWidth > 0) {
            zoomLevel = Math.max(0.3, Math.min(1.0, (wrapperWidth - 24) / canvasWidth));
          } else {
            zoomLevel = 1.0;
          }
          applyZoom();
        }

        zoomFitBtn.addEventListener("click", fitToScreen);

        function focusMemberOnTree(memberId) {
          const cardElement = treeCanvas.querySelector(`[data-id="${memberId}"]`);
          if (!cardElement) return;

          // Set zoomLevel to 1.0 for better readability when focusing
          zoomLevel = 1.0;
          applyZoom();

          // Smoothly scroll the container to center the card
          setTimeout(() => {
            const cardOffsetLeft = cardElement.offsetLeft;
            const cardOffsetTop = cardElement.offsetTop;
            const cardWidth = cardElement.offsetWidth;
            const cardHeight = cardElement.offsetHeight;

            treeCanvasWrapper.scrollTo({
              left: cardOffsetLeft * zoomLevel - treeCanvasWrapper.clientWidth / 2 + (cardWidth * zoomLevel) / 2,
              top: cardOffsetTop * zoomLevel - treeCanvasWrapper.clientHeight / 2 + (cardHeight * zoomLevel) / 2,
              behavior: "smooth"
            });

            // Highlight the card
            cardElement.classList.add("highlight-pulse");
            setTimeout(() => {
              cardElement.classList.remove("highlight-pulse");
            }, 3000);
          }, 50);
        }
        window.focusMemberOnTree = focusMemberOnTree;

        if (treeSearchInput) {
          treeSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
              if (clearSearchBtn) clearSearchBtn.style.display = "none";
              if (treeSearchSuggestions) {
                treeSearchSuggestions.style.display = "none";
                treeSearchSuggestions.innerHTML = "";
              }
              return;
            }

            if (clearSearchBtn) clearSearchBtn.style.display = "block";

            // Filter members matching query
            const matches = members.filter(m => m.name.toLowerCase().includes(query));

            if (treeSearchSuggestions) {
              if (matches.length > 0) {
                treeSearchSuggestions.innerHTML = matches.map(m => `
                  <div class="suggestion-item" data-id="${m.id}">
                    <span>${escapeHtml(m.name)}</span>
                    <span class="item-relation">${escapeHtml(m.relation)}</span>
                  </div>
                `).join("");
                treeSearchSuggestions.style.display = "block";
              } else {
                treeSearchSuggestions.innerHTML = `<div style="padding: 10px 14px; font-size: 13px; color: rgba(255,255,255,0.45);">No members found</div>`;
                treeSearchSuggestions.style.display = "block";
              }
            }
          });

          // Handle suggestion clicks
          if (treeSearchSuggestions) {
            treeSearchSuggestions.addEventListener("click", (e) => {
              const item = e.target.closest(".suggestion-item");
              if (item) {
                const memberId = item.dataset.id;
                const member = members.find(m => m.id === memberId);
                if (member) {
                  treeSearchInput.value = member.name;
                  treeSearchSuggestions.style.display = "none";
                  focusMemberOnTree(memberId);
                }
              }
            });
          }

          // Clear search
          if (clearSearchBtn) {
            clearSearchBtn.addEventListener("click", () => {
              treeSearchInput.value = "";
              clearSearchBtn.style.display = "none";
              if (treeSearchSuggestions) {
                treeSearchSuggestions.style.display = "none";
                treeSearchSuggestions.innerHTML = "";
              }
            });
          }

          // Hide suggestions when clicking outside
          document.addEventListener("click", (e) => {
            if (treeSearchSuggestions && !treeSearchSuggestions.contains(e.target) && e.target !== treeSearchInput) {
              treeSearchSuggestions.style.display = "none";
            }
          });
        }

        // Drag scrolling logic
        let isDown = false;
        let startX, startY, scrollLeft, scrollTop;

        treeCanvasWrapper.addEventListener("mousedown", (e) => {
          if (e.target.closest(".tree-node-card") || e.target.closest("button") || e.target.closest("input")) {
            return;
          }
          isDown = true;
          treeCanvasWrapper.classList.add("active-drag");
          startX = e.pageX - treeCanvasWrapper.offsetLeft;
          startY = e.pageY - treeCanvasWrapper.offsetTop;
          scrollLeft = treeCanvasWrapper.scrollLeft;
          scrollTop = treeCanvasWrapper.scrollTop;
        });

        treeCanvasWrapper.addEventListener("mouseleave", () => {
          isDown = false;
          treeCanvasWrapper.classList.remove("active-drag");
        });

        treeCanvasWrapper.addEventListener("mouseup", () => {
          isDown = false;
          treeCanvasWrapper.classList.remove("active-drag");
        });

        treeCanvasWrapper.addEventListener("mousemove", (e) => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - treeCanvasWrapper.offsetLeft;
          const y = e.pageY - treeCanvasWrapper.offsetTop;
          const walkX = (x - startX) * 1.5;
          const walkY = (y - startY) * 1.5;
          treeCanvasWrapper.scrollLeft = scrollLeft - walkX;
          treeCanvasWrapper.scrollTop = scrollTop - walkY;
        });





        function setDropdownDate(daySel, monthSel, yearSel, usDate) {
          if (!usDate) {
            if (daySel) daySel.value = "";
            if (monthSel) monthSel.value = "";
            if (yearSel) yearSel.value = "";
            return;
          }
          const parts = usDate.split("/");
          if (parts.length === 3) {
            if (monthSel) monthSel.value = parts[0];
            if (daySel) daySel.value = parts[1];
            if (yearSel) yearSel.value = parts[2];
          } else {
            if (daySel) daySel.value = "";
            if (monthSel) monthSel.value = "";
            if (yearSel) yearSel.value = "";
          }
        }

        function getDropdownDate(daySel, monthSel, yearSel) {
          const d = daySel ? daySel.value : "";
          const m = monthSel ? monthSel.value : "";
          const y = yearSel ? yearSel.value : "";
          if (!d || !m || !y) return "";
          return `${m}/${d}/${y}`;
        }

        function openModal(actionType, targetId = "") {
          modalActionType.value = actionType;
          modalTargetId.value = targetId;
          
          modalName.value = "";
          modalSpouseName.value = "";
          modalChildrenList.innerHTML = "";
          
          setDropdownDate(modalBirthDay, modalBirthMonth, modalBirthYear, "");
          setDropdownDate(modalAnniversaryDay, modalAnniversaryMonth, modalAnniversaryYear, "");
          modalAnniversaryLabel.style.display = "none";

          if (modalPhone) modalPhone.value = "";
          if (modalEmail) modalEmail.value = "";
          
          if (actionType === "add-root") {
            modalTitle.textContent = "Add Root Member";
            setGenderSelection("Male");
            
            modalSpouseContainer.style.display = "block";
            modalChildrenSection.style.display = "block";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "edit") {
            const member = members.find(m => m.id === targetId);
            if (member) {
              modalTitle.textContent = `Edit ${member.name}`;
              modalName.value = member.name;
              setGenderSelection(member.gender);
              
              modalRelationsSection.style.display = "none";
              modalSpouseContainer.style.display = "block";
              
              // Load dates
              setDropdownDate(modalBirthDay, modalBirthMonth, modalBirthYear, member.birthDate || "");
              
              if (modalPhone) modalPhone.value = member.phone || "";
              if (modalEmail) modalEmail.value = member.email || "";
              
              if (member.spouseId) {
                modalAnniversaryLabel.style.display = "block";
                const spouse = members.find(m => m.id === member.spouseId);
                if (spouse) {
                  modalSpouseName.value = spouse.name;
                  setDropdownDate(modalAnniversaryDay, modalAnniversaryMonth, modalAnniversaryYear, member.anniversaryDate || spouse.anniversaryDate || "");
                }
              } else {
                // If grandparent or parent but doesn't have spouse yet, we allow adding spouse name
                modalAnniversaryLabel.style.display = "none";
              }
              
              if (member.relation === "Grandparent" || member.relation === "Parent") {
                modalChildrenSection.style.display = "block";
                
                const spouseId = member.spouseId;
                const childRelation = member.relation === "Grandparent" ? "Parent" : "Child";
                const children = members.filter(m => m.relation === childRelation && (m.parentId === member.id || (spouseId && m.parentId === spouseId)));
                const loadedChildIds = new Set();
                
                children.forEach(child => {
                  if (child.spouseId && loadedChildIds.has(child.spouseId)) {
                    return; 
                  }
                  loadedChildIds.add(child.id);
                  addChildRow(child.name, child.gender, child.id);
                });
              } else {
                modalChildrenSection.style.display = "none";
              }
              
              modalDeleteBtn.style.display = "block";
            }
          } else if (actionType === "add-spouse") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Spouse to ${member ? member.name : ''}`;
            const spouseGender = member && member.gender === "Male" ? "Female" : "Male";
            setGenderSelection(spouseGender);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-child") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Child to ${member ? member.name : ''}`;
            setGenderSelection("Male");
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          }
          
          treeModal.style.display = "flex";
        }

        function closeModal() {
          treeModal.style.display = "none";
          modalForm.reset();
        }

        let activeProfileMemberId = null;

        function openProfileCard(memberId) {
          const member = members.find(m => m.id === memberId);
          if (!member) return;

          activeProfileMemberId = memberId;
          
          const initials = member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          profileAvatar.textContent = initials;
          
          if (member.gender === "Female") {
            profileAvatar.classList.add("female");
          } else {
            profileAvatar.classList.remove("female");
          }

          profileName.textContent = member.name;
          profileRelation.textContent = member.relation;

          if (member.birthDate) {
            const parts = member.birthDate.split("/");
            if (parts.length === 3) {
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const mIdx = parseInt(parts[0], 10) - 1;
              const formattedDate = `${months[mIdx] || parts[0]} ${parts[1]}, ${parts[2]}`;
              profileBirthDate.textContent = formattedDate;
            } else {
              profileBirthDate.textContent = member.birthDate;
            }
            root.querySelector("#profileBirthRow").style.display = "flex";
          } else {
            profileBirthDate.textContent = "-";
            root.querySelector("#profileBirthRow").style.display = "flex";
          }

          if (member.anniversaryDate) {
            const parts = member.anniversaryDate.split("/");
            if (parts.length === 3) {
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const mIdx = parseInt(parts[0], 10) - 1;
              const formattedDate = `${months[mIdx] || parts[0]} ${parts[1]}, ${parts[2]}`;
              profileAnniversaryDate.textContent = formattedDate;
            } else {
              profileAnniversaryDate.textContent = member.anniversaryDate;
            }
            profileAnniversaryRow.style.display = "flex";
          } else {
            profileAnniversaryRow.style.display = "none";
          }

          profilePhone.textContent = member.phone || "Not provided";
          profileEmail.textContent = member.email || "Not provided";

          if (member.phone) {
            profileCallAction.href = `tel:${member.phone}`;
            profileCallAction.classList.remove("disabled");
            
            const cleanPhone = member.phone.replace(/\D/g, "");
            const waMsg = encodeURIComponent(`Hello ${member.name}!`);
            profileWaAction.href = `https://wa.me/${cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : '91' + cleanPhone}?text=${waMsg}`;
            profileWaAction.classList.remove("disabled");
          } else {
            profileCallAction.removeAttribute("href");
            profileCallAction.classList.add("disabled");
            
            profileWaAction.removeAttribute("href");
            profileWaAction.classList.add("disabled");
          }

          if (member.email) {
            profileEmailAction.href = `mailto:${member.email}`;
            profileEmailAction.classList.remove("disabled");
          } else {
            profileEmailAction.removeAttribute("href");
            profileEmailAction.classList.add("disabled");
          }

          // Enforce Client Edit Restrictions on Profile Popup Card
          const loggedInMemberId = localStorage.getItem("happyCelebrationLoggedInMemberId") || "";
          if (profileEditBtn) {
            if (isAdmin || (loggedInMemberId && loggedInMemberId === memberId)) {
              profileEditBtn.style.display = "block";
            } else {
              profileEditBtn.style.display = "none";
            }
          }

          profileCardOverlay.style.display = "flex";
        }

        function closeProfileCard() {
          profileCardOverlay.style.display = "none";
          activeProfileMemberId = null;
        }

        if (profileCloseBtn) {
          profileCloseBtn.addEventListener("click", closeProfileCard);
        }

        if (profileCardOverlay) {
          profileCardOverlay.addEventListener("click", (e) => {
            if (e.target === profileCardOverlay) {
              closeProfileCard();
            }
          });
        }

        if (profileEditBtn) {
          profileEditBtn.addEventListener("click", () => {
            if (activeProfileMemberId) {
              const targetId = activeProfileMemberId;
              closeProfileCard();
              openModal("edit", targetId);
            }
          });
        }

        function setGenderSelection(gender) {
          const maleRadio = modalForm.querySelector('input[name="modalGender"][value="Male"]');
          const femaleRadio = modalForm.querySelector('input[name="modalGender"][value="Female"]');
          if (gender === "Male") {
            if (maleRadio) maleRadio.checked = true;
            modalMaleBtn.classList.add("active");
            modalFemaleBtn.classList.remove("active");
          } else {
            if (femaleRadio) femaleRadio.checked = true;
            modalFemaleBtn.classList.add("active");
            modalMaleBtn.classList.remove("active");
          }
        }

        function addChildRow(name = "", gender = "Male", id = "") {
          const rowId = id || "row_" + Math.random().toString(36).substr(2, 9);
          const childRow = document.createElement("div");
          childRow.className = "modal-child-row";
          childRow.dataset.rowId = rowId;
          
          const maleActive = gender === "Male" ? "active" : "";
          const femaleActive = gender === "Female" ? "active" : "";
          
          childRow.innerHTML = `
            <input type="text" class="child-name-input" placeholder="Child Name" value="${escapeHtml(name)}" autocomplete="off" required>
            <div class="gender-selector">
              <button type="button" class="gender-btn male-btn ${maleActive}">♂</button>
              <button type="button" class="gender-btn female-btn ${femaleActive}">♀</button>
              <input type="hidden" class="child-gender-input" value="${gender}">
            </div>
            <button type="button" class="remove-child-btn" aria-label="Remove Child">&times;</button>
          `;
          
          const maleBtn = childRow.querySelector(".male-btn");
          const femaleBtn = childRow.querySelector(".female-btn");
          const genderInput = childRow.querySelector(".child-gender-input");
          
          maleBtn.addEventListener("click", () => {
            genderInput.value = "Male";
            maleBtn.classList.add("active");
            femaleBtn.classList.remove("active");
          });
          
          femaleBtn.addEventListener("click", () => {
            genderInput.value = "Female";
            femaleBtn.classList.add("active");
            maleBtn.classList.remove("active");
          });
          
          childRow.querySelector(".remove-child-btn").addEventListener("click", () => {
            childRow.remove();
          });
          
          modalChildrenList.appendChild(childRow);
        }

        modalAddChildRowBtn.addEventListener("click", () => {
          addChildRow();
        });

        modalMaleBtn.addEventListener("click", () => {
          setGenderSelection("Male");
        });
        modalFemaleBtn.addEventListener("click", () => {
          setGenderSelection("Female");
        });

        modalAddSpouseBtn.addEventListener("click", () => {
          const targetId = modalTargetId.value;
          openModal("add-spouse", targetId);
        });

        modalAddChildBtn.addEventListener("click", () => {
          const targetId = modalTargetId.value;
          openModal("add-child", targetId);
        });

        modalCancelBtn.addEventListener("click", closeModal);



        function deleteMemberTree(targetId) {
          members = members.filter(m => m.id !== targetId);
          const toDelete = [];
          members.forEach(m => {
            if (m.spouseId === targetId) {
              toDelete.push(m.id);
            }
            if (m.parentId === targetId) {
              toDelete.push(m.id);
            }
          });
          toDelete.forEach(id => {
            deleteMemberTree(id);
          });
        }

        function deleteMember(targetId) {
          deleteMemberTree(targetId);
          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
          updateRegistrationState(); // Update home banner
          renderMemberList();
          renderTree();
        }

        modalDeleteBtn.addEventListener("click", () => {
          const targetId = modalTargetId.value;
          const targetMember = members.find(m => m.id === targetId);
          if (targetMember && confirm(`Are you sure you want to delete ${targetMember.name}?`)) {
            deleteMember(targetId);
            closeModal();
          }
        });

        function handleClearTree() {
          if (confirm("Are you sure you want to clear the entire family tree?")) {
            members = [];
            localStorage.removeItem("happyCelebrationFamily");
            updateRegistrationState(); // Update home banner
            renderMemberList();
            renderTree();
          }
        }

        clearTreeBtn?.addEventListener("click", handleClearTree);
        clearTreeZoomBtn?.addEventListener("click", handleClearTree);

        if (exportCsvBtn) {
          exportCsvBtn.addEventListener("click", () => {
            if (!members || members.length === 0) {
              alert("No family members found to export!");
              return;
            }
            
            // CSV Headers
            const headers = ["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID"];
            
            const rows = members.map(m => {
              const spouse = members.find(s => s.id === m.spouseId);
              const parent = members.find(p => p.id === m.parentId);
              
              return [
                m.id,
                m.name,
                m.gender || "",
                m.relation || "",
                spouse ? spouse.name : "",
                parent ? parent.name : "",
                m.birthDate || "",
                m.anniversaryDate || "",
                m.phone || "",
                m.email || ""
              ].map(val => `"${String(val).replace(/"/g, '""')}"`); // Escape quotes and wrap in quotes for CSV safety
            });
            
            // Add BOM (\uFEFF) for Excel UTF-8 compatibility
            const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            
            // Trigger browser download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "happy_celebration_family_tree.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
        }

        // Form submit handler
        modalForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const action = modalActionType.value;
          const targetId = modalTargetId.value;
          const name = modalName.value.trim();
          const gender = modalForm.querySelector('input[name="modalGender"]:checked').value;
          const phone = modalPhone ? modalPhone.value.trim() : "";
          const email = modalEmail ? modalEmail.value.trim() : "";

          if (!name) return;

          if (action === "add-root") {
            const rootId = "mem_" + Math.random().toString(36).substr(2, 9);
            const rootMember = {
              id: rootId,
              name,
              gender,
              relation: "Grandparent",
              spouseId: "",
              parentId: "",
              birthDate: "",
              anniversaryDate: "",
              phone,
              email
            };
            
            const spouseNameValue = modalSpouseName.value.trim();
            if (spouseNameValue) {
              const spouseId = "mem_" + Math.random().toString(36).substr(2, 9);
              const spouseGender = gender === "Male" ? "Female" : "Male";
              const spouseMember = {
                id: spouseId,
                name: spouseNameValue,
                gender: spouseGender,
                relation: "Grandparent",
                spouseId: rootId,
                parentId: "",
                birthDate: "",
                anniversaryDate: "",
                phone: "",
                email: ""
              };
              rootMember.spouseId = spouseId;
              members.push(spouseMember);
            }
            members.push(rootMember);

            // Add children
            const childCards = modalChildrenList.querySelectorAll(".modal-child-row");
            childCards.forEach(card => {
              const childNameInput = card.querySelector(".child-name-input");
              const childName = childNameInput ? childNameInput.value.trim() : "";
              const childGender = card.querySelector(".child-gender-input").value;
              
              if (childName) {
                const childId = "mem_" + Math.random().toString(36).substr(2, 9);
                const childMember = {
                  id: childId,
                  name: childName,
                  gender: childGender,
                  relation: "Parent",
                  spouseId: "",
                  parentId: rootId,
                  birthDate: "",
                  anniversaryDate: "",
                  phone: "",
                  email: ""
                };
                members.push(childMember);
              }
            });
          } else if (action === "edit") {
            const member = members.find(m => m.id === targetId);
            if (member) {
              member.name = name;
              member.gender = gender;
              
              // Save dates
              member.birthDate = getDropdownDate(modalBirthDay, modalBirthMonth, modalBirthYear);
              member.anniversaryDate = getDropdownDate(modalAnniversaryDay, modalAnniversaryMonth, modalAnniversaryYear);
              
              member.phone = phone;
              member.email = email;
              
              // Process spouse
              const spouseNameValue = modalSpouseName.value.trim();
              if (spouseNameValue) {
                const spouseGender = gender === "Male" ? "Female" : "Male";
                if (member.spouseId) {
                  const spouse = members.find(m => m.id === member.spouseId);
                  if (spouse) {
                    spouse.name = spouseNameValue;
                    spouse.gender = spouseGender;
                    spouse.anniversaryDate = member.anniversaryDate; // Sync dates
                  }
                } else {
                  const spouseId = "mem_" + Math.random().toString(36).substr(2, 9);
                  const spouseMember = {
                    id: spouseId,
                    name: spouseNameValue,
                    gender: spouseGender,
                    relation: member.relation,
                    spouseId: member.id,
                    parentId: member.parentId,
                    birthDate: "",
                    anniversaryDate: member.anniversaryDate,
                    phone: "",
                    email: ""
                  };
                  member.spouseId = spouseId;
                  members.push(spouseMember);
                }
              } else if (member.spouseId) {
                const spouseId = member.spouseId;
                member.spouseId = "";
                members = members.filter(m => m.id !== spouseId);
                members.forEach(m => {
                  if (m.parentId === spouseId) {
                    m.parentId = member.id;
                  }
                });
              }

              // Process children
              if (member.relation === "Grandparent" || member.relation === "Parent") {
                const childCards = modalChildrenList.querySelectorAll(".modal-child-row");
                const processedChildIds = new Set();
                const childRelation = member.relation === "Grandparent" ? "Parent" : "Child";
                
                childCards.forEach(card => {
                  const childRowId = card.dataset.rowId;
                  const childNameInput = card.querySelector(".child-name-input");
                  const childName = childNameInput ? childNameInput.value.trim() : "";
                  const childGender = card.querySelector(".child-gender-input").value;
                  
                  if (childName) {
                    let childId = childRowId;
                    let isNewChild = childRowId.startsWith("row_");
                    
                    if (isNewChild) {
                      childId = "mem_" + Math.random().toString(36).substr(2, 9);
                    }
                    
                    let childMember = members.find(m => m.id === childId);
                    if (childMember) {
                      childMember.name = childName;
                      childMember.gender = childGender;
                    } else {
                      childMember = {
                        id: childId,
                        name: childName,
                        gender: childGender,
                        relation: childRelation,
                        spouseId: "",
                        parentId: member.id,
                        birthDate: "",
                        anniversaryDate: "",
                        phone: "",
                        email: ""
                      };
                      members.push(childMember);
                    }
                    processedChildIds.add(childId);
                  }
                });

                // Remove deleted children
                const spouseId = member.spouseId;
                const currentChildren = members.filter(m => m.relation === childRelation && (m.parentId === member.id || (spouseId && m.parentId === spouseId)));
                currentChildren.forEach(child => {
                  if (!processedChildIds.has(child.id)) {
                    deleteMemberTree(child.id);
                  }
                });
              }
            }
          } else if (action === "add-spouse") {
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
              const spouseId = "mem_" + Math.random().toString(36).substr(2, 9);
              const spouseMember = {
                id: spouseId,
                name,
                gender,
                relation: targetMember.relation,
                spouseId: targetMember.id,
                parentId: targetMember.parentId,
                birthDate: "",
                anniversaryDate: "",
                phone,
                email
              };
              targetMember.spouseId = spouseId;
              members.push(spouseMember);
            }
          } else if (action === "add-child") {
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
              const childId = "mem_" + Math.random().toString(36).substr(2, 9);
              const childRelation = targetMember.relation === "Grandparent" ? "Parent" : "Child";
              const childMember = {
                id: childId,
                name,
                gender,
                relation: childRelation,
                spouseId: "",
                parentId: targetMember.id,
                birthDate: "",
                anniversaryDate: "",
                phone,
                email
              };
              members.push(childMember);
            }
          }

          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
          updateRegistrationState(); // Update home banner
          closeModal();
          renderMemberList();
          renderTree();

          // Auto sync to Google Sheets if configured
          const syncConfigRaw = localStorage.getItem("happyCelebrationSyncConfig");
          if (syncConfigRaw) {
            const config = JSON.parse(syncConfigRaw);
            if (config.googleSheetUrl) {
              autoSyncToGoogleSheets(config.googleSheetUrl);
            }
          }
        });

        // Google Sheets Sync Settings & Actions
        if (saveSyncConfigBtn) {
          saveSyncConfigBtn.addEventListener("click", () => {
            const googleSheetUrl = googleSheetUrlInput.value.trim();
            localStorage.setItem("happyCelebrationSyncConfig", JSON.stringify({ googleSheetUrl }));
            if (syncStatusMessage) {
              syncStatusMessage.style.color = "#a3e635"; // green
              syncStatusMessage.textContent = "Configuration saved successfully!";
              setTimeout(() => { syncStatusMessage.textContent = ""; }, 3000);
            }
          });
        }

        if (pushToSheetsBtn) {
          pushToSheetsBtn.addEventListener("click", () => {
            const googleSheetUrl = googleSheetUrlInput.value.trim();
            if (!googleSheetUrl) {
              if (syncStatusMessage) {
                syncStatusMessage.style.color = "#f87171"; // red
                syncStatusMessage.textContent = "Please enter your Google Apps Script URL first.";
              }
              return;
            }
            
            if (!members || members.length === 0) {
              if (syncStatusMessage) {
                syncStatusMessage.style.color = "#f87171";
                syncStatusMessage.textContent = "No family members to sync.";
              }
              return;
            }
            
            if (syncStatusMessage) {
              syncStatusMessage.style.color = "var(--gold-300)";
              syncStatusMessage.textContent = "Syncing data to Google Sheets...";
            }
            
            const payload = members.map(m => {
              const spouse = members.find(s => s.id === m.spouseId);
              const parent = members.find(p => p.id === m.parentId);
              return {
                id: m.id,
                name: m.name,
                gender: m.gender || "",
                relation: m.relation || "",
                spouseName: spouse ? spouse.name : "",
                parentName: parent ? parent.name : "",
                birthDate: m.birthDate || "",
                anniversaryDate: m.anniversaryDate || "",
                phone: m.phone || "",
                email: m.email || ""
              };
            });
            
            fetch(googleSheetUrl, {
              method: "POST",
              mode: "no-cors",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
            })
            .then(() => {
              if (syncStatusMessage) {
                syncStatusMessage.style.color = "#a3e635"; // green
                syncStatusMessage.textContent = "Data sent to Google Sheets! Check your sheet.";
              }
            })
            .catch(err => {
              console.error(err);
              if (syncStatusMessage) {
                syncStatusMessage.style.color = "#f87171"; // red
                syncStatusMessage.textContent = "Error syncing data: " + err.message;
              }
            });
          });
        }

        if (pullFromSheetsBtn) {
          pullFromSheetsBtn.addEventListener("click", () => {
            const googleSheetUrl = googleSheetUrlInput.value.trim();
            if (!googleSheetUrl) {
              if (syncStatusMessage) {
                syncStatusMessage.style.color = "#f87171";
                syncStatusMessage.textContent = "Please enter your Google Apps Script URL first.";
              }
              return;
            }
            fetchMembersFromGoogleSheets();
          });
        }

        if (copyAppsScriptBtn) {
          copyAppsScriptBtn.addEventListener("click", () => {
            const scriptCode = `function doPost(e) {
  try {
    var postContent = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (Array.isArray(postContent)) {
      sheet.clear();
      var headers = ["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID"];
      sheet.appendRow(headers);
      
      postContent.forEach(function(m) {
        sheet.appendRow([
          m.id || "",
          m.name || "",
          m.gender || "",
          m.relation || "",
          m.spouseName || "",
          m.parentName || "",
          m.birthDate || "",
          m.anniversaryDate || "",
          m.phone || "",
          m.email || ""
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Successfully synced " + postContent.length + " members."}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID"]);
      }
      sheet.appendRow([
        postContent.id || "submitted_" + new Date().getTime(),
        postContent.name || "",
        postContent.gender || "",
        postContent.relation || "Submitted",
        postContent.spouseName || "",
        postContent.parentName || "",
        postContent.birthDate || "",
        postContent.anniversaryDate || "",
        postContent.phone || "",
        postContent.email || ""
      ]);
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Successfully added entry."}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = rows[0];
    var data = [];
    
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var member = {};
      
      headers.forEach(function(header, index) {
        var key = header.toLowerCase().replace(/ /g, "");
        if (key === "memberid") key = "id";
        if (key === "name") key = "name";
        if (key === "gender") key = "gender";
        if (key === "relation") key = "relation";
        if (key === "spouseid" || key === "spouse") key = "spouseId";
        if (key === "parentid" || key === "parent") key = "parentId";
        if (key === "birthdate" || key === "dob") key = "birthDate";
        if (key === "anniversarydate") key = "anniversaryDate";
        if (key === "phonenumber" || key === "phone") key = "phone";
        if (key === "emailid" || key === "email") key = "email";
        
        member[key] = String(row[index] || "");
      });
      
      data.push(member);
    }
    
    data.forEach(function(m) {
      if (m.spouseId && !m.spouseId.startsWith("mem_")) {
        var foundSpouse = data.find(function(s) { return s.name.toLowerCase() === m.spouseId.toLowerCase(); });
        if (foundSpouse) m.spouseId = foundSpouse.id;
      }
      if (m.parentId && !m.parentId.startsWith("mem_")) {
        var foundParent = data.find(function(p) { return p.name.toLowerCase() === m.parentId.toLowerCase(); });
        if (foundParent) m.parentId = foundParent.id;
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
            
            navigator.clipboard.writeText(scriptCode)
              .then(() => {
                const oldText = copyAppsScriptBtn.textContent;
                copyAppsScriptBtn.textContent = "Copied! ✓";
                setTimeout(() => { copyAppsScriptBtn.textContent = oldText; }, 2000);
              })
              .catch(err => {
                alert("Failed to copy code.");
              });
          });
        }

        if (generateWaLinkBtn) {
          generateWaLinkBtn.addEventListener("click", () => {
            if (!members || members.length === 0) {
              alert("No family members to format.");
              return;
            }
            
            let message = "✦ Family Tree Data Summary ✦\n\n";
            members.forEach(m => {
              const spouse = members.find(s => s.id === m.spouseId);
              message += `• Name: ${m.name}\n`;
              message += `  Relation: ${m.relation} (${m.gender})\n`;
              if (m.birthDate) message += `  DOB: ${m.birthDate}\n`;
              if (m.anniversaryDate) message += `  Anniversary: ${m.anniversaryDate}\n`;
              if (m.phone) message += `  Phone: ${m.phone}\n`;
              if (m.email) message += `  Email: ${m.email}\n`;
              if (spouse) message += `  Spouse: ${spouse.name}\n`;
              message += "\n";
            });
            
            navigator.clipboard.writeText(message)
              .then(() => {
                alert("Family details formatted and copied to clipboard! You can paste it directly into WhatsApp.");
              })
              .catch(err => {
                alert("Failed to copy details.");
              });
          });
        }

        function autoSyncToGoogleSheets(url) {
          if (!url || !members || members.length === 0) return;
          const payload = members.map(m => {
            const spouse = members.find(s => s.id === m.spouseId);
            const parent = members.find(p => p.id === m.parentId);
            return {
              id: m.id,
              name: m.name,
              gender: m.gender || "",
              relation: m.relation || "",
              spouseName: spouse ? spouse.name : "",
              parentName: parent ? parent.name : "",
              birthDate: m.birthDate || "",
              anniversaryDate: m.anniversaryDate || "",
              phone: m.phone || "",
              email: m.email || ""
            };
          });
          fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).catch(err => console.error("Auto-sync error:", err));
        }

        function fetchMembersFromGoogleSheets() {
          const syncConfigRaw = localStorage.getItem("happyCelebrationSyncConfig");
          if (!syncConfigRaw) return;
          const config = JSON.parse(syncConfigRaw);
          const url = config.googleSheetUrl;
          if (!url) return;
          
          if (syncStatusMessage) {
            syncStatusMessage.style.color = "var(--gold-300)";
            syncStatusMessage.textContent = "Pulling data from Google Sheets...";
          }
          
          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) {
                members = data;
                localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
                renderMemberList();
                renderTree();
                updateRegistrationState();
                
                if (syncStatusMessage) {
                  syncStatusMessage.style.color = "#a3e635";
                  syncStatusMessage.textContent = "Synced successfully! Tree updated.";
                  setTimeout(() => { syncStatusMessage.textContent = ""; }, 3000);
                }
              } else if (data.status === "error") {
                console.error("Sheets sync error:", data.message);
                if (syncStatusMessage) {
                  syncStatusMessage.style.color = "#f87171";
                  syncStatusMessage.textContent = "Error: " + data.message;
                }
              }
            })
            .catch(err => {
              console.error("Fetch error from sheets:", err);
              if (syncStatusMessage) {
                syncStatusMessage.style.color = "#f87171";
                syncStatusMessage.textContent = "Unable to connect to Google Sheets. Using local cache.";
                setTimeout(() => { syncStatusMessage.textContent = ""; }, 4000);
              }
            });
        }

        // Event delegation on tree canvas
        treeCanvas.addEventListener("click", (e) => {
          const card = e.target.closest(".tree-node-card");
          if (card) {
            const memberId = card.dataset.id;
            openProfileCard(memberId);
            return;
          }
          const addFirstBtn = e.target.closest("#addFirstMemberBtn");
          if (addFirstBtn) {
            openModal("add-root");
          }
        });

        // Render editor member rows
        function renderMemberList() {
          if (addMemberBtn) {
            addMemberBtn.style.display = isAdmin ? "block" : "none";
          }

          if (!members.length) {
            membersListList.innerHTML = `
              <div class="empty-tree-container" style="padding: 32px 16px;">
                <p class="empty-tree-message">Your family tree is empty. Add the first member to begin!</p>
              </div>
            `;
            return;
          }
          
          const loggedInMemberId = localStorage.getItem("happyCelebrationLoggedInMemberId") || "";

          membersListList.innerHTML = members.map(m => {
            const initials = m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const genderClass = m.gender.toLowerCase();
            
            let actionsHtml = "";
            if (isAdmin) {
              actionsHtml = `
                <button type="button" class="secondary-action edit-row-btn" data-id="${m.id}">Edit</button>
                <button type="button" class="danger-action delete-row-btn" data-id="${m.id}">Delete</button>
              `;
            } else if (loggedInMemberId && loggedInMemberId === m.id) {
              actionsHtml = `
                <button type="button" class="secondary-action edit-row-btn" data-id="${m.id}">Edit</button>
              `;
            }

            return `
              <div class="member-row-card">
                <div class="member-row-info">
                  <div class="member-row-avatar ${genderClass}">${initials}</div>
                  <div class="member-row-details">
                    <span class="member-row-name">${escapeHtml(m.name)}</span>
                    <span class="member-row-relation">${escapeHtml(m.relation)} (${m.gender === 'Male' ? 'M' : 'F'})</span>
                  </div>
                </div>
                <div class="member-row-actions">
                  ${actionsHtml}
                </div>
              </div>
            `;
          }).join("");
          
          membersListList.querySelectorAll(".edit-row-btn").forEach(btn => {
            btn.addEventListener("click", () => {
              openModal("edit", btn.dataset.id);
            });
          });
          
          membersListList.querySelectorAll(".delete-row-btn").forEach(btn => {
            btn.addEventListener("click", () => {
              const targetId = btn.dataset.id;
              const targetMember = members.find(m => m.id === targetId);
              if (targetMember && confirm(`Are you sure you want to delete ${targetMember.name}?`)) {
                deleteMember(targetId);
              }
            });
          });
        }

        // Tree structure builder
        function buildTree(membersList) {
          const nodeMap = {};
          const treeNodes = [];
          const processedIds = new Set();
          
          membersList.forEach(m => {
            if (processedIds.has(m.id)) return;
            
            if (m.spouseId) {
              const spouse = membersList.find(s => s.id === m.spouseId);
              if (spouse) {
                const coupleNode = {
                  type: "couple",
                  id: m.id,
                  member1: m,
                  member2: spouse,
                  children: []
                };
                nodeMap[m.id] = coupleNode;
                nodeMap[spouse.id] = coupleNode;
                treeNodes.push(coupleNode);
                processedIds.add(m.id);
                processedIds.add(spouse.id);
                return;
              }
            }
            
            const singleNode = {
              type: "single",
              id: m.id,
              member: m,
              children: []
            };
            nodeMap[m.id] = singleNode;
            treeNodes.push(singleNode);
            processedIds.add(m.id);
          });
          
          const roots = [];
          treeNodes.forEach(node => {
            let pId = "";
            if (node.type === "couple") {
              pId = node.member1.parentId || node.member2.parentId || "";
            } else {
              pId = node.member.parentId || "";
            }
            
            if (pId && nodeMap[pId]) {
              if (!nodeMap[pId].children.includes(node)) {
                nodeMap[pId].children.push(node);
              }
            } else {
              roots.push(node);
            }
          });
          
          const order = { "Grandparent": 1, "Parent": 2, "Child": 3 };
          const sortNodes = (a, b) => {
            const aRel = a.type === "couple" ? a.member1.relation : a.member.relation;
            const bRel = b.type === "couple" ? b.member1.relation : b.member.relation;
            const relationDiff = (order[aRel] || 4) - (order[bRel] || 4);
            if (relationDiff !== 0) return relationDiff;
            
            const aName = a.type === "couple" ? a.member1.name : a.member.name;
            const bName = b.type === "couple" ? b.member1.name : b.member.name;
            return aName.localeCompare(bName);
          };
          
          roots.sort(sortNodes);
          treeNodes.forEach(n => {
            n.children.sort(sortNodes);
          });
          
          return roots;
        }

        function renderCardHTML(m) {
          const initials = m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const genderClass = m.gender.toLowerCase();
          const relationClass = "rel-" + m.relation.toLowerCase();
          return `
            <div class="tree-node-card circular ${genderClass} ${relationClass}" data-id="${m.id}">
              <div class="node-avatar">${initials}</div>
              <div class="node-details">
                <span class="node-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>
                <span class="node-relation">${escapeHtml(m.relation)}</span>
              </div>
            </div>
          `;
        }

        function renderCoupleCardHTML(node) {
          let memberLeft, memberRight;
          let isLeftSpouse = false;
          let isRightSpouse = false;
          const isGrandparent = node.member1.relation === "Grandparent";

          if (isGrandparent) {
            memberLeft = node.member1;
            memberRight = node.member2;
          } else {
            if (node.member1.parentId) {
              memberLeft = node.member1;
              memberRight = node.member2;
              isRightSpouse = true;
            } else {
              memberLeft = node.member2;
              memberRight = node.member1;
              isLeftSpouse = true;
            }
          }

          const initLeft = memberLeft.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const initRight = memberRight.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
          const genderLeft = memberLeft.gender.toLowerCase();
          const genderRight = memberRight.gender.toLowerCase();
          const relationClass = "rel-" + node.member1.relation.toLowerCase();
          
          const classLeft = `node-avatar ${genderLeft}${isLeftSpouse ? " spouse" : " descendant"}`;
          const classRight = `node-avatar ${genderRight}${isRightSpouse ? " spouse" : " descendant"}`;
          
          const tooltipLeft = `${escapeHtml(memberLeft.name)}${isLeftSpouse ? " (Spouse)" : " (Direct Descendant)"}`;
          const tooltipRight = `${escapeHtml(memberRight.name)}${isRightSpouse ? " (Spouse)" : " (Direct Descendant)"}`;
          
          const badgeLeft = isLeftSpouse ? `<span class="spouse-badge" title="Spouse">💍</span>` : "";
          const badgeRight = isRightSpouse ? `<span class="spouse-badge" title="Spouse">💍</span>` : "";

          const fullName = `${memberLeft.name} & ${memberRight.name}`;
          const descendantClass = isGrandparent ? "" : (isRightSpouse ? "descendant-left" : "descendant-right");

          return `
            <div class="tree-node-card circular couple ${relationClass} ${descendantClass}" data-id="${node.member1.id}">
              <div class="couple-avatars">
                <div class="${classLeft}" title="${tooltipLeft}">
                  ${initLeft}
                  ${badgeLeft}
                </div>
                <div class="${classRight}" title="${tooltipRight}">
                  ${initRight}
                  ${badgeRight}
                </div>
              </div>
              <div class="node-details">
                <span class="node-name" title="${escapeHtml(fullName)}">${escapeHtml(fullName)}</span>
                <span class="node-relation">${escapeHtml(node.member1.relation)}</span>
              </div>
            </div>
          `;
        }

        function renderNodeHTML(node) {
          const hasChildren = node.children && node.children.length > 0;
          let headerHTML = "";
          let branchClass = "";
          
          if (node.type === "couple") {
            headerHTML = renderCoupleCardHTML(node);
            const isGrandparent = node.member1.relation === "Grandparent";
            if (!isGrandparent) {
              if (node.member1.parentId) {
                branchClass = "child-left";
              } else {
                branchClass = "child-right";
              }
            }
          } else {
            headerHTML = renderCardHTML(node.member);
          }
          
          return `
            <div class="tree-branch ${hasChildren ? "has-children" : ""} ${branchClass}">
              ${headerHTML}
              ${hasChildren ? `
                <div class="tree-children-container">
                  ${node.children.map(child => renderNodeHTML(child)).join("")}
                </div>
              ` : ""}
            </div>
          `;
        }

        function renderTree() {
          if (!members.length) {
            treeCanvas.innerHTML = `
              <div class="empty-tree-container">
                <p class="empty-tree-message">Your family tree is empty. Add the first member to begin!</p>
                <button type="button" class="primary-action" id="addFirstMemberBtn">Add First Member</button>
              </div>
            `;
            return;
          }
          const roots = buildTree(members);
          treeCanvas.innerHTML = roots.map(rootNode => renderNodeHTML(rootNode)).join("");
        }

        // Initial renders
        renderMemberList();
        renderTree();
        setTimeout(fitToScreen, 100);
        
        // Auto-fetch from Google Sheets at startup if URL configured
        fetchMembersFromGoogleSheets();

      } catch (err) {
        console.error("Family panel error:", err);
        root.innerHTML = `
          <div style="padding: 16px; margin: 16px; border: 1px solid rgba(255, 74, 90, 0.4); border-radius: 12px; background: rgba(255, 74, 90, 0.1); color: #ff9aa2; font-size: 13px; line-height: 1.5;">
            <h4 style="margin: 0 0 8px; font-size: 15px; color: #ff4a5a;">Family Panel Setup Failed</h4>
            <p style="margin: 0 0 12px;">An error occurred while loading your family tree configuration.</p>
            <pre style="margin: 0 0 12px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 11px; color: #ffebec;">${escapeHtml(err.message)}\n\n${escapeHtml(err.stack)}</pre>
            <button id="resetStorageBtn" style="padding: 8px 16px; background: #ff4a5a; color: #fff; border: 0; border-radius: 999px; font-weight: 700; cursor: pointer; transition: background 0.2s;">Reset State & Reload</button>
          </div>
        `;
        setTimeout(() => {
          const resetBtn = root.querySelector("#resetStorageBtn");
          if (resetBtn) {
            resetBtn.addEventListener("click", () => {
              localStorage.removeItem("happyCelebrationFamily");
              window.location.reload();
            });
          }
        }, 50);
      }
    }
  },
  register: {
    title: "Profile / Login",
    kicker: "Access Control",
    template: "registerTemplate",
    setup(root) {
      function checkIsAdmin() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("admin") && params.get("admin") === "true") return true;
        if (params.has("role") && params.get("role") === "organizer") return true;
        try {
          const regData = localStorage.getItem("happyCelebrationRegistration");
          if (regData) {
            const data = JSON.parse(regData);
            if (data.role === "Organizer") return true;
          }
        } catch(e) {}
        return false;
      }

      function linkUserToTreeMember(fullName, phone) {
        try {
          const raw = localStorage.getItem("happyCelebrationFamily");
          const members = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(members)) return null;

          const cleanNum = p => String(p || "").replace(/\D/g, "");
          const targetPhoneClean = cleanNum(phone);

          if (targetPhoneClean) {
            const match = members.find(m => cleanNum(m.phone) === targetPhoneClean && targetPhoneClean.length > 5);
            if (match) return match;
          }

          // Fallback to name search
          const targetName = String(fullName || "").toLowerCase().trim();
          if (targetName) {
            const match = members.find(m => String(m.name || "").toLowerCase().trim() === targetName);
            if (match) return match;
          }
        } catch (e) {}
        return null;
      }

      function renderRegisterView() {
        const regDataRaw = localStorage.getItem("happyCelebrationRegistration");
        if (regDataRaw) {
          const data = JSON.parse(regDataRaw);
          const loggedInMemberId = localStorage.getItem("happyCelebrationLoggedInMemberId") || "";

          // Fetch family members to get relations
          let members = [];
          try {
            const raw = localStorage.getItem("happyCelebrationFamily");
            members = raw ? JSON.parse(raw) : [];
          } catch(e) {}

          const matchMember = members.find(m => m.id === loggedInMemberId);

          if (matchMember) {
            // Find relations
            const spouse = members.find(m => m.id === matchMember.spouseId);
            const parent = members.find(m => m.id === matchMember.parentId);
            const children = members.filter(m => m.parentId === matchMember.id || (matchMember.spouseId && m.parentId === matchMember.spouseId));

            const relationBadges = [];
            if (spouse) relationBadges.push(`<span class="dashboard-badge">💍 Spouse: ${escapeHtml(spouse.name)}</span>`);
            if (parent) relationBadges.push(`<span class="dashboard-badge">👴 Parent: ${escapeHtml(parent.name)}</span>`);
            children.forEach(c => relationBadges.push(`<span class="dashboard-badge">👶 Child: ${escapeHtml(c.name)}</span>`));

            root.innerHTML = `
              <div class="dashboard-card">
                <div class="dashboard-title">My Dashboard</div>
                
                <div style="text-align: center; margin-bottom: 12px;">
                  <div style="font-size: 48px; margin-bottom: 4px;">👤</div>
                  <h3 style="margin: 0; color: var(--gold-100); font-family: Georgia, serif; font-size: 22px;">${escapeHtml(matchMember.name)}</h3>
                  <span style="color: var(--gold-300); font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px;">${escapeHtml(data.role)}</span>
                </div>

                <div class="dashboard-row">
                  <span class="dashboard-label">Relationship:</span>
                  <span class="dashboard-val">${escapeHtml(matchMember.relation)}</span>
                </div>
                <div class="dashboard-row">
                  <span class="dashboard-label">Phone:</span>
                  <span class="dashboard-val">${escapeHtml(matchMember.phone || data.phone)}</span>
                </div>
                ${matchMember.email || data.emailId ? `
                <div class="dashboard-row">
                  <span class="dashboard-label">Email ID:</span>
                  <span class="dashboard-val">${escapeHtml(matchMember.email || data.emailId)}</span>
                </div>
                ` : ""}
                ${matchMember.birthDate ? `
                <div class="dashboard-row">
                  <span class="dashboard-label">Birthday:</span>
                  <span class="dashboard-val">${escapeHtml(matchMember.birthDate)}</span>
                </div>
                ` : ""}
                ${matchMember.anniversaryDate ? `
                <div class="dashboard-row">
                  <span class="dashboard-label">Wedding Anniversary:</span>
                  <span class="dashboard-val">${escapeHtml(matchMember.anniversaryDate)}</span>
                </div>
                ` : ""}

                ${relationBadges.length > 0 ? `
                <div class="dashboard-section">
                  <span class="dashboard-section-title">My Family Connections</span>
                  <div class="dashboard-badge-list">
                    ${relationBadges.join("")}
                  </div>
                </div>
                ` : ""}

                <button class="primary-action" id="focusMyNodeBtn" type="button" style="margin-top: 14px; width: 100%;">View My Node on Tree</button>
                <button class="danger-action" id="logoutBtn" type="button" style="margin-top: 8px; width: 100%;">Log Out</button>
              </div>
            `;

            // Focus on tree listener
            root.querySelector("#focusMyNodeBtn").addEventListener("click", () => {
              openPanel("family");
              const previewTabBtn = document.querySelector("#previewTabBtn");
              if (previewTabBtn) {
                previewTabBtn.click();
              }
              setTimeout(() => {
                if (typeof window.focusMemberOnTree === "function") {
                  window.focusMemberOnTree(loggedInMemberId);
                }
              }, 1200); // 1.2s delay for panel rendering animation transition
            });

          } else {
            // Linked node not found (Guest with no tree entry yet)
            root.innerHTML = `
              <div class="dashboard-card">
                <div class="dashboard-title">Profile Page</div>
                
                <div style="text-align: center; margin-bottom: 12px;">
                  <div style="font-size: 48px; margin-bottom: 4px;">👤</div>
                  <h3 style="margin: 0; color: var(--gold-100); font-family: Georgia, serif; font-size: 22px;">${escapeHtml(data.fullName)}</h3>
                  <span style="color: #ff9aa2; background: rgba(255, 74, 90, 0.1); border: 1px solid rgba(255, 74, 90, 0.25); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; margin-top: 6px;">Unlinked Guest</span>
                </div>

                <div class="dashboard-row">
                  <span class="dashboard-label">Phone:</span>
                  <span class="dashboard-val">${escapeHtml(data.phone)}</span>
                </div>
                ${data.emailId ? `
                <div class="dashboard-row">
                  <span class="dashboard-label">Email ID:</span>
                  <span class="dashboard-val">${escapeHtml(data.emailId)}</span>
                </div>
                ` : ""}
                
                <div class="pricing-card-description" style="margin-top: 12px; border-left-color: #ff4a5a; background: rgba(255, 74, 90, 0.05); font-size: 12px; color: #ff9aa2;">
                  ⚠️ Your phone number is not linked to any member in the family tree. Please ask the administrator to link your profile.
                </div>

                <button class="danger-action" id="logoutBtn" type="button" style="margin-top: 14px; width: 100%;">Log Out</button>
              </div>
            `;
          }

          root.querySelector("#logoutBtn").addEventListener("click", () => {
            if (confirm("Are you sure you want to log out / clear your profile?")) {
              localStorage.removeItem("happyCelebrationRegistration");
              localStorage.removeItem("happyCelebrationLoggedInMemberId");
              updateRegistrationState();
              renderRegisterView();
            }
          });

        } else {
          // Render Tabs & Form
          root.innerHTML = `
            <div class="auth-workspace" style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
              <!-- Auth Tabs Navigation -->
              <div class="auth-tabs-nav">
                <button type="button" class="auth-tab-nav-btn active" id="signInTabBtn">Sign In</button>
                <button type="button" class="auth-tab-nav-btn" id="signUpTabBtn">Sign Up</button>
              </div>

              <!-- Sign In View -->
              <div class="auth-view active" id="signInView" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
                <form class="lux-form" id="signInForm" style="display: flex; flex-direction: column; gap: 14px; margin-top: 4px;">
                  <label>
                    <span>Full Name</span>
                    <input name="fullName" id="signInName" type="text" placeholder="Your full name" required autocomplete="off">
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input name="phone" id="signInPhone" type="tel" placeholder="e.g. +91 98765 43210" required autocomplete="off">
                  </label>
                  <button class="primary-action" type="submit" style="margin-top: 6px; width: 100%;">Sign In</button>
                  <p class="form-note" id="signInNote"></p>
                </form>
              </div>

              <!-- Sign Up View -->
              <div class="auth-view" id="signUpView" style="display: none; flex-direction: column; flex: 1; min-height: 0;">
                <form class="lux-form" id="registerForm" style="display: flex; flex-direction: column; gap: 14px; margin-top: 4px;">
                  <label>
                    <span>Full Name</span>
                    <input name="fullName" id="registerName" type="text" placeholder="Your name" required autocomplete="off">
                  </label>
                  <label>
                    <span>Phone Number</span>
                    <input name="phone" id="registerPhone" type="tel" placeholder="e.g. +91 98765 43210" required autocomplete="off">
                  </label>
                  <label>
                    <span>Email ID</span>
                    <input name="emailId" id="registerEmail" type="email" placeholder="example@domain.com" autocomplete="off">
                  </label>
                  <label>
                    <span>Role</span>
                    <select name="role" id="registerRole" required>
                      <option value="Guest">Guest</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Organizer">Organizer</option>
                    </select>
                  </label>
                  <button class="primary-action" type="submit" style="margin-top: 6px; width: 100%;">Register</button>
                  <p class="form-note" id="registerNote"></p>
                </form>
              </div>
            </div>
          `;

          const signInTabBtn = root.querySelector("#signInTabBtn");
          const signUpTabBtn = root.querySelector("#signUpTabBtn");
          const signInView = root.querySelector("#signInView");
          const signUpView = root.querySelector("#signUpView");

          signInTabBtn.addEventListener("click", () => {
            signInTabBtn.classList.add("active");
            signUpTabBtn.classList.remove("active");
            signInView.style.display = "flex";
            signUpView.style.display = "none";
          });

          signUpTabBtn.addEventListener("click", () => {
            signUpTabBtn.classList.add("active");
            signInTabBtn.classList.remove("active");
            signUpView.style.display = "flex";
            signInView.style.display = "none";
          });

          // Sign In Submit
          const signInForm = root.querySelector("#signInForm");
          const signInNote = root.querySelector("#signInNote");

          signInForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(signInForm));
            
            const match = linkUserToTreeMember(data.fullName, data.phone);
            let role = "Guest";
            if (match) {
              if (String(match.name).toLowerCase().includes("amjad")) {
                role = "Organizer";
              } else {
                role = "Family Member";
              }
              localStorage.setItem("happyCelebrationLoggedInMemberId", match.id);
            }

            const regData = {
              fullName: match ? match.name : data.fullName,
              phone: match ? match.phone : data.phone,
              emailId: match ? (match.email || "") : "",
              role: role
            };

            localStorage.setItem("happyCelebrationRegistration", JSON.stringify(regData));
            updateRegistrationState();
            
            signInNote.style.color = "#86efac";
            signInNote.textContent = match 
              ? `Logged in successfully as ${match.name}!` 
              : "Signed in successfully as Guest!";
            
            setTimeout(() => {
              renderRegisterView();
            }, 1000);
          });

          // Sign Up Submit
          const registerForm = root.querySelector("#registerForm");
          const registerNote = root.querySelector("#registerNote");

          registerForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = Object.fromEntries(new FormData(registerForm));
            localStorage.setItem("happyCelebrationRegistration", JSON.stringify(formData));
            
            const nameLower = formData.fullName.toLowerCase();
            if (nameLower.includes("amjad")) {
              const currentFamily = localStorage.getItem("happyCelebrationFamily");
              if (!currentFamily || JSON.parse(currentFamily).length === 0) {
                // Prepopulate with default family tree data, including birthdays and anniversaries!
                const demoFamily = [
                  { id: "grandparent", name: "Grandparent", gender: "Male", relation: "Grandparent", spouseId: "", birthDate: "05/12/1950", anniversaryDate: "", phone: "", email: "" },
                  { id: "aleena", name: "Aleena", gender: "Female", relation: "Parent", parentId: "grandparent", spouseId: "", birthDate: "09/18/1982", anniversaryDate: "", phone: "", email: "" },
                  { id: "alisha", name: "Alisha", gender: "Female", relation: "Parent", parentId: "grandparent", spouseId: "rafi", birthDate: "10/12/1986", anniversaryDate: "06/23/2014", phone: "", email: "" },
                  { id: "rafi", name: "Rafi", gender: "Male", relation: "Parent", parentId: "", spouseId: "alisha", birthDate: "04/05/1984", anniversaryDate: "06/23/2014", phone: "", email: "" },
                  { id: "amjad", name: "Amjad", gender: "Male", relation: "Parent", parentId: "grandparent", spouseId: "subeena", birthDate: "08/14/1985", anniversaryDate: "03/12/2012", phone: "", email: "" },
                  { id: "subeena", name: "Subeena", gender: "Female", relation: "Parent", parentId: "", spouseId: "amjad", birthDate: "11/20/1988", anniversaryDate: "03/12/2012", phone: "", email: "" },
                  { id: "adab", name: "Adab", gender: "Female", relation: "Child", parentId: "alisha", spouseId: "", birthDate: "06/15/2018", anniversaryDate: "", phone: "", email: "" },
                  { id: "ali", name: "Ali", gender: "Male", relation: "Child", parentId: "alisha", spouseId: "", birthDate: "11/02/2020", anniversaryDate: "", phone: "", email: "" },
                  { id: "eva", name: "Eva", gender: "Female", relation: "Child", parentId: "amjad", spouseId: "", birthDate: "06/09/2016", anniversaryDate: "", phone: "", email: "" }
                ];
                localStorage.setItem("happyCelebrationFamily", JSON.stringify(demoFamily));
              }
            }
            
            // Check if matches member in tree to link ID
            const match = linkUserToTreeMember(formData.fullName, formData.phone);
            if (match) {
              localStorage.setItem("happyCelebrationLoggedInMemberId", match.id);
            }

            updateRegistrationState();
            registerNote.style.color = "#86efac";
            registerNote.textContent = `${formData.fullName} is registered.`;
            setTimeout(() => {
              renderRegisterView();
            }, 1000);
          });
        }
      }
      
      renderRegisterView();
    },
  },
  contact: {
    title: "Contact Us",
    kicker: "Support",
    template: "contactTemplate",
  },
};

const homeView = document.querySelector("#homeView");
const panelView = document.querySelector("#panelView");
const panelTitle = document.querySelector("#panelTitle");
const panelKicker = document.querySelector("#panelKicker");
const panelContent = document.querySelector("#panelContent");
const backButton = document.querySelector("#backButton");
function openPanel(name) {
  const panel = panels[name];
  if (!panel) return;

  // Clear floating celebration container to immediately remove active bubbles and hide it
  const container = document.getElementById("floatingCelebrationContainer");
  if (container) {
    container.innerHTML = "";
    container.style.display = "none";
  }

  const template = document.querySelector(`#${panel.template}`);
  panelTitle.textContent = panel.title;
  panelKicker.textContent = panel.kicker;
  panelContent.replaceChildren(template.content.cloneNode(true));
  panel.setup?.(panelContent);
  homeView.classList.remove("active");
  panelView.classList.add("active");
}

function closePanel() {
  panelView.classList.remove("active");
  homeView.classList.add("active");

  // Show floating celebration container again when returning to home view
  const container = document.getElementById("floatingCelebrationContainer");
  if (container) {
    container.style.display = "block";
  }
}

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
  
  button.addEventListener("mousemove", (e) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    button.style.setProperty("--mouse-x", `${x}px`);
    button.style.setProperty("--mouse-y", `${y}px`);
  });
});

backButton.addEventListener("click", closePanel);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && panelView.classList.contains("active")) {
    closePanel();
  }
});

// Initial registration state check on page load
updateRegistrationState();

// Support URL parameters for fullscreen mode and direct panel opening
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("fullscreen") || urlParams.has("fullpage")) {
  document.body.classList.add("fullscreen-mode");
}
const initialPanel = urlParams.get("panel");
if (initialPanel && panels[initialPanel]) {
  let panelOpened = false;
  const triggerOpen = () => {
    if (panelOpened) return;
    panelOpened = true;
    openPanel(initialPanel);
  };
  
  // Wait a moment for templates and DOM to be fully ready
  window.addEventListener("DOMContentLoaded", triggerOpen);
  // Also run immediately if DOM is already loaded
  if (document.readyState === "interactive" || document.readyState === "complete") {
    triggerOpen();
  }
}

// Theme Selection Logic
document.addEventListener("DOMContentLoaded", () => {
  const themeSettingsBtn = document.getElementById("themeSettingsBtn");
  const themeDropdown = document.getElementById("themeDropdown");
  
  if (themeSettingsBtn && themeDropdown) {
    themeSettingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      themeDropdown.style.display = themeDropdown.style.display === "none" ? "block" : "none";
    });
    
    document.addEventListener("click", () => {
      themeDropdown.style.display = "none";
    });
    
    themeDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    
    const themeOpts = themeDropdown.querySelectorAll(".theme-opt");
    const savedTheme = localStorage.getItem("happyCelebrationTheme") || "wine";
    
    // Apply saved theme immediately
    applyTheme(savedTheme);
    
    themeOpts.forEach(opt => {
      opt.addEventListener("click", () => {
        const selectedTheme = opt.dataset.theme;
        applyTheme(selectedTheme);
      });
    });
    
    function applyTheme(themeName) {
      document.body.classList.remove("theme-wine", "theme-emerald", "theme-sapphire", "theme-violet", "theme-luxury");
      document.body.classList.add(`theme-${themeName}`);
      
      themeOpts.forEach(opt => {
        if (opt.dataset.theme === themeName) {
          opt.classList.add("active");
        } else {
          opt.classList.remove("active");
        }
      });
      
      localStorage.setItem("happyCelebrationTheme", themeName);
    }
  }

  const userProfileBtn = document.getElementById("userProfileBtn");
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", () => {
      openPanel("register");
    });
  }
});

// Floating Celebration Bubbles Spawner
function initFloatingCelebration() {
  const container = document.getElementById("floatingCelebrationContainer");
  if (!container) return;

  const floatImages = [
    "assets/float-balloons.webp",
    "assets/float-cake.jpg",
    "assets/float-flowers.jpeg",
    "assets/float-wedding.webp",
    "assets/float-confetti.webp",
    "assets/float-arch.webp"
  ];

  function spawnBubble(initial = false) {
    // Only spawn bubbles when home view is active
    const homeView = document.getElementById("homeView");
    if (!homeView || !homeView.classList.contains("active")) {
      return;
    }

    const bubble = document.createElement("div");
    bubble.className = "float-bubble";
    
    // Pick a random image from the list
    const randomImg = floatImages[Math.floor(Math.random() * floatImages.length)];
    bubble.style.backgroundImage = `url('${randomImg}')`;

    // Randomize size between 45px and 75px
    const size = Math.floor(Math.random() * 30) + 45;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;

    // Randomize horizontal position (5% to 95%)
    bubble.style.left = `${Math.random() * 90 + 5}%`;

    // Randomize vertical offset if initial, to distribute them instantly
    if (initial) {
      const bottomOffset = Math.floor(Math.random() * 80) + 10;
      bubble.style.bottom = `${bottomOffset}%`;
    }

    // Randomize float up animation duration (8s to 12s)
    const floatDuration = Math.random() * 4 + 8;
    // Randomize sway animation duration (3s to 5s)
    const swayDuration = Math.random() * 2 + 3;
    
    bubble.style.animationDuration = `${floatDuration}s, ${swayDuration}s`;
    // Randomize sway starting delay to offset the phases
    bubble.style.animationDelay = `0s, ${Math.random() * -4}s`;

    container.appendChild(bubble);

    // Remove from DOM when animation completes
    setTimeout(() => {
      bubble.remove();
    }, floatDuration * 1000);
  }

  // Spawn initial bubbles so the screen isn't empty on load
  for (let i = 0; i < 4; i++) {
    spawnBubble(true);
  }

  // Periodically spawn new bubbles
  setInterval(() => spawnBubble(false), 2400);
}

// Run immediately if DOM is already ready, or wait for DOMContentLoaded
if (document.readyState === "interactive" || document.readyState === "complete") {
  initFloatingCelebration();
} else {
  document.addEventListener("DOMContentLoaded", initFloatingCelebration);
}

