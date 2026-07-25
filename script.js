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
  const userProfileBtn = document.querySelector("#userProfileBtn") || document.querySelector("#avatarBtn");

  if (regDataRaw) {
    const data = JSON.parse(regDataRaw);
    if (userProfileBtn) {
      userProfileBtn.classList.add("logged-in");
      if (data.fullName) {
        userProfileBtn.innerHTML = `<span class="avatar-placeholder">${data.fullName.trim().charAt(0).toUpperCase()}</span>`;
      } else {
        userProfileBtn.innerHTML = '<span class="avatar-placeholder">👤</span>';
      }
    }

    if (registerCard) {
      const spanText = registerCard.querySelector(".cultfit-label");
      if (spanText) {
        spanText.textContent = "My Profile";
      }
      const icon = registerCard.querySelector(".icon") || registerCard.querySelector(".cultfit-icon-circle");
      if (icon) {
        icon.style.background = "radial-gradient(circle, rgba(245, 199, 110, 0.45) 0%, rgba(245, 199, 110, 0) 70%)";
        icon.style.filter = "drop-shadow(0 0 8px rgba(245, 199, 110, 0.6))";
      }
    }

    if (!greetingBanner) {
      const banner = document.createElement("div");
      banner.id = "greetingBanner";
      banner.className = "greeting-banner";
      banner.innerHTML = `<span class="greeting-banner-copy">Welcome back, <span class="greeting-banner-name">${escapeHtml(data.fullName)}</span>! (${escapeHtml(data.role)})</span>`;
      
      const sparkle = document.querySelector(".sparkle") || document.querySelector(".logo-hero-sparkle");
      if (sparkle) {
        sparkle.after(banner);
      }
    } else {
      greetingBanner.className = "greeting-banner";
      greetingBanner.innerHTML = `<span class="greeting-banner-copy">Welcome back, <span class="greeting-banner-name">${escapeHtml(data.fullName)}</span>! (${escapeHtml(data.role)})</span>`;
    }

    // Dynamic Upcoming Event Reminders & Countdown Banner
    renderCountdownBanner();

  } else {
    if (userProfileBtn) {
      userProfileBtn.classList.remove("logged-in");
      userProfileBtn.innerHTML = '<span class="avatar-placeholder">👤</span>';
    }

    if (registerCard) {
      const spanText = registerCard.querySelector(".cultfit-label");
      if (spanText) {
        spanText.textContent = "Register";
      }
      const icon = registerCard.querySelector(".icon") || registerCard.querySelector(".cultfit-icon-circle");
      if (icon) {
        icon.style.background = "";
        icon.style.filter = "";
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
    banner.className = "countdown-banner countdown-banner-empty";
    banner.innerHTML = `
      <div class="countdown-content">
        <span class="countdown-label">✦ Family Event Reminders ✦</span>
        <span class="countdown-text countdown-text--muted">
          Configure birthdays & anniversaries to see countdowns.
        </span>
      <a class="countdown-btn countdown-link-btn" id="countdownAddBtn" href="?panel=family&fullscreen=true" target="_blank">Add Dates</a>
    `;

    const trigger = document.querySelector("#greetingBanner") || document.querySelector(".sparkle");
    if (trigger) {
      trigger.after(banner);
    }
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
        "Wedding Anniversary": { baseSetup: 8000, perGuest: 600, description: "Includes romantic stage setup, photo display zone, anniversary cake, live music background, and fine dining buffet." },
        "Anniversary": { baseSetup: 8000, perGuest: 600, description: "Includes romantic stage setup, photo display zone, anniversary cake, live music background, and fine dining buffet." },
        "Retirement Party": { baseSetup: 10000, perGuest: 700, description: "Includes elegant retirement stage setup, custom floral arrangements, audio system, and buffet catering." },
        "Theme Party": { baseSetup: 12000, perGuest: 800, description: "Includes specialized custom-themed decorations, customized sound & DJ lights, interactive props, and curated party snacks." },
        "Welcoming Newborn Baby": { baseSetup: 7000, perGuest: 500, description: "Includes pastel balloon arch designs, sweet baby cradle decorations, newborn theme photo backdrops, and child-friendly snacks." },
        "Festivals": { baseSetup: 15000, perGuest: 900, description: "Includes traditional festival backdrops, holiday themes, specialized LED light styling, and traditional buffet catering." },
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
        const editorTabBtn = root.querySelector("#editorTabBtn") || document.querySelector("#editorTabBtn");
        const previewTabBtn = root.querySelector("#previewTabBtn") || document.querySelector("#previewTabBtn");
        const syncTabBtn = root.querySelector("#syncTabBtn") || document.querySelector("#syncTabBtn");

        const familyEditorView = root.querySelector("#familyEditorView");
        const familyPreviewView = root.querySelector("#familyPreviewView");
        const familySyncView = root.querySelector("#familySyncView");

        const addMemberBtn = root.querySelector("#addMemberBtn");
        const membersListList = root.querySelector("#membersListList");

        // Canvas & Zoom controls
        const treeCanvas = root.querySelector("#treeCanvas");
        const treeCanvasWrapper = root.querySelector("#treeCanvasWrapper");
        const clearTreeBtn = root.querySelector("#clearTreeBtn");
        const clearTreeZoomBtn = root.querySelector("#clearTreeZoomBtn") || document.querySelector("#clearTreeZoomBtn");
        const exportCsvBtn = root.querySelector("#exportCsvBtn");
        const zoomLabel = root.querySelector("#zoomLabel") || document.querySelector("#zoomLabel");
        const zoomInBtn = root.querySelector("#zoomInBtn") || document.querySelector("#zoomInBtn");
        const zoomOutBtn = root.querySelector("#zoomOutBtn") || document.querySelector("#zoomOutBtn");
        const zoomFitBtn = root.querySelector("#zoomFitBtn") || document.querySelector("#zoomFitBtn");
        const treeZoomControls = document.querySelector("#panelView .tree-zoom-controls");
        if (treeZoomControls) {
          treeZoomControls.style.setProperty("display", "none", "important");
        }

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
        const modalPhotoInput = root.querySelector("#modalPhotoInput");
        const modalPhotoPreview = root.querySelector("#modalPhotoPreview");
        const modalPhotoRemoveBtn = root.querySelector("#modalPhotoRemoveBtn");
        const modalPhotoHint = root.querySelector("#modalPhotoHint");
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
        const profileAddRelativeBtn = root.querySelector("#profileAddRelativeBtn");

        // Relationship Selector Modal DOM Elements
        const relationshipSelectorModal = root.querySelector("#relationshipSelectorModal");
        const relationshipSelectorCloseBtn = root.querySelector("#relationshipSelectorCloseBtn");
        const relationshipSelectorTitle = root.querySelector("#relationshipSelectorTitle");
        const relationshipSelectorMultipleBtn = root.querySelector("#relationshipSelectorMultipleBtn");

        // Alive and Death Date Elements (removed)

        // Multiple Parents Elements
        const modalMultipleParentsContainer = root.querySelector("#modalMultipleParentsContainer");
        const modalFatherName = root.querySelector("#modalFatherName");
        const modalFatherBirthYear = root.querySelector("#modalFatherBirthYear");
        const modalMotherName = root.querySelector("#modalMotherName");
        const modalMotherBirthYear = root.querySelector("#modalMotherBirthYear");
        const modalMainFields = root.querySelector("#modalMainFields");

        let relationshipSelectorTargetId = null;
        let modalPhotoData = "";

        // Populate modal Days selects (1 to 31)
        [modalBirthDay, modalAnniversaryDay].forEach(daySel => {
          if (daySel) {
            // Keep the placeholder first option
            daySel.innerHTML = '<option value="">Day</option>';
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
        [modalBirthYear].forEach(yearSel => {
          if (yearSel) {
            yearSel.innerHTML = '<option value="">Year</option>';
            const currentYear = new Date().getFullYear();
            for (let i = currentYear; i >= 1900; i--) {
              const opt = document.createElement("option");
              opt.value = i;
              opt.textContent = i;
              yearSel.appendChild(opt);
            }
          }
        });

        // Populate modal Anniversary Years (current down to 1940)
        if (modalAnniversaryYear) {
          modalAnniversaryYear.innerHTML = '<option value="">Year</option>';
          const currentYear = new Date().getFullYear();
          for (let i = currentYear; i >= 1940; i--) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = i;
            modalAnniversaryYear.appendChild(opt);
          }
        }


        // Relationship Selector Modal Helpers & Handlers
        function closeRelationshipSelector() {
          if (relationshipSelectorModal) {
            relationshipSelectorModal.style.display = "none";
          }
          relationshipSelectorTargetId = null;
        }

        if (relationshipSelectorCloseBtn) {
          relationshipSelectorCloseBtn.addEventListener("click", closeRelationshipSelector);
        }

        function openRelationshipSelector(memberId) {
          const target = members.find(m => m.id === memberId);
          if (!target) return;
          
          relationshipSelectorTargetId = memberId;
          relationshipSelectorTitle.textContent = `Add a relative to ${target.name}`;
          
          const hasSpouse = !!target.spouseId;
          
          let hasFather = false;
          let hasMother = false;
          if (target.parentId) {
            const p1 = members.find(m => m.id === target.parentId);
            if (p1) {
              if (p1.gender === "Male") hasFather = true;
              else if (p1.gender === "Female") hasMother = true;
              if (p1.spouseId) {
                const p2 = members.find(m => m.id === p1.spouseId);
                if (p2) {
                  if (p2.gender === "Male") hasFather = true;
                  else if (p2.gender === "Female") hasMother = true;
                }
              }
            }
          }
          
          const buttons = relationshipSelectorModal.querySelectorAll(".rel-opt-btn");
          buttons.forEach(btn => {
            const rel = btn.getAttribute("data-relation");
            let disable = false;
            
            if (rel === "father") {
              disable = hasFather;
            } else if (rel === "mother") {
              disable = hasMother;
            } else if (rel === "partner") {
              disable = hasSpouse;
            } else if (rel === "brother" || rel === "sister") {
              disable = false;
            } else if (rel === "son" || rel === "daughter") {
              disable = false;
            }
            
            btn.disabled = disable;
            if (disable) {
              btn.style.opacity = "0.3";
              btn.style.pointerEvents = "none";
            } else {
              btn.style.opacity = "1";
              btn.style.pointerEvents = "auto";
            }
          });
          
          if (relationshipSelectorMultipleBtn) {
            const disableParents = hasFather && hasMother;
            relationshipSelectorMultipleBtn.disabled = disableParents;
            if (disableParents) {
              relationshipSelectorMultipleBtn.style.opacity = "0.3";
              relationshipSelectorMultipleBtn.style.pointerEvents = "none";
            } else {
              relationshipSelectorMultipleBtn.style.opacity = "1";
              relationshipSelectorMultipleBtn.style.pointerEvents = "auto";
            }
          }
          
          relationshipSelectorModal.style.display = "flex";
        }

                const relButtons = relationshipSelectorModal.querySelectorAll(".rel-opt-btn");
        relButtons.forEach(btn => {
          btn.addEventListener("click", () => {
            const rel = btn.getAttribute("data-relation");
            const targetId = relationshipSelectorTargetId;
            closeRelationshipSelector();
            if (rel === "father") {
              openModal("add-father", targetId);
            } else if (rel === "mother") {
              openModal("add-mother", targetId);
            } else if (rel === "partner") {
              openModal("add-spouse", targetId);
            } else if (rel === "brother") {
              openModal("add-brother", targetId);
            } else if (rel === "sister") {
              openModal("add-sister", targetId);
            } else if (rel === "son") {
              openModal("add-son", targetId);
            } else if (rel === "daughter") {
              openModal("add-daughter", targetId);
            }
          });
        });

        if (relationshipSelectorMultipleBtn) {
          relationshipSelectorMultipleBtn.addEventListener("click", () => {
            const targetId = relationshipSelectorTargetId;
            closeRelationshipSelector();
            openModal("add-parents", targetId);
          });
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

        // Older spouse records inherited the other spouse's parents. Spouses
        // have independent ancestry, so remove only that duplicated legacy link.
        const checkedCouples = new Set();
        members.forEach(member => {
          if (!member.parentId || !member.spouseId) return;
          const spouse = members.find(candidate => candidate.id === member.spouseId);
          if (!spouse || spouse.parentId !== member.parentId) return;

          const coupleKey = [member.id, spouse.id].sort().join("|");
          if (checkedCouples.has(coupleKey)) return;
          checkedCouples.add(coupleKey);

          let inheritedParentMember = null;
          if (member.relation === "Spouse" && spouse.relation !== "Spouse") {
            inheritedParentMember = member;
          } else if (spouse.relation === "Spouse" && member.relation !== "Spouse") {
            inheritedParentMember = spouse;
          } else {
            const memberChildren = members.filter(child => child.parentId === member.id).length;
            const spouseChildren = members.filter(child => child.parentId === spouse.id).length;
            if (memberChildren !== spouseChildren) {
              inheritedParentMember = memberChildren < spouseChildren ? member : spouse;
            }
          }

          if (inheritedParentMember) {
            inheritedParentMember.parentId = "";
            migrated = true;
          }
        });

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
          if (treeZoomControls) treeZoomControls.style.setProperty("display", "none", "important");
          renderMemberList();
        });

        previewTabBtn.addEventListener("click", () => {
          previewTabBtn.classList.add("active");
          editorTabBtn.classList.remove("active");
          if (syncTabBtn) syncTabBtn.classList.remove("active");
          
          familyEditorView.style.display = "none";
          familyPreviewView.style.display = "flex";
          if (familySyncView) familySyncView.style.display = "none";
          if (treeZoomControls) treeZoomControls.style.setProperty("display", "flex", "important");
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
            if (treeZoomControls) treeZoomControls.style.setProperty("display", "none", "important");
            
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
          treeCanvas.style.transform = "none";
          treeCanvas.style.width = "";
          treeCanvas.style.height = "";
          treeCanvas.style.marginRight = "";
          treeCanvas.style.marginBottom = "";
          treeCanvas.style.marginLeft = "";
          treeCanvas.style.marginTop = "";
          
          const wrapperWidth = treeCanvasWrapper.clientWidth;
          const wrapperHeight = treeCanvasWrapper.clientHeight;
          const canvasWidth = treeCanvas.scrollWidth || treeCanvas.offsetWidth;
          const canvasHeight = treeCanvas.scrollHeight || treeCanvas.offsetHeight;
          
          const zoomedWidth = canvasWidth * zoomLevel;
          const zoomedHeight = canvasHeight * zoomLevel;
          
          // Always use top left origin for precise centering and scroll bounding
          treeCanvas.style.transformOrigin = "top left";
          treeCanvas.style.transform = `scale(${zoomLevel})`;
          
          // Fix layout box to match visual scaled size (prevents extra scrollbar spaces)
          treeCanvas.style.width = `${canvasWidth}px`;
          treeCanvas.style.height = `${canvasHeight}px`;
          treeCanvas.style.marginRight = `-${canvasWidth * (1 - zoomLevel)}px`;
          treeCanvas.style.marginBottom = `-${canvasHeight * (1 - zoomLevel)}px`;
          
          if (zoomedWidth > wrapperWidth && wrapperWidth > 0) {
            treeCanvas.classList.add("overflowing");
            treeCanvas.style.marginLeft = "0px";
          } else {
            treeCanvas.classList.remove("overflowing");
            // Center the scaled canvas horizontally
            const leftOffset = Math.max(0, (wrapperWidth - zoomedWidth) / 2);
            treeCanvas.style.marginLeft = `${leftOffset}px`;
          }

          // Center the scaled canvas vertically
          if (zoomedHeight < wrapperHeight && wrapperHeight > 0) {
            const topOffset = Math.max(0, (wrapperHeight - zoomedHeight) / 2);
            treeCanvas.style.marginTop = `${topOffset}px`;
          } else {
            treeCanvas.style.marginTop = "0px";
          }
          
          zoomLabel.textContent = `${Math.round(zoomLevel * 100)}%`;
          requestAnimationFrame(drawContinuousTreeConnectors);
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

        window.addEventListener("resize", () => {
          if (familyPreviewView && familyPreviewView.style.display === "block") {
            fitToScreen();
          }
        });

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
          modalPhotoInput.value = "";
          modalPhotoData = "";
          
          setDropdownDate(modalBirthDay, modalBirthMonth, modalBirthYear, "");
          setDropdownDate(modalAnniversaryDay, modalAnniversaryMonth, modalAnniversaryYear, "");
          modalAnniversaryLabel.style.display = "none";
          if (modalMultipleParentsContainer) {
            modalMultipleParentsContainer.style.display = "none";
            modalFatherName.value = "";
            modalFatherBirthYear.value = "";
            modalMotherName.value = "";
            modalMotherBirthYear.value = "";
          }
          if (modalMainFields) modalMainFields.style.display = "block";

          if (modalPhone) modalPhone.value = "";
          if (modalEmail) modalEmail.value = "";

          // Reset gender radios back to enabled
          modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = false);
          
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
              modalPhotoData = member.photoData || "";
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
                modalAnniversaryLabel.style.display = "none";
              }
              
              // Always show children section during edit
              modalChildrenSection.style.display = "block";
              
              const spouseId = member.spouseId;
              const children = members.filter(m => (m.parentId === member.id || (spouseId && m.parentId === spouseId)));
              const loadedChildIds = new Set();
              
              children.forEach(child => {
                if (child.spouseId && loadedChildIds.has(child.spouseId)) {
                  return; 
                }
                loadedChildIds.add(child.id);
                addChildRow(child.name, child.gender, child.id);
              });
              
              modalDeleteBtn.style.display = "block";
            }
          } else if (actionType === "add-father") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Father to ${member ? member.name : ""}`;
            setGenderSelection("Male");
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-mother") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Mother to ${member ? member.name : ""}`;
            setGenderSelection("Female");
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-spouse") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Partner to ${member ? member.name : ''}`;
            const spouseGender = member && member.gender === "Male" ? "Female" : "Male";
            setGenderSelection(spouseGender);
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-brother") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Brother to ${member ? member.name : ""}`;
            setGenderSelection("Male");
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-sister") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Sister to ${member ? member.name : ""}`;
            setGenderSelection("Female");
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-son") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Son to ${member ? member.name : ""}`;
            setGenderSelection("Male");
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-daughter") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Daughter to ${member ? member.name : ""}`;
            setGenderSelection("Female");
            modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = true);
            
            modalSpouseContainer.style.display = "none";
            modalChildrenSection.style.display = "none";
            modalRelationsSection.style.display = "none";
            modalDeleteBtn.style.display = "none";
          } else if (actionType === "add-parents") {
            const member = members.find(m => m.id === targetId);
            modalTitle.textContent = `Add Parents to ${member ? member.name : ""}`;
            
            if (modalMainFields) modalMainFields.style.display = "none";
            if (modalMultipleParentsContainer) modalMultipleParentsContainer.style.display = "block";
            
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
          
          updateModalPhotoPreview();
          treeModal.style.display = "flex";
        }

        function closeModal() {
          treeModal.style.display = "none";
          modalForm.reset();
          // Reset gender radios back to enabled
          modalForm.querySelectorAll('input[name="modalGender"]').forEach(el => el.disabled = false);
          // Reset layouts
          if (modalMainFields) modalMainFields.style.display = "block";
          if (modalMultipleParentsContainer) modalMultipleParentsContainer.style.display = "none";
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
          const showActions = isAdmin || !loggedInMemberId || (loggedInMemberId === memberId);
          if (profileEditBtn) {
            profileEditBtn.style.display = showActions ? "block" : "none";
          }
          if (profileAddRelativeBtn) {
            profileAddRelativeBtn.style.display = showActions ? "block" : "none";
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

        if (profileAddRelativeBtn) {
          profileAddRelativeBtn.addEventListener("click", () => {
            if (activeProfileMemberId) {
              const targetId = activeProfileMemberId;
              closeProfileCard();
              openRelationshipSelector(targetId);
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
          updateModalPhotoPreview();
        }

        function getGenderAvatarDataUri(gender) {
          const isFemale = String(gender).toLowerCase() === "female";
          const background = isFemale ? "#7a174c" : "#173f7a";
          const accent = isFemale ? "#f472b6" : "#60a5fa";
          const hair = isFemale
            ? '<path d="M25 48c0-20 11-31 25-31s25 11 25 31v17H25V48Z" fill="#321522"/><circle cx="50" cy="43" r="19" fill="#f4c7a1"/><path d="M31 42c1-17 9-25 20-25 13 0 20 11 19 27-5-4-9-10-11-17-7 8-15 12-28 15Z" fill="#321522"/>'
            : '<circle cx="50" cy="44" r="19" fill="#f4c7a1"/><path d="M31 38c2-14 9-21 20-21 12 0 19 8 19 22-7-5-13-8-20-9-5 4-11 7-19 8Z" fill="#2a1b18"/>';
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${background}"/><circle cx="50" cy="50" r="45" fill="${accent}" opacity=".18"/>${hair}<path d="M18 100c2-22 14-34 32-34s30 12 32 34H18Z" fill="${accent}"/><circle cx="43" cy="46" r="2" fill="#3a221c"/><circle cx="57" cy="46" r="2" fill="#3a221c"/><path d="M43 56c4 4 10 4 14 0" fill="none" stroke="#9a4f42" stroke-width="2.5" stroke-linecap="round"/></svg>`;
          return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
        }

        function selectedModalGender() {
          return modalForm.querySelector('input[name="modalGender"]:checked')?.value || "Male";
        }

        function updateModalPhotoPreview() {
          if (!modalPhotoPreview) return;
          const hasPhoto = Boolean(modalPhotoData);
          modalPhotoPreview.src = modalPhotoData || getGenderAvatarDataUri(selectedModalGender());
          modalPhotoPreview.classList.toggle("generated-avatar", !hasPhoto);
          modalPhotoRemoveBtn.hidden = !hasPhoto;
          modalPhotoHint.textContent = hasPhoto
            ? "Selected image will be resized and saved with this member."
            : "A gender-based avatar will be used when no image is selected.";
        }

        function resizeMemberPhoto(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Unable to read this image."));
            reader.onload = () => {
              const image = new Image();
              image.onerror = () => reject(new Error("This image format could not be opened."));
              image.onload = () => {
                const maxSize = 480;
                const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
                canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
              };
              image.src = reader.result;
            };
            reader.readAsDataURL(file);
          });
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
            <button type="button" class="add-grandchild-btn" aria-label="Add a relative to ${escapeHtml(name || "this member")}" title="Add spouse or child">+</button>
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
          
          childRow.querySelector(".add-grandchild-btn").addEventListener("click", () => {
            const childName = childRow.querySelector(".child-name-input").value.trim();
            if (!childName) {
              childRow.querySelector(".child-name-input").focus();
              return;
            }

            const existingMemberIds = new Set(members.map(member => member.id));
            modalForm.requestSubmit();

            let childMemberId = rowId.startsWith("row_") ? "" : rowId;
            if (!childMemberId) {
              const newlyAddedChild = [...members].reverse().find(member =>
                !existingMemberIds.has(member.id) && member.name === childName
              );
              childMemberId = newlyAddedChild?.id || "";
            }

            if (childMemberId) {
              openRelationshipSelector(childMemberId);
            }
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

        modalPhotoInput.addEventListener("change", async () => {
          const file = modalPhotoInput.files?.[0];
          if (!file) return;
          if (!file.type.startsWith("image/")) {
            modalPhotoHint.textContent = "Please choose a JPG, PNG, or WebP image.";
            modalPhotoInput.value = "";
            return;
          }
          try {
            modalPhotoHint.textContent = "Preparing image…";
            modalPhotoData = await resizeMemberPhoto(file);
            updateModalPhotoPreview();
          } catch (error) {
            modalPhotoData = "";
            updateModalPhotoPreview();
            modalPhotoHint.textContent = error.message;
          }
        });

        modalPhotoRemoveBtn.addEventListener("click", () => {
          modalPhotoData = "";
          modalPhotoInput.value = "";
          updateModalPhotoPreview();
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

          // Auto sync to Google Sheets if configured
          const syncConfigRaw = localStorage.getItem("happyCelebrationSyncConfig");
          if (syncConfigRaw) {
            const config = JSON.parse(syncConfigRaw);
            if (config.googleSheetUrl) {
              autoSyncToGoogleSheets(config.googleSheetUrl);
            }
          }
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

            // Auto sync to Google Sheets if configured
            const syncConfigRaw = localStorage.getItem("happyCelebrationSyncConfig");
            if (syncConfigRaw) {
              const config = JSON.parse(syncConfigRaw);
              if (config.googleSheetUrl) {
                autoSyncToGoogleSheets(config.googleSheetUrl);
              }
            }
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
          const photoData = modalPhotoData;
          const memberCountBeforeSave = members.length;

          if (action !== "add-parents" && !name) return;

          const isDeceased = false;
          const birthDate = getDropdownDate(modalBirthDay, modalBirthMonth, modalBirthYear);
          const deathDate = "";
          const anniversaryDate = getDropdownDate(modalAnniversaryDay, modalAnniversaryMonth, modalAnniversaryYear);

          if (action === "add-root") {
            const rootId = "mem_" + Math.random().toString(36).substr(2, 9);
            const rootMember = {
              id: rootId,
              name,
              gender,
              relation: "Self",
              spouseId: "",
              parentId: "",
              birthDate,
              anniversaryDate,
              phone,
              email,
              photoData,
              isDeceased,
              deathDate
            };
            
            const spouseNameValue = modalSpouseName.value.trim();
            if (spouseNameValue) {
              const spouseId = "mem_" + Math.random().toString(36).substr(2, 9);
              const spouseGender = gender === "Male" ? "Female" : "Male";
              const spouseMember = {
                id: spouseId,
                name: spouseNameValue,
                gender: spouseGender,
                relation: "Spouse",
                spouseId: rootId,
                parentId: "",
                birthDate: "",
                anniversaryDate: anniversaryDate,
                phone: "",
                email: "",
                isDeceased: false,
                deathDate: ""
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
                  relation: "Child",
                  spouseId: "",
                  parentId: rootId,
                  birthDate: "",
                  anniversaryDate: "",
                  phone: "",
                  email: "",
                  isDeceased: false,
                  deathDate: ""
                };
                members.push(childMember);
              }
            });
          } else if (action === "edit") {
            const member = members.find(m => m.id === targetId);
            if (member) {
              member.name = name;
              member.gender = gender;
              
              // Save dates and deceased status
              member.birthDate = birthDate;
              member.anniversaryDate = anniversaryDate;
              member.isDeceased = isDeceased;
              member.deathDate = deathDate;
              
              member.phone = phone;
              member.email = email;
              member.photoData = photoData;
              
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
                    relation: "Spouse",
                    spouseId: member.id,
                    parentId: "",
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
              const childCards = modalChildrenList.querySelectorAll(".modal-child-row");
              const processedChildIds = new Set();
              const childRelation = (member.relation === "Grandparent" || member.relation === "Grandfather" || member.relation === "Grandmother") ? "Parent" : "Child";
              
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
                      email: "",
                      isDeceased: false,
                      deathDate: ""
                    };
                    members.push(childMember);
                  }
                  processedChildIds.add(childId);
                }
              });

              // Remove deleted children
              const spouseId = member.spouseId;
              const currentChildren = members.filter(m => (m.parentId === member.id || (spouseId && m.parentId === spouseId)));
              currentChildren.forEach(child => {
                if (!processedChildIds.has(child.id)) {
                  deleteMemberTree(child.id);
                }
              });
            }
          } else if (action === "add-father") {
            const target = members.find(m => m.id === targetId);
            if (target) {
              const fId = "mem_" + Math.random().toString(36).substr(2, 9);
              const parentRelation = target.relation === "Child" ? "Child" : "Self";
              const father = {
                id: fId,
                name,
                gender: "Male",
                relation: "Father",
                spouseId: "",
                parentId: "",
                birthDate,
                anniversaryDate,
                phone,
                email,
                isDeceased,
                deathDate
              };
              
              const oldParentId = target.parentId;
              if (oldParentId) {
                const oldParent = members.find(p => p.id === oldParentId);
                if (oldParent && oldParent.gender === "Female") {
                  father.spouseId = oldParent.id;
                  oldParent.spouseId = fId;
                }
              }
              
              target.parentId = fId;
              members.push(father);
            }
          } else if (action === "add-mother") {
            const target = members.find(m => m.id === targetId);
            if (target) {
              const mId = "mem_" + Math.random().toString(36).substr(2, 9);
              const parentRelation = target.relation === "Child" ? "Child" : "Self";
              const mother = {
                id: mId,
                name,
                gender: "Female",
                relation: "Mother",
                spouseId: "",
                parentId: "",
                birthDate,
                anniversaryDate,
                phone,
                email,
                isDeceased,
                deathDate
              };
              
              const oldParentId = target.parentId;
              if (oldParentId) {
                const oldParent = members.find(p => p.id === oldParentId);
                if (oldParent && oldParent.gender === "Male") {
                  mother.spouseId = oldParent.id;
                  oldParent.spouseId = mId;
                }
              }
              
              target.parentId = mId;
              members.push(mother);
            }
          } else if (action === "add-spouse") {
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
              const spouseId = "mem_" + Math.random().toString(36).substr(2, 9);
              const spouseMember = {
                id: spouseId,
                name,
                gender,
                relation: "Spouse",
                spouseId: targetMember.id,
                parentId: "",
                birthDate,
                anniversaryDate,
                phone,
                email,
                isDeceased,
                deathDate
              };
              targetMember.spouseId = spouseId;
              members.push(spouseMember);
            }
          } else if (action === "add-brother" || action === "add-sister") {
            const target = members.find(m => m.id === targetId);
            if (target) {
              const sibId = "mem_" + Math.random().toString(36).substr(2, 9);
              const sibling = {
                id: sibId,
                name,
                gender: action === "add-brother" ? "Male" : "Female",
                relation: action === "add-brother" ? "Brother" : "Sister",
                spouseId: "",
                parentId: target.parentId || "",
                birthDate,
                anniversaryDate,
                phone,
                email,
                isDeceased,
                deathDate
              };
              
              if (!target.parentId) {
                const pId = "mem_" + Math.random().toString(36).substr(2, 9);
                const parentRelation = target.relation === "Child" ? "Child" : "Self";
                const dummyParent = {
                  id: pId,
                  name: "Parent of " + target.name,
                  gender: "Male",
                  relation: "Father",
                  spouseId: "",
                  parentId: "",
                  birthDate: "",
                  anniversaryDate: "",
                  phone: "",
                  email: "",
                  isDeceased: false,
                  deathDate: ""
                };
                target.parentId = pId;
                sibling.parentId = pId;
                members.push(dummyParent);
              }
              
              members.push(sibling);
            }
          } else if (action === "add-son" || action === "add-daughter") {
            const target = members.find(m => m.id === targetId);
            if (target) {
              const cId = "mem_" + Math.random().toString(36).substr(2, 9);
              const childRelation = target.relation === "Self" ? "Child" : "Child";
              const child = {
                id: cId,
                name,
                gender: action === "add-son" ? "Male" : "Female",
                relation: gender === "Male" ? "Son" : "Daughter",
                spouseId: "",
                parentId: target.id,
                birthDate,
                anniversaryDate,
                phone,
                email,
                isDeceased,
                deathDate
              };
              members.push(child);
            }
          } else if (action === "add-parents") {
            const target = members.find(m => m.id === targetId);
            if (target) {
              const fName = modalFatherName.value.trim();
              const fBirthYear = modalFatherBirthYear.value.trim();
              const mName = modalMotherName.value.trim();
              const mBirthYear = modalMotherBirthYear.value.trim();
              
              let fId = "";
              let mId = "";
              const parentRelation = target.relation === "Child" ? "Child" : "Self";
              
              if (fName) {
                fId = "mem_" + Math.random().toString(36).substr(2, 9);
                const father = {
                  id: fId,
                  name: fName,
                  gender: "Male",
                  relation: "Mother",
                  spouseId: "",
                  parentId: "",
                  birthDate: fBirthYear ? "01/01/" + fBirthYear : "",
                  anniversaryDate: "",
                  phone: "",
                  email: "",
                  isDeceased: false,
                  deathDate: ""
                };
                members.push(father);
                target.parentId = fId;
              }
              
              if (mName) {
                mId = "mem_" + Math.random().toString(36).substr(2, 9);
                const mother = {
                  id: mId,
                  name: mName,
                  gender: "Female",
                  relation: parentRelation,
                  spouseId: "",
                  parentId: "",
                  birthDate: mBirthYear ? "01/01/" + mBirthYear : "",
                  anniversaryDate: "",
                  phone: "",
                  email: "",
                  isDeceased: false,
                  deathDate: ""
                };
                members.push(mother);
                if (!fName) {
                  target.parentId = mId;
                }
              }
              
              if (fName && mName) {
                const father = members.find(m => m.id === fId);
                const mother = members.find(m => m.id === mId);
                if (father && mother) {
                  father.spouseId = mId;
                  mother.spouseId = fId;
                }
              }
            }
          } else if (action === "add-child") {
            const targetMember = members.find(m => m.id === targetId);
            if (targetMember) {
              const childId = "mem_" + Math.random().toString(36).substr(2, 9);
              const childRelation = targetMember.relation === "Self" ? "Child" : "Child";
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
                email,
                isDeceased: false,
                deathDate: ""
              };
              members.push(childMember);
            }
          }

          if (action !== "edit" && photoData) {
            const newlyAddedMembers = members.slice(memberCountBeforeSave);
            const photographedMember = [...newlyAddedMembers].reverse().find(member => member.name === name);
            if (photographedMember) {
              photographedMember.photoData = photoData;
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
                email: m.email || "",
                isDeceased: m.isDeceased ? "Yes" : "No",
                deathDate: m.deathDate || ""
              };
            });
            
            fetch(googleSheetUrl, {
              method: "POST",
              headers: {
                "Content-Type": "text/plain"
              },
              body: JSON.stringify(payload)
            })
            .then(res => {
              if (!res.ok) throw new Error("HTTP error " + res.status);
              return res.json();
            })
            .then(data => {
              if (data.status === "success") {
                if (syncStatusMessage) {
                  syncStatusMessage.style.color = "#a3e635"; // green
                  syncStatusMessage.textContent = data.message || "Data sent to Google Sheets! Check your sheet.";
                }
              } else {
                throw new Error(data.message || "Sync failed.");
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
      var headers = ["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID", "Is Deceased", "Death Date"];
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
          m.email || "",
          m.isDeceased || "No",
          m.deathDate || ""
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Successfully synced " + postContent.length + " members."}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID", "Is Deceased", "Death Date"]);
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
        postContent.email || "",
        postContent.isDeceased || "No",
        postContent.deathDate || ""
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
        if (key === "spouseid" || key === "spouse" || key === "spousename") key = "spouseId";
        if (key === "parentid" || key === "parent" || key === "parentname") key = "parentId";
        if (key === "birthdate" || key === "dob") key = "birthDate";
        if (key === "anniversarydate") key = "anniversaryDate";
        if (key === "phonenumber" || key === "phone") key = "phone";
        if (key === "emailid" || key === "email") key = "email";
        if (key === "isdeceased" || key === "deceased") {
          member["isDeceased"] = String(row[index] || "").toLowerCase() === "yes" || String(row[index] || "").toLowerCase() === "true";
          return;
        }
        if (key === "deathdate") key = "deathDate";
        
        member[key] = String(row[index] || "");
      });
      
      data.push(member);
    }
    
    data.forEach(function(m) {
      if (m.spouseId && !m.spouseId.startsWith("mem_")) {
        var trimmedSpouse = m.spouseId.trim().toLowerCase();
        var foundSpouse = data.find(function(s) { 
          return s.name && s.name.trim().toLowerCase() === trimmedSpouse; 
        });
        m.spouseId = foundSpouse ? foundSpouse.id : "";
      }
      if (m.parentId && !m.parentId.startsWith("mem_")) {
        var trimmedParent = m.parentId.trim().toLowerCase();
        var foundParent = data.find(function(p) { 
          return p.name && p.name.trim().toLowerCase() === trimmedParent; 
        });
        m.parentId = foundParent ? foundParent.id : "";
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
          if (!url || !members) return;
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
              email: m.email || "",
              isDeceased: m.isDeceased ? "Yes" : "No",
              deathDate: m.deathDate || ""
            };
          });
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
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
          const addBtn = e.target.closest(".add-relative-btn");
          if (addBtn) {
            e.stopPropagation();
            const memberId = addBtn.dataset.id;
            openRelationshipSelector(memberId);
            return;
          }
          
          const card = e.target.closest(".family-member-card");
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
                <button type="button" class="primary-action" id="addFirstMemberBtn">Add First Member</button>
              </div>
            `;
            const btn = membersListList.querySelector("#addFirstMemberBtn");
            if (btn) {
              btn.addEventListener("click", () => {
                openModal("add-root");
              });
            }
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
            } else if (!loggedInMemberId || loggedInMemberId === m.id) {
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
          
          const order = { 
            "Grandparent": 1, "Grandfather": 1, "Grandmother": 1,
            "Father": 2, "Mother": 2, "Parent": 2, "Spouse": 2, "Partner": 2,
            "Self": 3, "Me": 3, "Primary": 3, "Brother": 3, "Sister": 3,
            "Son": 4, "Daughter": 4, "Child": 4
          };
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

        function getMemberStatusText(m) {
          let birthYear = "";
          if (m.birthDate) {
            const parts = m.birthDate.split("/");
            if (parts.length === 3) birthYear = parts[2];
          }
          
          if (m.isDeceased) {
            let deathYear = "";
            if (m.deathDate) {
              const parts = m.deathDate.split("/");
              if (parts.length === 3) deathYear = parts[2];
            }
            if (birthYear) {
              return `${birthYear} - ${deathYear || "Deceased"}`;
            } else {
              return deathYear ? `Deceased (d. ${deathYear})` : "Deceased";
            }
          } else {
            return birthYear ? `${birthYear} - Present` : "";
          }
        }

        function renderCardHTML(m, isCoupleMember = false, generation = 0) {
          const genderClass = m.gender.toLowerCase();
          const generationClass = `generation-${Math.min(generation, 2)}`;
          
          // Connectors rely on .rel-grandparent to hide top drop-lines. Root cards get .rel-grandparent.
          const isRoot = !m.parentId;
          const relationClass = isRoot ? "rel-grandparent" : ("rel-" + m.relation.toLowerCase());
          
          const loggedInMemberId = localStorage.getItem("happyCelebrationLoggedInMemberId") || "";
          const showAddBtn = isAdmin || !loggedInMemberId || (loggedInMemberId === m.id);
          const addBtnHTML = showAddBtn ? `<button type="button" class="add-relative-btn" data-id="${m.id}" title="Add relative">+</button>` : "";
          
          const statusText = getMemberStatusText(m);
          const statusHTML = statusText ? `<span class="node-status">${escapeHtml(statusText)}</span>` : "";
          const avatarSource = m.photoData || getGenderAvatarDataUri(m.gender);

          const cardClasses = isCoupleMember 
            ? `family-member-card ${genderClass} ${relationClass} ${generationClass}`
            : `tree-node-card circular family-member-card ${genderClass} ${relationClass} ${generationClass}`;

          return `
            <div class="${cardClasses}" data-id="${m.id}">
              <div class="node-avatar">
                <img class="node-avatar-image" src="${escapeHtml(avatarSource)}" alt="">
              </div>
              <div class="node-details">
                <span class="node-name" title="${escapeHtml(m.name)}">${escapeHtml(m.name)}</span>
                ${statusHTML}
              </div>
              ${addBtnHTML}
            </div>
          `;
        }

        function renderCoupleCardHTML(node, generation = 0) {
          let memberLeft, memberRight;
          const isRoot = !node.member1.parentId && !node.member2.parentId;

          if (isRoot) {
            memberLeft = node.member1;
            memberRight = node.member2;
          } else {
            if (node.member1.parentId) {
              memberLeft = node.member1;
              memberRight = node.member2;
            } else {
              memberLeft = node.member2;
              memberRight = node.member1;
            }
          }

          const descendantClass = isRoot ? "" : (node.member1.parentId ? "descendant-left" : "descendant-right");
          const relationClass = isRoot ? "rel-grandparent" : ("rel-" + node.member1.relation.toLowerCase());
          
          return `
            <div class="tree-node-card circular couple ${relationClass} ${descendantClass}" data-id="${node.member1.id}">
              ${renderCardHTML(memberLeft, true, generation)}
              <div class="spouse-connector-line"></div>
              ${renderCardHTML(memberRight, true, generation)}
            </div>
          `;
        }

        function renderNodeHTML(node, generation = 0) {
          const hasChildren = node.children && node.children.length > 0;
          let headerHTML = "";
          let branchClass = "";
          
          if (node.type === "couple") {
            headerHTML = renderCoupleCardHTML(node, generation);
            const isRoot = !node.member1.parentId && !node.member2.parentId;
            if (!isRoot) {
              if (node.member1.parentId) {
                branchClass = "child-left";
              } else {
                branchClass = "child-right";
              }
            }
          } else {
            headerHTML = renderCardHTML(node.member, false, generation);
          }
          
          return `
            <div class="tree-branch ${hasChildren ? "has-children" : ""} ${branchClass}">
              ${headerHTML}
              ${hasChildren ? `
                <div class="tree-children-container">
                  ${node.children.map(child => renderNodeHTML(child, generation + 1)).join("")}
                </div>
              ` : ""}
            </div>
          `;
        }

        function drawContinuousTreeConnectors() {
          treeCanvas.querySelector(".family-connector-overlay")?.remove();
          const rootBranches = Array.from(treeCanvas.children).filter((element) =>
            element.classList.contains("tree-branch")
          );
          if (!rootBranches.length) return;

          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.classList.add("family-connector-overlay");
          svg.setAttribute("aria-hidden", "true");
          svg.setAttribute("width", String(treeCanvas.scrollWidth));
          svg.setAttribute("height", String(treeCanvas.scrollHeight));
          svg.setAttribute("viewBox", `0 0 ${treeCanvas.scrollWidth} ${treeCanvas.scrollHeight}`);

          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          const arrowMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
          arrowMarker.setAttribute("id", "direct-child-arrow");
          arrowMarker.setAttribute("viewBox", "0 0 10 10");
          arrowMarker.setAttribute("refX", "8");
          arrowMarker.setAttribute("refY", "5");
          arrowMarker.setAttribute("markerWidth", "9");
          arrowMarker.setAttribute("markerHeight", "9");
          arrowMarker.setAttribute("orient", "auto");
          arrowMarker.setAttribute("markerUnits", "userSpaceOnUse");
          const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          arrowPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
          arrowPath.setAttribute("fill", "#ffd05f");
          arrowMarker.appendChild(arrowPath);
          defs.appendChild(arrowMarker);
          svg.appendChild(defs);

          const canvasRect = treeCanvas.getBoundingClientRect();
          const scale = zoomLevel || 1;
          const box = (element) => {
            const rect = element.getBoundingClientRect();
            return {
              left: (rect.left - canvasRect.left) / scale,
              right: (rect.right - canvasRect.left) / scale,
              top: (rect.top - canvasRect.top) / scale,
              bottom: (rect.bottom - canvasRect.top) / scale,
              centerX: (rect.left + rect.width / 2 - canvasRect.left) / scale
            };
          };

          const addLine = (x1, y1, x2, y2, type = "family") => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1.toFixed(1));
            line.setAttribute("y1", y1.toFixed(1));
            line.setAttribute("x2", x2.toFixed(1));
            line.setAttribute("y2", y2.toFixed(1));
            line.classList.add(`connector-${type}`);
            if (type === "direct-child") {
              line.setAttribute("marker-end", "url(#direct-child-arrow)");
            }
            svg.appendChild(line);
          };

          const directHeader = (branch) =>
            Array.from(branch.children).find((element) =>
              element.classList.contains("tree-node-card")
            );

          const drawBranch = (branch) => {
            const header = directHeader(branch);
            if (!header) return;
            let coupleAnchor = null;

            if (header.classList.contains("couple")) {
              const partners = Array.from(header.children).filter((element) =>
                element.classList.contains("family-member-card")
              );
              if (partners.length === 2) {
                const leftPartner = box(partners[0]);
                const rightPartner = box(partners[1]);
                const partnerY = (leftPartner.top + leftPartner.bottom) / 2;
                addLine(leftPartner.right, partnerY, rightPartner.left, partnerY, "spouse");
                coupleAnchor = {
                  x: (leftPartner.right + rightPartner.left) / 2,
                  y: partnerY
                };
              }
            }

            const childrenContainer = Array.from(branch.children).find((element) =>
              element.classList.contains("tree-children-container")
            );
            if (!childrenContainer) return;

            const childBranches = Array.from(childrenContainer.children).filter((element) =>
              element.classList.contains("tree-branch")
            );
            const childHeaders = childBranches.map(directHeader).filter(Boolean);
            if (!childHeaders.length) return;

            const parentBox = box(header);
            const childTargets = childHeaders.map((childHeader) => {
              if (!childHeader.classList.contains("couple")) return childHeader;
              const partnerCards = Array.from(childHeader.children).filter((element) =>
                element.classList.contains("family-member-card")
              );
              return partnerCards.find((card) => {
                const childMember = members.find((member) => member.id === card.dataset.id);
                return Boolean(childMember?.parentId);
              }) || partnerCards[0] || childHeader;
            });
            const childBoxes = childTargets.map(box);
            const childTop = Math.min(...childBoxes.map((childBox) => childBox.top));
            const parentX = coupleAnchor?.x ?? parentBox.centerX;
            const parentY = coupleAnchor?.y ?? parentBox.bottom;
            const jointY = parentBox.bottom + Math.max(18, (childTop - parentBox.bottom) / 2);
            const leftX = Math.min(...childBoxes.map((childBox) => childBox.centerX));
            const rightX = Math.max(...childBoxes.map((childBox) => childBox.centerX));

            addLine(parentX, parentY, parentX, jointY);
            addLine(leftX, jointY, rightX, jointY);
            childBoxes.forEach((childBox) => {
              addLine(
                childBox.centerX,
                jointY,
                childBox.centerX,
                childBox.top,
                "direct-child"
              );
            });

            childBranches.forEach(drawBranch);
          };

          rootBranches.forEach(drawBranch);
          treeCanvas.prepend(svg);
        }

        function renderTree() {
          if (!members.length) {
            treeCanvas.innerHTML = `
              <div class="empty-tree-container">
                <p class="empty-tree-message">No family tree to preview yet.</p>
                <p class="empty-tree-subtitle" style="font-size: 13px; color: var(--gold-300); opacity: 0.8; margin-top: 8px;">Please go to the Members tab to add your first member.</p>
              </div>
            `;
            return;
          }
          const roots = buildTree(members);
          treeCanvas.innerHTML = roots.map(rootNode => renderNodeHTML(rootNode)).join("");
          requestAnimationFrame(drawContinuousTreeConnectors);
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
                  { id: "grandparent", name: "Grandparent", gender: "Male", relation: "Grandparent", spouseId: "", birthDate: "05/12/1950", anniversaryDate: "", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "aleena", name: "Aleena", gender: "Female", relation: "Parent", parentId: "grandparent", spouseId: "", birthDate: "09/18/1982", anniversaryDate: "", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "alisha", name: "Alisha", gender: "Female", relation: "Parent", parentId: "grandparent", spouseId: "rafi", birthDate: "10/12/1986", anniversaryDate: "06/23/2014", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "rafi", name: "Rafi", gender: "Male", relation: "Parent", parentId: "", spouseId: "alisha", birthDate: "04/05/1984", anniversaryDate: "06/23/2014", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "amjad", name: "Amjad", gender: "Male", relation: "Parent", parentId: "grandparent", spouseId: "subeena", birthDate: "08/14/1985", anniversaryDate: "03/12/2012", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "subeena", name: "Subeena", gender: "Female", relation: "Parent", parentId: "", spouseId: "amjad", birthDate: "11/20/1988", anniversaryDate: "03/12/2012", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "adab", name: "Adab", gender: "Female", relation: "Child", parentId: "alisha", spouseId: "", birthDate: "06/15/2018", anniversaryDate: "", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "ali", name: "Ali", gender: "Male", relation: "Child", parentId: "alisha", spouseId: "", birthDate: "11/02/2020", anniversaryDate: "", phone: "", email: "", isDeceased: false, deathDate: "" },
                  { id: "eva", name: "Eva", gender: "Female", relation: "Child", parentId: "amjad", spouseId: "", birthDate: "06/09/2016", anniversaryDate: "", phone: "", email: "", isDeceased: false, deathDate: "" }
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
  packages: {
    title: "Celebration Packages",
    kicker: "Curated Tiers",
    template: "packagesTemplate",
    setup(root) {
      root.querySelectorAll(".book-pkg-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const pkgName = btn.dataset.package;
          openPanel("book");
          
          setTimeout(() => {
            const form = document.querySelector("#bookingForm");
            if (form) {
              const eventTypeSelect = form.querySelector("#bookingEventType");
              if (eventTypeSelect) {
                eventTypeSelect.value = "Birthday";
                eventTypeSelect.dispatchEvent(new Event("change"));
              }
              const guestsInput = form.querySelector("#bookingGuests");
              if (guestsInput) {
                if (pkgName === "Silver") guestsInput.value = 5;
                else if (pkgName === "Gold") guestsInput.value = 10;
                else if (pkgName === "Diamond") guestsInput.value = 15;
                guestsInput.dispatchEvent(new Event("input"));
              }
              let pkgNotice = form.querySelector(".package-booking-notice");
              if (!pkgNotice) {
                pkgNotice = document.createElement("div");
                pkgNotice.className = "package-booking-notice";
                pkgNotice.style.cssText = "background: rgba(245, 199, 110, 0.15); border: 1px dashed var(--gold-300); color: #fff; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 10px; text-align: center;";
                form.prepend(pkgNotice);
              }
              pkgNotice.textContent = `⚡ Booking with ${pkgName} Package pre-selected!`;
            }
          }, 80);
        });
      });
    }
  },
  upcoming: {
    title: "Upcoming Events",
    kicker: "Anniversaries & Birthdays",
    template: "upcomingTemplate",
    setup(root) {
      const container = root.querySelector("#upcomingEventsContainer");
      if (!container) return;

      let members = [];
      try {
        const raw = localStorage.getItem("happyCelebrationFamily");
        members = raw ? JSON.parse(raw) : [];
      } catch (e) {}

      if (!Array.isArray(members) || members.length === 0) {
        return;
      }

      const mockToday = new Date(2026, 5, 6);
      const list = [];

      members.forEach(m => {
        if (m.birthDate) {
          const parts = m.birthDate.split("/");
          if (parts.length === 3) {
            const bMon = parseInt(parts[0], 10) - 1;
            const bDay = parseInt(parts[1], 10);
            list.push({
              name: m.name,
              eventTitle: `${m.name}'s Birthday`,
              type: "Birthday",
              month: bMon,
              day: bDay,
              originalDate: m.birthDate
            });
          }
        }
        if (m.anniversaryDate && m.spouseId) {
          const spouse = members.find(s => s.id === m.spouseId);
          if (spouse && m.id < spouse.id) {
            const parts = m.anniversaryDate.split("/");
            if (parts.length === 3) {
              const aMon = parseInt(parts[0], 10) - 1;
              const aDay = parseInt(parts[1], 10);
              list.push({
                name: `${m.name} & ${spouse.name}`,
                eventTitle: `${m.name} & ${spouse.name}'s Anniversary`,
                type: "Anniversary",
                month: aMon,
                day: aDay,
                originalDate: m.anniversaryDate
              });
            }
          }
        }
      });

      const eventsWithDays = list.map(ev => {
        let evDate = new Date(2026, ev.month, ev.day);
        if (evDate < mockToday) {
          evDate = new Date(2027, ev.month, ev.day);
        }
        const diffTime = evDate - mockToday;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...ev, daysLeft: diffDays, targetYear: evDate.getFullYear() };
      });

      eventsWithDays.sort((a, b) => a.daysLeft - b.daysLeft);

      if (eventsWithDays.length > 0) {
        container.innerHTML = "";
        
        eventsWithDays.forEach(ev => {
          const card = document.createElement("div");
          card.className = "upcoming-event-card";
          
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const formattedDate = `${monthNames[ev.month]} ${ev.day}, ${ev.targetYear}`;

          card.innerHTML = `
            <div class="event-details">
              <span class="event-name">${ev.eventTitle}</span>
              <span class="event-date">📅 ${formattedDate} (${ev.type})</span>
            </div>
            <button class="event-countdown-badge" type="button">
              <span>⚡ ${ev.daysLeft}d left</span>
            </button>
          `;

          card.querySelector(".event-countdown-badge").addEventListener("click", () => {
            openPanel("book");
            setTimeout(() => {
              const form = document.querySelector("#bookingForm");
              if (form) {
                const nameInput = form.querySelector("input[name='name']");
                if (nameInput) nameInput.value = ev.name;
                const typeSelect = form.querySelector("#bookingEventType");
                if (typeSelect) {
                  typeSelect.value = ev.type === "Anniversary" ? "Anniversary" : "Birthday";
                  typeSelect.dispatchEvent(new Event("change"));
                }
              }
            }, 80);
          });

          container.appendChild(card);
        });
      }
    }
  },
  themePlan: {
    title: "Theme Plan",
    kicker: "Planner",
    template: "themePlanTemplate",
    setup(root) {
      const mockMonth = root.querySelector("#mockMonth");
      const mockDay = root.querySelector("#mockDay");
      const resetAutoThemeBtn = root.querySelector("#resetAutoThemeBtn");

      if (resetAutoThemeBtn) {
        resetAutoThemeBtn.addEventListener("click", () => {
          window.currentThemeStyleIndex = -1;
          updateActiveTheme();
          updateAirtelThemePlanningCards();
        });
      }

      if (mockMonth && mockDay) {
        mockMonth.addEventListener("change", () => {
          updateActiveTheme();
          updateAirtelThemePlanningCards();
        });
        mockDay.addEventListener("change", () => {
          updateActiveTheme();
          updateAirtelThemePlanningCards();
        });
      }

      renderStaticThemesList();
      updateActiveTheme();
      updateAirtelThemePlanningCards();
    }
  },
  locate: {
    title: "Locate Us",
    kicker: "Find Our Office",
    template: "locateTemplate",
  },
  surprises: {
    title: "Surprise Celebrations",
    kicker: "Unique Packages",
    template: "surprisesTemplate",
    setup(root) {
      root.querySelectorAll(".book-surprise-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const surpriseType = btn.dataset.surprise;
          openPanel("book");
          setTimeout(() => {
            const form = document.querySelector("#bookingForm");
            if (form) {
              const note = form.querySelector("#bookingNote");
              if (note) {
                note.value = `Surprise package requested: ${surpriseType}`;
              }
              const typeSelect = form.querySelector("#bookingEventType");
              if (typeSelect) {
                typeSelect.value = "Theme Party";
                typeSelect.dispatchEvent(new Event("change"));
              }
            }
          }, 80);
        });
      });
    }
  },
  smallFunctions: {
    title: "Small Function Options",
    kicker: "Intimate Gatherings",
    template: "smallFunctionsTemplate",
    setup(root) {
      root.querySelectorAll(".book-function-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const functionType = btn.dataset.function;
          openPanel("book");
          setTimeout(() => {
            const form = document.querySelector("#bookingForm");
            if (form) {
              const note = form.querySelector("#bookingNote");
              if (note) {
                note.value = `Intimate gathering package: ${functionType}`;
              }
              const typeSelect = form.querySelector("#bookingEventType");
              if (typeSelect) {
                typeSelect.value = "Birthday";
                typeSelect.dispatchEvent(new Event("change"));
              }
            }
          }, 80);
        });
      });
    }
  },
  venues: {
    title: "Partner Venues",
    kicker: "Event Spaces",
    template: "venuesTemplate",
    setup(root) {
      root.querySelectorAll(".book-venue-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const venueName = btn.dataset.venue;
          openPanel("book");
          setTimeout(() => {
            const form = document.querySelector("#bookingForm");
            if (form) {
              const note = form.querySelector("#bookingNote");
              if (note) {
                note.value = `Enquiring for partner venue: ${venueName}`;
              }
            }
          }, 80);
        });
      });
    }
  },
  career: {
    title: "Career Opportunities",
    kicker: "Join Our Team",
    template: "careerTemplate",
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
  homeView.style.display = "none";
  document.body.classList.add("panel-open"); // Add panel-open class to body
  if (name === "family") {
    document.body.classList.add("family-panel-open");
  } else {
    document.body.classList.remove("family-panel-open");
  }
  panelView.classList.add("active");
  
  if (typeof updateBottomNavActive === "function") {
    updateBottomNavActive(name);
  }
}

