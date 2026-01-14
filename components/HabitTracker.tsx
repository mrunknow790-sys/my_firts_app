// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Habit, UserStats } from '../types';
import { Check, Flame, Calendar as CalendarIcon, Bell, Plus, Trophy, Edit2, Sparkles, ShoppingBag, Gift, Coins, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HabitTrackerProps {
  userStats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

// Sound Effect
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

// Enhanced Reminder System
const handleSetReminder = async (habit: Habit) => {
  // 1. Browser Notification
  if (!("Notification" in window)) {
    alert("您的浏览器不支持本地通知");
  } else if (Notification.permission === "granted") {
    new Notification(`LifeUp 提醒`, { body: `该打卡了: ${habit.name}`, icon: '/favicon.ico' });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(`LifeUp 提醒`, { body: `提醒设置成功: ${habit.name}` });
    }
  }

  // 2. System Calendar Event (ICS)
  const now = new Date();
  // Set to habit reminder time or default to next 10 mins
  let startHour = 9;
  let startMin = 0;
  if (habit.reminderTime) {
      const parts = habit.reminderTime.split(':');
      startHour = parseInt(parts[0]);
      startMin = parseInt(parts[1]);
  }
  
  const startDate = new Date();
  startDate.setHours(startHour, startMin, 0);
  if (startDate < now) startDate.setDate(startDate.getDate() + 1); // Schedule for tomorrow if time passed

  const endDate = new Date(startDate.getTime() + 15 * 60000);

  const event = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `SUMMARY:LifeUp 打卡: ${habit.name}`,
    `DESCRIPTION:坚持就是胜利！\n任务: ${habit.name}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT5M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');
  
  const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${habit.name}_reminder.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const SIDE_QUESTS = [
  "喝一杯温水，慢慢喝完", "整理相册，删除3张废片", "深呼吸一分钟", 
  "给一位老朋友发个表情包", "看看窗外远处的风景", "整理一下现在的桌面", 
  "听一首你最喜欢的歌", "做10个开合跳", "夸奖自己一句"
];

const HabitTracker: React.FC<HabitTrackerProps> = ({ userStats, onUpdateStats }) => {
  const defaultHabits: Habit[] = [
    { id: '1', name: '晨跑', icon: '🏃', color: 'bg-orange-100 text-orange-600', streak: 0, completedDates: [], reminderTime: '07:00' },
    { id: '2', name: '喝水', icon: '💧', color: 'bg-blue-100 text-blue-600', streak: 0, completedDates: [] },
  ];

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('lifeup_habits');
    return saved ? JSON.parse(saved) : defaultHabits;
  });

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('lifeup_habits', JSON.stringify(habits));
  }, [habits]);

  const [showReward, setShowReward] = useState(false);
  const [rewardMsg, setRewardMsg] = useState({ title: '', xp: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userStats.name || '进取者');
  const [showShop, setShowShop] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const questIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % SIDE_QUESTS.length;
  const todaysQuest = SIDE_QUESTS[questIndex];
  const isQuestDone = userStats.lastSideQuestDate === today;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleHabit = (id: string, dateStr: string = today) => {
    // Only allow toggling for today in list mode, or logic for calendar can be added if needed
    if (dateStr !== today && viewMode === 'list') return; 

    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompleted = h.completedDates.includes(dateStr);
        let newCompletedDates = isCompleted 
          ? h.completedDates.filter(d => d !== dateStr)
          : [...h.completedDates, dateStr];
        
        // Logic only for today regarding stats
        if (dateStr === today) {
            let newStreak = h.streak;
            if (!isCompleted) {
                newStreak += 1;
                playSuccessSound();
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
                onUpdateStats({ ...userStats, xp: Math.max(0, userStats.xp - 20) });
            }
            return { ...h, completedDates: newCompletedDates, streak: newStreak };
        }
        return { ...h, completedDates: newCompletedDates };
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
      alert("金币不足！需要50金币。");
      return;
    }
    playSuccessSound();
    const randomXP = Math.floor(Math.random() * 100) + 20;
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
    if (tempName.trim()) onUpdateStats({ ...userStats, name: tempName.trim() });
    else setTempName(userStats.name);
    setIsEditingName(false);
  };

  const handleTouchStart = (habit: Habit) => {
    timerRef.current = setTimeout(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      if (window.confirm(`确定要删除习惯 "${habit.name}" 吗？`)) {
        setHabits(prev => prev.filter(h => h.id !== habit.id));
      }
    }, 800);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
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

  // Calendar Helpers
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500 relative">
      {/* Header & Stats */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-gray-100/50 border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
        <div className="flex justify-between items-center mb-4 relative z-10">
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
                Hi, {userStats.name || '进取者'}
                <Edit2 className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
              </h2>
            )}
            <div className="flex items-center gap-3 text-sm mt-1">
               <button 
                 onClick={() => setShowShop(!showShop)}
                 className="flex items-center gap-1 text-yellow-700 bg-gradient-to-r from-yellow-100 to-amber-100 px-3 py-1 rounded-full border border-white/50 font-bold active:scale-95 transition-transform shadow-sm"
               >
                 <Coins className="w-3.5 h-3.5" />
                 {userStats.coins}
               </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center space-x-2 bg-gradient-to-br from-yellow-50 to-amber-100 px-3 py-1 rounded-full border border-white/50 shadow-sm">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-800">Lv {userStats.level}</span>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-1 flex justify-between text-xs text-gray-400 font-medium">
          <span>XP {userStats.xp % 100} / 100</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${userStats.xp % 100}%` }}
          />
        </div>
      </div>

      {/* Shop Area */}
      {showShop && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-5 border border-yellow-100 animate-in slide-in-from-top-2 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> 积分商店
                </h3>
                <span className="text-xs text-yellow-600 bg-white/50 px-2 py-1 rounded-md">余额: {userStats.coins}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button 
                    onClick={buyMysteryBox}
                    className="flex-shrink-0 bg-white p-3 rounded-2xl border border-yellow-100 w-32 flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-sm hover:shadow-md"
                >
                    <Gift className="w-8 h-8 text-purple-500" />
                    <div className="text-center">
                        <div className="font-bold text-sm text-gray-800">神秘宝箱</div>
                        <div className="text-xs text-yellow-600 font-bold">50 金币</div>
                    </div>
                </button>
            </div>
        </div>
      )}

      {/* Side Quest */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-0.5 shadow-lg shadow-indigo-200 text-white">
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-[1.3rem] flex items-center justify-between border border-white/10">
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
                : 'bg-white text-indigo-600 shadow-lg hover:scale-110 active:scale-90'
             }`}
           >
             {isQuestDone ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
           </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-end px-2">
        <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800">我的习惯</h3>
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
                >
                    <List className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
                >
                    <CalendarIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
        {viewMode === 'list' && (
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                今日: {Math.round(calculateProgress())}%
            </span>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-300">
            {habits.map(habit => {
            const isCompleted = habit.completedDates.includes(today);
            return (
                <div 
                key={habit.id} 
                className="group bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50 flex items-center justify-between transition-all hover:shadow-md select-none relative overflow-hidden"
                onMouseDown={() => handleTouchStart(habit)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(habit)}
                onTouchEnd={handleTouchEnd}
                >
                <div className="flex items-center gap-4 flex-1 pointer-events-none">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${habit.color}`}>
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

                {/* Alarm Button */}
                <button 
                    onClick={(e) => { e.stopPropagation(); handleSetReminder(habit); }}
                    className="p-3 text-gray-300 hover:text-emerald-500 transition-colors z-10 active:scale-90"
                    title="设置系统提醒"
                >
                    <Bell className="w-5 h-5" />
                </button>

                {/* Check Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleHabit(habit.id); }}
                    className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 shadow-sm active:scale-90 ${
                    isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200' 
                        : 'bg-white border-gray-100 text-gray-200 hover:border-emerald-300 hover:text-emerald-300'
                    }`}
                >
                    <Check className={`w-7 h-7 ${isCompleted ? 'stroke-[4px]' : 'stroke-2'}`} />
                </button>
                </div>
            );
            })}
             <button 
                onClick={addNewHabit}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300/50 text-gray-400 font-medium flex items-center justify-center gap-2 hover:border-emerald-400 hover:text-emerald-500 transition-all bg-white/30 backdrop-blur-sm"
            >
                <Plus className="w-5 h-5" /> 添加新习惯
            </button>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft className="w-5 h-5"/></button>
                  <h3 className="font-bold text-gray-800 text-lg">{format(currentMonth, 'yyyy年 MM月', { locale: zhCN })}</h3>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronRight className="w-5 h-5"/></button>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs text-gray-400 font-medium">
                  {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((date, idx) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isToday = isSameDay(date, new Date());
                      const isCurrentMonth = isSameMonth(date, currentMonth);
                      
                      // Calculate tasks done this day
                      const tasksDone = habits.filter(h => h.completedDates.includes(dateStr));
                      const taskCount = tasksDone.length;
                      const hasTasks = taskCount > 0;
                      const allDone = habits.length > 0 && taskCount === habits.length;

                      return (
                          <div 
                             key={dateStr} 
                             className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all
                                ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                                ${isToday ? 'bg-emerald-50 text-emerald-700 font-bold ring-2 ring-emerald-500 ring-offset-2' : ''}
                                ${hasTasks && !isToday ? 'bg-gray-50' : ''}
                             `}
                          >
                              <span className="z-10">{format(date, 'd')}</span>
                              {hasTasks && (
                                  <div className="flex gap-0.5 mt-1 h-1.5">
                                      {tasksDone.slice(0, 3).map((_, i) => (
                                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${allDone ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                                      ))}
                                      {taskCount > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                                  </div>
                              )}
                          </div>
                      )
                  })}
              </div>
              <div className="mt-4 text-center text-xs text-gray-400">
                 圆点代表当日完成的任务
              </div>
          </div>
      )}

      {/* Reward Modal */}
      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-white/50 animate-bounce text-center ring-1 ring-black/5">
                <div className="text-5xl mb-4 drop-shadow-sm">🎉</div>
                <div className="font-bold text-xl text-gray-800 mb-1">{rewardMsg.title}</div>
                <div className="text-amber-500 font-bold text-2xl drop-shadow-sm">+{rewardMsg.xp} XP</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
