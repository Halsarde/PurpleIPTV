import React from 'react';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
    contentType: string;
    onContentTypeChange: (type: 'live' | 'movie' | 'series' | 'favorites' | 'recents') => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactElement;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex flex-col sm:flex-row items-center sm:justify-start sm:gap-4 p-3 rounded-lg transition-colors ${
            isActive 
                ? 'bg-purple-600/20 text-purple-300' 
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`}
        aria-label={label}
    >
        {icon}
        <span className="mt-1 sm:mt-0 text-xs sm:text-base hidden sm:inline">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ contentType, onContentTypeChange }) => {
    const { logout, userInfo } = useAppContext();
    
    const navItems = [
        { id: 'live', label: 'Live TV', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
        { id: 'movie', label: 'Movies', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg> },
        { id: 'series', label: 'Series', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
        { id: 'favorites', label: 'Favorites', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
        { id: 'recents', label: 'Recents', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
    ];

    return (
        <aside className="fixed top-0 left-0 h-full w-16 sm:w-64 bg-[#1A1A24] flex flex-col justify-between p-2 sm:p-4 z-30">
            <div>
                 <div className="flex items-center justify-center sm:justify-start gap-2 mb-8">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6A00F4] to-[#9B4DFF] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.002v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-white hidden sm:inline">Purple TV</h1>
                </div>

                <nav className="space-y-2">
                    {navItems.map(item => (
                        <NavItem 
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            isActive={contentType === item.id}
                            onClick={() => onContentTypeChange(item.id as 'live' | 'movie' | 'series' | 'favorites' | 'recents')}
                        />
                    ))}
                </nav>
            </div>

            <div className="space-y-2">
                {userInfo && (
                    <div className="text-center sm:text-left text-xs text-gray-400 p-2 border-t border-gray-700">
                        <p className="font-semibold hidden sm:block">{userInfo.username}</p>
                        <p className="hidden sm:block">{userInfo.status}</p>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="w-full flex flex-col sm:flex-row items-center sm:justify-start sm:gap-4 p-3 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="mt-1 sm:mt-0 text-xs sm:text-base hidden sm:inline">Logout</span>
                </button>
            </div>
        </aside>
    );
};
