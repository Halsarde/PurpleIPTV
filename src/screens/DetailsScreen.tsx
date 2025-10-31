import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { DetailsArgs, SeriesInfo, Episode, Stream } from "../types";
import * as xtreamService from "../services/xtreamService";
import { LoadingSpinner } from "../components/LoadingSpinner";

const DetailsScreen: React.FC<DetailsArgs> = ({ stream }) => {
  const { playlist, setScreen, isFavorite, toggleFavorite } = useAppContext();

  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeriesData = async () => {
      if (playlist && stream.stream_type === "series" && stream.series_id) {
        setIsLoading(true);
        setError(null);
        try {
          const data = await xtreamService.getSeriesInfo(playlist as any, stream.series_id);

          setSeriesInfo(data);
        } catch (err) {
          console.error(err);
          setError("Could not load series details.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSeriesData();
  }, [playlist, stream]);

  // ✅ تعديل رقم (1): استخدام string بدلاً من enum
  const handlePlay = (episode?: Episode) => {
    setScreen("player", { stream, episode });
  };

  // ✅ تعديل رقم (2): تمرير stream object بدل stream_id
  const isFav = isFavorite(stream.stream_id);



  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='%23fff' text-anchor='middle' dy='.3em'%3EImage Not Available%3C/text%3E%3C/svg%3E";

  const coverImage =
    seriesInfo?.info?.cover || stream.stream_icon || placeholderImage;
  const backdropImage =
    seriesInfo?.info?.backdrop_path?.[0] || coverImage;

  const releaseDate =
    seriesInfo?.info?.releaseDate ||
    (stream.added
      ? new Date(parseInt(stream.added) * 1000).getFullYear().toString()
      : null);

  const rating = seriesInfo?.info?.rating_5based || stream.rating_5based;
  const plot =
    seriesInfo?.info?.plot ||
    `Synopsis not available. "${stream.name}" is ready to be streamed. Enjoy the content.`;

  return (
    <div className="min-h-screen text-white bg-[#0D0D12] relative">
      {/* ✅ تعديل رقم (3): تصحيح التنقل إلى home */}
      <button
        onClick={() => setScreen("home")}
        className="absolute top-4 left-4 z-20 bg-black/50 rounded-full p-2 hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="relative h-64 md:h-96">
        <img
          src={backdropImage}
          alt={stream.name}
          className="w-full h-full object-cover"
          onError={(e) =>
            ((e.target as HTMLImageElement).src = placeholderImage)
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-[#0D0D12]/50"></div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8">
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            {stream.name}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm">
            {releaseDate && <span>{releaseDate}</span>}
            {rating && (
              <span>⭐ {Number(rating).toFixed(1)} / 5.0</span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <button
            onClick={() => handlePlay()}
            className="w-full sm:w-auto flex-1 text-white bg-gradient-to-r from-[#6A00F4] to-[#9B4DFF] hover:opacity-90 font-bold rounded-full text-lg px-8 py-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            ▶ Play
          </button>

          <button
            onClick={() => toggleFavorite(stream)}
            className={`p-3 rounded-full border-2 ${
              isFav
                ? "bg-white text-purple-600 border-white"
                : "border-gray-500 text-gray-400 hover:border-white hover:text-white"
            } transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
            aria-label={
              isFav ? "Remove from favorites" : "Add to favorites"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-400 mb-8">{plot}</p>

        {/* ✅ تعديل رقم (4): حماية إضافية من undefined */}
        {stream.stream_type === "series" && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Episodes</h2>
            {isLoading && (
              <div className="flex justify-center p-8">
                <LoadingSpinner />
              </div>
            )}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {seriesInfo &&
              Object.entries(seriesInfo.episodes || {}).map(
                ([season, episodes]) => (
                  <div key={season} className="mb-6">
                    <h3 className="text-xl font-semibold text-purple-400 mb-3">
                      Season {season}
                    </h3>
                    <div className="space-y-3">
                      {(episodes as Episode[]).map((episode) => (
                        <button
                          key={episode.id}
                          onClick={() => handlePlay(episode)}
                          className="w-full flex items-center gap-4 p-3 bg-[#1A1A24] rounded-lg cursor-pointer hover:bg-gray-700/50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                        >
                          <div className="w-8 h-8 flex-shrink-0 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {episode.episode_num}
                          </div>
                          <p className="font-medium text-left">
                            {episode.title}
                          </p>
                          <div className="ml-auto">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailsScreen;
