const loginFormEl = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const loginBtnEl = document.getElementById("loginBtn");
const loginMessageEl = document.getElementById("loginMessage");
const toastContainerEl = document.getElementById("toastContainer");

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainerEl.append(toast);
  window.setTimeout(() => toast.remove(), 2200);
}

function setLoading(isLoading) {
  loginBtnEl.disabled = isLoading;
  loginBtnEl.textContent = isLoading ? "Signing in..." : "Login to Admin";
}

async function redirectIfAlreadyLoggedIn() {
  if (!window.Auth || !window.Auth.isConfigured()) return;
  const session = await window.Auth.getSession();
  if (!session) return;

  const email = session.user?.email;
  if (window.Auth.isAdminEmail(email)) {
    window.location.href = "admin.html";
  }
}

loginFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMessageEl.textContent = "";
  loginMessageEl.classList.remove("error");
  setLoading(true);

  try {
    if (!window.Auth || !window.Auth.isConfigured()) {
      throw new Error("Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY first.");
    }

    const email = emailEl.value.trim();
    const password = passwordEl.value;

    const result = await window.Auth.signIn(email, password);
    const signedEmail = result.user?.email || email;

    if (!window.Auth.isAdminEmail(signedEmail)) {
      await window.Auth.signOut();
      throw new Error("This account is not allowed to access admin dashboard.");
    }

    showToast("Login successful.", "success");
    window.location.href = "admin.html";
  } catch (error) {
    loginMessageEl.textContent = error.message || "Login failed.";
    loginMessageEl.classList.add("error");
    showToast(error.message || "Login failed.", "error");
  } finally {
    setLoading(false);
  }
});

redirectIfAlreadyLoggedIn();
