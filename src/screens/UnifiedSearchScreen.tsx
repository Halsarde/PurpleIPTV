import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";

const UnifiedSearchScreen: React.FC = () => {
  const { setScreen } = useAppContext();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    console.log("Searching for:", query);
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white p-8">
      {/* زر العودة للصفحة الرئيسية */}
      <button
        onClick={() => setScreen("home")}
        className="mb-8 p-2 rounded-full hover:bg-gray-800 transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-6">🔍 Unified Search</h1>

      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter keyword..."
          className="flex-1 px-4 py-2 rounded-lg text-black focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold"
        >
          Search
        </button>
      </div>
    </div>
  );
};

export default UnifiedSearchScreen;
