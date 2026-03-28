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
const paymentsLoadingEl = document.getElementById("paymentsLoading");
const reportsLoadingEl = document.getElementById("reportsLoading");
const toastContainerEl = document.getElementById("toastContainer");

const REPORTS_STORAGE_KEY = "shc_reports";
let adminRenderTimeoutId;
let reportsRenderTimeoutId;

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

function showToast(message, type = "success") {
  if (!toastContainerEl) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainerEl.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2200);
}

function setAdminLoading(isLoading) {
  if (paymentsLoadingEl) {
    paymentsLoadingEl.hidden = !isLoading;
  }
}

function setReportsLoading(isLoading) {
  if (reportsLoadingEl) {
    reportsLoadingEl.hidden = !isLoading;
  }
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

  paymentRowsEl.innerHTML = craftsmanList.length
    ? craftsmanList
    .map(
      (item) => `
      <tr>
        <td data-label="${getTrans("techName")}">${item.name}</td>
        <td data-label="${getTrans("amountDue")}">${peso(item.amountDue)}</td>
        <td data-label="${getTrans("status")}" class="cell-status ${item.paymentStatus === "PAID" ? "status-paid" : "status-due"}">${item.paymentStatus === "PAID" ? getTrans("paid") : getTrans("due")}</td>
      </tr>
    `
    )
    .join("")
    : `<tr><td colspan="3" class="empty-state">${getTrans("noTechniciansFound")}</td></tr>`;

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
        <td data-label="${getTrans("date")}">${formatDateTime(item.createdAt)}</td>
        <td data-label="${getTrans("name")}">${escapeHtml(item.name)}</td>
        <td data-label="${getTrans("contact")}">${escapeHtml(item.contact)}</td>
        <td data-label="${getTrans("concernType")}">${reportTypeLabel(item.type)}</td>
        <td data-label="${getTrans("message")}">${escapeHtml(item.message)}</td>
        <td data-label="${getTrans("status")}" class="cell-status">
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

function queueAdminRender() {
  window.clearTimeout(adminRenderTimeoutId);
  setAdminLoading(true);
  adminRenderTimeoutId = window.setTimeout(() => {
    renderAdmin();
    setAdminLoading(false);
  }, 120);
}

function queueReportsRender() {
  window.clearTimeout(reportsRenderTimeoutId);
  setReportsLoading(true);
  reportsRenderTimeoutId = window.setTimeout(() => {
    renderReportsInbox();
    setReportsLoading(false);
  }, 120);
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
    queueReportsRender();
    showToast(getTrans("statusUpdated"), "success");
  });
}

function setupLogout() {
  logoutBtn.addEventListener("click", async () => {
    try {
      await window.Auth.signOut();
    } catch {
      // no-op
    }
    window.location.href = "login.html";
  });
}

function setupLanguageRefresh() {
  if (!languageSelectorEl) return;

  languageSelectorEl.addEventListener("change", () => {
    setTimeout(() => {
      queueAdminRender();
      queueReportsRender();
    }, 0);
  });
}

async function bootstrapAdmin() {
  if (!window.Auth || !window.Auth.isConfigured()) {
    reportsEmptyEl.style.display = "block";
    reportsEmptyEl.textContent = "Auth is not configured. Set Supabase values in supabase-config.js.";
    return;
  }

  const access = await window.Auth.requireAdminSession({
    redirectTo: "login.html",
    noAccessRedirect: "index.html"
  });

  if (!access.allowed) return;

  queueAdminRender();
  queueReportsRender();
  setupLogout();
  setupReportsActions();
  setupLanguageRefresh();
}

bootstrapAdmin();