function closePanel() {
  panelView.classList.remove("active");
  document.body.classList.remove("panel-open"); // Remove panel-open class from body
  document.body.classList.remove("fullscreen-mode"); // Remove fullscreen-mode class
  document.body.classList.remove("family-panel-open"); // Remove family-panel-open class
  
  // Clean up URL parameters so user returns to home view without fullscreen parameters
  if (window.history.pushState) {
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: newurl }, "", newurl);
  }

  homeView.classList.add("active");
  homeView.style.display = "block"; // Reset to default layout block safely

  // Show floating celebration container again when returning to home view
  const container = document.getElementById("floatingCelebrationContainer");
  if (container) {
    container.style.display = "block";
  }
  
  if (typeof updateBottomNavActive === "function") {
    updateBottomNavActive("home");
  }
}

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", (e) => {
    const panel = button.dataset.panel;
    if (panel === "family") {
      // Let the native <a> link navigation handle it
      return;
    }
    openPanel(panel);
  });
  
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
  const revealTargets = document.querySelectorAll('.home-section, .occasion-card, .service-card, .package-card, .photo-grid figure, .contact-list a');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.style.transitionDelay = `${Math.min(index * 50, 220)}ms`;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((target, index) => {
    target.classList.add('reveal');
    target.style.transitionDelay = `${Math.min(index * 40, 180)}ms`;
    revealObserver.observe(target);
  });

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

  const userProfileBtn = document.getElementById("userProfileBtn") || document.getElementById("avatarBtn");
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", () => {
      openPanel("register");
    });
  }
});

