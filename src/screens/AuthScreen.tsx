// src/screens/AuthScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { parseM3uContent } from "../services/m3uParser";
import { authenticateXtream, getLiveCategories, getLiveStreams } from "../services/xtreamService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Playlist } from "../types";
import { cacheService } from "../services/cacheService";

type AuthMode = "xtream" | "m3u-url" | "m3u-file" | "code";

const AuthScreen: React.FC = () => {
  const { login } = useAppContext(); // ✅ نستخدم login من AppContext
  const [mode, setMode] = useState<AuthMode>("xtream");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isTV, setIsTV] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent.toUpperCase();
    if (ua.includes("SMART-TV") || ua.includes("VIDAA") || ua.includes("TIZEN") || ua.includes("WEBOS") || ua.includes("TV")) {
      setIsTV(true);
    }
  }, []);

  const [xtreamServer, setXtreamServer] = useState("");
  const [xtreamUser, setXtreamUser] = useState("");
  const [xtreamPass, setXtreamPass] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");
  const [m3uFile, setM3uFile] = useState<File | null>(null);
  const [m3uFileName, setM3uFileName] = useState("No file chosen");
  const [authCode, setAuthCode] = useState("");

  // ✅ تسجيل الدخول (Xtream أو M3U)
  const handleLogin = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        let playlistData: Partial<Playlist> | null = null;

        if (mode === "xtream") {
          if (!xtreamServer || !xtreamUser || !xtreamPass)
            throw new Error("All Xtream fields are required.");

          const xtreamData = await authenticateXtream(xtreamServer, xtreamUser, xtreamPass);
          if (!xtreamData) throw new Error("Xtream authentication failed.");

          // ✅ استخدم البيانات كما أعادتها خدمة Xtream بدون إتلاف معلومات الخادم
          playlistData = {
            ...xtreamData.playlist,
            user_info: xtreamData.userInfo,
          };
          // Warm critical caches (categories + default live streams) without blocking navigation
          // This makes HomeScreen load instantly after the first successful login.
          setTimeout(() => {
            try {
              const p = playlistData as Playlist;
              const userKey = p.user_info?.username || "";
              Promise.all([
                getLiveCategories(p).then((cats) => cacheService.set(`${userKey}-live-categories`, cats)),
                getLiveStreams(p, "").then((streams) => cacheService.set(`${userKey}-live-streams-all`, streams)),
              ]).catch(() => {});
            } catch {}
          }, 0);
        }

        else if (mode === "m3u-url") {
          if (!m3uUrl) throw new Error("M3U URL is required.");
          const response = await fetch(m3uUrl);
          if (!response.ok) throw new Error(`Failed to fetch M3U URL. Status: ${response.status}`);
          const content = await response.text();
          const parsed = parseM3uContent(content);

          playlistData = {
            loginType: "m3u",
            user_info: { auth: 1, username: "M3U_User" } as any,
            server_info: { url: m3uUrl } as any,
            streams: parsed.streams,
            categories: parsed.categories,
          };
        }

        else if (mode === "m3u-file") {
          if (!m3uFile) throw new Error("M3U file is required.");
          const content = await m3uFile.text();
          const parsed = parseM3uContent(content);

          playlistData = {
            loginType: "m3u",
            user_info: { auth: 1, username: "M3U_File_User" } as any,
            server_info: { url: "local_file" } as any,
            streams: parsed.streams,
            categories: parsed.categories,
          };
        }

        else if (mode === "code") {
          throw new Error("Login by code not implemented yet.");
        }

        if (!playlistData) throw new Error("Failed to create playlist data.");

        // ✅ نسجل الدخول فعليًا
        login(playlistData);
      } catch (err: any) {
        console.error("Login error:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, xtreamServer, xtreamUser, xtreamPass, m3uUrl, m3uFile, login]
  );

  useEffect(() => {
    if (!isTV) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleLogin();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTV, handleLogin]);

  const renderForm = () => {
    switch (mode) {
      case "xtream":
        return (
          <>
            <input type="text" value={xtreamServer} onChange={(e) => setXtreamServer(e.target.value)} placeholder="Server URL (http://...:port)" className="input" />
            <input type="text" value={xtreamUser} onChange={(e) => setXtreamUser(e.target.value)} placeholder="Username" className="input" />
            <input type="password" value={xtreamPass} onChange={(e) => setXtreamPass(e.target.value)} placeholder="Password" className="input" />
          </>
        );
      case "m3u-url":
        return (
          <input type="text" value={m3uUrl} onChange={(e) => setM3uUrl(e.target.value)} placeholder="M3U Playlist URL" className="input" />
        );
      case "m3u-file":
        return (
          <div className="w-full">
            <input
              type="file"
              id="m3u-file-input"
              className="hidden"
              accept=".m3u,.m3u8"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setM3uFile(file);
                  setM3uFileName(file.name);
                }
              }}
            />
            <label htmlFor="m3u-file-input" className="file-label">
              <span className="truncate">{m3uFileName}</span>
              <span className="choose-btn">Choose File</span>
            </label>
          </div>
        );
      case "code":
        return (
          <input type="text" value={authCode} onChange={(e) => setAuthCode(e.target.value)} placeholder="Enter Your Code" className="input" />
        );
    }
  };

  const TabButton = ({ id, label }: { id: AuthMode; label: string }) => (
    <button onClick={() => setMode(id)} className={`tab-btn ${mode === id ? "active" : ""}`}>
      {label}
    </button>
  );

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isTV ? "bg-[#0B0B12]" : "bg-gradient-to-br from-[#0D0D12] to-[#1a0e2a]"
      } p-4 relative`}
    >
      {/* Language switch (pre-login) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => { try { const { langService } = require('../services/langService'); langService.setLang('ar'); } catch {} }} className="px-2 py-1 text-xs bg-white/10 rounded">AR</button>
        <button onClick={() => { try { const { langService } = require('../services/langService'); langService.setLang('en'); } catch {} }} className="px-2 py-1 text-xs bg-white/10 rounded">EN</button>
      </div>
      <div
        className={`${
          isTV ? "w-[70%]" : "w-full max-w-md"
        } bg-[#F9F9FB] dark:bg-[#1A1A24] rounded-2xl shadow-xl p-8 space-y-6`}
      >
        <div className="text-center flex flex-col items-center gap-2">
          <img src="/icons/logo.png" alt="Purple IPTV" className="h-12 w-12" onError={(e:any)=>{e.currentTarget.style.display='none'}} />
          <h1 className="text-3xl font-bold text-[#121212] dark:text-white mb-2">Purple TV</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Login to start streaming</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
          <TabButton id="xtream" label="Xtream" />
          <TabButton id="m3u-url" label="M3U Link" />
          <TabButton id="m3u-file" label="File" />
          <TabButton id="code" label="Code" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {renderForm()}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-600 text-red-400 text-sm rounded-lg text-center">
              {error}
            </div>
          )}
          <button type="submit" disabled={isLoading} className="connect-btn">
            {isLoading ? <LoadingSpinner size="sm" /> : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
