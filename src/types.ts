export interface XtreamUserInfo {
  username: string;
  password?: string;
  message?: string;
  auth: 1 | 0;
  status: string;
  exp_date?: string;
  is_trial?: string;
  active_cons?: string;
  created_at?: string;
  max_connections?: string;
  allowed_output_formats?: string[];
}

export interface ServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
}

export interface Playlist {
  loginType: 'xtream' | 'm3u';
  user_info: XtreamUserInfo;
  server_info: ServerInfo;
  streams?: Stream[];
  categories?: Category[];
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface Stream {
  stream_id: number;
  series_id?: number;
  name: string;
  stream_icon?: string;
  stream_type: 'live' | 'movie' | 'series';
  category_id?: string;
  url?: string; // for m3u
  backdrop_path?: string[];
  added?: string;
  rating_5based?: number;
}

export interface Episode {
  id: string;
  stream_id: number; // custom added
  episode_num: number;
  title: string;
  container_extension: string;
  info: any;
  custom_sid: string;
  added: string;
  season: number;
  direct_source: string;
}

export interface SeriesInfo {
  seasons: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    season_number: number;
    cover: string;
    cover_big: string;
  }[];
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
  };
  episodes: {
    [season_number: string]: Episode[];
  };
}


export enum Screen {
  AUTH = 'AUTH',
  HOME = 'HOME',
  PLAYER = 'PLAYER',
  DETAILS = 'DETAILS',
  SEARCH = 'SEARCH',
}

export interface PlayerArgs {
  stream: Stream;
  episode?: Episode;
}

export interface DetailsArgs {
    stream: Stream;
}
