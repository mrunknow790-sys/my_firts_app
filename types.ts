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
  images?: string[]; // Base64 strings for photos
}

export interface EnglishArticle {
  id: string; // Added unique ID
  title: string;
  content: string; // The full text
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  addedDate: string; // ISO date string when added
  lastCompletedDate?: string; // ISO date string YYYY-MM-DD
  completionCount?: number; // How many times recited
}

export interface UserStats {
  name: string; // Added user name
  xp: number;
  level: number;
  coins: number;
  lastSideQuestDate?: string; // Track when the daily side quest was completed
}

export type ViewState = 'habits' | 'journal' | 'english';
