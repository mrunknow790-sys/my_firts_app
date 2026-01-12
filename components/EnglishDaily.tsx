import React, { useState, useEffect, useCallback } from 'react';
import { EnglishArticle } from '../types';
import { fetchDailyEnglishArticle } from '../services/geminiService';
import { Volume2, RefreshCw, BookOpen, Loader2, PlayCircle, PauseCircle } from 'lucide-react';

const EnglishDaily: React.FC = () => {
  const [article, setArticle] = useState<EnglishArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    loadArticle();
  }, []);

  // Handle Text-to-Speech stop on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const loadArticle = async () => {
    setLoading(true);
    setArticle(null);
    try {
      const data = await fetchDailyEnglishArticle();
      setArticle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    setSelectedWord(cleanWord);
    speakText(cleanWord);
  };

  // Helper to wrap words in spans
  const renderInteractiveText = (text: string) => {
    return text.split(' ').map((word, index) => (
      <span
        key={index}
        onClick={() => handleWordClick(word)}
        className="cursor-pointer hover:bg-yellow-200 hover:text-yellow-900 rounded px-0.5 transition-colors inline-block"
      >
        {word}&nbsp;
      </span>
    ));
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">每日英语</h2>
        <button 
          onClick={loadArticle} 
          disabled={loading}
          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center h-64 space-y-4 text-gray-400">
           <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
           <p>正在生成课程...</p>
         </div>
      ) : article ? (
        <>
          {/* Article Card */}
          <div className="bg-white rounded-3xl shadow-lg shadow-emerald-50/50 border border-emerald-100 overflow-hidden">
             <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white relative overflow-hidden">
                <BookOpen className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 rotate-12" />
                <span className="inline-block px-2 py-1 bg-white/20 rounded-md text-xs font-medium mb-2 backdrop-blur-sm border border-white/10">
                  {article.difficulty}
                </span>
                <h3 className="text-xl font-bold leading-tight mb-2">{article.title}</h3>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={toggleFullRead}
                     className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors"
                   >
                     {isPlaying ? <PauseCircle className="w-4 h-4"/> : <PlayCircle className="w-4 h-4"/>}
                     {isPlaying ? '停止' : '朗读'}
                   </button>
                   <span className="text-xs opacity-80">美式英语</span>
                </div>
             </div>
             
             <div className="p-6">
                <p className="text-lg text-gray-700 leading-loose">
                  {renderInteractiveText(article.content)}
                </p>
                <p className="text-xs text-gray-400 mt-4 text-center">点击任意单词收听发音</p>
             </div>
          </div>

          {/* Vocabulary Section */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
              重点词汇
            </h4>
            <div className="grid gap-3">
              {article.vocabulary.map((vocab, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                   <button 
                     onClick={() => speakText(vocab.word)}
                     className="mt-0.5 p-1.5 bg-gray-50 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex-shrink-0"
                   >
                     <Volume2 className="w-4 h-4" />
                   </button>
                   <div>
                     <p className="font-bold text-gray-800">{vocab.word}</p>
                     <p className="text-sm text-gray-500">{vocab.definition}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-gray-500">
           加载失败，请重试。
        </div>
      )}
    </div>
  );
};

export default EnglishDaily;