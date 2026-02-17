import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SignalParams } from "../math/signal";

interface SpectrumCanvasProps {
  signal1: SignalParams;
  signal2: SignalParams;
  compareMode: boolean;
}

interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

const PAD = {
  left: 52,
  right: 16,
  top: 20,
  bottom: 36
};

export default function SpectrumCanvas({
  signal1,
  signal2,
  compareMode
}: SpectrumCanvasProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ width: 640, height: 220, dpr: 1 });

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) {
      return;
    }

    const resize = (): void => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width));
      const height = Math.max(190, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      setViewport({ width, height, dpr });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const plotWidth = viewport.width - PAD.left - PAD.right;
    const plotHeight = viewport.height - PAD.top - PAD.bottom;
    if (plotWidth <= 10 || plotHeight <= 10) {
      return;
    }

    const maxFrequency = Math.max(20, signal1.frequency * 1.2, compareMode ? signal2.frequency * 1.2 : 0);
    const maxAmplitude = Math.max(1, signal1.amplitude, compareMode ? signal2.amplitude : 0);

    const toX = (frequency: number): number => PAD.left + (frequency / maxFrequency) * plotWidth;
    const toY = (amplitude: number): number =>
      PAD.top + plotHeight - (amplitude / maxAmplitude) * plotHeight;

    context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);

    context.fillStyle = "#f8fbf8";
    context.fillRect(0, 0, viewport.width, viewport.height);

    context.strokeStyle = "#d9e4dc";
    context.lineWidth = 1;
    for (let i = 0; i <= 6; i += 1) {
      const x = PAD.left + (i / 6) * plotWidth;
      context.beginPath();
      context.moveTo(x, PAD.top);
      context.lineTo(x, PAD.top + plotHeight);
      context.stroke();
      context.fillStyle = "#2b3a33";
      context.font = "11px 'Avenir Next', 'Segoe UI Variable', sans-serif";
      context.fillText(((i / 6) * maxFrequency).toFixed(1), x - 10, viewport.height - 18);
    }

    context.beginPath();
    context.moveTo(PAD.left, PAD.top + plotHeight);
    context.lineTo(PAD.left + plotWidth, PAD.top + plotHeight);
    context.strokeStyle = "#8a9f92";
    context.lineWidth = 1.3;
    context.stroke();

    context.beginPath();
    context.moveTo(PAD.left, PAD.top);
    context.lineTo(PAD.left, PAD.top + plotHeight);
    context.stroke();

    const drawStem = (
      frequency: number,
      amplitude: number,
      color: string,
      dash: number[],
      label: string
    ): void => {
      const x = toX(frequency);
      const y = toY(amplitude);
      context.save();
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(x, PAD.top + plotHeight);
      context.lineTo(x, y);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.fillStyle = "#2b3a33";
      context.font = "12px 'Avenir Next', 'Segoe UI Variable', sans-serif";
      context.fillText(`${label}: ${frequency.toFixed(2)} Hz`, x + 8, y - 6);
    };

    drawStem(signal1.frequency, signal1.amplitude, "#156a75", [], "f1");
    if (compareMode) {
      drawStem(signal2.frequency, signal2.amplitude, "#bb5e1f", [8, 4], "f2");
    }

    context.fillStyle = "#2b3a33";
    context.font = "12px 'Avenir Next', 'Segoe UI Variable', sans-serif";
    context.fillText("frequency (Hz)", PAD.left + plotWidth * 0.5 - 34, viewport.height - 6);

    context.save();
    context.translate(14, PAD.top + plotHeight * 0.5 + 18);
    context.rotate(-Math.PI / 2);
    context.fillText("amplitude", 0, 0);
    context.restore();
  }, [compareMode, signal1, signal2, viewport]);

  return (
    <section className="panel visual-panel">
      <h3>Conceptual Spectrum View</h3>
      <div className="canvas-wrap spectrum-wrap" ref={wrapperRef}>
        <canvas ref={canvasRef} role="img" aria-label="Conceptual spectrum canvas" />
      </div>
    </section>
  );
}
