import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  adaptiveSampleCount,
  maxDisplayedAmplitude,
  signalAt,
  SignalParams
} from "../math/signal";

interface TimePlotCanvasProps {
  tNow: number;
  windowSec: number;
  signal1: SignalParams;
  signal2: SignalParams;
  compareMode: boolean;
  showSum: boolean;
  showDiff: boolean;
}

interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

const PADDING = {
  left: 56,
  right: 16,
  top: 18,
  bottom: 38
};

function ensureCapacity(buffer: Float32Array, targetLength: number): Float32Array {
  if (buffer.length >= targetLength) {
    return buffer;
  }
  return new Float32Array(targetLength);
}

export default function TimePlotCanvas({
  tNow,
  windowSec,
  signal1,
  signal2,
  compareMode,
  showSum,
  showDiff
}: TimePlotCanvasProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [viewport, setViewport] = useState<Viewport>({ width: 640, height: 320, dpr: 1 });

  const timeBufferRef = useRef(new Float32Array(0));
  const y1BufferRef = useRef(new Float32Array(0));
  const y2BufferRef = useRef(new Float32Array(0));
  const sumBufferRef = useRef(new Float32Array(0));
  const diffBufferRef = useRef(new Float32Array(0));

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

    const plotWidth = viewport.width - PADDING.left - PADDING.right;
    const plotHeight = viewport.height - PADDING.top - PADDING.bottom;
    if (plotWidth <= 16 || plotHeight <= 16) {
      return;
    }

    const maxFrequency = compareMode
      ? Math.max(signal1.frequency, signal2.frequency)
      : signal1.frequency;
    const sampleCount = adaptiveSampleCount(maxFrequency, windowSec, plotWidth);
    const tStart = tNow - windowSec;
    const invSample = sampleCount > 1 ? 1 / (sampleCount - 1) : 1;

    timeBufferRef.current = ensureCapacity(timeBufferRef.current, sampleCount);
    y1BufferRef.current = ensureCapacity(y1BufferRef.current, sampleCount);
    y2BufferRef.current = ensureCapacity(y2BufferRef.current, sampleCount);
    sumBufferRef.current = ensureCapacity(sumBufferRef.current, sampleCount);
    diffBufferRef.current = ensureCapacity(diffBufferRef.current, sampleCount);

    for (let i = 0; i < sampleCount; i += 1) {
      const t = tStart + i * invSample * windowSec;
      const y1 = signalAt(t, signal1);
      const y2 = signalAt(t, signal2);
      timeBufferRef.current[i] = t;
      y1BufferRef.current[i] = y1;
      y2BufferRef.current[i] = y2;
      sumBufferRef.current[i] = y1 + y2;
      diffBufferRef.current[i] = y1 - y2;
    }

    const yMax = Math.max(
      1,
      maxDisplayedAmplitude(signal1, compareMode ? signal2 : undefined, showSum, showDiff) * 1.2
    );

    const toX = (index: number): number => PADDING.left + index * invSample * plotWidth;
    const toY = (value: number): number =>
      PADDING.top + ((yMax - value) / (2 * yMax)) * plotHeight;

    context.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);

    context.fillStyle = "#f8fbf8";
    context.fillRect(0, 0, viewport.width, viewport.height);

    context.strokeStyle = "#d9e4dc";
    context.lineWidth = 1;
    const verticalTicks = 8;
    for (let i = 0; i <= verticalTicks; i += 1) {
      const x = PADDING.left + (i / verticalTicks) * plotWidth;
      context.beginPath();
      context.moveTo(x, PADDING.top);
      context.lineTo(x, PADDING.top + plotHeight);
      context.stroke();
    }
    const horizontalTicks = 6;
    for (let i = 0; i <= horizontalTicks; i += 1) {
      const y = PADDING.top + (i / horizontalTicks) * plotHeight;
      context.beginPath();
      context.moveTo(PADDING.left, y);
      context.lineTo(PADDING.left + plotWidth, y);
      context.stroke();
    }

    context.strokeStyle = "#8a9f92";
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(PADDING.left, toY(0));
    context.lineTo(PADDING.left + plotWidth, toY(0));
    context.stroke();

    context.beginPath();
    context.moveTo(PADDING.left, PADDING.top);
    context.lineTo(PADDING.left, PADDING.top + plotHeight);
    context.stroke();

    const drawSeries = (
      series: Float32Array,
      color: string,
      lineWidth: number,
      dash: number[]
    ): void => {
      context.save();
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.setLineDash(dash);
      context.beginPath();
      for (let i = 0; i < sampleCount; i += 1) {
        const x = toX(i);
        const y = toY(series[i]);
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
      context.restore();
    };

    drawSeries(y1BufferRef.current, "#156a75", 2.4, []);

    if (compareMode) {
      drawSeries(y2BufferRef.current, "#bb5e1f", 2.1, [8, 5]);
      if (showSum) {
        drawSeries(sumBufferRef.current, "#14213d", 2.1, [2, 4]);
      }
      if (showDiff) {
        drawSeries(diffBufferRef.current, "#0b7a5c", 2.1, [12, 4, 2, 4]);
      }
    }

    const markerX = PADDING.left + plotWidth;
    const markerY = toY(y1BufferRef.current[sampleCount - 1]);
    context.strokeStyle = "#5f7468";
    context.setLineDash([4, 4]);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(markerX, PADDING.top);
    context.lineTo(markerX, PADDING.top + plotHeight);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#156a75";
    context.beginPath();
    context.arc(markerX, markerY, 4, 0, 2 * Math.PI);
    context.fill();

    context.fillStyle = "#2b3a33";
    context.font = "12px 'Avenir Next', 'Segoe UI Variable', sans-serif";
    context.fillText("time (s)", PADDING.left + plotWidth * 0.5 - 20, viewport.height - 10);

    context.save();
    context.translate(14, PADDING.top + plotHeight * 0.5 + 20);
    context.rotate(-Math.PI / 2);
    context.fillText("amplitude", 0, 0);
    context.restore();

    for (let i = 0; i <= 4; i += 1) {
      const tickT = tStart + (i / 4) * windowSec;
      const x = PADDING.left + (i / 4) * plotWidth;
      context.fillText(tickT.toFixed(2), x - 14, viewport.height - 22);
    }

    context.fillText(`x(t_now) = ${y1BufferRef.current[sampleCount - 1].toFixed(3)}`, 12, 14);

    const legendY = PADDING.top + 14;
    const drawLegend = (x: number, label: string, color: string, dash: number[]): number => {
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
      context.fillText(label, x + 28, legendY + 4);
      return x + 28 + context.measureText(label).width + 14;
    };

    let legendX = PADDING.left + 12;
    legendX = drawLegend(legendX, "x1(t)", "#156a75", []);
    if (compareMode) {
      legendX = drawLegend(legendX, "x2(t)", "#bb5e1f", [8, 5]);
      if (showSum) {
        legendX = drawLegend(legendX, "x1+x2", "#14213d", [2, 4]);
      }
      if (showDiff) {
        drawLegend(legendX, "x1-x2", "#0b7a5c", [12, 4, 2, 4]);
      }
    }
  }, [compareMode, showDiff, showSum, signal1, signal2, tNow, viewport, windowSec]);

  return (
    <section className="panel visual-panel">
      <h3>Time-Domain Waveform</h3>
      <div className="canvas-wrap" ref={wrapperRef}>
        <canvas ref={canvasRef} role="img" aria-label="Time-domain waveform canvas" />
      </div>
    </section>
  );
}
