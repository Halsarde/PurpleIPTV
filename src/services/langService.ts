// ✅ src/services/langService.ts

type Lang = "ar" | "en";

type Translations = Record<string, { ar: string; en: string }>;

const messages: Translations = {
  settings: { ar: "الإعدادات", en: "Settings" },
  back: { ar: "رجوع", en: "Back" },
  clearCache: { ar: "مسح الكاش", en: "Clear Cache" },
  confirmClear: {
    ar: "هل أنت متأكد من مسح الكاش؟",
    en: "Are you sure you want to clear cache?",
  },
  cacheCleared: {
    ar: "تم مسح الكاش بنجاح ✅",
    en: "Cache cleared successfully ✅",
  },
  developedBy: {
    ar: "تم تطويره بحب في الأردن من قبل",
    en: "Developed with ❤️ in Jordan by",
  },
  theme: { ar: "السمة", en: "Theme" },
  fontSize: { ar: "حجم الخط", en: "Font Size" },
  quality: { ar: "الجودة", en: "Quality" },
  subtitleLang: { ar: "لغة الترجمة", en: "Subtitle Language" },
  appLang: { ar: "لغة التطبيق", en: "App Language" },
};

let currentLang: Lang = "ar";

export const langService = {
  get currentLang() {
    return currentLang;
  },

  setLang(lang: Lang) {
    currentLang = lang;
    localStorage.setItem("purple_lang", lang);
  },

  load() {
    const stored = localStorage.getItem("purple_lang") as Lang | null;
    if (stored === "en" || stored === "ar") currentLang = stored;
  },

  t(key: keyof typeof messages): string {
    const msg = messages[key];
    if (!msg) return key;
    return msg[currentLang] || key;
  },
};
