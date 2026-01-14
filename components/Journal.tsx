// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { Save, Smile, Meh, Frown, Zap, Moon, Camera, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';

const Journal: React.FC = () => {
  const defaultEntry: JournalEntry = {
      id: '1',
      date: new Date(Date.now() - 86400000).toISOString(),
      content: '今天工作效率很高，早上的咖啡非常完美。',
      mood: 'happy',
      tags: ['工作', '咖啡'],
      images: []
  };

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('lifeup_journal');
    return saved ? JSON.parse(saved) : [defaultEntry];
  });

  useEffect(() => {
    localStorage.setItem('lifeup_journal', JSON.stringify(entries));
  }, [entries]);

  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('neutral');
  const [tempImages, setTempImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compress Image logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Compress to JPEG 0.7 quality to save space
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setTempImages(prev => [...prev, dataUrl]);
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!newEntry.trim() && tempImages.length === 0) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newEntry,
      mood: selectedMood,
      tags: [],
      images: tempImages
    };

    setEntries([entry, ...entries]);
    setNewEntry('');
    setTempImages([]);
    setSelectedMood('neutral');
  };

  const removeTempImage = (index: number) => {
      setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleTouchStart = (id: string) => {
    timerRef.current = setTimeout(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      if (window.confirm('确定要删除这条日记吗？')) {
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    }, 800);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile className="text-emerald-500" />;
      case 'sad': return <Frown className="text-blue-500" />;
      case 'excited': return <Zap className="text-amber-500" />;
      case 'tired': return <Moon className="text-indigo-500" />;
      default: return <Meh className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in slide-in-from-right duration-500">
      <h2 className="text-2xl font-bold text-gray-800 ml-1">每日日记</h2>
      
      {/* Compose Area */}
      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-gray-100/50 border border-white/50">
        <textarea
          className="w-full h-32 p-4 bg-gray-50/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-gray-700 placeholder-gray-400 border border-transparent focus:bg-white"
          placeholder="今天发生了什么值得记录的事？"
          value={newEntry}
          onChange={(e) => setNewEntry((e.target as HTMLTextAreaElement).value)}
        />
        
        {/* Image Preview */}
        {tempImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                {tempImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                        <img src={img} alt="preview" className="h-20 w-20 object-cover rounded-xl border border-gray-100" />
                        <button 
                            onClick={() => removeTempImage(idx)}
                            className="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-1">
            {(['happy', 'neutral', 'sad', 'excited', 'tired'] as const).map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`p-2 rounded-full transition-all ${selectedMood === mood ? 'bg-white shadow-md scale-110' : 'hover:bg-gray-100'}`}
              >
                {getMoodIcon(mood)}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                title="添加照片"
            >
                <Camera className="w-5 h-5" />
            </button>
            <button
                onClick={handleSave}
                disabled={!newEntry.trim() && tempImages.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <Save className="w-4 h-4" /> 记录
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-8 border-l-2 border-emerald-100/50 last:border-0 pb-6">
            <div className="absolute -left-[11px] top-0 bg-white p-1 rounded-full border border-emerald-100 shadow-sm">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
            <div 
              className="bg-white/70 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-white/50 transition-all active:scale-98 select-none overflow-hidden"
              onMouseDown={() => handleTouchStart(entry.id)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={() => handleTouchStart(entry.id)}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-800">
                        {format(new Date(entry.date), 'dd')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase">
                        {format(new Date(entry.date), 'MM月 yyyy')}
                    </span>
                </div>
                <div className="bg-white p-1.5 rounded-full shadow-sm">{getMoodIcon(entry.mood)}</div>
              </div>
              
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{entry.content}</p>

              {/* Image Grid */}
              {entry.images && entry.images.length > 0 && (
                  <div className={`grid gap-2 ${entry.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {entry.images.map((img, i) => (
                          <img 
                            key={i} 
                            src={img} 
                            alt="journal" 
                            className="rounded-xl w-full h-32 object-cover border border-white/20 shadow-sm" 
                            loading="lazy"
                           />
                      ))}
                  </div>
              )}
              
              <div className="mt-3 flex items-center justify-end text-xs text-gray-400">
                  {format(new Date(entry.date), 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-10 text-gray-400 bg-white/50 rounded-3xl border border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            暂无日记，拍张照片记录今天吧！
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
