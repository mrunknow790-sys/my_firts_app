export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  completedDates: string[]; // ISO date strings YYYY-MM-DD
  reminderTime?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO string
  content: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
  tags: string[];
}

export interface EnglishArticle {
  title: string;
  content: string; // The full text
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  vocabulary: { word: string; definition: string }[];
}

export interface UserStats {
  xp: number;
  level: number;
  coins: number;
}

export type ViewState = 'habits' | 'journal' | 'english';
