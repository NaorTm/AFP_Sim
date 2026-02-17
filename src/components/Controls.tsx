import {
  angularFrequency,
  MAX_AMPLITUDE,
  MAX_AUDIO_FREQUENCY,
  MAX_VISUAL_FREQUENCY,
  MAX_WINDOW_SECONDS,
  MIN_AMPLITUDE,
  MIN_AUDIO_FREQUENCY,
  MIN_VISUAL_FREQUENCY,
  MIN_WINDOW_SECONDS,
  periodFromFrequency,
  phaseDifferenceRad,
  SignalParams,
  timeShiftFromPhase
} from "../math/signal";
import {
  formatNumber,
  formatSigned,
  PhaseUnit,
  phaseFromUnit,
  phaseToUnit
} from "../math/units";

export type ParameterKey = "amplitude" | "frequency" | "phase";
export type HighlightKey = ParameterKey | "window" | null;
export type PhaseShiftDirection = "left" | "right" | null;

interface ControlsProps {
  signal1: SignalParams;
  signal2: SignalParams;
  compareMode: boolean;
  lockSignal1: boolean;
  showSum: boolean;
  showDiff: boolean;
  showSpectrum: boolean;
  phaseUnit: PhaseUnit;
  windowSec: number;
  isPlaying: boolean;
  audioMode: boolean;
  audioFrequency: number;
  audioStarted: boolean;
  audioError: string | null;
  lastChanged: HighlightKey;
  phaseShiftDirection: PhaseShiftDirection;
  onSignal1Change: (next: SignalParams, key: ParameterKey) => void;
  onSignal2Change: (next: SignalParams, key: ParameterKey) => void;
  onCompareModeChange: (value: boolean) => void;
  onLockSignal1Change: (value: boolean) => void;
  onShowSumChange: (value: boolean) => void;
  onShowDiffChange: (value: boolean) => void;
  onShowSpectrumChange: (value: boolean) => void;
  onPhaseUnitChange: (next: PhaseUnit) => void;
  onWindowSecChange: (value: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  onAudioModeChange: (value: boolean) => void;
  onAudioFrequencyChange: (value: number) => void;
  onAudioStartStop: () => void;
}

function classWithHighlight(baseClass: string, shouldHighlight: boolean): string {
  return shouldHighlight ? `${baseClass} is-highlight` : baseClass;
}

function phaseBounds(unit: PhaseUnit): { min: number; max: number; step: number; label: string } {
  if (unit === "deg") {
    return { min: -180, max: 180, step: 0.1, label: "deg" };
  }
  return { min: -Math.PI, max: Math.PI, step: 0.001, label: "rad" };
}

function DerivedReadout({
  title,
  signal,
  phaseUnit
}: {
  title: string;
  signal: SignalParams;
  phaseUnit: PhaseUnit;
}): JSX.Element {
  const phaseValue = phaseToUnit(signal.phaseRad, phaseUnit);
  const period = periodFromFrequency(signal.frequency);
  const omega = angularFrequency(signal.frequency);
  const deltaT = timeShiftFromPhase(signal.phaseRad, signal.frequency);

  return (
    <article className="readout-card">
      <h4>{title}</h4>
      <p>
        <span>T = 1/f</span>
        <strong>{formatNumber(period, 4)} s</strong>
      </p>
      <p>
        <span>omega = 2*pi*f</span>
        <strong>{formatNumber(omega, 4)} rad/s</strong>
      </p>
      <p>
        <span>Phase</span>
        <strong>
          {formatSigned(phaseValue, phaseUnit === "deg" ? 1 : 3)} {phaseUnit}
        </strong>
      </p>
      <p>
        <span>Delta t = -phi/(2*pi*f)</span>
        <strong>{formatSigned(deltaT, 4)} s</strong>
      </p>
    </article>
  );
}

interface SignalEditorProps {
  idPrefix: string;
  title: string;
  signal: SignalParams;
  phaseUnit: PhaseUnit;
  disabled: boolean;
  highlightKey: HighlightKey;
  phaseShiftDirection: PhaseShiftDirection;
  onChange: (next: SignalParams, key: ParameterKey) => void;
}

function SignalEditor({
  idPrefix,
  title,
  signal,
  phaseUnit,
  disabled,
  highlightKey,
  phaseShiftDirection,
  onChange
}: SignalEditorProps): JSX.Element {
  const phaseConfig = phaseBounds(phaseUnit);
  const phaseValue = phaseToUnit(signal.phaseRad, phaseUnit);

  const phaseDirectionLabel =
    phaseShiftDirection === "left"
      ? "<- positive phase shifts waveform left"
      : "-> negative phase shifts waveform right";

  return (
    <section className="controls-subsection">
      <h4>{title}</h4>

      <div className={classWithHighlight("control-group", highlightKey === "amplitude")}>
        <div className="control-row">
          <label htmlFor={`${idPrefix}-amp`}>Amplitude A</label>
          <output htmlFor={`${idPrefix}-amp`}>{signal.amplitude.toFixed(2)}</output>
        </div>
        <input
          id={`${idPrefix}-amp`}
          type="range"
          min={MIN_AMPLITUDE}
          max={MAX_AMPLITUDE}
          step={0.01}
          value={signal.amplitude}
          disabled={disabled}
          aria-label={`${title} amplitude`}
          onChange={(event) =>
            onChange({ ...signal, amplitude: Number(event.currentTarget.value) }, "amplitude")
          }
        />
        <p className="microcopy">Scales the signal magnitude.</p>
      </div>

      <div className={classWithHighlight("control-group", highlightKey === "frequency")}>
        <div className="control-row">
          <label htmlFor={`${idPrefix}-freq`}>Frequency f (visual)</label>
          <output htmlFor={`${idPrefix}-freq`}>{signal.frequency.toFixed(2)} Hz</output>
        </div>
        <input
          id={`${idPrefix}-freq`}
          type="range"
          min={MIN_VISUAL_FREQUENCY}
          max={MAX_VISUAL_FREQUENCY}
          step={0.01}
          value={signal.frequency}
          disabled={disabled}
          aria-label={`${title} frequency`}
          onChange={(event) =>
            onChange({ ...signal, frequency: Number(event.currentTarget.value) }, "frequency")
          }
        />
        <p className="microcopy">Cycles per second, period is 1/f.</p>
      </div>

      <div className={classWithHighlight("control-group", highlightKey === "phase")}>
        <div className="control-row">
          <label htmlFor={`${idPrefix}-phase`}>Phase phi ({phaseUnit})</label>
          <output htmlFor={`${idPrefix}-phase`}>
            {phaseValue.toFixed(phaseUnit === "deg" ? 1 : 3)} {phaseConfig.label}
          </output>
        </div>
        <input
          id={`${idPrefix}-phase`}
          type="range"
          min={phaseConfig.min}
          max={phaseConfig.max}
          step={phaseConfig.step}
          value={phaseValue}
          disabled={disabled}
          aria-label={`${title} phase`}
          onChange={(event) =>
            onChange(
              { ...signal, phaseRad: phaseFromUnit(Number(event.currentTarget.value), phaseUnit) },
              "phase"
            )
          }
        />
        <p className="microcopy">Shifts the waveform in time for a fixed frequency.</p>
        {highlightKey === "phase" && phaseShiftDirection && (
          <p className="phase-shift" aria-live="polite">
            {phaseDirectionLabel}
          </p>
        )}
      </div>
    </section>
  );
}

export default function Controls({
  signal1,
  signal2,
  compareMode,
  lockSignal1,
  showSum,
  showDiff,
  showSpectrum,
  phaseUnit,
  windowSec,
  isPlaying,
  audioMode,
  audioFrequency,
  audioStarted,
  audioError,
  lastChanged,
  phaseShiftDirection,
  onSignal1Change,
  onSignal2Change,
  onCompareModeChange,
  onLockSignal1Change,
  onShowSumChange,
  onShowDiffChange,
  onShowSpectrumChange,
  onPhaseUnitChange,
  onWindowSecChange,
  onPlayPause,
  onReset,
  onAudioModeChange,
  onAudioFrequencyChange,
  onAudioStartStop
}: ControlsProps): JSX.Element {
  const phaseDiffRad = phaseDifferenceRad(signal1.phaseRad, signal2.phaseRad);
  const phaseDiffValue = phaseToUnit(phaseDiffRad, phaseUnit);

  return (
    <aside className="panel controls-panel" aria-label="Simulation controls">
      <section className="controls-subsection">
        <h3>Animation</h3>
        <div className="button-row">
          <button type="button" onClick={onPlayPause} aria-pressed={isPlaying}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" className="secondary" onClick={onReset}>
            Reset Defaults
          </button>
        </div>
      </section>

      <section className={classWithHighlight("controls-subsection", lastChanged === "window")}>
        <h3>Time Window</h3>
        <div className="control-row">
          <label htmlFor="window-slider">Window W</label>
          <output htmlFor="window-slider">{windowSec.toFixed(1)} s</output>
        </div>
        <input
          id="window-slider"
          type="range"
          min={MIN_WINDOW_SECONDS}
          max={MAX_WINDOW_SECONDS}
          step={0.1}
          value={windowSec}
          aria-label="Time window in seconds"
          onChange={(event) => onWindowSecChange(Number(event.currentTarget.value))}
        />
      </section>

      <section className="controls-subsection">
        <h3>Display</h3>
        <div className="segmented">
          <button
            type="button"
            className={phaseUnit === "rad" ? "chip active" : "chip"}
            aria-pressed={phaseUnit === "rad"}
            onClick={() => onPhaseUnitChange("rad")}
          >
            Radians
          </button>
          <button
            type="button"
            className={phaseUnit === "deg" ? "chip active" : "chip"}
            aria-pressed={phaseUnit === "deg"}
            onClick={() => onPhaseUnitChange("deg")}
          >
            Degrees
          </button>
        </div>

        <label className="toggle-line">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(event) => onCompareModeChange(event.currentTarget.checked)}
            aria-label="Enable two signal compare mode"
          />
          Two-signal compare mode
        </label>

        {compareMode && (
          <label className="toggle-line">
            <input
              type="checkbox"
              checked={lockSignal1}
              onChange={(event) => onLockSignal1Change(event.currentTarget.checked)}
              aria-label="Lock signal one to defaults"
            />
            Lock signal 1 to defaults
          </label>
        )}

        {compareMode && (
          <>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={showSum}
                onChange={(event) => onShowSumChange(event.currentTarget.checked)}
                aria-label="Show x1 plus x2 waveform"
              />
              Show x1 + x2
            </label>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={showDiff}
                onChange={(event) => onShowDiffChange(event.currentTarget.checked)}
                aria-label="Show x1 minus x2 waveform"
              />
              Show x1 - x2
            </label>
          </>
        )}

        <label className="toggle-line">
          <input
            type="checkbox"
            checked={showSpectrum}
            onChange={(event) => onShowSpectrumChange(event.currentTarget.checked)}
            aria-label="Show conceptual spectrum view"
          />
          Show spectrum view
        </label>
      </section>

      <SignalEditor
        idPrefix="signal-1"
        title="Signal 1"
        signal={signal1}
        phaseUnit={phaseUnit}
        disabled={compareMode && lockSignal1}
        highlightKey={lastChanged}
        phaseShiftDirection={phaseShiftDirection}
        onChange={onSignal1Change}
      />

      {compareMode && (
        <SignalEditor
          idPrefix="signal-2"
          title="Signal 2"
          signal={signal2}
          phaseUnit={phaseUnit}
          disabled={false}
          highlightKey={lastChanged}
          phaseShiftDirection={phaseShiftDirection}
          onChange={onSignal2Change}
        />
      )}

      <section className="controls-subsection">
        <h3>Numeric Readouts</h3>
        <div className="readout-grid" aria-live="polite">
          <DerivedReadout title="Signal 1" signal={signal1} phaseUnit={phaseUnit} />
          {compareMode && <DerivedReadout title="Signal 2" signal={signal2} phaseUnit={phaseUnit} />}
          {compareMode && (
            <article className="readout-card">
              <h4>Compare</h4>
              <p>
                <span>Delta phi = phi2 - phi1</span>
                <strong>{formatSigned(phaseDiffValue, phaseUnit === "deg" ? 1 : 3)} {phaseUnit}</strong>
              </p>
            </article>
          )}
        </div>
      </section>

      <section className="controls-subsection">
        <h3>Audio Mode (Optional)</h3>
        <label className="toggle-line">
          <input
            type="checkbox"
            checked={audioMode}
            onChange={(event) => onAudioModeChange(event.currentTarget.checked)}
            aria-label="Enable audio mode"
          />
          Enable audio output
        </label>
        {audioMode && (
          <>
            <div className="control-row">
              <label htmlFor="audio-frequency">Audio frequency</label>
              <output htmlFor="audio-frequency">{audioFrequency.toFixed(0)} Hz</output>
            </div>
            <input
              id="audio-frequency"
              type="range"
              min={MIN_AUDIO_FREQUENCY}
              max={MAX_AUDIO_FREQUENCY}
              step={1}
              value={audioFrequency}
              aria-label="Audio frequency in hertz"
              onChange={(event) => onAudioFrequencyChange(Number(event.currentTarget.value))}
            />
            <div className="button-row">
              <button type="button" onClick={onAudioStartStop}>
                {audioStarted ? "Stop Audio" : "Start Audio"}
              </button>
            </div>
            <p className="microcopy">Audio phase alignment is visual-only in this mode.</p>
          </>
        )}
        {audioError && <p className="error-text">{audioError}</p>}
      </section>
    </aside>
  );
}
