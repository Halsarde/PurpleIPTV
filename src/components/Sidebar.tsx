// ✅ src/components/Sidebar.tsx
import React from "react";
import { langService } from "../services/langService";

type ContentType = "live" | "movie" | "series" | "favorites" | "recents" | "sport";

type SidebarProps = {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
};

// ✅ استخدمنا React.memo لتقليل إعادة التصيير غير الضرورية
export const Sidebar: React.FC<SidebarProps> = React.memo(({ contentType, onContentTypeChange }) => {
  const t = (k: string) => langService.t(k as any);
  const items: { key: ContentType; label: string }[] = [
    { key: "live", label: t("live") },
    { key: "sport", label: t("sport") },
    { key: "movie", label: t("movie") },
    { key: "series", label: t("series") },
    { key: "favorites", label: t("favorites") },
    { key: "recents", label: t("recents") },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 sm:w-64 bg-[#141422] text-white p-3">
      <nav className="space-y-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onContentTypeChange(it.key)}
            className={`w-full text-left px-3 py-2 rounded-md transition ${
              contentType === it.key
                ? "bg-purple-600 text-white"
                : "bg-white/10 hover:bg-white/20 text-gray-300"
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
});

// ✅ يمكن ترك هذا السطر إذا يُستورد باسم default في مكان آخر
export default Sidebar;
