// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Habit, UserStats } from '../types';
import { Check, Flame, Calendar as CalendarIcon, Bell, Plus, Trophy, Edit2, Trash2, Sparkles, ShoppingBag, Gift, Coins } from 'lucide-react';
import { format } from 'date-fns';

interface HabitTrackerProps {
  userStats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

// Sound Effect Utility using Web Audio API (No external file needed)
const playSuccessSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(500, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

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

// Daily Quests Data
const SIDE_QUESTS = [
  "喝一杯温水，慢慢喝完",
  "整理相册，删除3张废片",
  "深呼吸一分钟",
  "给一位老朋友发个表情包",
  "看看窗外远处的风景",
  "整理一下现在的桌面/房间",
  "听一首你最喜欢的歌",
  "做10个开合跳",
  "夸奖自己一句"
];

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
  const [rewardMsg, setRewardMsg] = useState({ title: '', xp: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userStats.name || '进取者');
  const [showShop, setShowShop] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  // Determine today's quest based on date hash to keep it consistent for the day
  const questIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % SIDE_QUESTS.length;
  const todaysQuest = SIDE_QUESTS[questIndex];
  const isQuestDone = userStats.lastSideQuestDate === today;

  // Long press logic ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
            playSuccessSound();
            // Trigger reward
            onUpdateStats({
                ...userStats,
                xp: userStats.xp + 20,
                coins: userStats.coins + 10,
                level: Math.floor((userStats.xp + 20) / 100) + 1
            });
            setRewardMsg({ title: '继续保持！', xp: 20 });
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

  const completeSideQuest = () => {
    if (isQuestDone) return;
    playSuccessSound();
    onUpdateStats({
      ...userStats,
      xp: userStats.xp + 30,
      coins: userStats.coins + 15,
      lastSideQuestDate: today,
      level: Math.floor((userStats.xp + 30) / 100) + 1
    });
    setRewardMsg({ title: '支线任务完成！', xp: 30 });
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  const buyMysteryBox = () => {
    if (userStats.coins < 50) {
      alert("金币不足！需要50金币。多打卡赚取金币吧！");
      return;
    }
    
    playSuccessSound();
    // Random reward logic
    const randomXP = Math.floor(Math.random() * 100) + 20; // 20 to 120 XP
    
    onUpdateStats({
      ...userStats,
      coins: userStats.coins - 50,
      xp: userStats.xp + randomXP,
      level: Math.floor((userStats.xp + randomXP) / 100) + 1
    });

    setRewardMsg({ title: '开启神秘宝箱！', xp: randomXP });
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUpdateStats({ ...userStats, name: tempName.trim() });
    } else {
      setTempName(userStats.name); // revert if empty
    }
    setIsEditingName(false);
  };

  const handleTouchStart = (habit: Habit) => {
    timerRef.current = setTimeout(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      if (window.confirm(`确定要删除习惯 "${habit.name}" 吗？`)) {
        setHabits(prev => prev.filter(h => h.id !== habit.id));
      }
    }, 800); // 800ms for long press
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const addNewHabit = () => {
    const name = window.prompt("请输入新习惯名称:");
    if (!name) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: name,
      icon: '✨',
      color: 'bg-emerald-100 text-emerald-600',
      streak: 0,
      completedDates: []
    };
    setHabits([...habits, newHabit]);
  };

  const calculateProgress = () => {
    const completed = habits.filter(h => h.completedDates.includes(today)).length;
    return habits.length > 0 ? (completed / habits.length) * 100 : 0;
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 relative">
      {/* Header & Stats */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                autoFocus
                className="text-2xl font-bold text-gray-800 border-b-2 border-emerald-500 outline-none w-48 bg-transparent"
              />
            ) : (
              <h2 
                className="text-2xl font-bold text-gray-800 flex items-center gap-2 cursor-pointer group"
                onClick={() => setIsEditingName(true)}
              >
                你好，{userStats.name || '进取者'}！
                <Edit2 className="w-4 h-4 text-gray-300 group-hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all" />
              </h2>
            )}
            <div className="flex items-center gap-3 text-sm mt-1">
               <span className="text-gray-500">今天也要加油哦。</span>
               <button 
                 onClick={() => setShowShop(!showShop)}
                 className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100 font-bold active:scale-95 transition-transform"
               >
                 <Coins className="w-3 h-3" />
                 {userStats.coins}
               </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-1 rounded-full border border-yellow-100 shadow-sm">
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

      {/* Shop Area (Collapsible) */}
      {showShop && (
        <div className="bg-yellow-50 rounded-3xl p-5 border border-yellow-200 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> 积分商店
                </h3>
                <span className="text-xs text-yellow-600">花掉你的金币！</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button 
                    onClick={buyMysteryBox}
                    className="flex-shrink-0 bg-white p-3 rounded-xl border-2 border-yellow-200 w-32 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-sm"
                >
                    <Gift className="w-8 h-8 text-purple-500" />
                    <div className="text-center">
                        <div className="font-bold text-sm text-gray-800">神秘宝箱</div>
                        <div className="text-xs text-yellow-600 font-bold">50 金币</div>
                    </div>
                </button>
                {/* Placeholder for future items */}
                <div className="flex-shrink-0 bg-white/50 p-3 rounded-xl border-2 border-dashed border-yellow-200 w-32 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs text-gray-400">敬请期待</span>
                </div>
            </div>
        </div>
      )}

      {/* Side Quest Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-1 shadow-lg text-white">
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-[1.3rem] flex items-center justify-between">
           <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">
                 <Sparkles className="w-3 h-3" /> 每日支线任务
              </div>
              <div className={`font-medium transition-all ${isQuestDone ? 'line-through opacity-60' : ''}`}>
                 {todaysQuest}
              </div>
           </div>
           <button 
             onClick={completeSideQuest}
             disabled={isQuestDone}
             className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isQuestDone 
                ? 'bg-white/20 text-white cursor-default' 
                : 'bg-white text-indigo-600 shadow-md hover:scale-110 active:scale-90'
             }`}
           >
             {isQuestDone ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
           </button>
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
            <div 
              key={habit.id} 
              className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md select-none relative overflow-hidden"
              onMouseDown={() => handleTouchStart(habit)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={() => handleTouchStart(habit)}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-center gap-4 flex-1 pointer-events-none">
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
                       <span className="flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {habit.reminderTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reminder Button */}
              {habit.reminderTime && (
                <button 
                  onClick={(e) => { e.stopPropagation(); generateICS(habit); }}
                  className="absolute top-4 right-20 p-2 text-gray-300 hover:text-blue-500 transition-colors z-10"
                  title="添加到日历"
                >
                   <CalendarIcon className="w-4 h-4" />
                </button>
              )}

              {/* Check Button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm active:scale-90 ${
                  isCompleted 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200' 
                    : 'bg-white border-gray-200 text-gray-300 hover:border-emerald-400 hover:text-emerald-400 hover:shadow-md'
                }`}
              >
                <Check className={`w-8 h-8 ${isCompleted ? 'stroke-[4px]' : 'stroke-2'}`} />
              </button>
            </div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            长按任意习惯可删除，点击下方添加新习惯
          </div>
        )}
      </div>

      <button 
        onClick={addNewHabit}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-emerald-400 hover:text-emerald-500 transition-all"
      >
        <Plus className="w-5 h-5" /> 添加新习惯
      </button>

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-yellow-200 animate-bounce text-center">
                <div className="text-4xl mb-2">🎉</div>
                <div className="font-bold text-xl text-gray-800">{rewardMsg.title}</div>
                <div className="text-yellow-600 font-bold">+{rewardMsg.xp} 经验值</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