// ==========================================================================
// DYNAMIC CELEBRATION THEMES PLANNER ENGINE
// ==========================================================================

const ALL_THEME_STYLES = [
  {
    id: "boy-superhero",
    category: "Baby Boy Birthday theme",
    name: "Superhero Theme 🦸‍♂️",
    balloons: ["#ef4444", "#3b82f6", "#eab308"],
    balloonText: "Red, blue, yellow balloons.",
    desc: "Superhero. Bold Red, Blue, and Yellow balloons.",
    decor: "Superhero skyline backdrops, action bubble signs, and comic-style table spreads.",
    lighting: "Bright cool white spotlights with vibrant red/blue uplighting.",
    themeClass: "theme-wine",
    icon: "🎂"
  },
  {
    id: "boy-safari",
    category: "Baby Boy Birthday theme",
    name: "Safari Theme 🦁",
    balloons: ["#22c55e", "#78350f", "#f97316"],
    balloonText: "Green, brown, orange balloons.",
    desc: "Safari. Natural Green, Brown, and Orange balloons.",
    decor: "Jungle foliage vines, inflatable wild animal figures, and wooden rustic signs.",
    lighting: "Soft warm amber wash with green accent uplights.",
    themeClass: "theme-emerald",
    icon: "🎂"
  },
  {
    id: "boy-cars",
    category: "Baby Boy Birthday theme",
    name: "Cars & Trucks Theme 🏎️",
    balloons: ["#09090b", "#ef4444", "#cbd5e1"],
    balloonText: "Black, red, silver balloons.",
    desc: "Cars/Trucks. Sleek Black, Red, and Silver balloons.",
    decor: "Checkered racing flags, miniature traffic cones, and racetrack floor runners.",
    lighting: "Cool white floodlights with high-contrast red neon accents.",
    themeClass: "theme-luxury",
    icon: "🎂"
  },
  {
    id: "girl-princess",
    category: "Baby Girl Birthday theme",
    name: "Princess Theme 👑",
    balloons: ["#f472b6", "#eab308", "#ffffff"],
    balloonText: "Pink, gold, white balloons.",
    desc: "Princess. Royal Pink, Gold, and White balloons.",
    decor: "Sparkling tiaras, satin table skirts, and a grand castle photo gate.",
    lighting: "Soft pink wash with warm golden fairy light backdrop.",
    themeClass: "theme-birthday-female",
    icon: "🎀"
  },
  {
    id: "girl-superhero",
    category: "Baby Girl Birthday theme",
    name: "Superhero Theme 🦸‍♀️",
    balloons: ["#f472b6", "#c084fc", "#eab308"],
    balloonText: "Pink, purple, yellow balloons.",
    desc: "Superhero (Girl Style). Magical Pink, Purple, and Yellow superhero balloons.",
    decor: "Pink skyline backdrops, star shield cutouts, and glittery action signs.",
    lighting: "Soft pink and violet spotlights with gold star accents.",
    themeClass: "theme-birthday-female",
    icon: "🎀"
  },
  {
    id: "girl-fairy",
    category: "Baby Girl Birthday theme",
    name: "Fairy Garden Theme 🧚‍♀️",
    balloons: ["#fbcfe8", "#c084fc", "#86efac"],
    balloonText: "Pastel pink, lavender, mint green balloons.",
    desc: "Fairy Garden. Whimsical Pastel Pink, Lavender, and Mint Green balloons.",
    decor: "Enchanted flower vines, glowing mushroom props, and fairy wing chair covers.",
    lighting: "Ethereal lavender glow with twinkling firefly lights.",
    themeClass: "theme-violet",
    icon: "🎀"
  },
  {
    id: "girl-unicorn",
    category: "Baby Girl Birthday theme",
    name: "Unicorn Theme 🦄",
    balloons: ["#fbcfe8", "#c084fc", "#93c5fd", "#fef08a"],
    balloonText: "Rainbow mix with pastel shades.",
    desc: "Unicorn. Magical Rainbow Pastel balloons.",
    decor: "Golden unicorn horn centerpieces, fluffy cloud setups, and pastel rainbow backdrops.",
    lighting: "Dreamy pastel color-cycle washes with glittering star-projectors.",
    themeClass: "theme-birthday-female",
    icon: "🎀"
  },
  {
    id: "adult-birthday-boy",
    category: "Adult Boy/Girl Birthday theme",
    name: "Adult Boy Birthday 🍺",
    balloons: ["#d97706", "#f59e0b", "#ffffff"],
    balloonText: "Amber, gold, and white balloons.",
    desc: "Adult Boy Birthday. Cheers & Beers style with Gold, Amber, and White balloons.",
    decor: "Beer mug centerpieces, vintage chalkboard signs, dartboard targets, and lounge seating.",
    lighting: "Cozy pub-style warm low lighting with amber neon glows.",
    themeClass: "theme-anniversary-young",
    icon: "🎉"
  },
  {
    id: "adult-birthday-girl",
    category: "Adult Boy/Girl Birthday theme",
    name: "Adult Girl Birthday 💄",
    balloons: ["#fda4af", "#fef08a", "#ffffff"],
    balloonText: "Rose gold, champagne, and white balloons.",
    desc: "Adult Girl Birthday. Glamour spa & picnic vibes with Rose Gold and Champagne colors.",
    decor: "Floral rings, boho picnic carpets, low wooden tables, cosmetic props, and macaron towers.",
    lighting: "Warm fairy lighting with dreamy pink/violet uplighting.",
    themeClass: "theme-birthday-female",
    icon: "🎉"
  },
  {
    id: "old-age-birthday",
    category: "Old age Birthday theme",
    name: "Elegant Elder Birthday 🧓",
    balloons: ["#cbd5e1", "#c084fc", "#ffffff"],
    balloonText: "Silver, lavender, and white balloons.",
    desc: "Elder Birthday. Respectful and elegant classic birthday setting.",
    decor: "Memory lanes with printed pictures, traditional floral arches, and comfortable cushions.",
    lighting: "Soft warm white ambient light with twinkling background bulbs.",
    themeClass: "theme-violet",
    icon: "🎂"
  },
  {
    id: "newly-romantic",
    category: "Newly married marriage anniversary",
    name: "Romantic Elegance 🌹",
    balloons: ["#dc2626", "#ffffff", "#fda4af"],
    balloonText: "Red, white, rose-gold balloons.",
    desc: "Romantic Elegance. Passionate Red, White, and Rose-Gold balloons.",
    decor: "Fresh red rose petals, glass candle holders, and love letter backdrops.",
    lighting: "Intimate dim warm white candle-glow with soft rose uplighting.",
    themeClass: "theme-wine",
    icon: "💍"
  },
  {
    id: "newly-travel",
    category: "Newly married marriage anniversary",
    name: "Travel Adventure ✈️",
    balloons: ["#3b82f6", "#14b8a6", "#fef08a"],
    balloonText: "Blue, teal, sandy beige balloons.",
    desc: "Travel Adventure. Scenic Blue, Teal, and Sandy Beige balloons.",
    decor: "Vintage suitcases, globe centerpieces, and wanderlust map backdrops.",
    lighting: "Bright daylight white with cool teal ambient washes.",
    themeClass: "theme-sapphire",
    icon: "💍"
  },
  {
    id: "newly-glam",
    category: "Newly married marriage anniversary",
    name: "Modern Glam ✨",
    balloons: ["#cbd5e1", "#eab308", "#09090b"],
    balloonText: "Silver, gold, black balloons.",
    desc: "Modern Glam. Sophisticated Silver, Gold, and Black balloons.",
    decor: "Metallic sequined walls, geometric metal frames, and champagne towers.",
    lighting: "High-contrast white pinspots and golden sparkle projections.",
    themeClass: "theme-luxury",
    icon: "💍"
  },
  {
    id: "older-jubilee",
    category: "Old age marriage anniversary",
    name: "Golden Jubilee 🏆",
    balloons: ["#eab308", "#fffbeb", "#fef9c3"],
    balloonText: "Gold, ivory, champagne balloons.",
    desc: "Golden Jubilee. Majestic Gold, Ivory, and Champagne balloons.",
    decor: "Golden frame photo gallery, velvet drapery, and vintage anniversary banners.",
    lighting: "Warm amber candle-style chandeliers and golden uplights.",
    themeClass: "theme-luxury",
    icon: "💖"
  },
  {
    id: "older-memory",
    category: "Old age marriage anniversary",
    name: "Memory Lane 📸",
    balloons: ["#ffffff", "#78350f", "#fef08a"],
    balloonText: "White, sepia-toned brown, soft pastel balloons.",
    desc: "Memory Lane. Retro White, Sepia Brown, and Soft Pastel balloons.",
    decor: "Overhead hanging polaroid cards, retro record players, and lace table overlays.",
    lighting: "Dim nostalgic incandescent edison bulb strings.",
    themeClass: "theme-wine",
    icon: "💖"
  },
  {
    id: "older-classic",
    category: "Old age marriage anniversary",
    name: "Classic Elegance 🖤",
    balloons: ["#09090b", "#ffffff", "#cbd5e1"],
    balloonText: "Black, white, silver balloons.",
    desc: "Classic Elegance. Formal Black, White, and Silver balloons.",
    decor: "Monochromatic floral setups, crystal candelabras, and silver sequin runners.",
    lighting: "Crisp cool white wash with subtle silver shimmers.",
    themeClass: "theme-luxury",
    icon: "💖"
  },
  {
    id: "festival-christmas-style",
    category: "Christmas eve",
    name: "Christmas Theme 🎄",
    balloons: ["#ef4444", "#22c55e", "#ffffff"],
    balloonText: "Red, green, white balloons.",
    desc: "Christmas. Holiday cheer with Red, Green, and White balloons.",
    decor: "Pine wreaths, holly leaves, hanging socks, and mistletoe.",
    lighting: "Red and green accent spots with warm white fairy lights on tree branch clusters.",
    themeClass: "theme-festival-christmas",
    icon: "🎄"
  },
  {
    id: "festival-holi-style",
    category: "Holi party",
    name: "Holi Theme 🎨",
    balloons: ["#ec4899", "#3b82f6", "#eab308", "#22c55e"],
    balloonText: "Multicolor balloons (bright mix).",
    desc: "Holi. Organic Holi Splash featuring vibrant Multicolor balloons.",
    decor: "Organic herbal colors (gulal), water guns (pichkaris), and rustic organic drapes.",
    lighting: "Bright daylight white floodlights and multi-color laser projections.",
    themeClass: "theme-festival-holi",
    icon: "🎨"
  },
  {
    id: "festival-eid-style",
    category: "Eid Mubarak",
    name: "Eid Theme 🌙",
    balloons: ["#22c55e", "#eab308", "#cbd5e1"],
    balloonText: "Green, gold, silver balloons.",
    desc: "Eid. Blessed Eid vibes with Green, Gold, and Silver balloons.",
    decor: "Crescent moon backdrops, moroccan lantern centerpieces, and calligraphy hangings.",
    lighting: "Emerald green uplighting with warm gold lantern glows.",
    themeClass: "theme-festival-eid",
    icon: "🌙"
  },
  {
    id: "retirement-party",
    category: "Retirement parties",
    name: "Golden Retirement 🏖️",
    balloons: ["#60a5fa", "#eab308", "#ffffff"],
    balloonText: "Sky blue, gold, and white balloons.",
    desc: "Retirement Party. Relaxed beachy/golf retreat theme to honor hard work.",
    decor: "Beachy hammock installations, golf clubs, wishing well card box, and customized years-of-service timeline.",
    lighting: "Warm sunset amber washes and relaxing dim yellow string lights.",
    themeClass: "theme-anniversary-old",
    icon: "🏖️"
  },
  {
    id: "get-together-party",
    category: "Get together",
    name: "Cozy Get Together 🏡",
    balloons: ["#fbbf24", "#fda4af", "#fef3c7"],
    balloonText: "Warm gold, peach, and cream balloons.",
    desc: "Get Together. Cozy housewarming or family lawn barbecue setting.",
    decor: "Grill station setups, yard games (cornhole/giant Jenga), outdoor theater screen, and warm plaid picnic blankets.",
    lighting: "Fairy light canopies, bonfire glow, and overhead paper lanterns.",
    themeClass: "theme-emerald",
    icon: "🏡"
  },
  {
    id: "farewell-party",
    category: "Farewell party",
    name: "Bon Voyage Farewell 👋",
    balloons: ["#1e3a8a", "#cbd5e1", "#ffffff"],
    balloonText: "Navy blue, silver, and white balloons.",
    desc: "Farewell Party. Celebrating new horizons and saying a warm goodbye.",
    decor: "Bon voyage globe/map setups, corporate desk layouts, advice jars, and signing boards.",
    lighting: "Sophisticated cool blue washes with warm spot lamps.",
    themeClass: "theme-luxury",
    icon: "👋"
  }
];

