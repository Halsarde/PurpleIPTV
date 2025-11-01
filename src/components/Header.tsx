// ✅ src/components/Header.tsx
import React from "react";
import { Category } from "../types";
import { SearchBar } from "./SearchBar";
import { langService } from "../services/langService";

interface HeaderProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onSearch: (term: string) => void;
  showCategories: boolean;
}

// ✅ استخدمنا React.memo لتقليل إعادة التصيير غير الضرورية
export const Header: React.FC<HeaderProps> = React.memo(
  ({ categories, selectedCategory, onCategoryChange, onSearch, showCategories }) => {
    return (
      <header className="sticky top-0 z-20 bg-[#0D0D12]/80 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* ✅ قائمة التصنيفات */}
          <div className="w-full md:w-auto">
            {showCategories && (
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full md:w-64 p-2 bg-[#1A1A24] border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              >
                <option value="all">{langService.t('allCategories' as any) || 'All Categories'}</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ✅ شريط البحث */}
          <div className="w-full md:w-auto md:flex-grow md:max-w-md">
            <SearchBar placeholder={langService.t('searchPlaceholder' as any) || 'Search for content...'} onSearch={onSearch} />
          </div>
        </div>
      </header>
    );
  }
);

// ✅ تصدير افتراضي في حال تم استيراده كـ default
export default Header;
