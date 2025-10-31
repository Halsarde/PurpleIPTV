// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { Category, Stream } from "../types";
import * as xtreamService from "../services/xtreamService";
import { CardItem } from "../components/CardItem";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { cacheService } from "../services/cacheService";

type ContentType = "live" | "movie" | "series" | "favorites" | "recents";

const HomeScreen: React.FC = () => {
  const { playlist, isLoggedIn, setScreen, favorites, recentlyWatched, logout } = useAppContext();
  const [contentType, setContentType] = useState<ContentType>("live");
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ التحقق من تسجيل الدخول
  useEffect(() => {
    if (!isLoggedIn) {
      setScreen("auth");
    }
  }, [isLoggedIn, setScreen]);

  // ✅ جلب التصنيفات
  const fetchCategories = useCallback(
    async (type: ContentType) => {
      if (!playlist) return;

      // ===== M3U Mode =====
      if (playlist.loginType === "m3u") {
        const typeMap: Record<ContentType, "live" | "movie" | "series" | undefined> = {
          live: "live",
          movie: "movie",
          series: "series",
          favorites: undefined,
          recents: undefined,
        };
        const wanted = typeMap[type];
        if (!wanted) {
          setCategories([]);
          return;
        }

        const allStreams = playlist.streams || [];
        const relevantCategories = (playlist.categories || []).filter((cat) =>
          allStreams.some(
            (s) => s.category_id === cat.category_id && s.stream_type === wanted
          )
        );

        setCategories(
          relevantCategories.map((c) => ({ ...c, parent_id: c.parent_id ?? 0 })) as Category[]
        );
        return;
      }

      // ===== Xtream Mode =====
      const cacheKey = `${playlist.user_info?.username}-${type}-categories`;
      const cached = cacheService.get<Category[]>(cacheKey);
      if (cached) {
        setCategories(cached);
        return;
      }

      let fetched: Category[] = [];
      if (type === "live") fetched = await xtreamService.getLiveCategories(playlist as any);
      else if (type === "movie") fetched = await xtreamService.getVodCategories(playlist as any);
      else if (type === "series") fetched = await xtreamService.getSeriesCategories(playlist as any);

      setCategories(fetched);
      cacheService.set(cacheKey, fetched);
    },
    [playlist]
  );

  // ✅ جلب القنوات أو الفيديوهات
  const fetchStreams = useCallback(
    async (type: ContentType, categoryId: string) => {
      setIsLoading(true);
      if (!playlist) return;

      // ===== M3U Mode =====
      if (playlist.loginType === "m3u") {
        const typeMap: Record<ContentType, "live" | "movie" | "series" | undefined> = {
          live: "live",
          movie: "movie",
          series: "series",
          favorites: undefined,
          recents: undefined,
        };
        const wanted = typeMap[type];
        if (!wanted) {
          setStreams([]);
          setIsLoading(false);
          return;
        }

        let list = (playlist.streams || []).filter((s) => s.stream_type === wanted);
        if (categoryId !== "all") {
          list = list.filter((s) => s.category_id === categoryId);
        }

        setStreams(list as Stream[]);
        setIsLoading(false);
        return;
      }

      // ===== Xtream Mode =====
      const cacheKey = `${playlist.user_info?.username}-${type}-streams-${categoryId}`;
      const cached = cacheService.get<Stream[]>(cacheKey);
      if (cached) {
        setStreams(cached);
        setIsLoading(false);
        return;
      }

      let fetched: Stream[] = [];
      const catId = categoryId === "all" ? "" : categoryId;

      if (type === "live") fetched = await xtreamService.getLiveStreams(playlist as any, catId);
      else if (type === "movie") fetched = await xtreamService.getVodStreams(playlist as any, catId);
      else if (type === "series") fetched = await xtreamService.getSeriesStreams(playlist as any, catId);

      setStreams(fetched);
      cacheService.set(cacheKey, fetched);
      setIsLoading(false);
    },
    [playlist]
  );

  // ✅ تحديث عند التغيير
  useEffect(() => {
    if (contentType !== "favorites" && contentType !== "recents") {
      fetchCategories(contentType);
      fetchStreams(contentType, selectedCategory);
    } else {
      setIsLoading(false);
    }
  }, [contentType, fetchCategories, fetchStreams, selectedCategory]);

  // ✅ وظائف مساعدة
  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    setSelectedCategory("all");
    setSearchTerm("");
    setStreams([]);
    setCategories([]);
  };

  const handleCategoryChange = (id: string) => {
    setSelectedCategory(id);
    if (
      contentType !== "favorites" &&
      contentType !== "recents" &&
      playlist?.loginType !== "m3u"
    ) {
      fetchStreams(contentType, id);
    }
  };

  const handlePlay = (stream: Stream) => setScreen("player", { stream });
  const handleDetails = (stream: Stream) => setScreen("details", { stream });

  // ✅ الفلترة
  const filteredStreams = useMemo(() => {
    let source: Stream[] = [];

    if (contentType === "favorites") source = favorites;
    else if (contentType === "recents") source = recentlyWatched;
    else if (playlist?.loginType === "m3u") {
      const typeMap = { live: "live", movie: "movie", series: "series" };
      const t = typeMap[contentType as "live" | "movie" | "series"];
      source = playlist.streams?.filter((s) => s.stream_type === t) || [];
      if (selectedCategory !== "all") {
        source = source.filter((s) => s.category_id === selectedCategory);
      }
    } else {
      source = streams;
    }

    return !searchTerm
      ? source
      : source.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [streams, searchTerm, contentType, favorites, recentlyWatched, playlist, selectedCategory]);

  // ✅ واجهة المستخدم
  return (
    <div className="min-h-screen bg-[#0D0D12] text-white flex">
      <Sidebar contentType={contentType} onContentTypeChange={handleContentTypeChange} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 ml-16 sm:ml-64">
        {/* ===== الشريط العلوي ===== */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold tracking-wide">Purple IPTV</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setScreen("settings")}
              className="text-gray-300 hover:text-white bg-[#1F1F2E] px-3 py-2 rounded-lg text-sm transition"
            >
              ⚙️ الإعدادات
            </button>

            <button
              onClick={() => {
                if (window.confirm("هل تريد تسجيل الخروج؟")) {
                  logout();
                  setScreen("auth");
                }
              }}
              className="text-red-400 hover:text-white bg-[#2A1A1A] px-3 py-2 rounded-lg text-sm transition"
            >
              ⏻ خروج
            </button>
          </div>
        </div>

        {/* ===== الفلاتر ===== */}
        <Header
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          onSearch={setSearchTerm}
          showCategories={contentType !== "favorites" && contentType !== "recents"}
        />

        {/* ===== المحتوى ===== */}
        {isLoading ? (
  <div className="animate-pulse grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
    {Array(8).fill(0).map((_, i) => (
      <div key={i} className="bg-[#1F1F2E] h-40 rounded-xl" />
    ))}
  </div>
) : filteredStreams.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 mt-6">
            {filteredStreams.map((stream) => (
              <CardItem
                key={`${stream.stream_id}-${stream.series_id || ""}`}
                stream={stream}
                onPlay={handlePlay}
                onDetails={handleDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">لا يوجد محتوى متاح حاليًا.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomeScreen;
