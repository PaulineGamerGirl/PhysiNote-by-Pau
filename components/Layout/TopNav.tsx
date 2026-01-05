
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Layout, Settings, Menu, Wifi, WifiOff } from 'lucide-react';

interface TopNavProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  showSidebarToggle?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({ isSidebarOpen, setIsSidebarOpen, setIsSettingsModalOpen, showSidebarToggle = true }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="sticky top-0 z-20 px-6 sm:px-10 py-5 bg-white/80 backdrop-blur-xl flex justify-between items-center print:hidden border-b border-white/0 transition-all duration-300">
       <div className="flex items-center gap-4">
           {showSidebarToggle && (
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 hover:bg-slate-50 rounded-full transition shadow-sm bg-white border border-slate-100 group">
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-800" /> : <Menu className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />}
               </button>
           )}
           {/* If Sidebar is closed OR we are on home screen, show brand */}
           {(!isSidebarOpen || !showSidebarToggle) && <span className="font-extrabold text-xl tracking-tight text-slate-900 animate-fade-in">PhysiNote</span>}
           
           {/* Offline Indicator */}
           {!isOnline && (
               <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full animate-fade-in">
                   <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                   <span className="text-xs font-bold text-rose-600">Cloud Off • Saved Locally</span>
               </div>
           )}
       </div>
       <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2.5 hover:bg-slate-50 rounded-full transition text-slate-400 hover:text-slate-700"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 shadow-lg shadow-pink-200 ring-2 ring-white"></div>
       </div>
    </div>
  );
};

export default TopNav;
