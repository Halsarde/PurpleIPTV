// src/services/themeService.ts
export const themeService = {
  apply(theme: string) {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (theme === "dark" || (theme === "system" && prefersDark)) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // تخزين التفضيل
    localStorage.setItem("theme", theme);
  },

  get() {
    return localStorage.getItem("theme") || "system";
  },
};
