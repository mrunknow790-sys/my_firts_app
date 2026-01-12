import React, { useState, useEffect } from 'react';
import { Habit, UserStats } from '../types';
import { Check, Flame, Calendar as CalendarIcon, Bell, Plus, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface HabitTrackerProps {
  userStats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

// Helper to generate ICS file content
const generateICS = (habit: Habit) => {
  const now = new Date();
  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTEND:${new Date(now.getTime() + 15 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, // 15 min duration
    `SUMMARY:LifeUp 提醒: ${habit.name}`,
    `DESCRIPTION:来自 LifeUp 的习惯打卡提醒: ${habit.name}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  
  const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${habit.name.replace(/\s+/g, '_')}_reminder.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const HabitTracker: React.FC<HabitTrackerProps> = ({ userStats, onUpdateStats }) => {
  // Initial habits
  const defaultHabits: Habit[] = [
    { id: '1', name: '晨跑', icon: '🏃', color: 'bg-orange-100 text-orange-600', streak: 0, completedDates: [], reminderTime: '07:00' },
    { id: '2', name: '喝水', icon: '💧', color: 'bg-blue-100 text-blue-600', streak: 0, completedDates: [] },
    { id: '3', name: '阅读', icon: '📚', color: 'bg-purple-100 text-purple-600', streak: 0, completedDates: [] },
  ];

  // Load from localStorage
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('lifeup_habits');
    return saved ? JSON.parse(saved) : defaultHabits;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('lifeup_habits', JSON.stringify(habits));
  }, [habits]);

  const [showReward, setShowReward] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompleted = h.completedDates.includes(today);
        let newCompletedDates = isCompleted 
          ? h.completedDates.filter(d => d !== today)
          : [...h.completedDates, today];
        
        // Simple streak logic
        let newStreak = h.streak;
        if (!isCompleted) {
            newStreak += 1;
            // Trigger reward
            onUpdateStats({
                ...userStats,
                xp: userStats.xp + 20,
                coins: userStats.coins + 10,
                level: Math.floor((userStats.xp + 20) / 100) + 1
            });
            setShowReward(true);
            setTimeout(() => setShowReward(false), 2000);
        } else {
            newStreak = Math.max(0, newStreak - 1);
            onUpdateStats({
                ...userStats,
                xp: Math.max(0, userStats.xp - 20)
            });
        }

        return { ...h, completedDates: newCompletedDates, streak: newStreak };
      }
      return h;
    }));
  };

  const calculateProgress = () => {
    const completed = habits.filter(h => h.completedDates.includes(today)).length;
    return habits.length > 0 ? (completed / habits.length) * 100 : 0;
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">你好，进取者！</h2>
            <p className="text-gray-500 text-sm">今天也要加油哦。</p>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-yellow-700">Lv {userStats.level}</span>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-2 flex justify-between text-xs text-gray-400 font-medium">
          <span>经验值: {userStats.xp % 100}/100</span>
          <span>下一级</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-500 ease-out"
            style={{ width: `${userStats.xp % 100}%` }}
          />
        </div>
      </div>

      {/* Daily Progress */}
      <div className="flex justify-between items-end px-2">
        <h3 className="text-lg font-bold text-gray-800">今日打卡</h3>
        <span className="text-sm font-medium text-emerald-600">{Math.round(calculateProgress())}% 已完成</span>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {habits.map(habit => {
          const isCompleted = habit.completedDates.includes(today);
          return (
            <div key={habit.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${habit.color}`}>
                  {habit.icon}
                </div>
                <div>
                  <h4 className={`font-semibold text-gray-800 transition-all ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                    {habit.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1 text-orange-500 font-medium">
                      <Flame className="w-3 h-3 fill-current" /> 连续 {habit.streak} 天
                    </span>
                    {habit.reminderTime && (
                       <button 
                         onClick={() => generateICS(habit)}
                         className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                         title="添加到日历 / 设置提醒"
                       >
                        <Bell className="w-3 h-3" /> {habit.reminderTime}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleHabit(habit.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                    : 'border-gray-200 text-gray-300 hover:border-emerald-400 hover:text-emerald-400'
                }`}
              >
                <Check className={`w-6 h-6 ${isCompleted ? 'stroke-[3px]' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>

      <button className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-emerald-400 hover:text-emerald-500 transition-all">
        <Plus className="w-5 h-5" /> 添加新习惯
      </button>

      {/* Simplified Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-yellow-200 animate-bounce text-center">
                <div className="text-4xl mb-2">🎉</div>
                <div className="font-bold text-xl text-gray-800">继续保持！</div>
                <div className="text-yellow-600 font-bold">+20 经验值</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;