function mapAutoCelebrationToStyle(celebration) {
  let matched = null;
  if (celebration.id === "festival-diwali") {
    matched = ALL_THEME_STYLES.find(t => t.id === "festival-diwali-style");
  } else if (celebration.id === "festival-christmas") {
    matched = ALL_THEME_STYLES.find(t => t.id === "festival-christmas-style");
  } else if (celebration.id === "festival-holi") {
    matched = ALL_THEME_STYLES.find(t => t.id === "festival-holi-style");
  } else if (celebration.id === "festival-eid") {
    matched = ALL_THEME_STYLES.find(t => t.id === "festival-eid-style");
  } else if (celebration.id.startsWith("birthday")) {
    const isMale = celebration.themeClass === "theme-birthday-male";
    matched = ALL_THEME_STYLES.find(t => t.id === (isMale ? "boy-superhero" : "girl-princess"));
  } else if (celebration.id.startsWith("anniversary")) {
    const isOld = celebration.themeClass === "theme-anniversary-old";
    matched = ALL_THEME_STYLES.find(t => t.id === (isOld ? "older-jubilee" : "newly-romantic"));
  }
  
  if (matched) {
    return {
      ...celebration,
      balloons: matched.balloons,
      decor: matched.decor,
      lighting: matched.lighting,
      desc: matched.desc
    };
  }
  return celebration;
}

