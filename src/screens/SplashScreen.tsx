import React, { useEffect } from "react";
import { useAppContext } from "../context/AppContext";

const SplashScreen: React.FC = () => {
  const { setScreen } = useAppContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen("auth");
    }, 800); // أقل من ثانية واحدة
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0D0D12] text-white">
      <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-4 animate-pulse" />
      <h1 className="text-xl font-bold text-purple-400">Purple IPTV</h1>
    </div>
  );
};

export default SplashScreen;
