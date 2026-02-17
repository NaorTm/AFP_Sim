# AGENTS.md — Amplitude, Frequency, Phase Web Simulation (Authoritative Specification)

This document is the **authoritative product specification** for a single page web simulation that teaches **amplitude**, **frequency**, and **phase** using interactive visualizations (and optional audio).
Follow it closely.

---

## 0) Goal, Scope, Non-Goals

### 0.1 Goal
Implement an interactive web simulation that demonstrates the sinusoid model:
\[
x(t)=A\sin(2\pi f t+\varphi)
\]
and makes the effect of **A (amplitude)**, **f (frequency)**, and **φ (phase)** immediately visible via synchronized plots.

### 0.2 Scope
The app must provide:
1. Real time **time-domain waveform** visualization with animation controls
2. Real time **unit-circle phasor** visualization synchronized with the waveform
3. Clear numeric readouts and conceptual explanations (short, non distracting)

Optional, high value additions:
1. **Two-signal compare mode**
2. **Simple spectrum view** (conceptual line at f)
3. **Audio mode** using Web Audio API, with safe defaults

### 0.3 Non-Goals
• No backend  
• No user accounts  
• No persistence beyond in-memory state  
• No full DSP lecture, keep explanations concise and tied to visuals  
• No heavy dependencies that inflate bundle size unless necessary

---

## 1) User Stories

### 1.1 Core Learning Stories
1. As a user, when I change **amplitude A**, the waveform height changes but the period stays the same.
2. As a user, when I change **frequency f**, the number of cycles in a fixed window changes and period readout updates as \(T=1/f\).
3. As a user, when I change **phase φ**, the waveform shifts left or right and the phasor starts at an offset angle.

### 1.2 Interaction Stories
1. As a user, I can **play/pause** the animation and **reset** to defaults.
2. As a user, I can switch between **radians and degrees** for phase.
3. As a user, I can optionally enable **two-signal compare** to see phase difference effects.

---

## 2) Functional Requirements

### 2.1 Controls Panel
Provide a controls panel with:

#### 2.1.1 Main Signal Parameters
• Amplitude `A` slider  
  Range: 0 to 5, default 1, step 0.01  
• Frequency `f` slider (visual mode)  
  Range: 0.1 to 20 Hz, default 1, step 0.01  
• Phase `φ` slider  
  Range: -π to π radians OR -180 to 180 degrees (based on toggle)  
  Default: 0  
  Step: 0.001 rad or 0.1 deg

#### 2.1.2 Time Controls
• Time window length `W` (seconds)  
  Range: 1 to 10, default 2, step 0.1  
• Play/Pause toggle  
• Reset button (restores all defaults)

#### 2.1.3 Display Controls
• Phase units toggle: radians <-> degrees  
• Mode toggle: single signal <-> two signal compare (optional but recommended)  
• Optional toggle: show spectrum view

#### 2.1.4 Numeric Readouts (Always Visible)
Show computed values:
• Period \(T=1/f\)  
• Angular frequency \(\omega=2\pi f\)  
• Phase in current units  
• Equivalent time shift:
\[
\Delta t = -\frac{\varphi}{2\pi f}
\]
Display Δt in seconds, update live, handle f near 0.1 safely.

### 2.2 Time Domain Plot (Required)
A plot of `x(t)` over a sliding window of length `W` seconds.

Requirements:
1. Smooth animation via `requestAnimationFrame`
2. X axis labeled "time (s)", Y axis labeled "amplitude"
3. Grid lines or tick marks for readability
4. The waveform must remain visually stable across frequency changes, no jagged aliasing artifacts due to undersampling in drawing.

Implementation constraints:
• Use Canvas for performance (preferred)  
• Use adaptive sampling density, increase samples per cycle as f increases  
• Reuse buffers, do not allocate large arrays every frame

### 2.3 Phasor and Unit Circle View (Required)
A synchronized unit-circle visualization that demonstrates:
• Phasor angle: \(\theta(t)=2\pi f t+\varphi\)  
• Phasor magnitude proportional to `A`  
• Projection of the phasor’s vertical component equals `x(t)` at the current time

Requirements:
1. Draw unit circle
2. Draw phasor vector from origin at angle θ(t)
3. Draw projection line to show sin component
4. In two-signal mode: draw two phasors and their vector sum (optional but recommended)

### 2.4 Two-Signal Compare Mode (Recommended)
When enabled:
• Signal 1: optionally fixed defaults, or has its own parameters but can be "lock" toggled
• Signal 2: user adjustable

Show:
1. Both waveforms on the time plot (distinguishable styles, not color only)
2. Their sum: \(x_1(t)+x_2(t)\) (toggle)
3. Their difference: \(x_1(t)-x_2(t)\) (toggle)
4. Phase difference readout: \(\Delta \varphi = \varphi_2-\varphi_1\)

### 2.5 Spectrum View (Optional)
A conceptual frequency view:
• For one sine: show a single spectral line at f
• For two sines: show two lines at f1 and f2

