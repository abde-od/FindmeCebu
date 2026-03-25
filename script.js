const technicianListEl = document.getElementById("technicianList");
const searchInputEl = document.getElementById("searchInput");
const barangayFilterEl = document.getElementById("barangayFilter");
const categoryRowEl = document.getElementById("categoryRow");
const resultCountEl = document.getElementById("resultCount");

const modalEl = document.getElementById("phoneModal");
const modalNameEl = document.getElementById("modalName");
const modalPhoneEl = document.getElementById("modalPhone");
const closeModalBtn = document.getElementById("closeModal");

const REPORTS_STORAGE_KEY = "shc_reports";
const reportModalEl = document.getElementById("reportModal");
const openReportModalBtn = document.getElementById("openReportModal");
const cancelReportBtn = document.getElementById("cancelReport");
const reportFormEl = document.getElementById("reportForm");
const reportFeedbackEl = document.getElementById("reportFeedback");
const reportNameEl = document.getElementById("reportName");
const reportContactEl = document.getElementById("reportContact");
const reportTypeEl = document.getElementById("reportType");
const reportTechIdEl = document.getElementById("reportTechId");
const reportMessageEl = document.getElementById("reportMessage");
const languageSelectorEl = document.getElementById("languageSelector");

let activeCategory = "All";
let activeBarangay = "All";
let searchTerm = "";

function peso(amount) {
  return `PHP ${amount.toLocaleString()}`;
}

function getTrans(key) {
  const lang = localStorage.getItem("shc_language") || "en";
  return translations[lang]?.[key] || translations.en[key] || key;
}

function getSavedReports() {
  const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReports(items) {
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(items));
}

