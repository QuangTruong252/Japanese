import { create } from 'zustand';
import type { ExerciseType } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/settings';

export interface UIState {
  // Practice session state
  selectedLessons: number[];
  selectedTypes: ExerciseType[];
  questionCount: number;
  setSelectedLessons: (lessons: number[]) => void;
  setSelectedTypes: (types: ExerciseType[]) => void;
  setQuestionCount: (count: number) => void;

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

  // Trạng thái hộp thoại tìm kiếm
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Practice defaults
  selectedLessons: [...DEFAULT_SETTINGS.practicePreset.lessons],
  selectedTypes: [...DEFAULT_SETTINGS.practicePreset.types],
  questionCount: DEFAULT_SETTINGS.practicePreset.questionCount,
  setSelectedLessons: (selectedLessons) => set({ selectedLessons }),
  setSelectedTypes: (selectedTypes) => set({ selectedTypes }),
  setQuestionCount: (questionCount) => set({ questionCount }),

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

  // Search dialog defaults
  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
