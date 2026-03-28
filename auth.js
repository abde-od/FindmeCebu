window.Auth = (() => {
  let client;

  function isConfigured() {
    return (
      typeof SUPABASE_URL === "string" &&
      SUPABASE_URL.startsWith("http") &&
      typeof SUPABASE_ANON_KEY === "string" &&
      SUPABASE_ANON_KEY.length > 20
    );
  }

  function getClient() {
    if (!isConfigured()) {
      throw new Error("Supabase is not configured. Update SUPABASE_URL and SUPABASE_ANON_KEY.");
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase SDK is not loaded.");
    }

    if (!client) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }

    return client;
  }

  function isAdminEmail(email) {
    if (!Array.isArray(ADMIN_ALLOWED_EMAILS)) return false;
    return ADMIN_ALLOWED_EMAILS.map((item) => String(item).toLowerCase()).includes(String(email || "").toLowerCase());
  }

  async function getSession() {
    const supabase = getClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function signIn(email, password) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const supabase = getClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function requireAdminSession(options = {}) {
    const redirectTo = options.redirectTo || "login.html";
    const noAccessRedirect = options.noAccessRedirect || "index.html";

    try {
      const session = await getSession();
      if (!session) {
        window.location.href = redirectTo;
        return { allowed: false, session: null };
      }

      const email = session.user?.email;
      if (!isAdminEmail(email)) {
        await signOut();
        window.location.href = noAccessRedirect;
        return { allowed: false, session: null };
      }

      return { allowed: true, session };
    } catch {
      window.location.href = redirectTo;
      return { allowed: false, session: null };
    }
  }

  return {
    isConfigured,
    getSession,
    signIn,
    signOut,
    requireAdminSession,
    isAdminEmail
  };
})();
