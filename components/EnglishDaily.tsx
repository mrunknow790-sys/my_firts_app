import React, { useState, useEffect, useCallback } from 'react';
import { EnglishArticle, UserStats } from '../types';
import { Volume2, BookOpen, PlayCircle, PauseCircle, ClipboardPaste, Edit3, Trash2, Save, CheckCircle, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface EnglishDailyProps {
  userStats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

const EnglishDaily: React.FC<EnglishDailyProps> = ({ userStats, onUpdateStats }) => {
  const [article, setArticle] = useState<EnglishArticle | null>(() => {
    const saved = localStorage.getItem('lifeup_english_article');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReward, setShowReward] = useState(false);

  // Save to localStorage
  useEffect(() => {
    if (article) {
      localStorage.setItem('lifeup_english_article', JSON.stringify(article));
    } else {
      localStorage.removeItem('lifeup_english_article');
    }
  }, [article]);

  // Handle Text-to-Speech stop on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setEditContent(text);
        if (!editTitle) setEditTitle('导入的文章');
        setIsEditing(true);
      } else {
        alert('剪贴板为空或无法读取');
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
      // Fallback: just open edit mode so user can manually paste
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!editContent.trim()) return;
    
    setArticle({
      title: editTitle || '未命名文章',
      content: editContent,
      difficulty: 'Custom',
      vocabulary: [], // Manual import usually doesn't have definitions unless we use AI
      lastCompletedDate: undefined // Reset completion status on new import
    });
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (article) {
      setEditTitle(article.title);
      setEditContent(article.content);
      setIsEditing(true);
    }
  };

  const handleClear = () => {
    if (window.confirm('确定要清空当前文章吗？')) {
      setArticle(null);
      setEditTitle('');
      setEditContent('');
      setIsEditing(false);
      window.speechSynthesis.cancel();
    }
  };

  const handleComplete = () => {
    if (!article) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Prevent double reward for the same day
    if (article.lastCompletedDate === today) return;

    // Update stats (High reward for study)
    onUpdateStats({
      ...userStats,
      xp: userStats.xp + 50,
      coins: userStats.coins + 20,
      level: Math.floor((userStats.xp + 50) / 100) + 1
    });

    // Mark as completed
    setArticle({
      ...article,
      lastCompletedDate: today
    });

    // Show reward
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2000);
  };

  const speakText = useCallback((text: string) => {
    window.speechSynthesis.cancel(); // Stop current
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Standard US English
    utterance.rate = 0.9; // Slightly slower for learning
    
    // Attempt to find a specific high-quality US voice if available
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
    } else if (article) {
      speakText(article.content);
    }
  };

  const handleWordClick = (word: string) => {
    // Remove punctuation
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    speakText(cleanWord);
  };

  // Helper to wrap words in spans
  const renderInteractiveText = (text: string) => {
    return text.split(/(\s+)/).map((part, index) => {
      if (part.trim() === '') return <span key={index}>{part}</span>;
      return (
        <span
          key={index}
          onClick={() => handleWordClick(part)}
          className="cursor-pointer hover:bg-yellow-200 hover:text-yellow-900 rounded px-0.5 transition-colors inline-block select-text"
        >
          {part}
        </span>
      );
    });
  };

  // Editing View
  if (isEditing || !article) {
    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">每日英语</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
           <div className="text-center space-y-4 py-4">
              <div className="p-4 bg-emerald-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-emerald-500">
                <ClipboardPaste className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">导入学习内容</h3>
              <p className="text-sm text-gray-400">复制你想学习的英文段落，粘贴到这里。</p>
              
              {!isEditing && (
                <button 
                  onClick={handlePaste}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ClipboardPaste className="w-5 h-5" /> 
                  从剪贴板粘贴
                </button>
              )}
           </div>

           {(isEditing || !article) && (
             <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-300">
                <input 
                  type="text" 
                  placeholder="文章标题（可选）"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-100 outline-none font-bold text-gray-800"
                />
                <textarea 
                  placeholder="在此输入或粘贴英文内容..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-48 p-4 bg-gray-50 rounded-xl resize-none border-none focus:ring-2 focus:ring-emerald-100 outline-none text-gray-700 leading-relaxed"
                />
                <div className="flex gap-3">
                  {article && (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      取消
                    </button>
                  )}
                  <button 
                    onClick={handleSave}
                    disabled={!editContent.trim()}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {article ? '保存修改' : '开始学习'}
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  const isCompletedToday = article.lastCompletedDate === format(new Date(), 'yyyy-MM-dd');

  // Reading View
  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">每日英语</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-emerald-600 transition-colors bg-white rounded-full border border-gray-100 shadow-sm"
            title="编辑内容"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full border border-gray-100 shadow-sm"
            title="删除/新建"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Article Card */}
      <div className="bg-white rounded-3xl shadow-lg shadow-emerald-50/50 border border-emerald-100 overflow-hidden min-h-[400px] flex flex-col">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white relative overflow-hidden">
            <BookOpen className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 rotate-12" />
            <span className="inline-block px-2 py-1 bg-white/20 rounded-md text-xs font-medium mb-2 backdrop-blur-sm border border-white/10">
              本地导入
            </span>
            <h3 className="text-xl font-bold leading-tight mb-2 pr-8">{article.title}</h3>
            <div className="flex items-center gap-2">
                <button 
                  onClick={toggleFullRead}
                  className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors"
                >
                  {isPlaying ? <PauseCircle className="w-4 h-4"/> : <PlayCircle className="w-4 h-4"/>}
                  {isPlaying ? '停止' : '全文朗读'}
                </button>
                <span className="text-xs opacity-80">美式发音</span>
            </div>
          </div>
          
          <div className="p-6 flex-1">
            <p className="text-lg text-gray-700 leading-loose">
              {renderInteractiveText(article.content)}
            </p>
            <p className="text-xs text-gray-400 mt-8 text-center border-t border-gray-100 pt-4">
              点击任意单词可单独收听发音
            </p>
          </div>

          {/* Completion Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
             <button
               onClick={handleComplete}
               disabled={isCompletedToday}
               className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                 isCompletedToday 
                   ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                   : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95'
               }`}
             >
               {isCompletedToday ? (
                 <>
                  <CheckCircle className="w-5 h-5" /> 今日已完成 (+50 XP)
                 </>
               ) : (
                 <>
                  <Trophy className="w-5 h-5" /> 我已背诵完成
                 </>
               )}
             </button>
          </div>
      </div>

       {/* Reward Modal */}
       {showReward && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-yellow-200 animate-bounce text-center">
                <div className="text-4xl mb-2">🎉</div>
                <div className="font-bold text-xl text-gray-800">学习完成！</div>
                <div className="text-yellow-600 font-bold">+50 经验值</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EnglishDaily;