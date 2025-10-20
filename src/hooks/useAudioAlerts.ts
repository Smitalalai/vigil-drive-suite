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
    frequency: 400, // Gentle, pleasant tone
    duration: 0.4,
    volume: 0.12,
    pattern: 'single',
    interval: 10000, // Every 10 seconds
  },
  2: {
    frequency: 550, // Moderate, attention-getting tone
    duration: 0.5,
    volume: 0.18,
    pattern: 'double',
    interval: 6000, // Every 6 seconds
  },
  3: {
    frequency: 700, // Urgent but not harsh
    duration: 0.6,
    volume: 0.25,
    pattern: 'continuous',
    interval: 3000, // Every 3 seconds
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
    oscillator.type = 'sine'; // Sine wave is the softest, most pleasant

    // Gentle fade in and fade out for smoother sound
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + duration * 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  const speakWakeUp = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance('Please stay alert and take a break if needed');
      utterance.rate = 0.9; // Slower, calmer pace
      utterance.pitch = 1.0; // Normal, less alarming pitch
      utterance.volume = 0.7; // Gentler volume
      utterance.lang = 'en-US';
      
      // Try to use a more pleasant voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Natural')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
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
        // Play gentle escalating tones with voice alert
        const startFreq = config.frequency * 0.85;
        const endFreq = config.frequency * 1.15;
        
        [0, 1, 2].forEach((i) => {
          const freq = startFreq + (endFreq - startFreq) * (i / 2);
          setTimeout(() => {
            playTone(freq, config.duration * 0.8, config.volume * 0.9);
          }, i * (config.duration * 1000 * 0.6));
        });
        
        // Add gentle voice alert for critical level
        setTimeout(() => {
          speakWakeUp();
        }, 500);
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
