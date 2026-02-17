import { useEffect, useMemo, useRef, useState } from "react";
import Controls, {
  HighlightKey,
  ParameterKey,
  PhaseShiftDirection
} from "./components/Controls";
import PhasorCanvas from "./components/PhasorCanvas";
import SpectrumCanvas from "./components/SpectrumCanvas";
import TimePlotCanvas from "./components/TimePlotCanvas";
import { useWebAudioSine } from "./audio/useWebAudioSine";
import {
  DEFAULT_SIGNAL_1,
  DEFAULT_SIGNAL_2,
  DEFAULT_WINDOW_SECONDS,
  MIN_AUDIO_FREQUENCY,
  normalizePhase,
  SignalParams
} from "./math/signal";
import { PhaseUnit } from "./math/units";

function cloneSignal(signal: Readonly<SignalParams>): SignalParams {
  return { amplitude: signal.amplitude, frequency: signal.frequency, phaseRad: signal.phaseRad };
}

function whatChangedLabel(lastChanged: HighlightKey): string {
  if (lastChanged === "amplitude") {
    return "What changed: amplitude scaling was updated.";
  }
  if (lastChanged === "frequency") {
    return "What changed: frequency and period relationship updated.";
  }
  if (lastChanged === "phase") {
    return "What changed: phase shift was updated.";
  }
  if (lastChanged === "window") {
    return "What changed: visible time window length updated.";
  }
  return "What changed: waiting for your next adjustment.";
}

