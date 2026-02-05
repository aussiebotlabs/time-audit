import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock Web Audio API
class AudioContextMock {
  createOscillator() {
    return {
      connect: vi.fn(),
      frequency: { value: 0 },
      type: '',
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }
  get destination() { return {}; }
  get currentTime() { return 0; }
}

window.AudioContext = AudioContextMock;
window.webkitAudioContext = AudioContextMock;

// Mock MediaRecorder
class MediaRecorderMock {
  constructor() {
    this.start = vi.fn();
    this.stop = vi.fn();
    this.ondataavailable = null;
  }
  static isTypeSupported() { return true; }
}

window.MediaRecorder = MediaRecorderMock;

// Mock Navigator MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    }),
  },
});

// Mock Deepgram (global since it's loaded via CDN in index.html)
global.deepgram = {
  createClient: vi.fn().mockReturnValue({
    listen: {
      live: vi.fn().mockReturnValue({
        on: vi.fn(),
        send: vi.fn(),
        finish: vi.fn(),
        getReadyState: vi.fn().mockReturnValue(1),
      }),
    },
  }),
  LiveTranscriptionEvents: {
    Open: 'open',
    Transcript: 'transcript',
    Error: 'error',
    Close: 'close',
  },
};

// Mock alert/confirm
window.alert = vi.fn();
window.confirm = vi.fn().mockReturnValue(true);
