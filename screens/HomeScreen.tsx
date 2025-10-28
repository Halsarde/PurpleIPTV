
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Category, Stream, Screen } from '../types';
import * as xtreamService from '../services/xtreamService';
import { CardItem } from '../components/CardItem';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cacheService } from '../services/cacheService';

type ContentType = 'live' | 'movie' | 'series' | 'favorites' | 'recents';

const HomeScreen: React.FC = () => {
  const { playlist, setScreen, favorites, recentlyWatched } = useAppContext();
  const [contentType, setContentType] = useState<ContentType>('live');
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = useCallback(async (type: ContentType) => {
    if (!playlist) return;
    if (playlist.loginType === 'm3u') {
        const typeMap: { [key in ContentType]?: string } = { live: 'live', movie: 'movie', series: 'series' };
        const streamType = typeMap[type];
        const relevantCategories = (playlist.categories || []).filter(cat => 
            (playlist.streams || []).some(s => s.category_id === cat.category_id && s.stream_type === streamType)
        );
        setCategories(relevantCategories);
        return;
    }
    const cacheKey = `${playlist.user_info.username}-${type}-categories`;
    const cached = cacheService.get<Category[]>(cacheKey);
    if (cached) {
        setCategories(cached);
        return;
    }
    
    let fetchedCategories: Category[] = [];
    if (type === 'live') fetchedCategories = await xtreamService.getLiveCategories(playlist);
    else if (type === 'movie') fetchedCategories = await xtreamService.getVodCategories(playlist);
    else if (type === 'series') fetchedCategories = await xtreamService.getSeriesCategories(playlist);

    setCategories(fetchedCategories);
    cacheService.set(cacheKey, fetchedCategories);
  }, [playlist]);

  const fetchStreams = useCallback(async (type: ContentType, categoryId: string) => {
    setIsLoading(true);
    if (!playlist || playlist.loginType === 'm3u') {
        setIsLoading(false);
        return;
    }

    const cacheKey = `${playlist.user_info.username}-${type}-streams-${categoryId}`;
    const cached = cacheService.get<Stream[]>(cacheKey);
    if (cached) {
        setStreams(cached);
        setIsLoading(false);
        return;
    }
    
    let fetchedStreams: Stream[] = [];
    const catId = categoryId === 'all' ? '' : categoryId;
    if (type === 'live') fetchedStreams = await xtreamService.getLiveStreams(playlist, catId);
    else if (type === 'movie') fetchedStreams = await xtreamService.getVodStreams(playlist, catId);
    else if (type === 'series') fetchedStreams = await xtreamService.getSeriesStreams(playlist, catId);

    setStreams(fetchedStreams);
    cacheService.set(cacheKey, fetchedStreams);
    setIsLoading(false);
  }, [playlist]);

  useEffect(() => {
    if (contentType !== 'favorites' && contentType !== 'recents') {
        fetchCategories(contentType);
        fetchStreams(contentType, selectedCategory);
    } else {
        setIsLoading(false);
    }
  }, [contentType, fetchCategories, fetchStreams, selectedCategory]);
  
  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    setSelectedCategory('all');
    setSearchTerm('');
    setStreams([]);
    setCategories([]);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (contentType !== 'favorites' && contentType !== 'recents' && playlist?.loginType !== 'm3u') {
        fetchStreams(contentType, categoryId);
    }
  };

  const handlePlay = (stream: Stream) => {
    setScreen(Screen.PLAYER, { stream });
  };
  
  const handleDetails = (stream: Stream) => {
    setScreen(Screen.DETAILS, { stream });
  };

  const filteredStreams = useMemo(() => {
    let sourceStreams: Stream[] = [];
    if (contentType === 'favorites') {
        sourceStreams = favorites;
    } else if (contentType === 'recents') {
        sourceStreams = recentlyWatched;
    } else if (playlist?.loginType === 'm3u') {
      const typeMap = { live: 'live', movie: 'movie', series: 'series' };
      const streamType = typeMap[contentType as 'live' | 'movie' | 'series'];
      sourceStreams = (playlist.streams || []).filter(s => s.stream_type === streamType);
      if(selectedCategory !== 'all') {
          sourceStreams = sourceStreams.filter(s => s.category_id === selectedCategory);
      }
    } else {
        sourceStreams = streams;
    }
    
    if (!searchTerm) return sourceStreams;
    return sourceStreams.filter(stream => stream.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [streams, searchTerm, contentType, favorites, recentlyWatched, playlist, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white flex">
      <Sidebar 
        contentType={contentType} 
        onContentTypeChange={handleContentTypeChange} 
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 ml-16 sm:ml-64">
        <Header 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            onSearch={setSearchTerm}
            showCategories={contentType !== 'favorites' && contentType !== 'recents'}
        />
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 mt-6">
            {filteredStreams.map(stream => (
              <CardItem 
                key={`${stream.stream_id}-${stream.series_id || ''}`} 
                stream={stream} 
                onPlay={handlePlay} 
                onDetails={handleDetails} 
              />
            ))}
          </div>
        )}
         { !isLoading && filteredStreams.length === 0 && (
            <div className="text-center py-20">
                <p className="text-gray-400">No content found.</p>
            </div>
         )}
      </main>
    </div>
  );
};

export default HomeScreen;
