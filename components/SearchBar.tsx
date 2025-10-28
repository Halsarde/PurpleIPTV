import React, { useState } from 'react';

interface SearchBarProps {
  placeholder: string;
  onSearch: (term: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder, onSearch }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          className="block w-full p-4 ps-10 text-sm bg-gray-100 dark:bg-[#1A1A24] border border-gray-300 dark:border-gray-600 rounded-full focus:ring-purple-500 focus:border-purple-500 outline-none transition"
        />
      </div>
    </form>
  );
};