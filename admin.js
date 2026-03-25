const ADMIN_SESSION_KEY = "shc_admin_auth";
const ADMIN_PASSWORD = "abde&philipin2003";

const totalTechsEl = document.getElementById("totalTechs");
const totalCallsEl = document.getElementById("totalCalls");
const verifiedTechsEl = document.getElementById("verifiedTechs");
const totalRevenueEl = document.getElementById("totalRevenue");
const paymentRowsEl = document.getElementById("paymentRows");
const alertListEl = document.getElementById("alertList");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelectorEl = document.getElementById("languageSelector");
const reportRowsEl = document.getElementById("reportRows");
const reportsEmptyEl = document.getElementById("reportsEmpty");

const REPORTS_STORAGE_KEY = "shc_reports";

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

function formatDateTime(isoDate) {
  const lang = localStorage.getItem("shc_language") || "en";
  const locale = lang === "tl" ? "fil-PH" : "en-PH";
  return new Date(isoDate).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusClassName(status) {
  if (status === "Resolved") return "status-paid";
  if (status === "In Review") return "status-pending";
  return "status-due";
}

function statusLabel(status) {
  if (status === "Resolved") return getTrans("statusResolved");
  if (status === "In Review") return getTrans("statusInReview");
  return getTrans("statusNew");
}

function reportTypeLabel(type) {
  const map = {
    "Report Technician": "typeReportTech",
    "Service Complaint": "typeServiceComplaint",
    Suggestion: "typeSuggestion",
    Other: "typeOther"
  };

  return getTrans(map[type] || "typeOther");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function requireAdminAccess() {
  const hasSession = localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  if (hasSession) return true;

  const input = window.prompt("Admin access only. Enter admin password:");
  if (input === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "true");
    return true;
  }

  window.alert("Access denied. Redirecting to customer page.");
  window.location.href = "index.html";
  return false;
}

function renderAdmin() {
  const verifiedCount = craftsmanList.filter((item) => item.verified).length;
  const totalCalls = craftsmanList.reduce((sum, item) => sum + item.callsHandled, 0);
  const revenue = craftsmanList
    .filter((item) => item.paymentStatus === "PAID")
    .reduce((sum, item) => sum + item.amountDue, 0);

  totalTechsEl.textContent = String(craftsmanList.length);
  totalCallsEl.textContent = String(totalCalls);
  verifiedTechsEl.textContent = String(verifiedCount);
  totalRevenueEl.textContent = peso(revenue);

  paymentRowsEl.innerHTML = craftsmanList
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${peso(item.amountDue)}</td>
        <td class="${item.paymentStatus === "PAID" ? "status-paid" : "status-due"}">${item.paymentStatus === "PAID" ? getTrans("paid") : getTrans("due")}</td>
      </tr>
    `
    )
    .join("");

  const pendingTech = craftsmanList.find((item) => !item.verified)?.name || getTrans("noRegistrations");
  const paidTech = craftsmanList.find((item) => item.paymentStatus === "PAID")?.name || getTrans("noPaymentUpdates");

  const alerts = [
    `${getTrans("newTechRegistration")}: ${pendingTech}`,
    `${getTrans("paymentReceived")}: ${paidTech}`,
    `${getTrans("verifiedTechs")}: ${verifiedCount} / ${craftsmanList.length}`
  ];

  alertListEl.innerHTML = alerts.map((line) => `<li>${line}</li>`).join("");
}

function renderReportsInbox() {
  const reports = getSavedReports();

  reportsEmptyEl.style.display = reports.length ? "none" : "block";

  reportRowsEl.innerHTML = reports
    .map(
      (item) => `
      <tr>
        <td>${formatDateTime(item.createdAt)}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.contact)}</td>
        <td>${reportTypeLabel(item.type)}</td>
        <td>${escapeHtml(item.message)}</td>
        <td>
          <select class="report-status ${statusClassName(item.status)}" data-report-id="${item.id}">
            <option value="New" ${item.status === "New" ? "selected" : ""}>${getTrans("statusNew")}</option>
            <option value="In Review" ${item.status === "In Review" ? "selected" : ""}>${getTrans("statusInReview")}</option>
            <option value="Resolved" ${item.status === "Resolved" ? "selected" : ""}>${getTrans("statusResolved")}</option>
          </select>
        </td>
      </tr>
    `
    )
    .join("");
}

function setupReportsActions() {
  reportRowsEl.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-report-id]");
    if (!select) return;

    const reports = getSavedReports();
    const index = reports.findIndex((item) => item.id === select.dataset.reportId);
    if (index === -1) return;

    reports[index].status = select.value;
    saveReports(reports);
    renderReportsInbox();
  });
}

function setupLogout() {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = "index.html";
  });
}

function setupLanguageRefresh() {
  if (!languageSelectorEl) return;

  languageSelectorEl.addEventListener("change", () => {
    setTimeout(() => {
      renderAdmin();
      renderReportsInbox();
    }, 0);
  });
}

if (requireAdminAccess()) {
  renderAdmin();
  renderReportsInbox();
  setupLogout();
  setupReportsActions();
  setupLanguageRefresh();
}
