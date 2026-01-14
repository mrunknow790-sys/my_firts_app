// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { Save, Smile, Meh, Frown, Zap, Moon, Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react';
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
  const entryLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const imageLongPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Core Image Compression Logic
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // Better quality limit
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Process all selected files
    const fileArray = Array.from(files);
    const compressedImages = await Promise.all(fileArray.map(file => compressImage(file)));
    
    setTempImages(prev => [...prev, ...compressedImages]);
    
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (window.confirm("确定要删除这张照片吗？")) {
        setTempImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Long press handler for preview images (Compose area)
  const handlePreviewImageTouchStart = (index: number) => {
    imageLongPressTimer.current = setTimeout(() => {
        if (window.navigator.vibrate) window.navigator.vibrate(50);
        removeTempImage(index);
    }, 600);
  };

  const handlePreviewImageTouchEnd = () => {
    if (imageLongPressTimer.current) {
        clearTimeout(imageLongPressTimer.current);
        imageLongPressTimer.current = null;
    }
  };

  // Long press handler for Journal Entries (Timeline area)
  const handleEntryTouchStart = (id: string) => {
    entryLongPressTimer.current = setTimeout(() => {
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      if (window.confirm('确定要删除这条日记吗？')) {
        setEntries(prev => prev.filter(e => e.id !== id));
      }
    }, 800);
  };

  const handleEntryTouchEnd = () => {
    if (entryLongPressTimer.current) { clearTimeout(entryLongPressTimer.current); entryLongPressTimer.current = null; }
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

  // Smart Grid Layout for Timeline
  const renderImageGrid = (images: string[]) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
      return (
        <img 
          src={images[0]} 
          alt="journal" 
          className="rounded-xl w-full max-h-96 object-cover border border-white/20 shadow-sm" 
          loading="lazy"
        />
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
           {images.map((img, i) => (
             <img key={i} src={img} alt="journal" className="rounded-xl w-full h-40 object-cover border border-white/20 shadow-sm" loading="lazy" />
           ))}
        </div>
      );
    }

    // 3 or more images
    return (
      <div className="grid grid-cols-3 gap-1.5">
         {images.map((img, i) => (
           <img key={i} src={img} alt="journal" className="rounded-lg w-full aspect-square object-cover border border-white/20 shadow-sm" loading="lazy" />
         ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 animate-in slide-in-from-right duration-500">
      <h2 className="text-2xl font-bold text-gray-800 ml-1">每日日记</h2>
      
      {/* Compose Area */}
      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-gray-100/50 border border-white/50 relative overflow-hidden">
        <textarea
          className="w-full h-32 p-4 bg-gray-50/50 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-gray-700 placeholder-gray-400 border border-transparent focus:bg-white text-base"
          placeholder="今天发生了什么值得记录的事？"
          value={newEntry}
          onChange={(e) => setNewEntry((e.target as HTMLTextAreaElement).value)}
        />
        
        {/* Image Preview List */}
        {tempImages.length > 0 && (
            <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2 ml-1">长按图片可删除</p>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                    {tempImages.map((img, idx) => (
                        <div 
                            key={idx} 
                            className="relative flex-shrink-0 group"
                            onMouseDown={() => handlePreviewImageTouchStart(idx)}
                            onMouseUp={handlePreviewImageTouchEnd}
                            onMouseLeave={handlePreviewImageTouchEnd}
                            onTouchStart={() => handlePreviewImageTouchStart(idx)}
                            onTouchEnd={handlePreviewImageTouchEnd}
                        >
                            <img src={img} alt="preview" className="h-24 w-24 object-cover rounded-2xl border-2 border-white shadow-sm" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeTempImage(idx); }} // Stop prop to prevent conflict with long press
                                className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md border border-gray-100 active:scale-90 transition-transform"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {(['happy', 'neutral', 'sad', 'excited', 'tired'] as const).map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${selectedMood === mood ? 'bg-white shadow-md scale-110 ring-1 ring-emerald-100' : 'hover:bg-gray-100'}`}
              >
                {getMoodIcon(mood)}
              </button>
            ))}
          </div>
          
          <div className="flex gap-3 pl-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImageUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors active:scale-95"
                title="添加照片"
            >
                <Camera className="w-5 h-5" />
            </button>
            <button
                onClick={handleSave}
                disabled={!newEntry.trim() && tempImages.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <Save className="w-4 h-4" /> <span className="hidden xs:inline">记录</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-8 border-l-2 border-emerald-100/50 last:border-0 pb-6">
            <div className="absolute -left-[11px] top-0 bg-white p-1 rounded-full border border-emerald-100 shadow-sm z-10">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
            <div 
              className="bg-white/70 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-white/60 transition-all active:scale-[0.99] select-none overflow-hidden hover:shadow-md"
              onMouseDown={() => handleEntryTouchStart(entry.id)}
              onMouseUp={handleEntryTouchEnd}
              onMouseLeave={handleEntryTouchEnd}
              onTouchStart={() => handleEntryTouchStart(entry.id)}
              onTouchEnd={handleEntryTouchEnd}
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
              
              {entry.content && <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 text-sm">{entry.content}</p>}

              {/* Enhanced Image Grid */}
              {renderImageGrid(entry.images)}
              
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span className="bg-white/50 px-2 py-1 rounded-md">{entry.tags?.join(', ') || 'LifeUp'}</span>
                  <span>{format(new Date(entry.date), 'HH:mm')}</span>
              </div>
            </div>
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 mx-4">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-500" />
            <p>暂无日记</p>
            <p className="text-xs mt-1 opacity-70">拍张照片，记录今天的美好吧！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
