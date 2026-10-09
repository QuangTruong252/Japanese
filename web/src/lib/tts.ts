import { loadSettings } from './settings.ts';

export const hasJapaneseVoice = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const check = (): boolean => {
    const voices = window.speechSynthesis.getVoices();
    return voices.some((v) => v.lang.toLowerCase().startsWith('ja'));
  };

  if (check()) return true;

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    const onVoicesChanged = () => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(check());
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(check());
      }
    }, 1000);
  });
};

/** `volume` chỉ để nghe thử giá trị thanh trượt chưa lưu; mặc định theo cài đặt hiện tại. */
export const speak = (
  text: string,
  rate = 1.0,
  volume: number = loadSettings().soundVolume,
): SpeechSynthesisUtterance | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate;
  utterance.volume = volume;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ja'));
  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
};
