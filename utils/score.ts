/** Classic-style score: start high, lose points for moves and time. */
export function computeScore(moves: number, elapsedSeconds: number): number {
  const raw = 10000 - moves * 15 - elapsedSeconds * 2;
  return Math.max(0, Math.round(raw));
}

export function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