function getFilteredCraftsmen() {
  return craftsmanList.filter((craftsman) => {
    const matchesCategory = activeCategory === "All" || craftsman.category === activeCategory;
    const matchesBarangay = activeBarangay === "All" || craftsman.barangay === activeBarangay;
    const text = `${craftsman.name} ${craftsman.category} ${craftsman.serves} ${craftsman.barangay}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesBarangay && matchesSearch;
  });
}

function renderBarangayOptions() {
  const barangays = [...new Set(craftsmanList.map((item) => item.barangay))].sort((a, b) => a.localeCompare(b));
  barangayFilterEl.innerHTML = ["All", ...barangays]
    .map((barangay) => `<option value="${barangay}">${barangay === "All" ? getTrans("allBarangays") : barangay}</option>`)
    .join("");
}

function renderReportTechnicianOptions() {
  if (!reportTechIdEl) return;

  reportTechIdEl.innerHTML = [
    `<option value="">${getTrans("selectTechnician")}</option>`,
    ...craftsmanList.map((item) => `<option value="${item.id}">${item.name} (${item.category})</option>`)
  ].join("");
}

function renderTechnicians() {
  const items = getFilteredCraftsmen();

  technicianListEl.innerHTML = items
    .map((item) => {
      const verifiedBadge = getTrans(item.verified ? "verified" : "pending");
      const status = item.verified
        ? `<span class="badge verified">${verifiedBadge}</span>`
        : `<span class="badge pending">${verifiedBadge}</span>`;

      return `
      <article class="tech-card">
        <img class="tech-photo" src="${item.image}" alt="${item.name} at work" loading="lazy">
        <div class="tech-meta">
          <h3>${item.name}${status}</h3>
          <p><strong>${item.category}</strong> · Rating ${item.rating.toFixed(1)} ★ · ${item.jobsCompleted} ${getTrans("jobsCompleted")}</p>
          <div class="tech-info">
            <span>${getTrans("available")}: ${item.available}</span>
            <span>${getTrans("serves")}: ${item.serves}</span>
            <span>${getTrans("barangay")}: ${item.barangay}</span>
            <span>${getTrans("starting")}: ${peso(item.startPrice)}</span>
          </div>
          <div class="tech-actions">
            <button class="solid-btn" data-action="show-number" data-id="${item.id}" type="button">${getTrans("showNumber")}</button>
            <a class="accent-btn" href="${item.whatsapp}" target="_blank" rel="noreferrer">${getTrans("whatsapp")}</a>
          </div>
        </div>
      </article>
      `;
    })
    .join("");

  if (!items.length) {
    technicianListEl.innerHTML = `<article class="tech-card"><div class="tech-meta"><h3>${getTrans("noTechniciansFound")}</h3><p>${getTrans("tryAnotherSearch")}</p></div></article>`;
  }

  const count = items.length;
  const techLabel = count === 1 ? getTrans("technician") : getTrans("technicians");
  resultCountEl.textContent = `${count} ${techLabel} ${getTrans("shown")}`;
}

function setupFilters() {
  categoryRowEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    document.querySelectorAll(".category-chip").forEach((chip) => {
      chip.classList.toggle("active", chip === button);
    });
    renderTechnicians();
  });

  searchInputEl.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    renderTechnicians();
  });

  barangayFilterEl.addEventListener("change", (event) => {
    activeBarangay = event.target.value;
    renderTechnicians();
  });
}

function setupActions() {
  technicianListEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='show-number']");
    if (!button) return;
    const selectedId = Number(button.dataset.id);
    const craftsman = craftsmanList.find((item) => item.id === selectedId);
    if (!craftsman) return;
    modalNameEl.textContent = craftsman.name;
    modalPhoneEl.textContent = craftsman.phone;
    modalEl.classList.add("open");
    modalEl.setAttribute("aria-hidden", "false");
  });

  closeModalBtn.addEventListener("click", () => {
    modalEl.classList.remove("open");
    modalEl.setAttribute("aria-hidden", "true");
  });

  modalEl.addEventListener("click", (event) => {
    if (event.target === modalEl) {
      modalEl.classList.remove("open");
      modalEl.setAttribute("aria-hidden", "true");
    }
  });
}

function closeReportModal() {
  reportModalEl.classList.remove("open");
  reportModalEl.setAttribute("aria-hidden", "true");
}

function setupReportForm() {
  if (!reportFormEl || !openReportModalBtn) return;

  openReportModalBtn.addEventListener("click", () => {
    reportFeedbackEl.textContent = "";
    reportModalEl.classList.add("open");
    reportModalEl.setAttribute("aria-hidden", "false");
  });

  cancelReportBtn.addEventListener("click", () => {
    closeReportModal();
  });

  reportModalEl.addEventListener("click", (event) => {
    if (event.target === reportModalEl) {
      closeReportModal();
    }
  });

  reportFormEl.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = reportMessageEl.value.trim();
    if (message.length < 10) {
      reportFeedbackEl.textContent = getTrans("reportTooShort");
      reportFeedbackEl.classList.add("error");
      return;
    }

    const reports = getSavedReports();
    reports.unshift({
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      name: reportNameEl.value.trim(),
      contact: reportContactEl.value.trim(),
      type: reportTypeEl.value,
      technicianId: reportTechIdEl.value ? Number(reportTechIdEl.value) : null,
      technicianName: reportTechIdEl.selectedOptions[0]?.textContent || "",
      message,
      status: "New"
    });

    saveReports(reports);
    reportFormEl.reset();
    reportFeedbackEl.textContent = getTrans("reportSuccess");
    reportFeedbackEl.classList.remove("error");

    setTimeout(() => {
      closeReportModal();
      reportFeedbackEl.textContent = "";
    }, 1000);
  });
}

function setupLanguageRefresh() {
  if (!languageSelectorEl) return;

  languageSelectorEl.addEventListener("change", () => {
    setTimeout(() => {
      renderBarangayOptions();
      renderReportTechnicianOptions();
      renderTechnicians();
    }, 0);
  });
}

function setupSmoothScrollOffset() {
  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      const offset = document.querySelector(".site-header").offsetHeight + 10;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

renderBarangayOptions();
renderReportTechnicianOptions();
renderTechnicians();
setupFilters();
setupActions();
setupReportForm();
setupSmoothScrollOffset();
setupLanguageRefresh();
