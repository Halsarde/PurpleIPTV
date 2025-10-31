import React, { useEffect } from "react";

type SplashScreenProps = {
  onComplete: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200); // بعد 1.2 ثانية ينهي التحميل
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl font-bold">Purple IPTV</h1>
    </div>
  );
};

export default SplashScreen;
