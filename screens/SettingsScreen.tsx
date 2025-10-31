// ✅ src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { settingsService, Settings } from "../services/settingsService";
import { langService } from "../services/langService";

export const SettingsScreen: React.FC = () => {
  const { setScreen } = useAppContext();
  const [settings, setSettings] = useState<Settings>(settingsService.get());

  // تحميل الإعدادات عند فتح الصفحة
  useEffect(() => {
    setSettings(settingsService.get());
  }, []);

  // تحديث الإعدادات فوراً وتطبيقها
  const updateSetting = (key: keyof Settings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    settingsService.update({ [key]: value });
  };

  // مسح الكاش
  const clearCache = () => {
    if (window.confirm(langService.t("confirmClear") || "Are you sure you want to clear cache?")) {
      localStorage.clear();
      alert(langService.t("cacheCleared") || "Cache cleared successfully ✅");
      window.location.reload();
    }
  };

  // خيارات الإعدادات
  const options = [
    { label: langService.t("theme"), key: "theme", values: ["light", "dark", "system"] },
    { label: langService.t("fontSize"), key: "fontSize", values: ["small", "medium", "large"] },
    { label: langService.t("quality"), key: "quality", values: ["auto", "1080p", "720p", "480p"] },
    { label: langService.t("subtitleLang"), key: "subtitleLang", values: ["off", "ar", "en"] },
    { label: langService.t("appLang"), key: "appLang", values: ["ar", "en"] },
  ];

  // ترجمة القيم
  const renderLabel = (key: keyof Settings, value: string) => {
    const lang = langService.currentLang;
    const maps: Record<string, Record<string, string>> = {
      theme: {
        light: lang === "ar" ? "فاتح" : "Light",
        dark: lang === "ar" ? "داكن" : "Dark",
        system: lang === "ar" ? "افتراضي النظام" : "System Default",
      },
      fontSize: {
        small: lang === "ar" ? "صغير" : "Small",
        medium: lang === "ar" ? "متوسط" : "Medium",
        large: lang === "ar" ? "كبير" : "Large",
      },
      quality: {
        auto: lang === "ar" ? "تلقائي" : "Auto",
        "1080p": "1080p",
        "720p": "720p",
        "480p": "480p",
      },
      subtitleLang: {
        off: lang === "ar" ? "إيقاف" : "Off",
        ar: lang === "ar" ? "العربية" : "Arabic",
        en: lang === "ar" ? "الإنجليزية" : "English",
      },
      appLang: { ar: "العربية", en: "English" },
    };

    // ✅ إصلاح الخطأ السادس هنا
    return maps[key as string]?.[value] || value;
  };

  return (
    <div
      className={`min-h-screen ${
        settings.theme === "dark" ? "bg-[#0D0D12]" : "bg-gray-100"
      } text-white flex flex-col items-center p-6 transition-colors duration-300`}
    >
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between w-full max-w-2xl mb-6">
        <button
          onClick={() => setScreen("home")}
          className="text-gray-400 hover:text-white text-lg"
        >
          {langService.t("back") || "← Back"}
        </button>
        <h1 className="text-2xl font-bold text-center">
          ⚙️ {langService.t("settings") || "Settings"}
        </h1>
        <div className="w-10" />
      </div>

      {/* قائمة الإعدادات */}
      <div className="w-full max-w-2xl bg-[#1A1A24] rounded-2xl shadow-lg p-4 space-y-4">
        {options.map((opt) => (
          <div
            key={opt.key}
            className="flex justify-between items-center bg-[#242430] hover:bg-[#2e2e3c] rounded-xl p-4 transition"
          >
            <span className="text-sm text-gray-300">{opt.label}</span>
            <select
              value={settings[opt.key]}
              onChange={(e) => updateSetting(opt.key as keyof Settings, e.target.value)}
              className="bg-[#2E2E3C] text-white rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-purple-500"
            >
              {opt.values.map((v) => (
                <option key={v} value={v}>
                  {renderLabel(opt.key as keyof Settings, v)}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* زر مسح الكاش */}
        <div className="flex justify-between items-center bg-[#2e1c1c] rounded-xl p-4">
          <span className="text-sm text-red-400">
            {langService.t("clearCache") || "Clear Cache"}
          </span>
          <button
            onClick={clearCache}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg px-4 py-1 transition"
          >
            {langService.currentLang === "ar" ? "مسح" : "Clear"}
          </button>
        </div>
      </div>

      {/* قسم حول التطبيق */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p className="font-semibold text-white">Purple IPTV v1.0</p>
        <p>
          {langService.t("developedBy") || "Developed with ❤️ in Jordan by"}{" "}
          <span className="text-purple-400">حمزة السردي ❤️</span>
        </p>
        <p className="mt-1">{langService.t("copyright") || "© 2025 All rights reserved"}</p>
      </div>
    </div>
  );
};

export default SettingsScreen;
