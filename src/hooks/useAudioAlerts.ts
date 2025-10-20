import { useEffect, useRef } from 'react';

interface AudioAlertConfig {
  frequency: number;
  duration: number;
  volume: number;
  pattern: 'single' | 'double' | 'triple' | 'continuous';
  interval?: number;
}

const ALERT_SOUNDS: Record<number, AudioAlertConfig> = {
  0: {
    frequency: 0,
    duration: 0,
    volume: 0,
    pattern: 'single',
  },
  1: {
    frequency: 300, // Low frequency - gentle warning
    duration: 0.3,
    volume: 0.2,
    pattern: 'single',
    interval: 8000, // Every 8 seconds
  },
  2: {
    frequency: 600, // Medium frequency - urgent warning
    duration: 0.4,
    volume: 0.3,
    pattern: 'double',
    interval: 4000, // Every 4 seconds
  },
  3: {
    frequency: 1200, // High frequency - critical alert
    duration: 0.5,
    volume: 0.4,
    pattern: 'continuous',
    interval: 2000, // Every 2 seconds
  },
};

export const useAudioAlerts = (alertLevel: 0 | 1 | 2 | 3, enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playTone = (frequency: number, duration: number, volume: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  const speakWakeUp = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Wake up!');
      utterance.rate = 1.2;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playPattern = (config: AudioAlertConfig) => {
    const now = Date.now();
    
    // Throttle alerts based on interval
    if (config.interval && now - lastPlayedRef.current < config.interval) {
      return;
    }

    lastPlayedRef.current = now;

    switch (config.pattern) {
      case 'single':
        playTone(config.frequency, config.duration, config.volume);
        break;
      
      case 'double':
        playTone(config.frequency, config.duration, config.volume);
        setTimeout(() => {
          playTone(config.frequency, config.duration, config.volume);
        }, config.duration * 1000 + 100);
        break;
      
      case 'triple':
        [0, 1, 2].forEach((i) => {
          setTimeout(() => {
            playTone(config.frequency, config.duration, config.volume);
          }, i * (config.duration * 1000 + 100));
        });
        break;
      
      case 'continuous':
        // Play escalating frequency sweep (low to high) with "Wake Up" voice
        const startFreq = config.frequency * 0.7;
        const endFreq = config.frequency * 1.3;
        
        [0, 1, 2].forEach((i) => {
          const freq = startFreq + (endFreq - startFreq) * (i / 2);
          setTimeout(() => {
            playTone(freq, config.duration * 0.7, config.volume);
          }, i * (config.duration * 1000 * 0.5));
        });
        
        // Add "Wake Up!" voice alert for critical level
        setTimeout(() => {
          speakWakeUp();
        }, 200);
        break;
    }
  };

  useEffect(() => {
    if (!enabled || alertLevel === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const config = ALERT_SOUNDS[alertLevel];
    
    // Play immediately when alert level changes
    playPattern(config);

    // Set up recurring alerts
    if (config.interval) {
      intervalRef.current = setInterval(() => {
        playPattern(config);
      }, config.interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [alertLevel, enabled]);

  const playManualAlert = (level: 0 | 1 | 2 | 3) => {
    const config = ALERT_SOUNDS[level];
    playPattern(config);
  };

  return { playManualAlert };
};
