import React, { useState } from 'react';
import { ViewState, UserStats } from './types';
import HabitTracker from './components/HabitTracker';
import Journal from './components/Journal';
import EnglishDaily from './components/EnglishDaily';
import { ListTodo, BookHeart, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('habits');
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 0,
    level: 1,
    coins: 0
  });

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Main Content Area */}
      <main className="max-w-md mx-auto min-h-screen bg-white sm:shadow-2xl sm:my-8 sm:rounded-[3rem] sm:min-h-[850px] relative overflow-hidden flex flex-col">
        {/* Top Status Bar Decoration (Mobile Simulation) */}
        <div className="h-6 w-full bg-white z-10 sticky top-0 sm:hidden"></div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {currentView === 'habits' && (
            <HabitTracker userStats={userStats} onUpdateStats={setUserStats} />
          )}
          {currentView === 'journal' && (
            <Journal />
          )}
          {currentView === 'english' && (
            <EnglishDaily />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-4 pb-8 sm:pb-6 z-20">
          <nav className="flex justify-around items-center max-w-sm mx-auto bg-gray-900 rounded-full p-2 shadow-xl shadow-gray-200">
            
            <button
              onClick={() => setCurrentView('habits')}
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
              onClick={() => setCurrentView('journal')}
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
              onClick={() => setCurrentView('english')}
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