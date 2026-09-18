export type SettingsLanguage = "EN" | "PL";

export type DashboardSettings = {
  language: SettingsLanguage;
  emailNotifications: boolean;
};

const SETTINGS_KEY = "tajlandia_dashboard_settings";

export const defaultDashboardSettings: DashboardSettings = {
  language: "EN",
  emailNotifications: true,
};

export function getDashboardSettings(): DashboardSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaultDashboardSettings;

    const parsed = JSON.parse(stored) as Partial<DashboardSettings>;
    return {
      language: parsed.language === "PL" ? "PL" : "EN",
      emailNotifications: parsed.emailNotifications !== false,
    };
  } catch {
    return defaultDashboardSettings;
  }
}

export function saveDashboardSettings(settings: DashboardSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Keep the form usable when browser storage is unavailable.
  }
}
