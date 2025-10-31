// ✅ src/components/Sidebar.tsx
import React from "react";

type ContentType = "live" | "movie" | "series" | "favorites" | "recents";

type SidebarProps = {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
};

// ✅ استخدمنا React.memo لتقليل إعادة التصيير غير الضرورية
export const Sidebar: React.FC<SidebarProps> = React.memo(({ contentType, onContentTypeChange }) => {
  const items: { key: ContentType; label: string }[] = [
    { key: "live", label: "Live" },
    { key: "movie", label: "Movies" },
    { key: "series", label: "Series" },
    { key: "favorites", label: "Favorites" },
    { key: "recents", label: "Recents" },
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
