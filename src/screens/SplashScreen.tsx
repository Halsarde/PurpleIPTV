// src/screens/SplashScreen.tsx
import React, { useEffect } from "react";

type SplashScreenProps = {
  onComplete?: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.(); // 🔁 فقط استدعاء الدالة من App.tsx
    }, 1000); // ثانية واحدة مثالية
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0D0D12] text-white select-none">
      {/* شعار التطبيق */}
      <img
        src="/logo.png"
        alt="Logo"
        className="w-32 h-32 mb-4 animate-pulse"
        loading="eager"
      />
      <h1 className="text-xl font-bold text-purple-400 tracking-wide">
        Purple IPTV
      </h1>
      <p className="text-gray-400 mt-2 text-sm">Loading your experience...</p>
    </div>
  );
};

export default SplashScreen;
