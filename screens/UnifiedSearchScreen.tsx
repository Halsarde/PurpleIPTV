
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Screen } from '../types';

const UnifiedSearchScreen: React.FC = () => {
  const { setScreen } = useAppContext();

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white p-8">
      <button onClick={() => setScreen(Screen.HOME)} className="mb-8 p-2 rounded-full hover:bg-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h1 className="text-3xl font-bold">Search</h1>
      <p className="text-gray-400 mt-4">Search functionality is not yet implemented.</p>
    </div>
  );
};

export default UnifiedSearchScreen;
