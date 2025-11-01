import { Playlist, XtreamUserInfo, Category, Stream, ServerInfo, SeriesInfo } from "../types";

const resolveProtocol = (value?: string, fallback: "http" | "https" = "http"): "http" | "https" => {
  if (value) {
    const lower = value.toLowerCase();
    if (lower.startsWith("https")) return "https";
    if (lower.startsWith("http")) return "http";
  }
  return fallback;
};

const normaliseServerAddress = (value: string): URL => {
  const trimmed = value.trim();
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  return new URL(hasProtocol ? trimmed : `http://${trimmed}`);
};

const normaliseServerInfo = (raw: Partial<ServerInfo> | undefined, parsedInput: URL): ServerInfo => {
  const inputProtocol = parsedInput.protocol === "https:" ? "https" : "http";
  const protocol = resolveProtocol(raw?.server_protocol, inputProtocol);
  const fallbackHost = parsedInput.host || parsedInput.hostname;
  const rawUrl = raw?.url?.trim();
  const absoluteUrl = rawUrl
    ? /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `${protocol}://${rawUrl.replace(/^\/+/, "")}`
    : `${protocol}://${fallbackHost}`;

  const fallbackPort = parsedInput.port || (protocol === "https" ? "443" : "80");
  const port = raw?.port && raw.port !== "" ? raw.port : fallbackPort;
  const httpsPort = raw?.https_port && raw.https_port !== "" ? raw.https_port : protocol === "https" ? port : "443";

  return {
    url: absoluteUrl,
    port,
    https_port: httpsPort,
    server_protocol: raw?.server_protocol || protocol,
    rtmp_port: raw?.rtmp_port || "0",
    timezone: raw?.timezone || "UTC",
    timestamp_now: raw?.timestamp_now || Math.floor(Date.now() / 1000),
    time_now: raw?.time_now || new Date().toISOString(),
  };
};

const createBaseUrl = (serverInfo: ServerInfo): URL => {
  const base = normaliseServerAddress(serverInfo.url);
  const isWindow = typeof window !== 'undefined';
  const appWantsHttps = isWindow && typeof window.location !== 'undefined' && window.location.protocol === 'https:';
  if (appWantsHttps) {
    try {
      base.protocol = 'https:';
    } catch {}
  }

  const isHttps = base.protocol === 'https:';
  const desiredPort = isHttps ? serverInfo.https_port : serverInfo.port;
  if (desiredPort && desiredPort !== '0') {
    base.port = desiredPort;
  }
  base.pathname = "/";
  base.search = "";
  base.hash = "";
  return base;
};

const buildApiUrl = (playlist: Playlist, action: string, params: Record<string, string> = {}) => {
  const { user_info, server_info } = playlist;
  const baseUrl = createBaseUrl(server_info);
  baseUrl.pathname = "/player_api.php";
  baseUrl.search = new URLSearchParams({
    username: user_info.username || "",
    password: user_info.password || "",
    action,
    ...params,
  }).toString();
  return baseUrl.toString();
};

export const authenticateXtream = async (
  serverUrl: string,
  username?: string,
  password?: string
): Promise<{ playlist: Playlist; userInfo: XtreamUserInfo } | null> => {
  if (!username || !password) return null;

  let parsedInput: URL;
  try {
    parsedInput = normaliseServerAddress(serverUrl);
  } catch (error) {
    console.error("Xtream authentication error: invalid server URL", error);
    return null;
  }

  const authUrl = new URL(parsedInput.toString());
  authUrl.pathname = "/player_api.php";
  authUrl.search = new URLSearchParams({ username, password }).toString();

  try {
    const response = await fetch(authUrl.toString());
    if (!response.ok) {
      throw new Error(`Authentication failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.user_info && data.user_info.auth === 1) {
      const userInfo: XtreamUserInfo = {
        ...data.user_info,
        username: data.user_info.username || username,
        password,
      };

      const serverInfo = normaliseServerInfo(data.server_info, parsedInput);

      const playlist: Playlist = {
        loginType: "xtream",
        user_info: userInfo,
        server_info: serverInfo,
      };

      return { playlist, userInfo };
    }
    return null;
  } catch (error) {
    console.error("Xtream authentication error:", error);
    return null;
  }
};

export const getLiveCategories = async (playlist: Playlist): Promise<Category[]> => {
  const url = buildApiUrl(playlist, "get_live_categories");
  const response = await fetch(url);
  return response.json();
};

export const getVodCategories = async (playlist: Playlist): Promise<Category[]> => {
  const url = buildApiUrl(playlist, "get_vod_categories");
  const response = await fetch(url);
  return response.json();
};

export const getSeriesCategories = async (playlist: Playlist): Promise<Category[]> => {
  const url = buildApiUrl(playlist, "get_series_categories");
  const response = await fetch(url);
  return response.json();
};

export const getLiveStreams = async (playlist: Playlist, categoryId = ""): Promise<Stream[]> => {
  const url = buildApiUrl(playlist, "get_live_streams", categoryId ? { category_id: categoryId } : {});
  const response = await fetch(url);
  const data: any[] = await response.json();
  return data.map((item) => ({ ...item, stream_type: "live" }));
};

export const getVodStreams = async (playlist: Playlist, categoryId = ""): Promise<Stream[]> => {
  const url = buildApiUrl(playlist, "get_vod_streams", categoryId ? { category_id: categoryId } : {});
  const response = await fetch(url);
  const data: any[] = await response.json();
  return data.map((item) => ({ ...item, stream_type: "movie" }));
};

export const getSeriesStreams = async (playlist: Playlist, categoryId = ""): Promise<Stream[]> => {
  const url = buildApiUrl(playlist, "get_series", categoryId ? { category_id: categoryId } : {});
  const response = await fetch(url);
  const data: any[] = await response.json();
  return data.map((item) => ({ ...item, stream_id: item.series_id, stream_type: "series" }));
};

export const getSeriesInfo = async (playlist: Playlist, seriesId: number): Promise<SeriesInfo> => {
  const url = buildApiUrl(playlist, "get_series_info", { series_id: seriesId.toString() });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch series info");
  }
  const data = await response.json();
  for (const season in data.episodes) {
    data.episodes[season] = data.episodes[season].map((ep: any) => ({
      ...ep,
      stream_id: ep.id,
    }));
  }
  return data as SeriesInfo;
};

const buildStreamUrl = (playlist: Playlist, type: "live" | "movie" | "series", streamId: number, extension: string) => {
  const baseUrl = createBaseUrl(playlist.server_info);
  baseUrl.pathname = `/${type}/${playlist.user_info.username}/${playlist.user_info.password}/${streamId}.${extension}`;
  baseUrl.search = "";
  return baseUrl.toString();
};

export const getVodStreamUrl = (playlist: Playlist, streamId: number, extension = "mp4"): string => {
  return buildStreamUrl(playlist, "movie", streamId, extension);
};

export const getLiveStreamUrl = (playlist: Playlist, streamId: number, extension = "ts"): string => {
  return buildStreamUrl(playlist, "live", streamId, extension);
};

export const getSeriesStreamUrl = (playlist: Playlist, streamId: number, extension: string): string => {
  return buildStreamUrl(playlist, "series", streamId, extension);
};
