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

  if (regDataRaw) {
    const data = JSON.parse(regDataRaw);
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
      const form = root.querySelector("#bookingForm");
      const note = root.querySelector("#bookingNote");

      const monthSel = root.querySelector("#bookingMonth");
      const daySel = root.querySelector("#bookingDay");
      const yearSel = root.querySelector("#bookingYear");

      // Populate Days (1 to 31)
      if (daySel) {
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
        if (form.eventType) form.eventType.value = window.prefilledBooking.eventType || "Birthday";
        if (window.prefilledBooking.date && monthSel && daySel && yearSel) {
          const parts = window.prefilledBooking.date.split("/");
          if (parts.length === 3) {
            monthSel.value = parts[0];
            daySel.value = parts[1];
            yearSel.value = parts[2];
          }
        }
        if (form.guests) form.guests.value = 100;
        window.prefilledBooking = null; // Clear prefill
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

        localStorage.setItem("happyCelebrationBooking", JSON.stringify(data));
        note.textContent = "Booking request saved. We will contact you shortly.";
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

        const familyEditorView = root.querySelector("#familyEditorView");
        const familyPreviewView = root.querySelector("#familyPreviewView");

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

        // Tab Switching Event Listeners
        editorTabBtn.addEventListener("click", () => {
          editorTabBtn.classList.add("active");
          previewTabBtn.classList.remove("active");
          
          familyEditorView.style.display = "flex";
          familyPreviewView.style.display = "none";
          renderMemberList();
        });

        previewTabBtn.addEventListener("click", () => {
          previewTabBtn.classList.add("active");
          editorTabBtn.classList.remove("active");
          
          familyEditorView.style.display = "none";
          familyPreviewView.style.display = "block";
          renderTree();
          setTimeout(fitToScreen, 50);
        });

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
            const headers = ["Member ID", "Name", "Gender", "Relation", "Spouse Name", "Parent Name", "Birth Date", "Anniversary Date"];
            
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
                m.anniversaryDate || ""
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
              anniversaryDate: ""
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
                anniversaryDate: ""
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
                  anniversaryDate: ""
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
                    anniversaryDate: member.anniversaryDate
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
                        anniversaryDate: ""
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
                anniversaryDate: ""
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
                anniversaryDate: ""
              };
              members.push(childMember);
            }
          }

          localStorage.setItem("happyCelebrationFamily", JSON.stringify(members));
          updateRegistrationState(); // Update home banner
          closeModal();
          renderMemberList();
          renderTree();
        });

        // Event delegation on tree canvas
        treeCanvas.addEventListener("click", (e) => {
          const card = e.target.closest(".tree-node-card");
          if (card) {
            const memberId = card.dataset.id;
            openModal("edit", memberId);
            return;
          }
          const addFirstBtn = e.target.closest("#addFirstMemberBtn");
          if (addFirstBtn) {
            openModal("add-root");
          }
        });

        // Render editor member rows
        function renderMemberList() {
          if (!members.length) {
            membersListList.innerHTML = `
              <div class="empty-tree-container" style="padding: 32px 16px;">
                <p class="empty-tree-message">Your family tree is empty. Add the first member to begin!</p>
              </div>
            `;
            return;
          }
          
          membersListList.innerHTML = members.map(m => {
            const initials = m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            const genderClass = m.gender.toLowerCase();
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
                  <button type="button" class="secondary-action edit-row-btn" data-id="${m.id}">Edit</button>
                  <button type="button" class="danger-action delete-row-btn" data-id="${m.id}">Delete</button>
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
    title: "Register",
    kicker: "Guest Entry",
    template: "registerTemplate",
    setup(root) {
      function renderRegisterView() {
        const regDataRaw = localStorage.getItem("happyCelebrationRegistration");
        if (regDataRaw) {
          const data = JSON.parse(regDataRaw);
          root.innerHTML = `
            <div class="lux-form" style="padding: 22px 20px; text-align: center; display: grid; gap: 16px;">
              <div style="font-size: 48px; margin-bottom: 8px;">👤</div>
              <h3 style="margin: 0; color: var(--gold-100); font-family: Georgia, serif; font-size: 24px;">${escapeHtml(data.fullName)}</h3>
              <p style="margin: 0; color: var(--gold-300); font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">${escapeHtml(data.role)}</p>
              
              <div style="text-align: left; background: rgba(0,0,0,0.25); border-radius: 12px; padding: 16px; border: 1px solid rgba(245,199,110,0.15); font-size: 13px; display: grid; gap: 10px; margin: 8px 0;">
                <div><strong style="color: var(--soft);">Phone:</strong> <span style="color: #fff;">${escapeHtml(data.phone)}</span></div>
                ${data.emailId ? `<div><strong style="color: var(--soft);">Email ID:</strong> <span style="color: #fff;">${escapeHtml(data.emailId)}</span></div>` : ""}
              </div>
              
              <button class="danger-action" id="logoutBtn" type="button" style="min-height: 44px; font-weight: 700; width: 100%;">Log Out</button>
            </div>
          `;
          
          root.querySelector("#logoutBtn").addEventListener("click", () => {
            if (confirm("Are you sure you want to log out / clear your profile?")) {
              localStorage.removeItem("happyCelebrationRegistration");
              updateRegistrationState();
              renderRegisterView();
            }
          });
        } else {
          root.innerHTML = `
            <form class="lux-form" id="registerForm">
              <label>
                <span>Full Name</span>
                <input name="fullName" type="text" placeholder="Your name" required autocomplete="off">
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" type="tel" placeholder="+91 98765 43210" required autocomplete="off">
              </label>
              <label>
                <span>Email ID</span>
                <input name="emailId" type="email" placeholder="example@domain.com" autocomplete="off">
              </label>
              <label>
                <span>Role</span>
                <select name="role" required>
                  <option value="Guest">Guest</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Organizer">Organizer</option>
                </select>
              </label>
              <button class="primary-action" type="submit" style="width: 100%;">Register</button>
              <p class="form-note" id="registerNote"></p>
            </form>
          `;
          
          const form = root.querySelector("#registerForm");
          const note = root.querySelector("#registerNote");
          form.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = Object.fromEntries(new FormData(form));
            localStorage.setItem("happyCelebrationRegistration", JSON.stringify(formData));
            
            const nameLower = formData.fullName.toLowerCase();
            if (nameLower.includes("amjad")) {
              const currentFamily = localStorage.getItem("happyCelebrationFamily");
              if (!currentFamily || JSON.parse(currentFamily).length === 0) {
                // Prepopulate with default family tree data, including birthdays and anniversaries!
                const demoFamily = [
                  { id: "grandparent", name: "Grandparent", gender: "Male", relation: "Grandparent", spouseId: "", birthDate: "05/12/1950", anniversaryDate: "" },
                  { id: "aleena", name: "Aleena", gender: "Female", relation: "Parent", parentId: "grandparent", spouseId: "", birthDate: "09/18/1982", anniversaryDate: "" },
                  { id: "alisha", name: "Alisha", gender: "Female", relation: "Parent", parentId: "grandparent", spouseId: "rafi", birthDate: "10/12/1986", anniversaryDate: "06/23/2014" },
                  { id: "rafi", name: "Rafi", gender: "Male", relation: "Parent", parentId: "", spouseId: "alisha", birthDate: "04/05/1984", anniversaryDate: "06/23/2014" },
                  { id: "amjad", name: "Amjad", gender: "Male", relation: "Parent", parentId: "grandparent", spouseId: "subeena", birthDate: "08/14/1985", anniversaryDate: "03/12/2012" },
                  { id: "subeena", name: "Subeena", gender: "Female", relation: "Parent", parentId: "", spouseId: "amjad", birthDate: "11/20/1988", anniversaryDate: "03/12/2012" },
                  { id: "adab", name: "Adab", gender: "Female", relation: "Child", parentId: "alisha", spouseId: "", birthDate: "06/15/2018", anniversaryDate: "" },
                  { id: "ali", name: "Ali", gender: "Male", relation: "Child", parentId: "alisha", spouseId: "", birthDate: "11/02/2020", anniversaryDate: "" },
                  { id: "eva", name: "Eva", gender: "Female", relation: "Child", parentId: "amjad", spouseId: "", birthDate: "06/09/2016", anniversaryDate: "" }
                ];
                localStorage.setItem("happyCelebrationFamily", JSON.stringify(demoFamily));
              }
            }
            
            updateRegistrationState();
            note.textContent = `${formData.fullName} is registered.`;
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
}

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
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

