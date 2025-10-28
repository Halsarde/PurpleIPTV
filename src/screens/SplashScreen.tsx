import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start fade-in shortly after mount to trigger CSS transition
    const fadeInTimer = setTimeout(() => setVisible(true), 100);
    // Start fade-out after 2.6s (0.1s delay + 1.5s fade-in + 1s hold)
    const fadeOutTimer = setTimeout(() => setVisible(false), 2600);
    // Call onComplete after 4.1s (total duration)
    const completeTimer = setTimeout(onComplete, 4100);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#8A2BE2] to-[#6C00FF] transition-opacity duration-[1500ms] ease-in-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="text-center">
        <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-[#6A00F4] to-[#9B4DFF] flex items-center justify-center shadow-2xl shadow-purple-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.002v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
          </div>
        </div>
        <p className="text-white/80 text-lg tracking-wider">Powered by Purple IPTV</p>
      </div>
    </div>
  );
};

export default SplashScreen;
