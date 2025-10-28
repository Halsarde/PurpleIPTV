
import React from 'react';
import { Category } from '../types';
import { SearchBar } from './SearchBar';

interface HeaderProps {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (categoryId: string) => void;
    onSearch: (term: string) => void;
    showCategories: boolean;
}

export const Header: React.FC<HeaderProps> = ({ categories, selectedCategory, onCategoryChange, onSearch, showCategories }) => {
    return (
        <header className="sticky top-0 z-20 bg-[#0D0D12]/80 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-auto">
                    {showCategories && (
                         <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="w-full md:w-64 p-2 bg-[#1A1A24] border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 outline-none"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>
                                    {cat.category_name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="w-full md:w-auto md:flex-grow md:max-w-md">
                    <SearchBar placeholder="Search for content..." onSearch={onSearch} />
                </div>
            </div>
        </header>
    );
};