function getCelebrationThemeForDate(date) {
  const m = date.getMonth(); // 0-11
  const d = date.getDate();
  const targetMD = `${m + 1}/${d}`;

  // Load family members
  let members = [];
  try {
    const raw = localStorage.getItem("happyCelebrationFamily");
    members = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  // 1. Birthdays (highly personal)
  const bdaysToday = members.filter(member => {
    if (!member.birthDate) return false;
    const parts = member.birthDate.split("/");
    if (parts.length >= 2) {
      return `${parseInt(parts[0], 10)}/${parseInt(parts[1], 10)}` === targetMD;
    }
    return false;
  });

  if (bdaysToday.length > 0) {
    const kid = bdaysToday.find(member => ["son", "daughter", "child"].includes((member.relation || "").toLowerCase())) || bdaysToday[0];
    const isMale = (kid.gender || "").toLowerCase() === "male";
    if (isMale) {
      return {
        id: `birthday-${kid.id}`,
        name: `${kid.name}'s Birthday! 🎂`,
        themeClass: "theme-birthday-male",
        icon: "🎈",
        desc: `Celebrating ${kid.name}'s Birthday with bright, energetic Blue & Silver colors and floating balloons.`,
        bubbleChar: "🎈",
        tag: "BIRTHDAY THEME"
      };
    } else {
      return {
        id: `birthday-${kid.id}`,
        name: `${kid.name}'s Birthday! 🎂`,
        themeClass: "theme-birthday-female",
        icon: "🌸",
        desc: `Celebrating ${kid.name}'s Birthday with a cheerful Pink & Violet palette and playful sparkles.`,
        bubbleChar: "🌸",
        tag: "BIRTHDAY THEME"
      };
    }
  }

  // 2. Anniversaries (personal)
  const annivsToday = members.filter(member => {
    if (!member.anniversaryDate) return false;
    const parts = member.anniversaryDate.split("/");
    if (parts.length >= 2) {
      return `${parseInt(parts[0], 10)}/${parseInt(parts[1], 10)}` === targetMD;
    }
    return false;
  });

  if (annivsToday.length > 0) {
    const annivMember = annivsToday[0];
    let years = 1;
    const parts = annivMember.anniversaryDate.split("/");
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      if (!isNaN(year)) {
        years = date.getFullYear() - year;
      }
    }

    if (years >= 25) {
      return {
        id: `anniversary-${annivMember.id}`,
        name: `${annivMember.name}'s Anniversary (${years} yrs) 💍`,
        themeClass: "theme-anniversary-old",
        icon: "💍",
        desc: `Celebrating a milestone 25+ years Silver/Golden jubilee with an elegant Black & Gold vintage palette.`,
        bubbleChar: "✨",
        tag: "ANNIVERSARY THEME"
      };
    } else {
      return {
        id: `anniversary-${annivMember.id}`,
        name: `${annivMember.name}'s Anniversary (${years} yrs) 💖`,
        themeClass: "theme-anniversary-young",
        icon: "💖",
        desc: `Celebrating ${years} years of love with a romantic, fresh Red & Gold palette and floating hearts.`,
        bubbleChar: "💖",
        tag: "ANNIVERSARY THEME"
      };
    }
  }

  // 3. Festivals (calendar events)
  // Diwali: Oct 30 - Nov 5
  if ((m === 9 && d >= 30) || (m === 10 && d <= 5)) {
    return {
      id: "festival-diwali",
      name: "Diwali Celebration Theme 🪔",
      themeClass: "theme-festival-diwali",
      icon: "🪔",
      desc: "Deep Orange + Gold. Celebrating the festival of lights with glowing diyas and sparkling fireworks.",
      bubbleChar: "🪔",
      tag: "FESTIVAL THEME"
    };
  }

  // Eid: Mar 30 - Apr 2
  if ((m === 2 && d >= 30) || (m === 3 && d <= 2)) {
    return {
      id: "festival-eid",
      name: "Eid Celebration Theme 🌙",
      themeClass: "theme-festival-eid",
      icon: "🌙",
      desc: "Emerald Green + White. Celebrating Eid with crescent moons, stars, and lantern glow.",
      bubbleChar: "🌙",
      tag: "FESTIVAL THEME"
    };
  }

  // Christmas: Dec 24 - Dec 26
  if (m === 11 && d >= 24 && d <= 26) {
    return {
      id: "festival-christmas",
      name: "Christmas Celebration Theme 🎄",
      themeClass: "theme-festival-christmas",
      icon: "🎄",
      desc: "Red + Green. Holiday vibes featuring cozy snowflakes, stars, and decorated fir trees.",
      bubbleChar: "❄️",
      tag: "FESTIVAL THEME"
    };
  }

  // Holi: Mar 10 - Mar 15
  if (m === 2 && d >= 10 && d <= 15) {
    return {
      id: "festival-holi",
      name: "Holi Celebration Theme 🎨",
      themeClass: "theme-festival-holi",
      icon: "🎨",
      desc: "Multicolor Splash. Bright vibrant gradients showcasing organic color balloons and water splashes.",
      bubbleChar: "🎨",
      tag: "FESTIVAL THEME"
    };
  }

  return null;
}

window.currentThemeStyleIndex = 0; // Default to first theme (Superhero Theme) on load

function updateActiveTheme() {
  const activeStyleNameEl = document.getElementById("activeThemeStyleName");
  const activeStyleCategoryEl = document.getElementById("activeThemeStyleCategory");

  let celebration = null;
  let activeDate = new Date();
  const mockMonthSelect = document.getElementById("mockMonth");
  const mockDaySelect = document.getElementById("mockDay");
  if (mockMonthSelect && mockDaySelect) {
    const mm = parseInt(mockMonthSelect.value, 10);
    const dd = parseInt(mockDaySelect.value, 10);
    activeDate = new Date(activeDate.getFullYear(), mm, dd);
  }

  // 1. Check if user selected a manual category override index
  if (typeof window.currentThemeStyleIndex === "number" && window.currentThemeStyleIndex >= 0 && window.currentThemeStyleIndex < ALL_THEME_STYLES.length) {
    const themeStyle = ALL_THEME_STYLES[window.currentThemeStyleIndex];
    if (themeStyle) {
      if (activeStyleNameEl) activeStyleNameEl.textContent = themeStyle.name;
      if (activeStyleCategoryEl) activeStyleCategoryEl.textContent = themeStyle.category;
      
      celebration = {
        id: themeStyle.id,
        name: themeStyle.name,
        themeClass: themeStyle.themeClass,
        icon: themeStyle.icon,
        desc: themeStyle.desc,
        decor: themeStyle.decor,
        lighting: themeStyle.lighting,
        balloons: themeStyle.balloons,
        tag: themeStyle.category.toUpperCase()
      };
    }
  } else {
    // 2. Default automatic date detection
    window.currentThemeStyleIndex = -1;
    if (activeStyleNameEl) activeStyleNameEl.textContent = "Auto-detect from Date";
    if (activeStyleCategoryEl) activeStyleCategoryEl.textContent = "Using calendar dates to set theme.";

    celebration = getCelebrationThemeForDate(activeDate);
    // If auto detected a theme, let's map it to one of our special theme styles!
    if (celebration) {
      celebration = mapAutoCelebrationToStyle(celebration);
    }
  }

  // Clear all themes
  document.body.classList.remove(
    "theme-wine", "theme-emerald", "theme-sapphire", "theme-violet", "theme-luxury",
    "theme-birthday-male", "theme-birthday-female",
    "theme-anniversary-young", "theme-anniversary-old",
    "theme-festival-diwali", "theme-festival-eid", "theme-festival-christmas", "theme-festival-holi"
  );

  if (celebration) {
    document.body.classList.add(celebration.themeClass);
    updateAirtelHero(celebration);
    renderThemeDetailsSections(celebration.id);
  } else {
    const savedTheme = localStorage.getItem("happyCelebrationTheme") || "wine";
    document.body.classList.add(`theme-${savedTheme}`);
    updateAirtelHero(null);
    const detailsContainer = document.getElementById("themeDetailsSections");
    if (detailsContainer) detailsContainer.style.display = "none";
  }

  // Restart floating particles
  initFloatingCelebration();
  
  // Highlight active theme item in static list
  updateStaticThemesHighlight();
}

function renderStaticThemesList() {
  const container = document.getElementById("staticThemesList");
  if (!container) return;

  container.innerHTML = "";

  const categories = [
    { name: "Baby Boy Birthday theme", icon: "🎂" },
    { name: "Baby Girl Birthday theme", icon: "🎀" },
    { name: "Adult Boy/Girl Birthday theme", icon: "🎉" },
    { name: "Old age Birthday theme", icon: "🧓" },
    { name: "Newly married marriage anniversary", icon: "💍" },
    { name: "Old age marriage anniversary", icon: "💖" },
    { name: "Christmas eve", icon: "🎄" },
    { name: "Holi party", icon: "🎨" },
    { name: "Eid Mubarak", icon: "🌙" },
    { name: "Retirement parties", icon: "🏖️" },
    { name: "Get together", icon: "🏡" },
    { name: "Farewell party", icon: "👋" }
  ];

  categories.forEach(cat => {
    // Check if there are themes in this category
    const hasThemes = ALL_THEME_STYLES.some(theme => theme.category === cat.name);
    if (!hasThemes) return;

    // Create header element
    const header = document.createElement("div");
    header.className = "static-category-title";
    header.innerHTML = `<span style="margin-right: 6px;">${cat.icon}</span>${cat.name}`;
    container.appendChild(header);

    // Filter themes for this category
    ALL_THEME_STYLES.forEach((theme, index) => {
      if (theme.category === cat.name) {
        const item = document.createElement("div");
        item.className = "static-theme-item";
        item.dataset.themeIndex = index;

        // Map colors for small circle previews
        const dotsHtml = theme.balloons.map(color => 
          `<span class="theme-color-dot" style="background-color: ${color};"></span>`
        ).join("");

        item.innerHTML = `
          <div class="static-theme-left">
            <div class="theme-color-dots">${dotsHtml}</div>
          </div>
          <div class="static-theme-content">
            <div class="static-theme-name">${theme.name}</div>
            <div class="static-theme-balloons">${theme.balloonText || ""}</div>
          </div>
          <div class="static-theme-status">
            <span class="active-indicator">✓</span>
          </div>
        `;

        item.addEventListener("click", () => {
          window.currentThemeStyleIndex = index;
          updateActiveTheme();
          updateAirtelThemePlanningCards();
        });

        container.appendChild(item);
      }
    });
  });
}

