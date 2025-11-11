// 15 notification tone options using Web Audio API
// Each tone has unique frequency, duration, and waveform characteristics

export interface ToneConfig {
  name: string;
  frequency: number; // Hz
  duration: number; // milliseconds
  waveform: OscillatorType; // 'sine' | 'square' | 'sawtooth' | 'triangle'
  volume: number; // 0-1
}

export const notificationTones: Record<string, ToneConfig> = {
  tone1: {
    name: "Classic Beep",
    frequency: 800,
    duration: 200,
    waveform: 'sine',
    volume: 0.3
  },
  tone2: {
    name: "Soft Ping",
    frequency: 600,
    duration: 150,
    waveform: 'sine',
    volume: 0.25
  },
  tone3: {
    name: "Alert Chime",
    frequency: 1000,
    duration: 250,
    waveform: 'triangle',
    volume: 0.3
  },
  tone4: {
    name: "High Ding",
    frequency: 1200,
    duration: 180,
    waveform: 'sine',
    volume: 0.3
  },
  tone5: {
    name: "Low Pulse",
    frequency: 400,
    duration: 300,
    waveform: 'square',
    volume: 0.2
  },
  tone6: {
    name: "Bright Bell",
    frequency: 1400,
    duration: 200,
    waveform: 'triangle',
    volume: 0.3
  },
  tone7: {
    name: "Gentle Tap",
    frequency: 500,
    duration: 120,
    waveform: 'sine',
    volume: 0.25
  },
  tone8: {
    name: "Sharp Click",
    frequency: 1600,
    duration: 100,
    waveform: 'square',
    volume: 0.25
  },
  tone9: {
    name: "Warm Tone",
    frequency: 700,
    duration: 250,
    waveform: 'triangle',
    volume: 0.3
  },
  tone10: {
    name: "Digital Beep",
    frequency: 900,
    duration: 180,
    waveform: 'square',
    volume: 0.25
  },
  tone11: {
    name: "Mellow Ring",
    frequency: 550,
    duration: 280,
    waveform: 'sine',
    volume: 0.3
  },
  tone12: {
    name: "Quick Boop",
    frequency: 1100,
    duration: 140,
    waveform: 'sawtooth',
    volume: 0.2
  },
  tone13: {
    name: "Deep Thud",
    frequency: 300,
    duration: 350,
    waveform: 'sine',
    volume: 0.35
  },
  tone14: {
    name: "Crystal Clear",
    frequency: 1500,
    duration: 160,
    waveform: 'triangle',
    volume: 0.3
  },
  tone15: {
    name: "Smooth Alert",
    frequency: 750,
    duration: 220,
    waveform: 'sine',
    volume: 0.3
  }
};

export type ToneId = keyof typeof notificationTones;

export const toneIds: ToneId[] = Object.keys(notificationTones) as ToneId[];

/**
 * Generate and play a notification tone using Web Audio API
 */
export function playNotificationTone(toneId: ToneId): void {
  const config = notificationTones[toneId] || notificationTones.tone1;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = config.waveform;
    oscillator.frequency.value = config.frequency;

    // Apply fade in/out envelope for smoother sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(config.volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + config.duration / 1000);

    // Clean up
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    console.error('[Tone] Failed to play notification tone:', error);
  }
}

export function getToneName(toneId: ToneId): string {
  return notificationTones[toneId]?.name || "Classic Beep";
}
