import { create } from 'zustand';
import type { ExerciseType } from '@/types';

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

  // Global UI settings (toggles)
  furiganaVisible: boolean;
  furiganaSize: 'normal' | 'large';
  studyMode: boolean; // hide translations
  setFuriganaVisible: (visible: boolean) => void;
  setFuriganaSize: (size: 'normal' | 'large') => void;
  setStudyMode: (enabled: boolean) => void;
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

  // UI Settings defaults
  furiganaVisible: true,
  furiganaSize: 'normal',
  studyMode: false,
  setFuriganaVisible: (furiganaVisible) => set({ furiganaVisible }),
  setFuriganaSize: (furiganaSize) => set({ furiganaSize }),
  setStudyMode: (studyMode) => set({ studyMode }),
}));
