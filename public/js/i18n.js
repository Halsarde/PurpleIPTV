const RES = {
  ar: {
    "app.name": "Purple IPTV",
    "action.search": "بحث",
    "action.settings": "الإعدادات",
    "action.quickPlay": "تشغيل سريع",
    "action.clear": "مسح",
    "hero.title": "استمتع بتجربة مشاهدة مميزة",
    "hero.subtitle": "بث مباشر وفيديو عند الطلب بأعلى جودة",
    "section.live": "قنوات مباشرة",
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.theme": "السمة",
    "settings.dark": "داكن",
    "settings.light": "فاتح",
    "settings.system": "النظام",
    "player.reconnecting": "جارِ إعادة الاتصال…",
    "player.unavailable": "البث غير متاح حالياً",
    "player.error": "حدث خطأ أثناء التشغيل"
  },
  en: {
    "app.name": "Purple IPTV",
    "action.search": "Search",
    "action.settings": "Settings",
    "action.quickPlay": "Quick Play",
    "action.clear": "Clear",
    "hero.title": "Enjoy a premium viewing experience",
    "hero.subtitle": "Live and on-demand at top quality",
    "section.live": "Live Channels",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.dark": "Dark",
    "settings.light": "Light",
    "settings.system": "System",
    "player.reconnecting": "Reconnecting…",
    "player.unavailable": "Stream unavailable right now",
    "player.error": "Playback error occurred"
  }
};

function getLang() {
  try {
    const saved = localStorage.getItem('lang');
    let lang = saved || (navigator.language || 'en').slice(0,2);
    if (lang !== 'ar' && lang !== 'en') lang = 'en';
    return lang;
  } catch { return 'en'; }
}

function setLang(lang) {
  try {
    if (lang !== 'ar' && lang !== 'en') return;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' ? 'rtl' : 'ltr');
    apply();
  } catch {}
}

function t(key) {
  const lang = getLang();
  return (RES[lang] && RES[lang][key]) || key;
}

function apply(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
}

window.I18N = { t, apply, setLang, getLang };

