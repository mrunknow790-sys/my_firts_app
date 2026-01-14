// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { EnglishArticle, UserStats } from '../types';
import { Volume2, BookOpen, PlayCircle, PauseCircle, ClipboardPaste, Plus, Trash2, Save, CheckCircle, Trophy, Library, ChevronLeft, ArrowLeft, History } from 'lucide-react';
import { format } from 'date-fns';

interface EnglishDailyProps {
  userStats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

const EnglishDaily: React.FC<EnglishDailyProps> = ({ userStats, onUpdateStats }) => {
  // Store array of articles now
  const [library, setLibrary] = useState<EnglishArticle[]>(() => {
    const saved = localStorage.getItem('lifeup_english_library');
    if (saved) return JSON.parse(saved);
    // Migration: check for old single article format
    const oldSingle = localStorage.getItem('lifeup_english_article');
    if (oldSingle) {
        const parsed = JSON.parse(oldSingle);
        return [{ ...parsed, id: Date.now().toString(), addedDate: new Date().toISOString(), completionCount: parsed.lastCompletedDate ? 1 : 0 }];
    }
    return [];
  });

  // State
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [viewMode, setViewMode] = useState<'library' | 'reading'>('library');

  // Derived
  const currentArticle = library.find(a => a.id === currentArticleId);

  // Persistence
  useEffect(() => {
    localStorage.setItem('lifeup_english_library', JSON.stringify(library));
  }, [library]);

  // Clean up TTS
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setEditContent(text);
        if (!editTitle) setEditTitle('My New Article');
      }
    } catch (err) {
      console.error('Clipboard error', err);
    }
  };

  const handleSaveNew = () => {
    if (!editContent.trim()) return;
    const newArticle: EnglishArticle = {
        id: Date.now().toString(),
        title: editTitle || 'Untitled Article',
        content: editContent,
        difficulty: 'Custom',
        addedDate: new Date().toISOString(),
        completionCount: 0
    };
    setLibrary(prev => [newArticle, ...prev]); // Add to top
    setEditTitle('');
    setEditContent('');
    setIsAdding(false);
    setCurrentArticleId(newArticle.id);
    setViewMode('reading');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("确定要删除这篇文章吗？")) {
        setLibrary(prev => prev.filter(a => a.id !== id));
        if (currentArticleId === id) setViewMode('library');
    }
  };

  const handleComplete = () => {
    if (!currentArticle) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Logic: Allow re-completing on different days
    if (currentArticle.lastCompletedDate === today) return;

    onUpdateStats({
      ...userStats,
      xp: userStats.xp + 50,
      coins: userStats.coins + 20,
      level: Math.floor((userStats.xp + 50) / 100) + 1
    });

    // Update article history
    setLibrary(prev => prev.map(a => {
        if (a.id === currentArticle.id) {
            return {
                ...a,
                lastCompletedDate: today,
                completionCount: (a.completionCount || 0) + 1
            };
        }
        return a;
    }));

    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  const speakText = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
    if (usVoice) utterance.voice = usVoice;

    utterance.onend = () => setIsPlaying(false);
    utterance.onstart = () => setIsPlaying(true);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleFullRead = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else if (currentArticle) {
      speakText(currentArticle.content);
    }
  };

  // Views
  if (isAdding) {
      return (
        <div className="space-y-6 pb-24 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5"/></button>
                <h2 className="text-2xl font-bold text-gray-800">导入文章</h2>
            </div>
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 space-y-4">
                <div className="flex gap-2">
                    <button onClick={handlePaste} className="text-sm bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg font-bold flex items-center gap-1">
                        <ClipboardPaste className="w-4 h-4"/> 粘贴剪贴板
                    </button>
                </div>
                <input 
                  type="text" 
                  placeholder="文章标题"
                  value={editTitle}
                  onChange={(e) => setEditTitle((e.target as HTMLInputElement).value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-100 outline-none font-bold text-gray-800"
                />
                <textarea 
                  placeholder="在此输入英文内容..."
                  value={editContent}
                  onChange={(e) => setEditContent((e.target as HTMLTextAreaElement).value)}
                  className="w-full h-48 p-4 bg-gray-50 rounded-xl resize-none border-none focus:ring-2 focus:ring-emerald-100 outline-none text-gray-700 leading-relaxed"
                />
                <button 
                  onClick={handleSaveNew}
                  disabled={!editContent.trim()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all disabled:opacity-50"
                >
                  保存并开始学习
                </button>
            </div>
        </div>
      )
  }

  // Library View
  if (viewMode === 'library') {
      return (
        <div className="space-y-6 pb-24 animate-in fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">英语文库</h2>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-gray-900 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                </button>
             </div>

             {library.length === 0 ? (
                 <div className="text-center py-12 text-gray-400 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                     <Library className="w-12 h-12 mx-auto mb-2 opacity-20" />
                     空空如也，添加第一篇文章吧
                 </div>
             ) : (
                 <div className="grid gap-4">
                     {library.map(art => (
                         <div 
                            key={art.id}
                            onClick={() => { setCurrentArticleId(art.id); setViewMode('reading'); }}
                            className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all active:scale-98 cursor-pointer relative group"
                         >
                             <h3 className="font-bold text-gray-800 mb-1 pr-8 truncate">{art.title}</h3>
                             <p className="text-xs text-gray-400 line-clamp-2 mb-3">{art.content}</p>
                             <div className="flex items-center justify-between">
                                <div className="flex gap-2 text-xs">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-500">{format(new Date(art.addedDate), 'MM/dd')}</span>
                                    {art.completionCount > 0 && (
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded flex items-center gap-1">
                                            <Trophy className="w-3 h-3" /> {art.completionCount}次
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(art.id, e)}
                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
      )
  }

  // Reading View
  if (!currentArticle) return null; // Should not happen
  const isCompletedToday = currentArticle.lastCompletedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6 pb-24 animate-in slide-in-from-right duration-300">
       <div className="flex items-center gap-2">
           <button onClick={() => setViewMode('library')} className="p-2 bg-white rounded-full shadow-sm text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
           <h2 className="text-xl font-bold text-gray-800 truncate flex-1">{currentArticle.title}</h2>
       </div>

       {/* Article Card */}
       <div className="bg-white rounded-[2rem] shadow-xl shadow-emerald-100/50 overflow-hidden flex flex-col min-h-[500px]">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white relative">
            <BookOpen className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 rotate-12" />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10">Reading Mode</span>
                <div className="flex gap-2">
                    {isCompletedToday && <span className="bg-white/20 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 今日已背</span>}
                </div>
            </div>
            
            <button 
                onClick={toggleFullRead}
                className="flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
                {isPlaying ? <PauseCircle className="w-5 h-5"/> : <PlayCircle className="w-5 h-5"/>}
                {isPlaying ? '暂停朗读' : '全文朗读'}
            </button>
          </div>
          
          <div className="p-8 flex-1 bg-white">
            <p className="text-xl text-gray-700 leading-loose font-serif select-text whitespace-pre-line">
              {currentArticle.content.split(/(\s+)/).map((part, index) => {
                  if (part.trim() === '') return part;
                  return (
                    <span
                        key={index}
                        onClick={() => speakText(part.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ""))}
                        className="cursor-pointer hover:bg-yellow-200 hover:text-yellow-900 rounded px-0.5 transition-colors inline-block"
                    >
                        {part}
                    </span>
                  );
              })}
            </p>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
             <button
               onClick={handleComplete}
               disabled={isCompletedToday}
               className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                 isCompletedToday 
                   ? 'bg-emerald-100 text-emerald-700 cursor-default opacity-80' 
                   : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95'
               }`}
             >
               {isCompletedToday ? '今日背诵任务已完成' : '我已完成背诵 (+50 XP)'}
             </button>
             {currentArticle.lastCompletedDate && (
                 <p className="text-center text-xs text-gray-400 mt-2">
                     上次背诵: {currentArticle.lastCompletedDate} · 共完成 {currentArticle.completionCount || 0} 次
                 </p>
             )}
          </div>
       </div>

       {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl border border-white/50 animate-bounce text-center">
                <div className="text-5xl mb-4">🏆</div>
                <div className="font-bold text-xl text-gray-800">背诵打卡成功！</div>
                <div className="text-emerald-500 font-bold mt-1">+50 经验值</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EnglishDaily;
