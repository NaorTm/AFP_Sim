export type PhaseUnit = "rad" | "deg";

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function phaseToUnit(phaseRad: number, unit: PhaseUnit): number {
  return unit === "deg" ? radToDeg(phaseRad) : phaseRad;
}

export function phaseFromUnit(value: number, unit: PhaseUnit): number {
  return unit === "deg" ? degToRad(value) : value;
}

export function formatNumber(value: number, digits = 3): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

export function formatSigned(value: number, digits = 3): string {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  const text = value.toFixed(digits);
  return value >= 0 ? `+${text}` : text;
}