function updateStaticThemesHighlight() {
  const items = document.querySelectorAll("#staticThemesList .static-theme-item");
  items.forEach(item => {
    const idx = parseInt(item.dataset.themeIndex, 10);
    if (idx === window.currentThemeStyleIndex) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Also update reset auto theme button state style
  const resetBtn = document.getElementById("resetAutoThemeBtn");
  if (resetBtn) {
    resetBtn.classList.toggle("is-active", window.currentThemeStyleIndex === -1);
  }
}

function updateAirtelHero(celebration) {
  const heroCard = document.getElementById("airtelHeroCard");
  const heroIcon = document.getElementById("airtelHeroIcon");
  const heroTag = document.getElementById("airtelHeroTag");
  const heroTitle = document.getElementById("airtelHeroTitle");
  const heroDesc = document.getElementById("airtelHeroDesc");
  const heroBtn = document.getElementById("airtelHeroBtn");

  if (!heroCard) return;

  if (celebration) {
    if (heroIcon) heroIcon.textContent = celebration.icon || "🎉";
    if (heroTag) heroTag.textContent = celebration.tag || "Active Theme";
    if (heroTitle) heroTitle.textContent = celebration.name;
    
    let displayDesc = celebration.desc;
    if (celebration.decor) {
      displayDesc += ` Decor: ${celebration.decor}`;
    }
    if (heroDesc) heroDesc.textContent = displayDesc;
    
    if (heroBtn) {
      heroBtn.style.display = "none";
    }

    // Populate interactive detailed sections
    renderThemeDetailsSections(celebration.id);
  } else {
    if (heroIcon) heroIcon.textContent = "🎉";
    if (heroTag) heroTag.textContent = "Theme Planner";
    if (heroTitle) heroTitle.textContent = "Standard Theme Active";
    if (heroDesc) heroDesc.textContent = "No active celebration theme today. Toggle the mock date picker options below to preview our custom themes!";
    if (heroBtn) {
      heroBtn.style.display = "none";
    }

    // Hide interactive sections
    const detailsContainer = document.getElementById("themeDetailsSections");
    if (detailsContainer) detailsContainer.style.display = "none";
  }
}

const THEME_DETAILED_SECTIONS = {
  "boy-superhero": {
    characters: {
      title: "🦸‍♂️ Select Character Style",
      items: ["Thor (Lightning elements, hammer props)", "Spider-Man (Web shooter decorations, blue/red nets)", "Superman (Cape backdrops, classic emblem signs)", "Batman (Dark Knight motifs, bat signal lights)", "Iron Man (Arc reactor table centerpiece)"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["Thor's Mjolnir Hammer 3D Cake", "Spider-Man City Skyline Sculpted Cake", "Superman Shield Multi-tier Cake", "Avengers Assembled Fondant Cake"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Kids Deluxe Superhero Costumes (with capes & masks)", "Personalized Family Superhero T-Shirts", "Avenger Character Capes for all guests"]
    },
    stuff: {
      title: "🛡️ Props & Other Stuff",
      items: ["Foam Thor Hammers & Captain America Shields", "Comic bubble photo booth props", "Face painting booth (Hero designs)"]
    }
  },
  "girl-superhero": {
    characters: {
      title: "🦸‍♀️ Select Character Style",
      items: ["Supergirl", "Batgirl", "Wonder Woman", "Harley Quinn"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["Supergirl Crest Cake", "Batgirl Skyline Cake", "Wonder Woman Tiara Cake"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Girl Superhero capes and masks", "Custom family hero tees"]
    },
    stuff: {
      title: "🛡️ Props & Other Stuff",
      items: ["Action bubbles and star shield props", "Photo booth setups"]
    }
  },
  "boy-safari": {
    characters: {
      title: "🦁 Safari Animal Styles",
      items: ["Lion King style", "Friendly Giraffe & Zebra themes", "Jungle Explorer motifs"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["3D Jungle Animal Treehouse Cake", "Cute Lion Cub Sculpted Fondant Cake", "Wild Safari Jeep Cream Cake"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Khaki Explorer Pith Hats for kids", "Custom 'Wild One' safari print family tees", "Animal ear headbands"]
    },
    stuff: {
      title: "🌿 Props & Other Stuff",
      items: ["Inflatable safari animals", "Custom jungle binoculars", "Greenery photobooth arch"]
    }
  },
  "boy-cars": {
    characters: {
      title: "🏎️ Racetrack & Vehicle Styles",
      items: ["Formula 1 Racing style", "Monster Truck Rally theme", "Retro Hot Rod style"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["Race Car 3D Sculpted Cake", "Piston Cup Championship Trophy Cake", "Monster Truck tire fondant cake"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Racing Driver pitcrew jumpsuit for birthday boy", "Checkered flag pattern shirts for family", "Pitstop crew custom caps"]
    },
    stuff: {
      title: "🏁 Props & Other Stuff",
      items: ["Miniature traffic cones & warning lights", "Checkered flag photo backdrop", "Tire stack balloon columns"]
    }
  },
  "girl-princess": {
    characters: {
      title: "👑 Royal Princess Styles",
      items: ["Cinderella (Ice Blue & Silver)", "Belle (Royal Gold & Roses)", "Elsa (Frozen Ice Palace style)", "Ariel (Under the Sea Princess)"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["3D Pink Castle & Tiara Cake", "Disney Princess character fondant cake", "Glass Slipper velvet cream cake"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Sparkling Deluxe Princess Gown for birthday girl", "Royal tiaras & wands for all princess guests", "Matching family pastel outfits"]
    },
    stuff: {
      title: "🏰 Props & Other Stuff",
      items: ["Royal throne chair for photos", "Satin carriage photo frame", "Glittery wand decoration booth"]
    }
  },
  "girl-fairy": {
    characters: {
      title: "🧚‍♀️ Enchanted Forest Styles",
      items: ["Tinkerbell Pixie Style", "Forest Elves & Wildflowers", "Dreamy Woodland Fairies"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["Fairy Hollow Treehouse Cake", "Magic Mushroom & Pixie Dust Cake", "Floral crown tiered naked cake"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Glowing LED Fairy wings for kids", "Floral crown headbands", "Pastel tutu skirts"]
    },
    stuff: {
      title: "🌸 Props & Other Stuff",
      items: ["Giant glowing flower models", "Pixie dust bubble bottles", "Wooden fairy door installations"]
    }
  },
  "girl-unicorn": {
    characters: {
      title: "🦄 Unicorn & Star Styles",
      items: ["Magical Pegasus Theme", "Pastel Rainbow Unicorn Style", "Glitter & Starlight Magic"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["Golden Horn Unicorn Head 3D Cake", "Over-the-rainbow multi-tier cake", "Pastel swirl drip cake with stars"]
    },
    clothes: {
      title: "👕 Clothes & Costumes",
      items: ["Unicorn horn headband & pastel dress for birthday girl", "Matching unicorn family tees", "Glittery hair clips for guests"]
    },
    stuff: {
      title: "☁️ Props & Other Stuff",
      items: ["Fluffy cotton cloud table overlays", "Giant unicorn plush backdrop", "Unicorn face paint & glitter bar"]
    }
  },
  "adult-birthday-boy": {
    characters: {
      title: "🍺 Select Party Vibe",
      items: ["Sports & Games Night style", "Casino & Las Vegas theme", "Classic Beer Garden vibe", "Retro Arcade setup"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["3D Beer Mug Shaped Cake", "Xbox/PlayStation Console Cake", "Poker Table Fondant Cake", "Whiskey Bottle Sculpted Cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Smart casual shirts and custom caps", "Sports jerseys of preferred teams", "Custom 'Birthday Crew' t-shirts"]
    },
    stuff: {
      title: "🎯 Props & Fun Stuff",
      items: ["Dartboard & ping pong table sets", "Custom printed beer coasters", "Mini arcade basketball machine"]
    }
  },
  "adult-birthday-girl": {
    characters: {
      title: "💄 Select Party Vibe",
      items: ["Glamour Spa Day styling", "Dreamy Boho picnic setup", "Glitzy Cocktail Party layout", "Floral garden tea party"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["High-end Cosmetics box cake", "Floral ring drip cake with gold foil", "Giant cupcake frosting tower", "Champagne bucket cake"]
    },
    clothes: {
      title: "👗 Clothes & Outfits",
      items: ["Chic cocktail dresses or pastel robes", "Matching floral dress code", "Custom personalized birthday queen sash"]
    },
    stuff: {
      title: "🌸 Props & Fun Stuff",
      items: ["Mimosa bar setups and fancy glassware", "Instagrammable floral arch with neon sign", "Plush cushions and rugs for low seating"]
    }
  },
  "old-age-birthday": {
    characters: {
      title: "👴 Select Comfort Style",
      items: ["Vintage Nostalgia theme", "Royal Traditional style", "Classic English Tea Party setting"]
    },
    cakes: {
      title: "🎂 Customized Birthday Cake",
      items: ["Family Tree photo-collage cake", "Fresh rose floral basket cake", "Classic elegant double-tier velvet cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Comfortable premium ethnic attire", "Warm soft shawls / coordinated sweaters", "Coordinating family color palette"]
    },
    stuff: {
      title: "📸 Props & Comfort Stuff",
      items: ["Nostalgic retro newspaper prints of birth year", "Soft armchair and cushion lounge setup", "Hanging timeline card boards of key memories"]
    }
  },
  "newly-romantic": {
    characters: {
      title: "🌹 Romantic Styling Themes",
      items: ["Classic Crimson Rose style", "Boho Rose Gold & Pampas Grass", "Modern Minimalist Hearts"]
    },
    cakes: {
      title: "🎂 Customized Anniversary Cake",
      items: ["Fresh Red Rose tier cake", "Elegant Silhouette Couple Cake", "Gold Foil drip velvet cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Elegant Evening Gown & Suit suggestion", "Matching Red/White couple outfits", "Embroidered anniversary initials shirts"]
    },
    stuff: {
      title: "✨ Props & Other Stuff",
      items: ["Heart-shaped balloon arch", "Marquee 'LOVE' light letters", "Personalized memory wall photo board"]
    }
  },
  "newly-travel": {
    characters: {
      title: "✈️ Travel Adventure Styles",
      items: ["Wanderlust & Map Theme", "Hot Air Balloon Flight style", "Parisian/Venetian City Romance"]
    },
    cakes: {
      title: "🎂 Customized Anniversary Cake",
      items: ["Globe & Vintage Suitcase cake", "Passport & boarding pass cake", "World map stencil tier cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Travel-ready safari chic outfits", "Matching custom passport-holder couple shirts", "Adventure themed jackets"]
    },
    stuff: {
      title: "🗺️ Props & Other Stuff",
      items: ["Vintage globe & map photo corner", "Mini suitcase favors", "Boarding pass style menu cards"]
    }
  },
  "newly-glam": {
    characters: {
      title: "✨ Modern Glam Styles",
      items: ["Great Gatsby / Art Deco Theme", "VIP Red Carpet style", "Ultra-modern Silver & Neon"]
    },
    cakes: {
      title: "🎂 Customized Anniversary Cake",
      items: ["Art Deco Geometric Gold Cake", "Sequin shimmer black & gold cake", "Champagne bottle pouring cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Black-tie Tuxedo & Sequin Dress guide", "Matching metallic accents attire", "Custom glam masquerade masks"]
    },
    stuff: {
      title: "🍾 Props & Other Stuff",
      items: ["Champagne tower display", "Silver metallic sequin backdrop", "Hollywood VIP photo step & repeat"]
    }
  },
  "older-jubilee": {
    characters: {
      title: "🏆 Golden Jubilee Styles",
      items: ["Grand Royal Gold style", "Vintage Floral Anniversary theme", "Classic Family Reunion theme"]
    },
    cakes: {
      title: "🎂 Customized Anniversary Cake",
      items: ["50th Golden Jubilee Tier Cake", "Vintage lace design fondant cake", "White rose cake with gold flakes"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Golden embroidered traditional outfit suggestion", "Matching silk/satin family apparel", "Golden crown/tiara for the couple"]
    },
    stuff: {
      title: "📸 Props & Other Stuff",
      items: ["Golden number '50' marquee lights", "Family tree photo display frame", "Nostalgic family memory video screen"]
    }
  },
  "older-memory": {
    characters: {
      title: "📸 Retro Memory Styles",
      items: ["Retro Vintage Record theme", "Sepia Classic Photo theme", "Old School Romance style"]
    },
    cakes: {
      title: "🎂 Customized Anniversary Cake",
      items: ["Vinyl Record & gramophone cake", "Nostalgic photo-printed collage cake", "Rustic naked chocolate cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Retro 70s/80s styled outfits", "Matching classic vintage design shirts", "Nostalgic color palette dress code"]
    },
    stuff: {
      title: "📻 Props & Other Stuff",
      items: ["Hanging polaroid clothesline photo wall", "Vintage radio & record player setup", "Custom retro newspaper event program"]
    }
  },
  "older-classic": {
    characters: {
      title: "🖤 Classic Elegance Styles",
      items: ["Monochrome Minimalism Theme", "Crystal Luxury Dinner style", "Classic Tuxedo Lounge theme"]
    },
    cakes: {
      title: "🎂 Customized Anniversary Cake",
      items: ["Classic Black Velvet Rose Cake", "White fondant cake with silver ribbon", "Tuxedo & Gown styled 2-tier cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Formal Black & White dress code", "Classic silver-accented outfits", "Matching monogrammed silk scarves"]
    },
    stuff: {
      title: "🕯️ Props & Other Stuff",
      items: ["Tall crystal candelabras", "Silver-rimmed dinnerware setups", "Monochromatic rose flower arches"]
    }
  },
  "festival-christmas-style": {
    characters: {
      title: "🎄 Christmas Cozy Styles",
      items: ["Rustic Woodland Cabin theme", "Winter Wonderland White theme", "Santa's Red & Green Workshop"]
    },
    cakes: {
      title: "🎂 Customized Christmas Cake",
      items: ["Traditional Yule Log Chocolate Cake", "Gingerbread House display & cupcakes", "Snowy pinecone vanilla drip cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Cozy Matching Family Christmas Sweaters", "Elf & Santa hats for all guests", "Flannel plaid pajama dress code"]
    },
    stuff: {
      title: "🎁 Props & Other Stuff",
      items: ["Custom decorated Christmas tree arch", "Personalized stockings hanging station", "Fake snow spray & mistletoe photo spots"]
    }
  },
  "festival-holi-style": {
    characters: {
      title: "🎨 Holi Splash Styles",
      items: ["Bright Color Powder Rain theme", "Eco-friendly Organic Gulaal style", "Retro Bollywood Holi theme"]
    },
    cakes: {
      title: "🎂 Customized Holi Cake",
      items: ["Rainbow splash tie-dye cake", "Water balloon styled cupcakes", "Colorful splash frosting cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Pure White cotton kurtas/tees (ready for colors)", "Custom matching 'Bura Na Mano Holi Hai' tees", "Cool protective colorful sunglasses"]
    },
    stuff: {
      title: "💦 Props & Other Stuff",
      items: ["Water guns (Pichkaris) & balloon bucket stations", "Organic non-toxic herbal color platters", "Holi photo booth with splash backdrops"]
    }
  },
  "festival-eid-style": {
    characters: {
      title: "🌙 Eid Mubarak Themes",
      items: ["Crescent Moon & Star theme", "Royal Arabic Lantern style", "Elegant Emerald Moroccan theme"]
    },
    cakes: {
      title: "🎂 Customized Eid Cake",
      items: ["Crescent Moon & Stars 3D Cake", "Eid Mubarak calligraphy gold foil cake", "Moroccan tile pattern cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Shalwar Kameez & Sherwani guidelines", "Pastel matching family Eid apparel", "Traditional embroidered caps & hijabs"]
    },
    stuff: {
      title: "🏮 Props & Other Stuff",
      items: ["Arabic lanterns with LED candles", "Moroccan pouf seating corner", "Eid gift box favors display station"]
    }
  },
  "retirement-party": {
    characters: {
      title: "🏖️ Select Party Vibe",
      items: ["Island Travel Getaway vibe", "Country Club Golf lounge setup", "Vintage Retro Office Farewell"]
    },
    cakes: {
      title: "🎂 Customized Retirement Cake",
      items: ["Suitcase & Travel Ticket cake", "Golf green tiered cake with flags", "Monogrammed plaque fondant cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Relaxed resort-wear or Hawaiian shirts", "Smart-casual comfortable attire", "Custom 'Officially Retired' couple sash"]
    },
    stuff: {
      title: "📝 Props & Other Stuff",
      items: ["Wishing well box for notes and cards", "Milestone career timeline photo wall", "Retirement countdown clock prop"]
    }
  },
  "get-together-party": {
    characters: {
      title: "🏡 Select Party Vibe",
      items: ["Backyard lawn BBQ party", "Cozy board games & karaoke night", "Traditional family potluck picnic"]
    },
    cakes: {
      title: "🎂 Customized Cake",
      items: ["Monogram family crest cake", "Assorted cupcake towers", "Rustic woodland berry naked cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Cozy flannel patterns or matching tees", "Relaxed home/lounge wear code", "Matching custom family badge pins"]
    },
    stuff: {
      title: "🎬 Props & Other Stuff",
      items: ["Outdoor projector movie screen setup", "Bonfire fire pit logs & marshallows", "Cornhole lawn game sets"]
    }
  },
  "farewell-party": {
    characters: {
      title: "✈️ Select Party Vibe",
      items: ["New horizons travel theme", "Retro corporate cocktail theme", "Academic graduation style"]
    },
    cakes: {
      title: "🎂 Customized Farewell Cake",
      items: ["Globe 'Bon Voyage' cake", "Office desk & coffee mug styled cake", "Stacked books graduation fondant cake"]
    },
    clothes: {
      title: "👕 Clothes & Outfits",
      items: ["Semi-formal cocktail dresses & suits", "Customized 'We will miss you' sash/ribbons", "Matching corporate colors attire"]
    },
    stuff: {
      title: "✍️ Props & Other Stuff",
      items: ["Wishes & memory jar signing cards", "Large photo board for guest signatures", "Custom suitcase gift box drops"]
    }
  }
};


function getOptionImageURL(themeId, sectionKey, itemText) {
  const text = (itemText || "").toLowerCase();
  const theme = (themeId || "").toLowerCase();

  if (sectionKey === "cakes") {
    if (theme.includes("superhero")) return "https://images.unsplash.com/photo-1535141192574-5d4897c13636?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("safari")) return "https://images.unsplash.com/photo-1588195538326-c5b1e9f8011b?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("cars")) return "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("princess")) return "https://images.unsplash.com/photo-1558961309-dbdf71771497?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("fairy")) return "https://images.unsplash.com/photo-1464349172961-1ff4a1360a7e?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("unicorn")) return "https://images.unsplash.com/photo-1562440499-64c9a111f713?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("adult")) return "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("christmas")) return "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("eid")) return "https://images.unsplash.com/photo-1605270864936-a36c6418b760?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("holi")) return "https://images.unsplash.com/photo-1514517604298-cf80e0fb7f1e?auto=format&fit=crop&w=300&q=80";
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80";
  }
  if (sectionKey === "characters") {
    if (text.includes("thor")) return "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=300&q=80";
    if (text.includes("spider-man") || text.includes("spider")) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80";
    if (text.includes("superman")) return "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=300&q=80";
    if (text.includes("batman")) return "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&q=80";
    if (text.includes("iron man") || text.includes("arc reactor")) return "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("safari")) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("cars")) return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("princess")) return "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("fairy")) return "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("unicorn")) return "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("adult")) return "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("romantic") || theme.includes("newly")) return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("travel")) return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("glam")) return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("jubilee") || theme.includes("old age marriage")) return "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("memory")) return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("classic")) return "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("christmas")) return "https://images.unsplash.com/photo-1543589077-47d8160677a0?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("holi")) return "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("eid")) return "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("retirement")) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("together") || theme.includes("get-together")) return "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("farewell")) return "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80";
    return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80";
  }
  if (sectionKey === "clothes") {
    if (theme.includes("superhero") || text.includes("costumes") || text.includes("capes")) return "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("princess") || text.includes("gown") || text.includes("dress")) return "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("safari")) return "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("cars") || text.includes("racing")) return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("christmas") || text.includes("sweater")) return "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("holi") || text.includes("white")) return "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("eid")) return "https://images.unsplash.com/photo-1584997187878-fd9e3907a0c4?auto=format&fit=crop&w=300&q=80";
    if (theme.includes("anniversary") || theme.includes("romantic") || theme.includes("glam") || theme.includes("newly")) return "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=300&q=80";
    return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=300&q=80";
  }

  // Props & stuff
  if (text.includes("water") || text.includes("gun") || text.includes("pichkaris")) return "https://images.unsplash.com/photo-1580600301354-02c529a7ba65?auto=format&fit=crop&w=300&q=80";
  if (text.includes("lantern") || text.includes("candle") || text.includes("lamps")) return "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=300&q=80";
  if (text.includes("balloon")) return "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=300&q=80";
  if (text.includes("flower") || text.includes("marigold") || text.includes("garland")) return "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=300&q=80";
  if (text.includes("photo") || text.includes("booth") || text.includes("props")) return "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80";
  return "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=300&q=80";
}

function getThemeConsolidatedImageURL(themeId) {
  const theme = (themeId || "").toLowerCase();
  if (theme === "boy-superhero") return "assets/boy_superhero_setup.png";
  if (theme === "girl-superhero") return "assets/superhero_group.jpg";
  if (theme.includes("safari")) return "assets/safari_theme_setup.png";
  if (theme.includes("cars")) return "assets/car_theme_custom.png";
  if (theme.includes("princess")) return "assets/princess_theme_setup.png";
  if (theme.includes("fairy")) return "assets/fairy_theme_setup.png";
  if (theme.includes("unicorn")) return "assets/unicorn_theme_setup.png";
  if (theme.includes("adult-birthday-boy")) return "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("adult-birthday-girl")) return "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("old-age-birthday")) return "assets/elder_birthday_setup.png";
  if (theme.includes("romantic") || theme.includes("newly-romantic")) return "assets/romantic_anniversary_setup.png";
  if (theme.includes("travel") || theme.includes("newly-travel")) return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("glam") || theme.includes("newly-glam")) return "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("jubilee") || theme.includes("older-jubilee")) return "assets/golden_anniversary_setup.png";
  if (theme.includes("memory") || theme.includes("older-memory")) return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("classic") || theme.includes("older-classic")) return "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("christmas")) return "https://images.unsplash.com/photo-1543589077-47d8160677a0?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("holi")) return "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("eid")) return "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("retirement")) return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("together") || theme.includes("get-together")) return "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80";
  if (theme.includes("farewell")) return "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80";
  return "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80";
}

function renderThemeDetailsSections(themeId) {
  const detailsCard = document.getElementById("themeDetailsSections");
  const container = document.getElementById("themeDetailedOptionsContainer");
  const descriptionEl = document.getElementById("themeDetailsDescription");
  if (!detailsCard || !container) return;

  const data = THEME_DETAILED_SECTIONS[themeId];
  if (!data) {
    detailsCard.style.display = "none";
    return;
  }

  // Find theme details to set name and description
  const theme = ALL_THEME_STYLES.find(t => t.id === themeId);
  if (theme && descriptionEl) {
    descriptionEl.innerHTML = `<strong>Theme Description:</strong> ${theme.desc}<br><br><strong>Design Setup:</strong> ${theme.decor || ""} ${theme.lighting || ""}`;
  }

  detailsCard.style.display = "flex";
  container.innerHTML = "";

  // Create and append one consolidated theme image
  const imgWrapper = document.createElement("div");
  imgWrapper.style.width = "100%";
  imgWrapper.style.marginTop = "12px";
  imgWrapper.style.borderRadius = "12px";
  imgWrapper.style.overflow = "hidden";
  imgWrapper.style.border = "1px solid rgba(255,255,255,0.1)";
  imgWrapper.style.boxShadow = "0 8px 30px rgba(0,0,0,0.5)";

  const img = document.createElement("img");
  img.src = getThemeConsolidatedImageURL(themeId);
  img.alt = theme ? theme.name : "Theme Image";
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.maxHeight = "450px";
  img.style.objectFit = "cover";
  img.style.display = "block";

  imgWrapper.appendChild(img);
  container.appendChild(imgWrapper);
}

function updateAirtelThemePlanningCards() {
  let members = [];
  try {
    const raw = localStorage.getItem("happyCelebrationFamily");
    members = raw ? JSON.parse(raw) : [];
  } catch (e) {}

  const rightTag = document.getElementById("airtelMiniRightTag");
  const rightTitle = document.getElementById("airtelMiniRightTitle");
  const rightDesc = document.getElementById("airtelMiniRightDesc");
  const rightBtn = document.getElementById("airtelMiniRightBtn");

  if (!rightTitle) return;

  if (!Array.isArray(members) || members.length === 0) {
    if (rightTag) rightTag.textContent = "Next Event";
    rightTitle.textContent = "No members yet";
    if (rightDesc) rightDesc.textContent = "Go to the Family Tree tab to add family members and see their upcoming celebrations.";
    if (rightBtn) {
      rightBtn.textContent = "Add Member";
      rightBtn.onclick = null;
    }
    return;
  }

  let activeDate = new Date();
  const mockMonthSelect = document.getElementById("mockMonth");
  const mockDaySelect = document.getElementById("mockDay");
  if (mockMonthSelect && mockDaySelect) {
    const mm = parseInt(mockMonthSelect.value, 10);
    const dd = parseInt(mockDaySelect.value, 10);
    activeDate = new Date(activeDate.getFullYear(), mm, dd);
  }

  let nextEvent = null;
  let minDaysDiff = Infinity;

  members.forEach(m => {
    if (m.birthDate) {
      const parts = m.birthDate.split("/");
      if (parts.length >= 2) {
        const bMon = parseInt(parts[0], 10) - 1;
        const bDay = parseInt(parts[1], 10);
        let evDate = new Date(activeDate.getFullYear(), bMon, bDay);
        if (evDate < activeDate) {
          evDate = new Date(activeDate.getFullYear() + 1, bMon, bDay);
        }
        const diffTime = evDate - activeDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < minDaysDiff) {
          minDaysDiff = diffDays;
          nextEvent = {
            type: "Birthday",
            name: m.name,
            daysLeft: diffDays,
            dateStr: `${bDay} ${getMonthName(bMon)}`,
            icon: "🎂"
          };
        }
      }
    }

    if (m.anniversaryDate) {
      const parts = m.anniversaryDate.split("/");
      if (parts.length >= 2) {
        const aMon = parseInt(parts[0], 10) - 1;
        const aDay = parseInt(parts[1], 10);
        let evDate = new Date(activeDate.getFullYear(), aMon, aDay);
        if (evDate < activeDate) {
          evDate = new Date(activeDate.getFullYear() + 1, aMon, aDay);
        }
        const diffTime = evDate - activeDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < minDaysDiff) {
          minDaysDiff = diffDays;
          nextEvent = {
            type: "Anniversary",
            name: `${m.name}'s`,
            daysLeft: diffDays,
            dateStr: `${aDay} ${getMonthName(aMon)}`,
            icon: "💍"
          };
        }
      }
    }
  });

  if (nextEvent) {
    if (rightTag) rightTag.textContent = `${nextEvent.type} Event`;
    if (nextEvent.daysLeft === 0) {
      rightTitle.textContent = `Today: ${nextEvent.name} ${nextEvent.type}!`;
      if (rightDesc) rightDesc.textContent = `Celebrate the special occasion today!`;
    } else {
      rightTitle.textContent = `${nextEvent.name} ${nextEvent.type}`;
      if (rightDesc) rightDesc.textContent = `Happening on ${nextEvent.dateStr} (${nextEvent.daysLeft} days left).`;
    }
    if (rightBtn) {
      rightBtn.textContent = "View Family";
      rightBtn.onclick = null;
    }
  } else {
    if (rightTag) rightTag.textContent = "Next Event";
    rightTitle.textContent = "No dates saved";
    if (rightDesc) rightDesc.textContent = "Add birth dates and anniversaries to get countdowns here.";
    if (rightBtn) {
      rightBtn.textContent = "View Family";
      rightBtn.onclick = null;
    }
  }
}

function getMonthName(m) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[m] || "";
}

// Floating Celebration Emojis Spawner
function initFloatingCelebration() {
  const container = document.getElementById("floatingCelebrationContainer");
  if (!container) return;

  container.style.display = "block";
  container.innerHTML = "";
  if (window.floatingBubbleInterval) {
    clearInterval(window.floatingBubbleInterval);
  }

  let activeDate = new Date();
  const mockMonthSelect = document.getElementById("mockMonth");
  const mockDaySelect = document.getElementById("mockDay");
  if (mockMonthSelect && mockDaySelect) {
    const mm = parseInt(mockMonthSelect.value, 10);
    const dd = parseInt(mockDaySelect.value, 10);
    activeDate = new Date(activeDate.getFullYear(), mm, dd);
  }

  // Get current active theme
  const categorySelect = document.getElementById("themeCategorySelect");
  const styleSelect = document.getElementById("themeStyleSelect");
  let celebration = null;

  if (categorySelect && categorySelect.value !== "auto") {
    const catKey = categorySelect.value;
    const styleKey = styleSelect ? styleSelect.value : "";
    const catObj = CELEBRATION_THEMES[catKey];
    if (catObj) {
      const themeStyle = catObj.styles.find(s => s.id === styleKey) || catObj.styles[0];
      if (themeStyle) {
        celebration = {
          id: themeStyle.id,
          name: themeStyle.name,
          themeClass: themeStyle.themeClass,
          icon: "🎈",
          desc: themeStyle.desc,
          balloons: themeStyle.balloons
        };
      }
    }
  } else {
    celebration = getCelebrationThemeForDate(activeDate);
    if (celebration) {
      celebration = mapAutoCelebrationToStyle(celebration);
    }
  }

  // If a celebration is active and it has custom balloons, use them!
  const useCssBalloons = celebration && Array.isArray(celebration.balloons);
  const balloonColors = useCssBalloons ? celebration.balloons : [];
  
  let emojis = ["🎉", "✨", "🎈", "💖", "🌸", "⭐"];
  if (celebration) {
    const id = celebration.id;
    if (id.includes("diwali")) {
      emojis = ["🪔", "✨", "💥", "🪔", "✨"];
    } else if (id.includes("eid")) {
      emojis = ["🌙", "⭐", "🕌", "🌙", "⭐"];
    } else if (id.includes("christmas")) {
      emojis = ["❄️", "🎄", "🎅", "❄️", "⭐"];
    } else if (id.includes("holi")) {
      emojis = ["🎨", "💦", "🎨", "🌈"];
    } else if (id.includes("boy") || id.includes("birthday-male")) {
      emojis = ["🎈", "🎂", "🎉", "🎈", "⭐"];
    } else if (id.includes("girl") || id.includes("birthday-female")) {
      emojis = ["🌸", "🎂", "🎉", "🌸", "🧚‍♀️"];
    } else if (id.includes("romantic") || id.includes("travel") || id.includes("anniversary-young")) {
      emojis = ["💖", "💍", "🌹", "💖", "✨"];
    } else if (id.includes("jubilee") || id.includes("memory") || id.includes("classic") || id.includes("anniversary-old")) {
      emojis = ["💍", "✨", "🎩", "💍", "💖"];
    }
  }

  function spawnBubble(initial = false) {
    const homeView = document.getElementById("homeView");
    if (!homeView || !homeView.classList.contains("active")) {
      return;
    }

    const maxBubbles = window.innerWidth < 768 ? 10 : 16;
    if (container.querySelectorAll(".float-bubble").length >= maxBubbles) {
      return;
    }

    const bubble = document.createElement("div");
    bubble.className = "float-bubble";

    // 70% of the time spawn 3D balloon, 30% spawn emojis/sparkles
    const spawnBalloon = useCssBalloons && Math.random() < 0.7;

    const size = Math.floor(Math.random() * 20) + 32; // size in pixels
    bubble.style.width = `${size}px`;
    bubble.style.display = "flex";
    bubble.style.alignItems = "center";
    bubble.style.justifyContent = "center";
    bubble.style.border = "none";
    bubble.style.pointerEvents = "none";

    if (spawnBalloon) {
      const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
      const height = Math.floor(size * 1.25);
      bubble.style.height = `${height}px`;
      bubble.style.borderRadius = "50% 50% 50% 50% / 40% 40% 60% 60%";
      bubble.style.background = `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%), ${color}`;
      bubble.style.boxShadow = `inset -3px -3px 8px rgba(0,0,0,0.45), 0 4px 15px ${color}77`;

      // Tie knot
      const knot = document.createElement("div");
      knot.style.position = "absolute";
      knot.style.bottom = "-2px";
      knot.style.left = "50%";
      knot.style.transform = "translateX(-50%)";
      knot.style.width = "6px";
      knot.style.height = "4px";
      knot.style.background = color;
      knot.style.borderRadius = "3px / 2px";
      bubble.appendChild(knot);

      // String
      const string = document.createElement("div");
      string.style.position = "absolute";
      string.style.bottom = "-25px";
      string.style.left = "50%";
      string.style.width = "1px";
      string.style.height = "25px";
      string.style.background = "rgba(255, 255, 255, 0.35)";
      string.style.transform = "translateX(-50%)";
      bubble.appendChild(string);
    } else {
      bubble.style.height = `${size}px`;
      bubble.style.background = "none";
      bubble.style.boxShadow = "none";
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      bubble.textContent = emoji;
      bubble.style.fontSize = `${size * 0.75}px`;
      bubble.style.textShadow = "0 2px 10px rgba(255, 255, 255, 0.4), 0 0 20px rgba(245, 199, 110, 0.3)";
    }

    bubble.style.left = `${Math.random() * 90 + 5}%`;

    if (initial) {
      const bottomOffset = Math.floor(Math.random() * 80) + 10;
      bubble.style.bottom = `${bottomOffset}%`;
    }

    const floatDuration = Math.random() * 4 + 8;
    const swayDuration = Math.random() * 2 + 3;
    
    bubble.style.animationDuration = `${floatDuration}s, ${swayDuration}s`;
    bubble.style.animationDelay = `0s, ${Math.random() * -4}s`;

    container.appendChild(bubble);

    setTimeout(() => {
      bubble.remove();
    }, floatDuration * 1000);
  }

  const initialBubbleCount = window.innerWidth < 768 ? 3 : 4;
  for (let i = 0; i < initialBubbleCount; i++) {
    spawnBubble(true);
  }

  window.floatingBubbleInterval = setInterval(() => {
    if (document.getElementById("homeView")?.classList.contains("active")) {
      spawnBubble(false);
    }
  }, 2800);
}

if (document.readyState === "interactive" || document.readyState === "complete") {
  initFloatingCelebration();
} else {
  document.addEventListener("DOMContentLoaded", initFloatingCelebration);
}

// ==========================================================================
// CULT.FIT STYLE DASHBOARD RUNTIME INITIALIZATION
// ==========================================================================

function updateBottomNavActive(tabName) {
  const tabs = document.querySelectorAll(".bottom-nav-bar .nav-tab");
  tabs.forEach(tab => {
    // Map panels to tabs
    const datasetTab = tab.dataset.tab;
    const isMatching = (datasetTab === tabName) || 
                       (datasetTab === "about" && (tabName === "about" || tabName === "contact")) ||
                       (datasetTab === "family" && tabName === "family") ||
                       (datasetTab === "book" && tabName === "book");
                       
    if (isMatching) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Update desktop nav
  const desktopBtns = document.querySelectorAll(".desktop-nav .nav-link-btn");
  desktopBtns.forEach(btn => {
    const btnPanel = btn.dataset.navPanel;
    if (btnPanel === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function initDashboardFeatures() {
  // 1. Bottom Nav click routing
  const tabs = document.querySelectorAll(".bottom-nav-bar .nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      
      if (tabName === "home") {
        closePanel();
        updateBottomNavActive("home");
      } else if (tabName === "book") {
        openPanel("book");
      } else if (tabName === "family") {
        window.open("?panel=family&fullscreen=true", "_blank");
      } else if (tabName === "about") {
        openPanel("about");
      } else if (tabName === "search") {
        showQuickSearchAlert();
      }
    });
  });

  // 2. Setup Cultfit Grid Tab Button Click Listeners
  const cultfitBtns = document.querySelectorAll(".cultfit-tab-btn");
  cultfitBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const panel = btn.dataset.panel;
      if (panel === "family") {
        // Let the native <a> link navigation handle it
        return;
      }
      if (panel) openPanel(panel);
    });
  });

  // 2b. Setup Desktop Navigation Link Click Listeners (Widescreen Single-Page Scrolling)
  const desktopNavBtns = document.querySelectorAll(".desktop-nav .nav-link-btn");
  desktopNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = btn.dataset.navPanel;
      if (panel === "home") {
        closePanel();
        const home = document.getElementById("homeView");
        if (home) home.scrollTo({ top: 0, behavior: "smooth" });
      } else if (panel === "services" || panel === "packages" || panel === "gallery" || panel === "about" || panel === "contact") {
        closePanel();
        const targetId = panel + "Section";
        const section = document.getElementById(targetId);
        if (section) {
          setTimeout(() => {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 80);
        }
      } else if (panel) {
        openPanel(panel);
      }
    });
  });

  // 2c. Setup Brand Logo click listener
  const brandBtn = document.getElementById("headerBrandBtn");
  if (brandBtn) {
    brandBtn.addEventListener("click", () => {
      closePanel();
      const home = document.getElementById("homeView");
      if (home) home.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 2d. Setup Hero Call-to-Action buttons
  const heroBookBtn = document.getElementById("heroBookBtn");
  const heroExploreBtn = document.getElementById("heroExploreBtn");
  if (heroBookBtn) {
    heroBookBtn.addEventListener("click", () => {
      openPanel("book");
    });
  }
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", () => {
      const section = document.getElementById("packagesSection");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // 2e. Setup Landing Page Package Select buttons
  const landingPkgBtns = document.querySelectorAll("[data-package-select]");
  landingPkgBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const pkgName = btn.dataset.packageSelect;
      openPanel("book");
      
      setTimeout(() => {
        const form = document.querySelector("#bookingForm");
        if (form) {
          const eventTypeSelect = form.querySelector("#bookingEventType");
          if (eventTypeSelect) {
            eventTypeSelect.value = "Birthday";
            eventTypeSelect.dispatchEvent(new Event("change"));
          }
          const guestsInput = form.querySelector("#bookingGuests");
          if (guestsInput) {
            if (pkgName === "Silver") guestsInput.value = 5;
            else if (pkgName === "Gold") guestsInput.value = 10;
            else if (pkgName === "Diamond") guestsInput.value = 15;
            guestsInput.dispatchEvent(new Event("input"));
          }
          const note = form.querySelector("#bookingNote");
          if (note) {
            note.textContent = `Pre-filled ${pkgName} package settings. Customize as needed!`;
            note.style.color = "var(--gold-300)";
          }
        }
      }, 100);
    });
  });

  // 2f. Setup Services Cards click listeners (data-panel-trigger)
  const serviceTriggerBtns = document.querySelectorAll("[data-panel-trigger]");
  serviceTriggerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const panelName = btn.dataset.panelTrigger;
      if (panelName) openPanel(panelName);
    });
  });

  // 3. Notification Bell Click Toggle
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationsDropdown = document.getElementById("notificationsDropdown");
  const clearNotificationsBtn = document.getElementById("clearNotificationsBtn");

  if (notificationBtn && notificationsDropdown) {
    notificationBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notificationsDropdown.style.display = notificationsDropdown.style.display === "none" ? "block" : "none";
      
      const badge = notificationBtn.querySelector(".notification-badge");
      if (badge) {
        badge.style.display = "none";
      }
    });

    document.addEventListener("click", () => {
      notificationsDropdown.style.display = "none";
    });

    notificationsDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener("click", () => {
      const list = document.getElementById("notificationsList");
      if (list) {
        list.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 20px; color: var(--soft); font-size: 12px;">
            🔔 No new notifications.
          </div>
        `;
      }
      const badge = document.querySelector(".notification-badge");
      if (badge) {
        badge.style.display = "none";
      }
    });
  }

  // 4. Populate Dynamic Notifications
  function populateNotifications() {
    const list = document.getElementById("notificationsList");
    const badge = document.querySelector(".notification-badge");
    if (!list) return;

    let notificationItems = [];
    let members = [];
    try {
      const raw = localStorage.getItem("happyCelebrationFamily");
      members = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    let upcomingCount = 0;
    if (Array.isArray(members) && members.length > 0) {
      const mockToday = new Date(2026, 5, 6);
      members.forEach(m => {
        if (m.birthDate) {
          const parts = m.birthDate.split("/");
          if (parts.length === 3) {
            const bMon = parseInt(parts[0], 10) - 1;
            const bDay = parseInt(parts[1], 10);
            let evDate = new Date(2026, bMon, bDay);
            if (evDate < mockToday) evDate = new Date(2027, bMon, bDay);
            const diffDays = Math.ceil((evDate - mockToday) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
              notificationItems.push({
                text: `🎂 ${m.name}'s Birthday is in ${diffDays} days!`,
                time: `${diffDays}d left`,
                panel: "book",
                prefill: { name: m.name, type: "Birthday" }
              });
              upcomingCount++;
            }
          }
        }
        if (m.anniversaryDate && m.spouseId) {
          const spouse = members.find(s => s.id === m.spouseId);
          if (spouse && m.id < spouse.id) {
            const parts = m.anniversaryDate.split("/");
            if (parts.length === 3) {
              const aMon = parseInt(parts[0], 10) - 1;
              const aDay = parseInt(parts[1], 10);
              let evDate = new Date(2026, aMon, aDay);
              if (evDate < mockToday) evDate = new Date(2027, aMon, aDay);
              const diffDays = Math.ceil((evDate - mockToday) / (1000 * 60 * 60 * 24));
              if (diffDays <= 30) {
                notificationItems.push({
                  text: `💍 ${m.name} & ${spouse.name}'s Anniversary is in ${diffDays} days!`,
                  time: `${diffDays}d left`,
                  panel: "book",
                  prefill: { name: `${m.name} & ${spouse.name}`, type: "Anniversary" }
                });
                upcomingCount++;
              }
            }
          }
        }
      });
    }

    if (members.length > 0) {
      notificationItems.push({
        text: `🌳 Family Tree: ${members.length} members loaded. Sync is active.`,
        time: "Active",
        panel: "family"
      });
    }

    notificationItems.push({
      text: "✨ Welcome to Happy Celebration! Plan your milestones with our premium theme designs.",
      time: "1d ago",
      panel: "about"
    });

    list.innerHTML = notificationItems.map((item, idx) => `
      <div class="notification-item unread" data-index="${idx}" style="cursor: pointer;">
        <div class="notification-dot"></div>
        <div class="notification-content">
          <p class="notification-text">${item.text}</p>
          <span class="notification-time">${item.time}</span>
        </div>
      </div>
    `).join("");

    list.querySelectorAll(".notification-item").forEach(el => {
      el.addEventListener("click", () => {
        const item = notificationItems[parseInt(el.dataset.index, 10)];
        if (item.panel) {
          openPanel(item.panel);
          if (item.prefill) {
            setTimeout(() => {
              const form = document.querySelector("#bookingForm");
              if (form) {
                const nameInput = form.querySelector("input[name='name']");
                if (nameInput) nameInput.value = item.prefill.name;
                const typeSelect = form.querySelector("#bookingEventType");
                if (typeSelect) {
                  typeSelect.value = item.prefill.type;
                  typeSelect.dispatchEvent(new Event("change"));
                }
              }
            }, 80);
          }
        }
        notificationsDropdown.style.display = "none";
      });
    });

    if (badge) {
      const unreadCount = upcomingCount || notificationItems.length;
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? "flex" : "none";
    }
  }

  populateNotifications();

  // Dynamically populate upcoming celebrations tab in Settings side drawer
  window.updateDrawerUpcomingEvents = function() {
    const container = document.getElementById("drawerUpcomingEventsContainer");
    if (!container) return;

    let members = [];
    try {
      const raw = localStorage.getItem("happyCelebrationFamily");
      members = raw ? JSON.parse(raw) : [];
    } catch (e) {}

    if (!Array.isArray(members) || members.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px 20px; color: var(--soft); font-size: 14px;">
          🌳 No family members found. Add members to your family tree to track their upcoming events.
        </div>
      `;
      return;
    }

    const mockToday = new Date(2026, 5, 6);
    const list = [];

    members.forEach(m => {
      if (m.birthDate) {
        const parts = m.birthDate.split("/");
        if (parts.length === 3) {
          const bMon = parseInt(parts[0], 10) - 1;
          const bDay = parseInt(parts[1], 10);
          list.push({
            name: m.name,
            eventTitle: `${m.name}'s Birthday`,
            type: "Birthday",
            month: bMon,
            day: bDay,
            originalDate: m.birthDate
          });
        }
      }
      if (m.anniversaryDate && m.spouseId) {
        const spouse = members.find(s => s.id === m.spouseId);
        if (spouse && m.id < spouse.id) {
          const parts = m.anniversaryDate.split("/");
          if (parts.length === 3) {
            const aMon = parseInt(parts[0], 10) - 1;
            const aDay = parseInt(parts[1], 10);
            list.push({
              name: `${m.name} & ${spouse.name}`,
              eventTitle: `${m.name} & ${spouse.name}'s Anniversary`,
              type: "Anniversary",
              month: aMon,
              day: aDay,
              originalDate: m.anniversaryDate
            });
          }
        }
      }
    });

    const eventsWithDays = list.map(ev => {
      let evDate = new Date(2026, ev.month, ev.day);
      if (evDate < mockToday) {
        evDate = new Date(2027, ev.month, ev.day);
      }
      const diffTime = evDate - mockToday;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...ev, daysLeft: diffDays, targetYear: evDate.getFullYear() };
    });

    eventsWithDays.sort((a, b) => a.daysLeft - b.daysLeft);

    if (eventsWithDays.length > 0) {
      container.innerHTML = "";
      eventsWithDays.forEach(ev => {
        const card = document.createElement("div");
        card.className = "upcoming-event-card";
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedDate = `${monthNames[ev.month]} ${ev.day}, ${ev.targetYear}`;

        card.innerHTML = `
          <div class="event-details">
            <span class="event-name">${ev.eventTitle}</span>
            <span class="event-date">📅 ${formattedDate} (${ev.type})</span>
          </div>
          <button class="event-countdown-badge" type="button">
            <span>⚡ ${ev.daysLeft}d left</span>
          </button>
        `;

        card.querySelector(".event-countdown-badge").addEventListener("click", () => {
          // Close drawer
          const settingsDrawer = document.getElementById("settingsDrawer");
          const drawerOverlay = document.getElementById("drawerOverlay");
          if (settingsDrawer) settingsDrawer.classList.remove("open");
          if (drawerOverlay) drawerOverlay.classList.remove("open");

          openPanel("book");
          setTimeout(() => {
            const form = document.querySelector("#bookingForm");
            if (form) {
              const nameInput = form.querySelector("input[name='name']");
              if (nameInput) nameInput.value = ev.name;
              const typeSelect = form.querySelector("#bookingEventType");
              if (typeSelect) {
                typeSelect.value = ev.type === "Anniversary" ? "Anniversary" : "Birthday";
                typeSelect.dispatchEvent(new Event("change"));
              }
            }
          }, 80);
        });

        container.appendChild(card);
      });
    } else {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px 20px; color: var(--soft); font-size: 14px;">
          🌳 No family members found. Add members to your family tree to track their upcoming events.
        </div>
      `;
    }
  };

  // Initialize Settings Drawer toggle
  const menuToggleBtn = document.getElementById("menuToggleBtn");
  const settingsDrawer = document.getElementById("settingsDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  if (menuToggleBtn && settingsDrawer && drawerOverlay && drawerCloseBtn) {
    const openDrawer = () => {
      settingsDrawer.classList.add("open");
      drawerOverlay.classList.add("open");
      if (typeof window.updateDrawerUpcomingEvents === "function") {
        window.updateDrawerUpcomingEvents();
      }
    };
    const closeDrawer = () => {
      settingsDrawer.classList.remove("open");
      drawerOverlay.classList.remove("open");
    };

    menuToggleBtn.addEventListener("click", openDrawer);
    drawerCloseBtn.addEventListener("click", closeDrawer);
    drawerOverlay.addEventListener("click", closeDrawer);
  }

  // Side Drawer Menu Item Clicks
  const drawerMenuItems = document.querySelectorAll(".drawer-menu-item");
  drawerMenuItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetPanel = item.dataset.menuPanel;
      
      // Close drawer
      const settingsDrawer = document.getElementById("settingsDrawer");
      const drawerOverlay = document.getElementById("drawerOverlay");
      if (settingsDrawer) settingsDrawer.classList.remove("open");
      if (drawerOverlay) drawerOverlay.classList.remove("open");

      // Open target panel
      openPanel(targetPanel);
    });
  });

  // Google Sheets Sync inside Settings Drawer
  const drawerGoogleSheetUrlInput = document.getElementById("drawerGoogleSheetUrlInput");
  const drawerSyncMsg = document.getElementById("drawerSyncStatusMessage");
  const drawerPullBtn = document.getElementById("drawerPullFromSheetsBtn");
  const drawerPushBtn = document.getElementById("drawerPushToSheetsBtn");
  const drawerSaveSyncBtn = document.getElementById("drawerSaveSyncConfigBtn");
  const drawerCopyBtn = document.getElementById("drawerCopyAppsScriptBtn");
  const drawerClearTreeBtn = document.getElementById("drawerClearTreeBtn");

  // Load URL from localstorage
  const syncConfigRaw = localStorage.getItem("happyCelebrationSyncConfig");
  if (syncConfigRaw && drawerGoogleSheetUrlInput) {
    try {
      const config = JSON.parse(syncConfigRaw);
      drawerGoogleSheetUrlInput.value = config.googleSheetUrl || "";
    } catch (e) {}
  }

  if (drawerSaveSyncBtn && drawerGoogleSheetUrlInput) {
    drawerSaveSyncBtn.addEventListener("click", () => {
      const url = drawerGoogleSheetUrlInput.value.trim();
      localStorage.setItem("happyCelebrationSyncConfig", JSON.stringify({ googleSheetUrl: url }));
      if (drawerSyncMsg) {
        drawerSyncMsg.style.color = "#a3e635";
        drawerSyncMsg.textContent = "Config saved locally.";
        setTimeout(() => { drawerSyncMsg.textContent = ""; }, 3000);
      }
    });
  }

  if (drawerPullBtn && drawerGoogleSheetUrlInput) {
    drawerPullBtn.addEventListener("click", () => {
      const url = drawerGoogleSheetUrlInput.value.trim();
      if (!url) {
        if (drawerSyncMsg) {
          drawerSyncMsg.style.color = "#f87171";
          drawerSyncMsg.textContent = "Please enter your Google Sheets URL first.";
        }
        return;
      }
      if (drawerSyncMsg) {
        drawerSyncMsg.style.color = "var(--gold-300)";
        drawerSyncMsg.textContent = "Pulling data...";
      }
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            localStorage.setItem("happyCelebrationFamily", JSON.stringify(data));
            if (drawerSyncMsg) {
              drawerSyncMsg.style.color = "#a3e635";
              drawerSyncMsg.textContent = "Synced successfully! Tree updated.";
              setTimeout(() => { drawerSyncMsg.textContent = ""; }, 3000);
            }
            if (getActivePanelTabName() === "family") {
              openPanel("family");
            }
            // Update the themes cards and countdown
            updateActiveTheme();
            updateAirtelThemePlanningCards();
          } else if (data.status === "error") {
            throw new Error(data.message);
          }
        })
        .catch(err => {
          console.error(err);
          if (drawerSyncMsg) {
            drawerSyncMsg.style.color = "#f87171";
            drawerSyncMsg.textContent = "Error pulling: " + err.message;
          }
        });
    });
  }

  if (drawerPushBtn && drawerGoogleSheetUrlInput) {
    drawerPushBtn.addEventListener("click", () => {
      const url = drawerGoogleSheetUrlInput.value.trim();
      if (!url) {
        if (drawerSyncMsg) {
          drawerSyncMsg.style.color = "#f87171";
          drawerSyncMsg.textContent = "Please enter your Google Sheets URL first.";
        }
        return;
      }
      if (drawerSyncMsg) {
        drawerSyncMsg.style.color = "var(--gold-300)";
        drawerSyncMsg.textContent = "Pushing data...";
      }
      const rawFamily = localStorage.getItem("happyCelebrationFamily");
      const localMembers = rawFamily ? JSON.parse(rawFamily) : [];

      const payload = localMembers.map(m => {
        const spouse = localMembers.find(s => s.id === m.spouseId);
        const parent = localMembers.find(p => p.id === m.parentId);
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
          email: m.email || "",
          isDeceased: m.isDeceased ? "Yes" : "No",
          deathDate: m.deathDate || ""
        };
      });

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then(data => {
        if (data.status === "success") {
          if (drawerSyncMsg) {
            drawerSyncMsg.style.color = "#a3e635";
            drawerSyncMsg.textContent = data.message || "Data pushed successfully!";
            setTimeout(() => { drawerSyncMsg.textContent = ""; }, 3000);
          }
        } else {
          throw new Error(data.message || "Sync failed.");
        }
      })
      .catch(err => {
        console.error(err);
        if (drawerSyncMsg) {
          drawerSyncMsg.style.color = "#f87171";
          drawerSyncMsg.textContent = "Error pushing: " + err.message;
        }
      });
    });
  }

  if (drawerCopyBtn) {
    drawerCopyBtn.addEventListener("click", () => {
      const scriptCode = `function doPost(e) {
  try {
    var postContent = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (Array.isArray(postContent)) {
      sheet.clear();
      var headers = ["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID", "Is Deceased", "Death Date"];
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
          m.email || "",
          m.isDeceased || "No",
          m.deathDate || ""
        ]);
      });
      return ContentService.createTextOutput(JSON.stringify({status: "success", message: "Successfully synced " + postContent.length + " members."}))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date", "Phone Number", "Email ID", "Is Deceased", "Death Date"]);
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
        postContent.email || "",
        postContent.isDeceased || "No",
        postContent.deathDate || ""
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
        if (key === "spouseid" || key === "spouse" || key === "spousename") key = "spouseId";
        if (key === "parentid" || key === "parent" || key === "parentname") key = "parentId";
        if (key === "birthdate" || key === "dob") key = "birthDate";
        if (key === "anniversarydate") key = "anniversaryDate";
        if (key === "phonenumber" || key === "phone") key = "phone";
        if (key === "emailid" || key === "email") key = "email";
        if (key === "isdeceased" || key === "deceased") {
          member["isDeceased"] = String(row[index] || "").toLowerCase() === "yes" || String(row[index] || "").toLowerCase() === "true";
          return;
        }
        if (key === "deathdate") key = "deathDate";
        
        member[key] = String(row[index] || "");
      });
      
      data.push(member);
    }
    
    data.forEach(function(m) {
      if (m.spouseId && !m.spouseId.startsWith("mem_")) {
        var trimmedSpouse = m.spouseId.trim().toLowerCase();
        var foundSpouse = data.find(function(s) { 
          return s.name && s.name.trim().toLowerCase() === trimmedSpouse; 
        });
        m.spouseId = foundSpouse ? foundSpouse.id : "";
      }
      if (m.parentId && !m.parentId.startsWith("mem_")) {
        var trimmedParent = m.parentId.trim().toLowerCase();
        var foundParent = data.find(function(p) { 
          return p.name && p.name.trim().toLowerCase() === trimmedParent; 
        });
        m.parentId = foundParent ? foundParent.id : "";
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
          const oldText = drawerCopyBtn.textContent;
          drawerCopyBtn.textContent = "Copied! ✓";
          setTimeout(() => { drawerCopyBtn.textContent = oldText; }, 2000);
        })
        .catch(err => {
          alert("Failed to copy code: " + err.message);
        });
    });
  }

  if (drawerClearTreeBtn) {
    drawerClearTreeBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all family tree data? This cannot be undone.")) {
        localStorage.removeItem("happyCelebrationFamily");
        if (drawerSyncMsg) {
          drawerSyncMsg.style.color = "#a3e635";
          drawerSyncMsg.textContent = "Local family data deleted.";
          setTimeout(() => { drawerSyncMsg.textContent = ""; }, 3000);
        }
        if (getActivePanelTabName() === "family") {
          openPanel("family");
        }
        updateActiveTheme();
        updateAirtelThemePlanningCards();
      }
    });
  }

  // Theme Planner Mock Date Picker & Style Selector Events
  const mockMonth = document.getElementById("mockMonth");
  const mockDay = document.getElementById("mockDay");
  const resetAutoThemeBtn = document.getElementById("resetAutoThemeBtn");

  if (resetAutoThemeBtn) {
    resetAutoThemeBtn.addEventListener("click", () => {
      window.currentThemeStyleIndex = -1;
      updateActiveTheme();
      updateAirtelThemePlanningCards();
    });
  }

  if (mockMonth && mockDay) {
    mockMonth.addEventListener("change", () => {
      updateActiveTheme();
      updateAirtelThemePlanningCards();
    });
    mockDay.addEventListener("change", () => {
      updateActiveTheme();
      updateAirtelThemePlanningCards();
    });
  }

  // Render static themes list of all 16 items
  renderStaticThemesList();

  // Trigger initial cards content and active theme load
  updateActiveTheme();
  updateAirtelThemePlanningCards();

}

