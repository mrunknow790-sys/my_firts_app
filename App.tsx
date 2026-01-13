// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ViewState, UserStats } from './types';
import HabitTracker from './components/HabitTracker';
import Journal from './components/Journal';
import EnglishDaily from './components/EnglishDaily';
import { ListTodo, BookHeart, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  // Load initial state from localStorage if available
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('lifeup_view');
    return (saved as ViewState) || 'habits';
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('lifeup_stats');
    return saved ? JSON.parse(saved) : { name: '进取者', xp: 0, level: 1, coins: 0 };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('lifeup_view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('lifeup_stats', JSON.stringify(userStats));
  }, [userStats]);

  const handleNavClick = (view: ViewState) => {
    setCurrentView(view);
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10); // Light haptic feedback
    }
  };

  return (
    // Updated container: Fixed height (h-screen)
    // NEW: Added a premium gradient background (Aurora style)
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50 text-gray-900 font-sans selection:bg-emerald-200 selection:text-emerald-900 pt-[var(--sat)] flex flex-col">
      
      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full h-full relative flex flex-col sm:my-8 sm:h-[850px] sm:rounded-[3rem] sm:shadow-2xl sm:border sm:border-gray-100 overflow-hidden bg-white/50 backdrop-blur-sm sm:bg-white">
        
        {/* Content View - Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
          {currentView === 'habits' && (
            <HabitTracker userStats={userStats} onUpdateStats={setUserStats} />
          )}
          {currentView === 'journal' && (
            <Journal />
          )}
          {currentView === 'english' && (
            <EnglishDaily userStats={userStats} onUpdateStats={setUserStats} />
          )}
        </div>

        {/* Bottom Navigation - Fixed within the flex container */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100/50 px-6 py-4 z-20 pb-[calc(1rem+var(--sab))] sm:pb-6">
          <nav className="flex justify-around items-center max-w-sm mx-auto bg-gray-900/95 rounded-full p-2 shadow-xl shadow-gray-200">
            
            <button
              onClick={() => handleNavClick('habits')}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                currentView === 'habits' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 -translate-y-4' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ListTodo className="w-6 h-6" />
              {currentView === 'habits' && (
                <span className="absolute -bottom-6 text-[10px] font-bold text-gray-900 tracking-wide opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards" style={{ opacity: 1 }}>
                  打卡
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('journal')}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                currentView === 'journal' 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 -translate-y-4' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BookHeart className="w-6 h-6" />
               {currentView === 'journal' && (
                <span className="absolute -bottom-6 text-[10px] font-bold text-gray-900 tracking-wide">
                  日记
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('english')}
              className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                currentView === 'english' 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 -translate-y-4' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <GraduationCap className="w-6 h-6" />
               {currentView === 'english' && (
                <span className="absolute -bottom-6 text-[10px] font-bold text-gray-900 tracking-wide">
                  学习
                </span>
              )}
            </button>

          </nav>
        </div>
      </main>
    </div>
  );
};

export default App;
