
// FIX: Corrected import path for types
import { Playlist, ServerInfo, XtreamUserInfo, Stream, Category } from '../types';

export const parseM3uUrl = (url: string): Playlist | null => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const username = params.get('username');
    const password = params.get('password');

    // For Xtream URLs, username is required.
    if (!username) {
      return null;
    }
    
    // Construct base server URL without the path
    const serverUrl = `${urlObj.protocol}//${urlObj.hostname}`;
    const port = urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80');

    const userInfo: XtreamUserInfo = {
        username,
        password: password || '',
        status: 'Active', 
        auth: 1
    };

    const serverInfo: ServerInfo = {
        url: serverUrl,
        port: port,
        https_port: port,
        server_protocol: urlObj.protocol.replace(':', ''),
        rtmp_port: "0",
        timezone: "UTC",
        timestamp_now: Math.floor(Date.now() / 1000),
        time_now: new Date().toISOString()
    };
    
    const playlist: Playlist = {
        loginType: 'xtream', // Default to xtream for URL parsing
        user_info: userInfo,
        server_info: serverInfo
    };

    return playlist;

  } catch (error) {
    console.error("Failed to parse M3U URL:", error);
    return null;
  }
};

export const parseM3uContent = (content: string): { streams: Stream[], categories: Category[] } => {
    const streams: Stream[] = [];
    const categoriesMap = new Map<string, Category>();
    let streamIdCounter = 1;

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF:')) {
            const infoLine = lines[i];
            const urlLine = lines[i + 1]?.trim();

            if (urlLine && (urlLine.startsWith('http://') || urlLine.startsWith('https://'))) {
                const nameMatch = infoLine.match(/,(.*)/);
                const name = nameMatch ? nameMatch[1].trim() : `Stream ${streamIdCounter}`;

                const logoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
                const logo = logoMatch ? logoMatch[1] : '';

                const groupMatch = infoLine.match(/group-title="([^"]*)"/);
                const groupTitle = groupMatch ? groupMatch[1] : 'General';
                
                // Try to guess stream type from group title
                let stream_type: 'live' | 'movie' | 'series' = 'live';
                const lowerGroup = groupTitle.toLowerCase();
                if (lowerGroup.includes('movie') || lowerGroup.includes('vod')) {
                    stream_type = 'movie';
                } else if (lowerGroup.includes('series') || lowerGroup.includes('tv show')) {
                    stream_type = 'series';
                }
                
                if (!categoriesMap.has(groupTitle)) {
                    categoriesMap.set(groupTitle, {
                        category_id: (categoriesMap.size + 1).toString(),
                        category_name: groupTitle,
                        parent_id: 0
                    });
                }
                const categoryId = categoriesMap.get(groupTitle)!.category_id;

                streams.push({
                    stream_id: streamIdCounter++,
                    name: name,
                    stream_icon: logo,
                    stream_type: stream_type,
                    category_id: categoryId,
                    url: urlLine,
                });
            }
        }
    }
    
    return { streams, categories: Array.from(categoriesMap.values()) };
};
