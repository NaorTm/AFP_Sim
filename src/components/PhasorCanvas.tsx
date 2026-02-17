import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { maxDisplayedAmplitude, SignalParams, thetaAt } from "../math/signal";

interface PhasorCanvasProps {
  tNow: number;
  signal1: SignalParams;
  signal2: SignalParams;
  compareMode: boolean;
}

interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

export default function PhasorCanvas({
  tNow,
  signal1,
  signal2,
  compareMode
}: PhasorCanvasProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewport, setViewport] = useState<Viewport>({ width: 640, height: 300, dpr: 1 });

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) {
      return;
    }

    const resize = (): void => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width));
      const height = Math.max(220, Math.floor(rect.height));
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

    context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);

    context.fillStyle = "#f8fbf8";
    context.fillRect(0, 0, viewport.width, viewport.height);

    const cx = viewport.width * 0.5;
    const cy = viewport.height * 0.53;
    const maxAmp = maxDisplayedAmplitude(signal1, compareMode ? signal2 : undefined, true, true);
    const radius = Math.min(viewport.width, viewport.height) * 0.33;
    const unitsToPixels = radius / Math.max(1, maxAmp);

    const unitRadius = unitsToPixels;
    context.strokeStyle = "#8ca497";
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(cx, cy, unitRadius, 0, Math.PI * 2);
    context.stroke();

    context.strokeStyle = "#d4e0d8";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.moveTo(cx - radius, cy);
    context.lineTo(cx + radius, cy);
    context.moveTo(cx, cy - radius);
    context.lineTo(cx, cy + radius);
    context.stroke();

    const theta1 = thetaAt(tNow, signal1);
    const v1x = signal1.amplitude * Math.cos(theta1);
    const v1y = signal1.amplitude * Math.sin(theta1);

    const theta2 = thetaAt(tNow, signal2);
    const v2x = signal2.amplitude * Math.cos(theta2);
    const v2y = signal2.amplitude * Math.sin(theta2);

    const drawVector = (
      vx: number,
      vy: number,
      color: string,
      dash: number[],
      width: number,
      label: string
    ): void => {
      const x = cx + vx * unitsToPixels;
      const y = cy - vy * unitsToPixels;

      context.save();
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = width;
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(x, y);
      context.stroke();
      context.setLineDash([]);
      context.beginPath();
      context.arc(x, y, 3.6, 0, 2 * Math.PI);
      context.fill();
      context.restore();

      context.fillStyle = "#2b3a33";
      context.font = "12px 'Avenir Next', 'Segoe UI Variable', sans-serif";
      context.fillText(label, x + 6, y - 6);
    };

    drawVector(v1x, v1y, "#156a75", [], 2.4, "x1");

    const x1End = cx + v1x * unitsToPixels;
    const y1End = cy - v1y * unitsToPixels;

    context.strokeStyle = "#5f7468";
    context.lineWidth = 1;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.moveTo(x1End, y1End);
    context.lineTo(cx, y1End);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#156a75";
    context.beginPath();
    context.arc(cx, y1End, 3.2, 0, Math.PI * 2);
    context.fill();

    if (compareMode) {
      drawVector(v2x, v2y, "#bb5e1f", [8, 5], 2.1, "x2");
      drawVector(v1x + v2x, v1y + v2y, "#14213d", [2, 4], 2.2, "x1+x2");
    }

    context.fillStyle = "#2b3a33";
    context.font = "12px 'Avenir Next', 'Segoe UI Variable', sans-serif";
    context.fillText("unit circle", cx + unitRadius + 10, cy - 6);
    context.fillText(`x1(t_now) = ${v1y.toFixed(3)}`, 12, 16);
    context.fillText("Projection on y-axis matches sinusoid sample", 12, viewport.height - 10);

    const legendY = 28;
    const legendItem = (x: number, color: string, dash: number[], text: string): number => {
      context.save();
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(x, legendY);
      context.lineTo(x + 22, legendY);
      context.stroke();
      context.restore();

      context.fillStyle = "#2b3a33";
      context.fillText(text, x + 28, legendY + 4);
      return x + 28 + context.measureText(text).width + 16;
    };

    let cursor = 12;
    cursor = legendItem(cursor, "#156a75", [], "signal 1");
    if (compareMode) {
      cursor = legendItem(cursor, "#bb5e1f", [8, 5], "signal 2");
      legendItem(cursor, "#14213d", [2, 4], "vector sum");
    }
  }, [compareMode, signal1, signal2, tNow, viewport]);

  return (
    <section className="panel visual-panel">
      <h3>Phasor and Unit Circle</h3>
      <div className="canvas-wrap phasor-wrap" ref={wrapperRef}>
        <canvas ref={canvasRef} role="img" aria-label="Phasor and unit circle canvas" />
      </div>
    </section>
  );
}
