export interface SignalParams {
  amplitude: number;
  frequency: number;
  phaseRad: number;
}

export const MIN_AMPLITUDE = 0;
export const MAX_AMPLITUDE = 5;
export const MIN_VISUAL_FREQUENCY = 0.1;
export const MAX_VISUAL_FREQUENCY = 20;
export const MIN_AUDIO_FREQUENCY = 20;
export const MAX_AUDIO_FREQUENCY = 2000;
export const MIN_WINDOW_SECONDS = 1;
export const MAX_WINDOW_SECONDS = 10;

export const DEFAULT_WINDOW_SECONDS = 2;

export const DEFAULT_SIGNAL_1: Readonly<SignalParams> = Object.freeze({
  amplitude: 1,
  frequency: 1,
  phaseRad: 0
});

export const DEFAULT_SIGNAL_2: Readonly<SignalParams> = Object.freeze({
  amplitude: 1,
  frequency: 1,
  phaseRad: Math.PI / 2
});

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizePhase(phaseRad: number): number {
  const tau = 2 * Math.PI;
  let wrapped = ((phaseRad + Math.PI) % tau + tau) % tau - Math.PI;
  if (wrapped === -Math.PI) {
    wrapped = Math.PI;
  }
  return wrapped;
}

export function thetaAt(tSec: number, signal: SignalParams): number {
  return 2 * Math.PI * signal.frequency * tSec + signal.phaseRad;
}

export function signalAt(tSec: number, signal: SignalParams): number {
  return signal.amplitude * Math.sin(thetaAt(tSec, signal));
}

export function periodFromFrequency(frequencyHz: number): number {
  const safeFreq = Math.max(frequencyHz, 1e-6);
  return 1 / safeFreq;
}

export function angularFrequency(frequencyHz: number): number {
  return 2 * Math.PI * frequencyHz;
}

export function timeShiftFromPhase(phaseRad: number, frequencyHz: number): number {
  const safeFreq = Math.max(frequencyHz, 1e-6);
  return -phaseRad / angularFrequency(safeFreq);
}

export function phaseDifferenceRad(phi1: number, phi2: number): number {
  return normalizePhase(phi2 - phi1);
}

export function adaptiveSampleCount(
  maxFrequencyHz: number,
  windowSeconds: number,
  pixelWidth: number
): number {
  const kSamplesPerCycleWindow = 220;
  const byFrequency = Math.ceil(
    kSamplesPerCycleWindow * Math.max(maxFrequencyHz, MIN_VISUAL_FREQUENCY) * windowSeconds
  );
  const byPixels = Math.ceil(pixelWidth * 1.6);
  const minSamples = 320;
  const maxSamples = 12000;
  return clamp(Math.max(minSamples, byFrequency, byPixels), minSamples, maxSamples);
}

export function maxDisplayedAmplitude(
  signal1: SignalParams,
  signal2?: SignalParams,
  showSum = false,
  showDiff = false
): number {
  let maxValue = Math.max(1, signal1.amplitude);
  if (signal2) {
    maxValue = Math.max(maxValue, signal2.amplitude);
    if (showSum) {
      maxValue = Math.max(maxValue, signal1.amplitude + signal2.amplitude);
    }
    if (showDiff) {
      maxValue = Math.max(maxValue, signal1.amplitude + signal2.amplitude);
    }
  }
  return maxValue;
}
