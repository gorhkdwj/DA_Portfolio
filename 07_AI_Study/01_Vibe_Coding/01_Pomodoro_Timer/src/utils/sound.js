import { isElectron } from './fsHelper';

let currentActiveAudio = null;

export const stopCurrentAlarm = () => {
  if (currentActiveAudio) {
    currentActiveAudio();
    currentActiveAudio = null;
  }
};

export const playBeep = (type, volume) => {
  stopCurrentAlarm(); // Ensure previous is stopped before starting new

  try {
    if (type.startsWith('data:audio/') || type.startsWith('file://') || type.startsWith('asset://') || type.startsWith('blob:')) {
      const audio = new Audio(type);
      audio.volume = volume;
      audio.play().catch(e => console.warn("Audio play blocked", e));
      currentActiveAudio = () => {
        audio.pause();
        audio.currentTime = 0;
      };
      return currentActiveAudio;
    }

    if (type.endsWith('.mp3') || type.endsWith('.wav')) {
      let audioSrc;
      if (isElectron()) {
        audioSrc = `asset://sounds/${encodeURIComponent(type)}`;
      }
      if (!audioSrc) audioSrc = `${import.meta.env.BASE_URL}sounds/${type}`;
      const audio = new Audio(audioSrc);
      audio.volume = volume;
      audio.play().catch(e => console.warn("Audio play blocked", e));
      currentActiveAudio = () => {
        audio.pause();
        audio.currentTime = 0;
      };
      return currentActiveAudio;
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    gainNode.gain.value = volume;

    if (type === 'bell') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.5);
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } else if (type === 'digital') {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } else {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    }

    currentActiveAudio = () => {
      try {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      } catch (e) {
        // Handle DOMException if already stopped
      }
    };
    return currentActiveAudio;
  } catch(e) {
    console.warn("Audio not supported or blocked", e);
    return () => {};
  }
};