This can be non FFT, purely illustrative:
• Render vertical stems at the frequencies with height proportional to amplitude
• Label frequency axis in Hz

### 2.6 Audio Mode (Optional, If Implemented Must Be Safe)
If audio mode is implemented:
1. Default OFF
2. Provide a separate frequency range in audio mode: 20 to 2000 Hz
3. Implement audio with Web Audio API:
   • OscillatorNode for sine generation
   • GainNode for amplitude control
4. Volume capped: max gain 0.2
5. Smooth parameter changes to avoid clicks:
   • use `linearRampToValueAtTime` or `setTargetAtTime`
6. Phase control in audio is optional:
   • If phase accurate audio is difficult, phase affects visuals only, clearly label it.

---

## 3) UX and Copy Requirements

### 3.1 Micro Explanations (Concise)
For each parameter show one sentence:
• Amplitude: "Scales the signal magnitude."  
• Frequency: "Cycles per second, period is 1/f."  
• Phase: "Shifts the waveform in time for a fixed frequency."

### 3.2 “What Changed?” Highlight
When user moves a slider:
• Briefly highlight the relevant concept area (e.g., outline amplitude label when A changes)
• In phase changes, show a small arrow indicating horizontal shift direction

### 3.3 Responsiveness
• Must work on mobile and desktop
• Controls stack vertically on small screens
• Plots resize to available width

---

## 4) Technical Requirements

### 4.1 Stack
Preferred:
• React + TypeScript  
• Vite (or equivalent modern bundler)  
• Canvas-based rendering for plots

No backend.

### 4.2 Architecture
Must separate concerns:
• Pure math functions in `src/math/`
• Canvas drawing in `src/components/*Canvas.tsx`
• State management in `App.tsx` (or lightweight store)

### 4.3 Performance
Targets:
• 60 fps on typical laptop
• Avoid per-frame heavy allocations
• Adaptive sampling:
  - Choose N samples based on max frequency and window size, e.g.
    \(N \ge k \cdot f \cdot W\) with k around 200, and clamp to safe min/max.
  - Ensure stable visuals up to 20 Hz in visual mode.

### 4.4 Accessibility
• Keyboard operable controls  
• ARIA labels for sliders and toggles  
• Provide numeric readouts so users are not forced to infer from color or shape alone

---

## 5) File and Folder Layout

Generate at minimum:
1. `src/App.tsx`
2. `src/components/Controls.tsx`
3. `src/components/TimePlotCanvas.tsx`
4. `src/components/PhasorCanvas.tsx`
5. `src/math/signal.ts`
6. `src/math/units.ts`
7. `src/styles.css`

Optional:
1. `src/components/SpectrumCanvas.tsx`
2. `src/audio/useWebAudioSine.ts`

---

## 6) Math Definitions (Authoritative)

### 6.1 Signal
\[
x(t)=A\sin(2\pi f t+\varphi)
\]

### 6.2 Derived Quantities
\[
T=\frac{1}{f},\quad \omega=2\pi f,\quad \Delta t=-\frac{\varphi}{2\pi f}
\]

### 6.3 Two Signals
\[
x_1(t)=A_1\sin(2\pi f_1 t+\varphi_1),\quad x_2(t)=A_2\sin(2\pi f_2 t+\varphi_2)
\]
\[
x_{\text{sum}}(t)=x_1(t)+x_2(t),\quad x_{\text{diff}}(t)=x_1(t)-x_2(t)
\]

---

## 7) Acceptance Criteria (Must Pass)

### 7.1 Single Signal
1. Changing `A` scales waveform vertically only, period stays fixed.
2. Changing `f` changes period and number of cycles in the window, readouts update correctly.
3. Changing `φ` shifts waveform horizontally, and phasor rotates with matching offset.
4. Phasor projection equals the instantaneous time-domain sample at the current time marker.

### 7.2 Visual Quality
1. No obvious jagged aliasing at max visual frequency (20 Hz) due to insufficient plotting samples.
2. Canvas resizes correctly and maintains aspect ratio within reasonable bounds.

### 7.3 Optional Features
If compare mode exists:
• Two waveforms display correctly and phase difference readout updates.

If audio mode exists:
• Audio starts only after explicit user gesture, volume capped, no loud clicks on parameter changes.

---

## 8) Implementation Notes for Codex
1. Use `requestAnimationFrame` with a `startTime` reference and compute `t` in seconds.
2. Use a consistent time marker `t_now` for both waveform plot and phasor view, they must be synchronized.
3. For plotting:
   • Sample `t_i` across `[t_now-W, t_now]`
   • Compute `x(t_i)` for each sample
   • Draw polyline
4. Provide degree/radian conversion helpers:
   • deg = rad * 180/π
   • rad = deg * π/180

---

## 9) Out of Scope Safety and Policy
This project is educational and must not include harmful content, deceptive tracking, or any unauthorized data collection.
No analytics by default.

---