export default function App(): JSX.Element {
  const [signal1, setSignal1] = useState<SignalParams>(cloneSignal(DEFAULT_SIGNAL_1));
  const [signal2, setSignal2] = useState<SignalParams>(cloneSignal(DEFAULT_SIGNAL_2));
  const [windowSec, setWindowSec] = useState(DEFAULT_WINDOW_SECONDS);

  const [compareMode, setCompareMode] = useState(false);
  const [lockSignal1, setLockSignal1] = useState(true);
  const [showSum, setShowSum] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(false);
  const [phaseUnit, setPhaseUnit] = useState<PhaseUnit>("rad");

  const [isPlaying, setIsPlaying] = useState(true);
  const [tNow, setTNow] = useState(0);
  const simTimeRef = useRef(0);
  const lastRafMsRef = useRef<number | null>(null);

  const [lastChanged, setLastChanged] = useState<HighlightKey>(null);
  const [phaseShiftDirection, setPhaseShiftDirection] = useState<PhaseShiftDirection>(null);

  const [audioMode, setAudioMode] = useState(false);
  const [audioFrequency, setAudioFrequency] = useState(MIN_AUDIO_FREQUENCY);

  const audio = useWebAudioSine({
    enabled: audioMode,
    amplitude: signal1.amplitude,
    frequency: audioFrequency
  });

  useEffect(() => {
    if (!isPlaying) {
      lastRafMsRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (nowMs: number): void => {
      if (lastRafMsRef.current !== null) {
        simTimeRef.current += (nowMs - lastRafMsRef.current) / 1000;
      }
      lastRafMsRef.current = nowMs;
      setTNow(simTimeRef.current);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying]);

  useEffect(() => {
    if (!lastChanged) {
      return;
    }
    const timeout = window.setTimeout(() => setLastChanged(null), 850);
    return () => window.clearTimeout(timeout);
  }, [lastChanged]);

  useEffect(() => {
    if (!phaseShiftDirection) {
      return;
    }
    const timeout = window.setTimeout(() => setPhaseShiftDirection(null), 900);
    return () => window.clearTimeout(timeout);
  }, [phaseShiftDirection]);

  const registerPhaseShift = (previous: number, next: number): void => {
    const delta = normalizePhase(next - previous);
    if (Math.abs(delta) < 1e-8) {
      return;
    }
    setPhaseShiftDirection(delta > 0 ? "left" : "right");
  };

  const handleSignal1Change = (next: SignalParams, key: ParameterKey): void => {
    setSignal1((previous) => {
      if (key === "phase") {
        registerPhaseShift(previous.phaseRad, next.phaseRad);
      }
      return next;
    });
    setLastChanged(key);
  };

  const handleSignal2Change = (next: SignalParams, key: ParameterKey): void => {
    setSignal2((previous) => {
      if (key === "phase") {
        registerPhaseShift(previous.phaseRad, next.phaseRad);
      }
      return next;
    });
    setLastChanged(key);
  };

  const handleLockSignal1Change = (nextLocked: boolean): void => {
    setLockSignal1(nextLocked);
    if (nextLocked) {
      setSignal1(cloneSignal(DEFAULT_SIGNAL_1));
    }
  };

  const handleCompareModeChange = (nextCompareMode: boolean): void => {
    setCompareMode(nextCompareMode);
    if (nextCompareMode && lockSignal1) {
      setSignal1(cloneSignal(DEFAULT_SIGNAL_1));
    }
  };

  const handleReset = (): void => {
    setSignal1(cloneSignal(DEFAULT_SIGNAL_1));
    setSignal2(cloneSignal(DEFAULT_SIGNAL_2));
    setWindowSec(DEFAULT_WINDOW_SECONDS);
    setCompareMode(false);
    setLockSignal1(true);
    setShowSum(true);
    setShowDiff(false);
    setShowSpectrum(false);
    setPhaseUnit("rad");
    setLastChanged(null);
    setPhaseShiftDirection(null);
    setAudioMode(false);
    setAudioFrequency(MIN_AUDIO_FREQUENCY);
    audio.stop();

    simTimeRef.current = 0;
    lastRafMsRef.current = null;
    setTNow(0);
    setIsPlaying(true);
  };

  const handleAudioStartStop = (): void => {
    if (audio.isStarted) {
      audio.stop();
    } else {
      audio.start();
    }
  };

  const changedCopy = useMemo(() => whatChangedLabel(lastChanged), [lastChanged]);

  return (
    <div className="app-shell">
      <header className="panel hero-panel">
        <h1>Amplitude, Frequency, Phase</h1>
        <p className="formula">x(t) = A sin(2*pi*f*t + phi)</p>
        <p>
          Adjust A, f, and phi to see synchronized behavior across the waveform and phasor views.
        </p>
        <p className="what-changed" aria-live="polite">
          {changedCopy}
        </p>
      </header>

      <div className="layout-grid">
        <Controls
          signal1={signal1}
          signal2={signal2}
          compareMode={compareMode}
          lockSignal1={lockSignal1}
          showSum={showSum}
          showDiff={showDiff}
          showSpectrum={showSpectrum}
          phaseUnit={phaseUnit}
          windowSec={windowSec}
          isPlaying={isPlaying}
          audioMode={audioMode}
          audioFrequency={audioFrequency}
          audioStarted={audio.isStarted}
          audioError={audio.error}
          lastChanged={lastChanged}
          phaseShiftDirection={phaseShiftDirection}
          onSignal1Change={handleSignal1Change}
          onSignal2Change={handleSignal2Change}
          onCompareModeChange={handleCompareModeChange}
          onLockSignal1Change={handleLockSignal1Change}
          onShowSumChange={setShowSum}
          onShowDiffChange={setShowDiff}
          onShowSpectrumChange={setShowSpectrum}
          onPhaseUnitChange={setPhaseUnit}
          onWindowSecChange={(value) => {
            setWindowSec(value);
            setLastChanged("window");
          }}
          onPlayPause={() => setIsPlaying((prev) => !prev)}
          onReset={handleReset}
          onAudioModeChange={setAudioMode}
          onAudioFrequencyChange={setAudioFrequency}
          onAudioStartStop={handleAudioStartStop}
        />

        <main className="visual-column">
          <TimePlotCanvas
            tNow={tNow}
            windowSec={windowSec}
            signal1={signal1}
            signal2={signal2}
            compareMode={compareMode}
            showSum={showSum}
            showDiff={showDiff}
          />
          <PhasorCanvas tNow={tNow} signal1={signal1} signal2={signal2} compareMode={compareMode} />
          {showSpectrum && (
            <SpectrumCanvas signal1={signal1} signal2={signal2} compareMode={compareMode} />
          )}
        </main>
      </div>
    </div>
  );
}
