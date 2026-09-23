const REMEMBERED_EMAIL_KEY = "tajlandia_remembered_email";
const REMEMBER_ME_FLAG_KEY = "tajlandia_remember_me";

export function saveRememberedLogin(email: string, rememberMe: boolean): void {
  try {
    if (rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      localStorage.setItem(REMEMBER_ME_FLAG_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_ME_FLAG_KEY);
    }
  } catch {
    // Ignore storage failures without blocking login.
  }
}

export function getRememberedLogin(): { email: string; rememberMe: boolean } | null {
  try {
    const email = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    return email
      ? { email, rememberMe: localStorage.getItem(REMEMBER_ME_FLAG_KEY) === "true" }
      : null;
  } catch {
    return null;
  }
}