// 6. Search Dialog Modal Logic
function showQuickSearchAlert() {
  let searchOverlay = document.getElementById("quickSearchOverlay");
  if (!searchOverlay) {
    searchOverlay = document.createElement("div");
    searchOverlay.id = "quickSearchOverlay";
    searchOverlay.className = "tree-modal-overlay";
    searchOverlay.innerHTML = `
      <div class="tree-modal-content" style="max-width: 340px; border: 1px solid var(--card-border); background: var(--card-bg-gradient);">
        <button type="button" class="profile-close-btn" id="searchCloseBtn" style="color: var(--gold-300); font-size: 24px; position: absolute; right: 15px; top: 10px; background: none; border: none; cursor: pointer;">&times;</button>
        <h4 style="margin-top: 0; margin-bottom: 12px; color: var(--gold-300); font-family: 'Outfit', sans-serif; font-size: 18px; letter-spacing: 0.5px;">Search Family members</h4>
        <div class="lux-form" style="padding: 0; border: none; background: none; box-shadow: none;">
          <label style="margin-bottom: 12px; display: block; text-align: left;">
            <span style="font-size: 13px; color: var(--gold-100); font-weight: 500;">Search names or relations</span>
            <input type="text" id="quickSearchInput" placeholder="Type name (e.g. Aleena, Rafi)..." style="width: 100%; min-height: 42px; padding: 10px; border-radius: 8px; border: 1px solid rgba(245, 199, 110, 0.4); background: rgba(30, 4, 12, 0.85); color: #fff; margin-top: 6px; font-family: inherit;">
          </label>
        </div>
        <div id="quickSearchResults" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding-right: 4px;">
          <p style="font-size: 12px; color: rgba(255, 255, 255, 0.5); text-align: center; margin: 10px 0;">Type to search members...</p>
        </div>
      </div>
    `;
    document.querySelector(".screen").appendChild(searchOverlay);
    
    // Close overlay
    searchOverlay.querySelector("#searchCloseBtn").addEventListener("click", () => {
      searchOverlay.style.display = "none";
      const activeTab = panelView.classList.contains("active") ? getActivePanelTabName() : "home";
      updateBottomNavActive(activeTab);
    });
    
    // Input key/input search listener
    const input = searchOverlay.querySelector("#quickSearchInput");
    input.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase().trim();
      const resultsContainer = searchOverlay.querySelector("#quickSearchResults");
      if (!val) {
        resultsContainer.innerHTML = '<p style="font-size: 12px; color: rgba(255, 255, 255, 0.5); text-align: center; margin: 10px 0;">Type to search members...</p>';
        return;
      }
      
      const raw = localStorage.getItem("happyCelebrationFamily");
      let members = [];
      if (raw) {
        try { members = JSON.parse(raw); } catch(err) {}
      }
      
      const filtered = members.filter(m => m.name.toLowerCase().includes(val) || (m.relation && m.relation.toLowerCase().includes(val)));
      
      if (filtered.length === 0) {
        resultsContainer.innerHTML = '<p style="font-size: 12px; color: #ff9aa2; text-align: center; margin: 10px 0;">No matching members found</p>';
      } else {
        resultsContainer.innerHTML = filtered.map(m => `
          <div class="search-result-item" style="padding: 10px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(245, 199, 110, 0.2); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; text-align: left;" data-id="${m.id}">
            <div>
              <span style="font-weight: 600; color: #fff; font-size: 13px; display: block;">${m.name}</span>
              <span style="font-size: 11px; color: var(--gold-300);">${m.relation || 'Relative'}</span>
            </div>
            <span style="font-size: 12px; color: var(--gold-300);">👉</span>
          </div>
        `).join("");
        
        resultsContainer.querySelectorAll(".search-result-item").forEach(item => {
          item.addEventListener("click", () => {
            const memberId = item.dataset.id;
            searchOverlay.style.display = "none";
            
            // Navigate to family tree panel
            openPanel("family");
            
            // Highlight and click the node
            setTimeout(() => {
              // Switch to the Preview tab inside family workspace
              const previewTabBtn = document.getElementById("previewTabBtn");
              if (previewTabBtn) {
                previewTabBtn.click();
              }
              
              setTimeout(() => {
                // Find node
                const nodeCard = document.querySelector(`#treeCanvas [data-id="${memberId}"]`);
                if (nodeCard) {
                  nodeCard.click();
                  nodeCard.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                }
              }, 200);
            }, 300);
          });
        });
      }
    });
  }
  
  searchOverlay.style.display = "flex";
  searchOverlay.querySelector("#quickSearchInput").value = "";
  searchOverlay.querySelector("#quickSearchInput").focus();
  searchOverlay.querySelector("#quickSearchResults").innerHTML = '<p style="font-size: 12px; color: rgba(255, 255, 255, 0.5); text-align: center; margin: 10px 0;">Type to search members...</p>';
}

function getActivePanelTabName() {
  if (!panelView.classList.contains("active")) return "home";
  const kicker = panelKicker.textContent.toLowerCase();
  const title = panelTitle.textContent.toLowerCase();
  if (title.includes("book") || kicker.includes("book")) return "book";
  if (title.includes("family") || kicker.includes("family")) return "family";
  if (title.includes("about") || kicker.includes("about") || title.includes("contact") || kicker.includes("support")) return "about";
  return "home";
}

// Initialise Dashboard features on ready
if (document.readyState === "interactive" || document.readyState === "complete") {
  initDashboardFeatures();
} else {
  document.addEventListener("DOMContentLoaded", initDashboardFeatures);
}
