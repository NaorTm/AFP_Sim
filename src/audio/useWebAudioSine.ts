import { useCallback, useEffect, useRef, useState } from "react";
import { clamp, MAX_AMPLITUDE, MAX_AUDIO_FREQUENCY, MIN_AUDIO_FREQUENCY } from "../math/signal";

interface UseWebAudioSineArgs {
  enabled: boolean;
  amplitude: number;
  frequency: number;
}

interface UseWebAudioSineResult {
  isStarted: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
}

const MAX_GAIN = 0.2;
const RAMP_SECONDS = 0.03;

export function useWebAudioSine({
  enabled,
  amplitude,
  frequency
}: UseWebAudioSineArgs): UseWebAudioSineResult {
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const cleanupNodes = useCallback(() => {
    const oscillator = oscillatorRef.current;
    const gainNode = gainRef.current;
    const audioContext = contextRef.current;

    if (!audioContext) {
      return;
    }

    if (oscillator) {
      try {
        oscillator.stop(audioContext.currentTime + RAMP_SECONDS + 0.01);
      } catch {
        // Ignore if oscillator is already stopped.
      }
      oscillator.disconnect();
    }

    if (gainNode) {
      gainNode.disconnect();
    }

    oscillatorRef.current = null;
    gainRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const audioContext = contextRef.current;
    const gainNode = gainRef.current;
    if (audioContext && gainNode) {
      const now = audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setTargetAtTime(0, now, RAMP_SECONDS);
    }
    cleanupNodes();
    setIsStarted(false);
  }, [cleanupNodes]);

  const start = useCallback(() => {
    try {
      const audioContext = contextRef.current ?? new AudioContext();
      contextRef.current = audioContext;
      void audioContext.resume();

      cleanupNodes();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = "sine";

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const now = audioContext.currentTime;
      const safeFrequency = clamp(frequency, MIN_AUDIO_FREQUENCY, MAX_AUDIO_FREQUENCY);
      const safeGain = clamp(amplitude / MAX_AMPLITUDE, 0, 1) * MAX_GAIN;

      oscillator.frequency.setValueAtTime(safeFrequency, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.setTargetAtTime(safeGain, now, RAMP_SECONDS);

      oscillator.start(now);
      oscillatorRef.current = oscillator;
      gainRef.current = gainNode;

      setIsStarted(true);
      setError(null);
    } catch {
      setIsStarted(false);
      setError("Audio could not be started in this browser.");
    }
  }, [amplitude, cleanupNodes, frequency]);

  useEffect(() => {
    if (!enabled && isStarted) {
      stop();
    }
  }, [enabled, isStarted, stop]);

  useEffect(() => {
    if (!isStarted || !enabled) {
      return;
    }

    const audioContext = contextRef.current;
    const oscillator = oscillatorRef.current;
    const gainNode = gainRef.current;
    if (!audioContext || !oscillator || !gainNode) {
      return;
    }

    const now = audioContext.currentTime;
    const safeFrequency = clamp(frequency, MIN_AUDIO_FREQUENCY, MAX_AUDIO_FREQUENCY);
    const safeGain = clamp(amplitude / MAX_AMPLITUDE, 0, 1) * MAX_GAIN;

    oscillator.frequency.cancelScheduledValues(now);
    oscillator.frequency.setTargetAtTime(safeFrequency, now, RAMP_SECONDS);

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setTargetAtTime(safeGain, now, RAMP_SECONDS);
  }, [amplitude, enabled, frequency, isStarted]);

  useEffect(() => {
    return () => {
      cleanupNodes();
      const audioContext = contextRef.current;
      if (audioContext) {
        void audioContext.close();
      }
      contextRef.current = null;
    };
  }, [cleanupNodes]);

  return {
    isStarted,
    start,
    stop,
    error
  };
}
