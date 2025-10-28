import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { PlayerArgs, Screen, Stream, Episode } from '../types';
import { useAppContext } from '../context/AppContext';
import * as xtreamService from '../services/xtreamService';
import { LoadingSpinner } from '../components/LoadingSpinner';

const PlayerScreen: React.FC<PlayerArgs> = ({ stream, episode }) => {
  const { playlist, setScreen, addRecentlyWatched, screen, setIsPipActive } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  const handleGoBack = useCallback(() => {
    if (stream.stream_type !== 'live') {
      setScreen(Screen.DETAILS, { stream });
    } else {
      setScreen(Screen.HOME);
    }
  }, [setScreen, stream]);

  useEffect(() => {
    addRecentlyWatched(stream);

    if (!playlist) {
      setError('Playlist not found.');
      setIsLoading(false);
      return;
    }

    let src = '';
    if (playlist.loginType === 'm3u' && stream.url) {
      src = stream.url;
    } else {
      switch (stream.stream_type) {
        case 'live':
          src = xtreamService.getLiveStreamUrl(playlist, stream.stream_id);
          break;
        case 'movie':
          src = xtreamService.getVodStreamUrl(playlist, stream.stream_id);
          break;
        case 'series':
          if (episode) {
            src = xtreamService.getSeriesStreamUrl(
              playlist,
              episode.stream_id,
              episode.container_extension
            );
          } else {
            setError('No episode selected for this series.');
            setIsLoading(false);
            return;
          }
          break;
        default:
          setError('Unsupported stream type.');
          setIsLoading(false);
          return;
      }
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    const startPlayback = () => {
        videoElement.play().catch(err => {
            console.warn("Autoplay was prevented by the browser.", err);
            setIsPlaying(false);
        });
    };

    if (src.includes('.m3u8') && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startPlayback();
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS fatal error:', data);
          setError('Could not load the stream. The source may be offline or incompatible.');
          setIsLoading(false);
        }
      });
    } else {
        videoElement.src = src;
        videoElement.addEventListener('loadedmetadata', startPlayback, { once: true });
    }

    return () => {
        videoElement.removeEventListener('loadedmetadata', startPlayback);
         if (hlsRef.current) {
            hlsRef.current.destroy();
        }
    };

  }, [playlist, stream, episode, addRecentlyWatched]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      if (videoRef.current) {
          videoRef.current.volume = newVolume;
          setVolume(newVolume);
          if (newVolume > 0 && isMuted) {
              setIsMuted(false);
              videoRef.current.muted = false;
          } else if (newVolume === 0) {
              setIsMuted(true);
              videoRef.current.muted = true;
          }
      }
  };

  const toggleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const togglePiP = async () => {
    if (!document.pictureInPictureEnabled || !videoRef.current || !isMetadataLoaded) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP Error:', err);
    }
  };
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolume = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
    };
    const handleEnterPiP = () => {
      setIsPipActive(true);
      setIsControlsVisible(false);
    };
    const handleLeavePiP = () => {
      setIsPipActive(false);
      setIsControlsVisible(true);
      // When user leaves PiP (e.g., closes window or clicks 'back to tab'),
      // ensure they are brought back to the fullscreen player.
      if (screen !== Screen.PLAYER) {
         setScreen(Screen.PLAYER, { stream, episode });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolume);
    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolume);
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [setIsPipActive, setScreen, screen, stream, episode]);
  
  const title = episode ? `${stream.name} - ${episode.title}` : stream.name;

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center text-white group"
         onMouseEnter={() => setIsControlsVisible(true)}
         onMouseLeave={() => setIsControlsVisible(false)}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain ${isLoading || error ? 'hidden' : ''}`}
        onCanPlay={() => setIsLoading(false)}
        onLoadedMetadata={() => setIsMetadataLoaded(true)}
        onError={() => {
          if (!hlsRef.current) {
             setError('Could not load the video. Format may not be supported or URL is invalid.');
             setIsLoading(false);
          }
        }}
        onClick={togglePlayPause}
      />
      
      {(isLoading || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center p-4">
          {isLoading && !error && <><LoadingSpinner size="lg" /><p className="mt-4">Loading stream...</p></>}
          {error && <><p className="text-red-500 text-lg">{error}</p><button onClick={handleGoBack} className="mt-4 px-4 py-2 bg-purple-600 rounded-md">Go Back</button></>}
        </div>
      )}

      <div className={`absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/70 via-black/40 to-transparent transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
            <button onClick={handleGoBack} className="bg-black/50 rounded-full p-2 hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500" title="Go Back">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
      </div>
      
      <div className={`absolute bottom-0 left-0 right-0 p-4 z-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
            <button onClick={togglePlayPause} title={isPlaying ? 'Pause' : 'Play'} className="p-2 bg-black/50 rounded-full hover:bg-black/75">
                {isPlaying 
                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                }
            </button>
            
            <div className="flex items-center gap-2">
                <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} className="p-1 bg-black/50 rounded-full hover:bg-black/75">
                     {isMuted || volume === 0
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                     }
                </button>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange} className="w-24 h-1 accent-purple-500"/>
            </div>
            
            <div className="flex-grow"></div>
            
            {document.pictureInPictureEnabled && (
                <button
                  onClick={togglePiP}
                  title="Picture-in-Picture"
                  disabled={!isMetadataLoaded}
                  className="p-1 bg-black/50 rounded-full hover:bg-black/75 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>
                </button>
            )}

            <button onClick={toggleFullScreen} title="Fullscreen" className="p-1 bg-black/50 rounded-full hover:bg-black/75">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerScreen;
