// ✅ src/services/settingsService.ts
export type Settings = {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  quality: "auto" | "1080p" | "720p" | "480p";
  subtitleLang: "off" | "ar" | "en";
  appLang: "ar" | "en";
};

// الإعدادات الافتراضية
const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  fontSize: "medium",
  quality: "auto",
  subtitleLang: "off",
  appLang: "ar",
};

// ✅ خدمة إدارة الإعدادات (تخزين واسترجاع)
const STORAGE_KEY = "purple_settings";

export const settingsService = {
  get(): Settings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  update(newSettings: Partial<Settings>) {
    try {
      const current = this.get();
      const merged = { ...current, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.error("⚠️ Failed to update settings:", e);
    }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
