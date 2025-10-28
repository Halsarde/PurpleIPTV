
import React, { useState } from 'react';
// FIX: Corrected import path for AppContext
import { useAppContext } from '../context/AppContext';
import { parseM3uUrl, parseM3uContent } from '../services/m3uParser';
import { authenticateXtream } from '../services/xtreamService';
import { LoadingSpinner } from '../components/LoadingSpinner';
// FIX: Corrected import path for types
import { Playlist, XtreamUserInfo, ServerInfo, Stream, Category } from '../types';

type AuthMode = 'xtream' | 'm3u-url' | 'm3u-file' | 'code';

const AuthScreen: React.FC = () => {
    const { login } = useAppContext();
    const [mode, setMode] = useState<AuthMode>('xtream');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [xtreamServer, setXtreamServer] = useState('');
    const [xtreamUser, setXtreamUser] = useState('');
    const [xtreamPass, setXtreamPass] = useState('');
    const [m3uUrl, setM3uUrl] = useState('');
    const [m3uFile, setM3uFile] = useState<File | null>(null);
    const [m3uFileName, setM3uFileName] = useState('No file chosen');
    const [authCode, setAuthCode] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            let result: { playlist: Playlist, userInfo: XtreamUserInfo } | null = null;
            let m3uParsedData: { streams: Stream[], categories: Category[] } | null = null;
            let m3uPlaylist: Playlist | null = null;

            if (mode === 'xtream') {
                if (!xtreamServer || !xtreamUser || !xtreamPass) {
                    throw new Error("All Xtream Codes fields are required.");
                }
                result = await authenticateXtream(xtreamServer, xtreamUser, xtreamPass);

            } else if (mode === 'm3u-url') {
                if (!m3uUrl) throw new Error("M3U URL is required.");
                try {
                    const response = await fetch(m3uUrl);
                    if (!response.ok) throw new Error(`Failed to fetch M3U URL. Status: ${response.status}`);
                    const content = await response.text();
                    m3uParsedData = parseM3uContent(content);
                } catch (fetchError) {
                     throw new Error("Could not fetch the M3U URL. It might be a CORS issue. Please try the 'M3U File' option instead.");
                }

            } else if (mode === 'm3u-file') {
                if (!m3uFile) throw new Error("M3U file is required.");
                const content = await m3uFile.text();
                m3uParsedData = parseM3uContent(content);

            } else if (mode === 'code') {
                // This is a placeholder for a custom code-based login system
                throw new Error("Login with code is not implemented yet.");
            }

            if(m3uParsedData){
                const genericUserInfo: XtreamUserInfo = { auth: 1, status: 'Active', username: 'm3u_user' };
                const genericServerInfo: ServerInfo = { url: 'local', port: '', server_protocol: 'http', https_port: '', rtmp_port: '', timezone: '', timestamp_now: 0, time_now: '' };
                m3uPlaylist = {
                    loginType: 'm3u',
                    user_info: genericUserInfo,
                    server_info: genericServerInfo,
                    streams: m3uParsedData.streams,
                    categories: m3uParsedData.categories,
                };
                result = { playlist: m3uPlaylist, userInfo: genericUserInfo };
            }

            if (result) {
                login(result.playlist, result.userInfo);
            } else {
                throw new Error("Login failed. Please check your credentials.");
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderForm = () => {
        switch (mode) {
            case 'xtream':
                return (
                    <>
                        <input type="text" value={xtreamServer} onChange={e => setXtreamServer(e.target.value)} placeholder="Server URL (http://...:port)" className="w-full p-3 bg-[#FFFFFF] dark:bg-[#1A1A24] rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />
                        <input type="text" value={xtreamUser} onChange={e => setXtreamUser(e.target.value)} placeholder="Username" className="w-full p-3 bg-[#FFFFFF] dark:bg-[#1A1A24] rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />
                        <input type="password" value={xtreamPass} onChange={e => setXtreamPass(e.target.value)} placeholder="Password" className="w-full p-3 bg-[#FFFFFF] dark:bg-[#1A1A24] rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />
                    </>
                );
            case 'm3u-url':
                return <input type="text" value={m3uUrl} onChange={e => setM3uUrl(e.target.value)} placeholder="M3U Playlist URL" className="w-full p-3 bg-[#FFFFFF] dark:bg-[#1A1A24] rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />;
            case 'm3u-file':
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
                        <label htmlFor="m3u-file-input" className="w-full flex justify-between items-center p-3 bg-[#FFFFFF] dark:bg-[#1A1A24] rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer">
                            <span className="text-gray-500 truncate">{m3uFileName}</span>
                            <span className="bg-gray-200 dark:bg-gray-700 text-sm font-medium px-3 py-1 rounded-md">Choose File</span>
                        </label>
                    </div>
                );
            case 'code':
                return <input type="text" value={authCode} onChange={e => setAuthCode(e.target.value)} placeholder="Enter Your Code" className="w-full p-3 bg-[#FFFFFF] dark:bg-[#1A1A24] rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500" />;
        }
    };
    
    const TabButton = ({ id, label }: { id: AuthMode, label: string }) => (
        <button
            onClick={() => setMode(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${mode === id ? 'bg-gradient-to-r from-[#7E3FF2] to-[#A56FFF] text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gradient-to-br dark:from-[#0D0D12] dark:to-[#1a0e2a] p-4">
            <div className="w-full max-w-md bg-[#F9F9FB] dark:bg-[#1A1A24] rounded-2xl shadow-lg p-8 space-y-6">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 mb-2">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6A00F4] to-[#9B4DFF] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.002v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[#121212] dark:text-white">Purple TV</h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter your playlist details to continue</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
                    <TabButton id="xtream" label="Xtream" />
                    <TabButton id="m3u-url" label="M3U Link" />
                    <TabButton id="m3u-file" label="M3U File" />
                    <TabButton id="code" label="Code" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {renderForm()}
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 text-white bg-gradient-to-r from-[#6A00F4] to-[#9B4DFF] hover:opacity-90 font-medium rounded-full text-sm px-5 py-3 text-center transition disabled:opacity-50">
                        {isLoading ? <LoadingSpinner size="sm" /> : null}
                        {isLoading ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthScreen;
