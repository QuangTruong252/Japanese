import { create } from 'zustand';
import type { ExerciseType } from '@/types';
import { DEFAULT_SETTINGS, type AppSettings } from '@/lib/settings';

export interface UIState {
  // Practice session state
  selectedLessons: number[];
  selectedTypes: ExerciseType[];
  questionCount: number;
  currentQuestionIndex: number;
  setSelectedLessons: (lessons: number[]) => void;
  setSelectedTypes: (types: ExerciseType[]) => void;
  setQuestionCount: (count: number) => void;
  setCurrentQuestionIndex: (index: number) => void;

  // Audio player state
  isPlaying: boolean;
  playbackRate: number;
  loopA: number | null;
  loopB: number | null;
  showTranscript: boolean;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setLoopA: (time: number | null) => void;
  setLoopB: (time: number | null) => void;
  setShowTranscript: (show: boolean) => void;

  // Global UI settings — tên trường khớp AppSettings (src/lib/settings.ts)
  furigana: boolean;
  furiganaSize: 'normal' | 'large';
  hideTranslations: boolean;
  theme: AppSettings['theme'];
  setFurigana: (visible: boolean) => void;
  setFuriganaSize: (size: 'normal' | 'large') => void;
  setHideTranslations: (enabled: boolean) => void;
  setTheme: (theme: AppSettings['theme']) => void;

  // Search dialog state (SPEC-13)
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Practice defaults
  selectedLessons: [1],
  selectedTypes: ['mc', 'matching', 'cloze', 'reorder', 'listening'],
  questionCount: 15,
  currentQuestionIndex: 0,
  setSelectedLessons: (selectedLessons) => set({ selectedLessons }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes }),
  setQuestionCount: (questionCount) => set({ questionCount }),
  setCurrentQuestionIndex: (currentQuestionIndex) => set({ currentQuestionIndex }),

  // Audio Player defaults
  isPlaying: false,
  playbackRate: 1.0,
  loopA: null,
  loopB: null,
  showTranscript: true,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setLoopA: (loopA) => set({ loopA }),
  setLoopB: (loopB) => set({ loopB }),
  setShowTranscript: (showTranscript) => set({ showTranscript }),

  // UI Settings defaults — lấy từ DEFAULT_SETTINGS, không khai lại giá trị
  furigana: DEFAULT_SETTINGS.furigana,
  furiganaSize: DEFAULT_SETTINGS.furiganaSize,
  hideTranslations: DEFAULT_SETTINGS.hideTranslations,
  theme: DEFAULT_SETTINGS.theme,
  setFurigana: (furigana) => set({ furigana }),
  setFuriganaSize: (furiganaSize) => set({ furiganaSize }),
  setHideTranslations: (hideTranslations) => set({ hideTranslations }),
  setTheme: (theme) => set({ theme }),

  // Search dialog defaults
  isSearchOpen: false,
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
