// ✅ src/components/CardItem.tsx
import React, { useRef, useState, useEffect } from "react";
import { Stream } from "../types";
import { useAppContext } from "../context/AppContext";

interface CardItemProps {
  stream: Stream;
  onPlay: (stream: Stream) => void;
  onDetails: (stream: Stream) => void;
}

// ✅ تحسينات طفيفة للأداء + منع إعادة التصيير غير الضروري
const CardItemComponent: React.FC<CardItemProps> = ({ stream, onPlay, onDetails }) => {
  const { isFavorite, toggleFavorite } = useAppContext();
  const isFav = isFavorite(stream.stream_id);

  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%231A1A24'/%3E%3C/svg%3E";

  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // ✅ تحميل الصورة فقط عند ظهور البطاقة
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // ✅ فصل المراقبة مباشرة بعد التحميل
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const imageUrl =
    stream.stream_icon ||
    (Array.isArray(stream.backdrop_path) ? stream.backdrop_path[0] : stream.backdrop_path) ||
    placeholderImage;

  // ✅ عند النقر أو الضغط على إنتر أو سبيس
  const handleDetailsClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (stream.stream_type === "live") onPlay(stream);
    else onDetails(stream);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleDetailsClick(e);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(stream);
  };

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      data-stream-id={stream.stream_id}
      onClick={handleDetailsClick}
      onKeyDown={handleKeyDown}
      className="group relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 bg-[#1A1A24] shadow-lg hover:shadow-purple-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D12]"
    >
      {/* ✅ الصورة */}
      <img
        src={isVisible ? imageUrl : placeholderImage}
        alt={stream.name || "Stream"}
        className="w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0.6 }}
        loading="lazy"
        onError={(e) => {
          if (isVisible) (e.target as HTMLImageElement).src = placeholderImage;
        }}
      />

      {/* ✅ تدرج أسود سفلي للقراءة */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      {/* ✅ اسم القناة / الفيلم */}
      <div className="absolute bottom-0 left-0 p-3 w-full">
        <h3 className="text-white font-semibold text-sm truncate">{stream.name}</h3>
      </div>

      {/* ✅ زر المفضلة */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
        <button
          onClick={handleFavoriteClick}
          className={`p-2 rounded-full transition ${
            isFav ? "bg-purple-600 text-white" : "bg-black/50 text-gray-300 hover:text-white"
          }`}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ✅ React.memo لتقليل إعادة التصيير بشكل ذكي
export const CardItem = React.memo(CardItemComponent);
export default CardItem;
