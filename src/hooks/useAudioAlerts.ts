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
    frequency: 440, // A4 note - gentle warning
    duration: 0.2,
    volume: 0.15,
    pattern: 'single',
    interval: 8000, // Every 8 seconds
  },
  2: {
    frequency: 880, // A5 note - urgent warning
    duration: 0.3,
    volume: 0.25,
    pattern: 'double',
    interval: 4000, // Every 4 seconds
  },
  3: {
    frequency: 1320, // E6 note - critical alert
    duration: 0.4,
    volume: 0.35,
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
        // Play three quick beeps for continuous pattern
        [0, 1, 2].forEach((i) => {
          setTimeout(() => {
            playTone(config.frequency, config.duration * 0.7, config.volume);
          }, i * (config.duration * 1000 * 0.5));
        });
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
