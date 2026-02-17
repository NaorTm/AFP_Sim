# AFP Sim

AFP Sim is an interactive web simulation for learning how **amplitude**, **frequency**, and **phase** affect a sine wave.

It visualizes the model:

`x(t) = A * sin(2 * pi * f * t + phi)`

with synchronized, real-time views so parameter changes are immediately visible.

## What This Project Includes

- Real-time time-domain waveform plot (Canvas, animated)
- Real-time phasor and unit-circle visualization synchronized to the waveform
- Live numeric readouts:
  - Period `T = 1/f`
  - Angular frequency `omega = 2*pi*f`
  - Phase in radians/degrees
  - Equivalent time shift `delta t = -phi / (2*pi*f)`
- Phase units toggle (radians/degrees)
- Play/Pause and Reset controls
- Two-signal compare mode (optional, implemented):
  - Signal 1 and Signal 2
  - Phase difference readout
  - Optional sum/difference waveforms
- Conceptual spectrum view (optional, implemented)
- Optional Web Audio mode with safe defaults:
  - Explicit user start
  - Frequency range 20 to 2000 Hz
  - Gain capped to 0.2 with smoothed parameter ramps

## Tech Stack

- React + TypeScript
- Vite
- HTML Canvas rendering
- Web Audio API (optional audio mode)

## Project Structure

- `src/App.tsx` - top-level state, animation timing, orchestration
- `src/components/Controls.tsx` - UI controls and readouts
- `src/components/TimePlotCanvas.tsx` - waveform canvas rendering
- `src/components/PhasorCanvas.tsx` - phasor/unit-circle rendering
- `src/components/SpectrumCanvas.tsx` - conceptual spectrum rendering
- `src/math/signal.ts` - signal math and derived formulas
- `src/math/units.ts` - radians/degrees helpers and formatting
- `src/audio/useWebAudioSine.ts` - optional audio engine hook
- `src/styles.css` - layout, responsive behavior, visual styles

## Getting Started

1. Install dependencies:
   - `npm install`
2. Start the dev server:
   - `npm run dev`
3. Build for production:
   - `npm run build`
4. Preview production build:
   - `npm run preview`

## Notes

- This project is fully client-side (no backend).
- It is educational and does not collect analytics by default.
