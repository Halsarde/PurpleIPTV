
// FIX: Corrected import path for types
import { Playlist, XtreamUserInfo, Category, Stream, ServerInfo, SeriesInfo } from '../types';

const buildApiUrl = (playlist: Playlist, action: string, params: Record<string, string> = {}) => {
  const { user_info, server_info } = playlist;
  const baseUrl = `${server_info.url}:${server_info.port}/player_api.php`;
  const allParams = new URLSearchParams({
    username: user_info.username || '',
    password: user_info.password || '',
    action,
    ...params,
  });
  return `${baseUrl}?${allParams.toString()}`;
};

export const authenticateXtream = async (serverUrl: string, username?: string, password?: string): Promise<{playlist: Playlist, userInfo: XtreamUserInfo} | null> => {
  if (!username || !password) return null;
  
  const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Authentication failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.user_info && data.user_info.auth === 1) {
        const parsedUrl = new URL(serverUrl);
        const playlist: Playlist = {
            loginType: 'xtream',
            user_info: data.user_info,
            server_info: data.server_info || {
                url: parsedUrl.origin,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
                server_protocol: parsedUrl.protocol.replace(':',''),
                https_port: parsedUrl.port || '443',
                rtmp_port: '0',
                timezone: 'UTC',
                timestamp_now: Date.now() / 1000,
                time_now: new Date().toISOString()
            },
        };
        return { playlist, userInfo: data.user_info };
    }
    return null;
  } catch (error) {
    console.error("Xtream authentication error:", error);
    return null;
  }
};

export const getLiveCategories = async (playlist: Playlist): Promise<Category[]> => {
  const url = buildApiUrl(playlist, 'get_live_categories');
  const response = await fetch(url);
  return response.json();
};

export const getVodCategories = async (playlist: Playlist): Promise<Category[]> => {
    const url = buildApiUrl(playlist, 'get_vod_categories');
    const response = await fetch(url);
    return response.json();
};

export const getSeriesCategories = async (playlist: Playlist): Promise<Category[]> => {
    const url = buildApiUrl(playlist, 'get_series_categories');
    const response = await fetch(url);
    return response.json();
};


export const getLiveStreams = async (playlist: Playlist, categoryId: string = ''): Promise<Stream[]> => {
  const url = buildApiUrl(playlist, 'get_live_streams', categoryId ? { category_id: categoryId } : {});
  const response = await fetch(url);
  const data: any[] = await response.json();
  return data.map(item => ({...item, stream_type: 'live'}));
};

export const getVodStreams = async (playlist: Playlist, categoryId: string = ''): Promise<Stream[]> => {
    const url = buildApiUrl(playlist, 'get_vod_streams', categoryId ? { category_id: categoryId } : {});
    const response = await fetch(url);
    const data: any[] = await response.json();
    return data.map(item => ({...item, stream_type: 'movie'}));
};

export const getSeriesStreams = async (playlist: Playlist, categoryId: string = ''): Promise<Stream[]> => {
    const url = buildApiUrl(playlist, 'get_series', categoryId ? { category_id: categoryId } : {});
    const response = await fetch(url);
    const data: any[] = await response.json();
    // Xtream uses 'series_id' for series, so we map it to 'stream_id' for consistency
    return data.map(item => ({...item, stream_id: item.series_id, stream_type: 'series'}));
};

export const getSeriesInfo = async (playlist: Playlist, seriesId: number): Promise<SeriesInfo> => {
    const url = buildApiUrl(playlist, 'get_series_info', { series_id: seriesId.toString() });
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch series info');
    }
    const data = await response.json();
    // Add stream_id to each episode for playback
    for (const season in data.episodes) {
        data.episodes[season] = data.episodes[season].map((ep: any) => ({
            ...ep,
            stream_id: ep.id, // The episode's stream ID is in its 'id' field
        }));
    }
    return data as SeriesInfo;
}

export const getVodStreamUrl = (playlist: Playlist, streamId: number, extension: string = 'mp4'): string => {
    return `${playlist.server_info.url}:${playlist.server_info.port}/movie/${playlist.user_info.username}/${playlist.user_info.password}/${streamId}.${extension}`;
}

export const getLiveStreamUrl = (playlist: Playlist, streamId: number, extension: string = 'ts'): string => {
    return `${playlist.server_info.url}:${playlist.server_info.port}/live/${playlist.user_info.username}/${playlist.user_info.password}/${streamId}.${extension}`;
}

export const getSeriesStreamUrl = (playlist: Playlist, streamId: number, extension: string): string => {
    return `${playlist.server_info.url}:${playlist.server_info.port}/series/${playlist.user_info.username}/${playlist.user_info.password}/${streamId}.${extension}`;
}
