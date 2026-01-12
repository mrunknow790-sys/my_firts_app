import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { Save, Smile, Meh, Frown, Zap, Moon } from 'lucide-react';
import { format } from 'date-fns';

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      date: new Date(Date.now() - 86400000).toISOString(),
      content: '今天工作效率很高，早上的咖啡非常完美。',
      mood: 'happy',
      tags: ['工作', '咖啡']
    }
  ]);
  const [newEntry, setNewEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('neutral');

  const handleSave = () => {
    if (!newEntry.trim()) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newEntry,
      mood: selectedMood,
      tags: []
    };

    setEntries([entry, ...entries]);
    setNewEntry('');
    setSelectedMood('neutral');
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <Smile className="text-emerald-500" />;
      case 'sad': return <Frown className="text-blue-500" />;
      case 'excited': return <Zap className="text-yellow-500" />;
      case 'tired': return <Moon className="text-purple-500" />;
      default: return <Meh className="text-gray-500" />;
    }
  };

  const getMoodLabel = (mood: string) => {
      switch (mood) {
          case 'happy': return '开心';
          case 'sad': return '难过';
          case 'excited': return '兴奋';
          case 'tired': return '疲惫';
          case 'neutral': return '平静';
          default: return '';
      }
  }

  return (
    <div className="space-y-6 pb-24 animate-in slide-in-from-right duration-500">
      <h2 className="text-2xl font-bold text-gray-800">每日日记</h2>
      
      {/* Compose Area */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <textarea
          className="w-full h-32 p-4 bg-gray-50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all text-gray-700 placeholder-gray-400"
          placeholder="今天发生了什么？"
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {(['happy', 'neutral', 'sad', 'excited', 'tired'] as const).map((mood) => (
              <button
                key={mood}
                onClick={() => setSelectedMood(mood)}
                className={`p-2 rounded-full transition-all ${selectedMood === mood ? 'bg-gray-100 scale-110 shadow-inner' : 'hover:bg-gray-50'}`}
                title={getMoodLabel(mood)}
              >
                {getMoodIcon(mood)}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={!newEntry.trim()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-full font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-700">近期回忆</h3>
        {entries.map((entry) => (
          <div key={entry.id} className="relative pl-8 border-l-2 border-emerald-100 last:border-0 pb-6">
            <div className="absolute -left-[11px] top-0 bg-white p-1 rounded-full border border-emerald-100">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-400">
                  {format(new Date(entry.date), 'yyyy-MM-dd HH:mm')}
                </span>
                <div className="scale-75 origin-right" title={getMoodLabel(entry.mood)}>{getMoodIcon(entry.mood)}</div>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </div>
          </div>
        ))}
        
        {entries.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            暂无日记，开始记录今天吧！
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;