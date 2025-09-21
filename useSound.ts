import { useCallback } from 'react';

// Create a single AudioContext to be reused.
// It's created on first use to ensure it's running in a browser environment.
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window !== 'undefined' && (!audioContext || audioContext.state === 'closed')) {
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return null;
    }
  }
  return audioContext;
};

// This function should be called on the first user interaction to unlock the AudioContext.
export const initAudio = () => {
    const resumeAudio = () => {
        const context = getAudioContext();
        if (context && context.state === 'suspended') {
            context.resume();
        }
        // Clean up listeners after first interaction
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
        window.removeEventListener('touchstart', resumeAudio);
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
    }
};

export const useSound = () => {
    const playNote = useCallback((frequency: number, duration: number, volume: number, type: OscillatorType) => {
        const context = getAudioContext();
        if (!context) return;
        
        if (context.state === 'suspended') {
            context.resume().catch(err => console.error("AudioContext resume failed:", err));
        }

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        
        gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime); // Start at half volume for smoother attack
        gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01); // Quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration); // Smooth decay

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
    }, []);

    const playClick = useCallback(() => {
        playNote(1200, 0.05, 0.1, 'triangle');
    }, [playNote]);

    const playScore = useCallback(() => {
        const context = getAudioContext();
        if (!context) return;
        
        if (context.state === 'suspended') {
            context.resume().catch(err => console.error("AudioContext resume failed:", err));
        }

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
    }, []);

    const playWin = useCallback(() => {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((note, index) => {
            setTimeout(() => {
                playNote(note, 0.15, 0.2, 'sine');
            }, index * 100);
        });
    }, [playNote]);
    
    const playLose = useCallback(() => {
        playNote(164, 0.5, 0.2, 'sawtooth');
    }, [playNote]);

    const playStart = useCallback(() => {
        playNote(523.25, 0.2, 0.3, 'sine');
    }, [playNote]);

    return { playClick, playScore, playWin, playLose, playStart };
};
