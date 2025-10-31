// ✅ src/screens/SplashScreen.tsx
import React, { useEffect } from "react";

export type SplashScreenProps = {
  onComplete?: () => void; // ✅ أصبحت اختيارية
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // ⏱ عرض شاشة البداية لمدة قصيرة ثم استدعاء onComplete فقط إذا كانت موجودة
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0D0D12] text-white">
      {/* شعار التطبيق */}
      <div className="flex flex-col items-center space-y-3 animate-pulse">
        <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-4xl font-bold">
          🎬
        </div>
        <h1 className="text-2xl font-bold tracking-wide">Purple IPTV</h1>
        <p className="text-gray-400 text-sm">Loading your experience...</p>
      </div>
    </div>
  );
};

export default SplashScreen;
