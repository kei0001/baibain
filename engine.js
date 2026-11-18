export const MODES = {
  snack: { label: 'おやつ', count: 24, interval: 5 },
  feast: { label: '大食い', count: 48, interval: 4.5 },
  hell: { label: '無理', count: 52, interval: 4 }
};
export function createGame(mode = 'snack') {
  const config = MODES[mode] || MODES.snack;
  return { ...config, count: config.count, elapsed: 0, next: config.interval, fullness: 0, eaten: 0, used: false, status: 'playing', combo: 0, lastBite: -99, peak: config.count };
}
export function tick(s, dt) {
  if (s.status !== 'playing') return;
  s.elapsed += dt;
  s.fullness = Math.max(0, s.fullness - dt * 15);
  while (s.elapsed >= s.next && s.status === 'playing') {
    s.count *= 2; s.peak = Math.max(s.peak, s.count); s.next += s.interval;
    if (s.count >= 1024) s.status = 'lost';
  }
}
export function bite(s) {
  if (s.status !== 'playing' || s.fullness > 90) return 0;
  s.combo = s.elapsed - s.lastBite < 0.7 ? s.combo + 1 : 1;
  s.lastBite = s.elapsed;
  const amount = Math.min(s.count, s.combo % 8 === 0 ? 3 : 1);
  s.count -= amount; s.eaten += amount; s.fullness = Math.min(100, s.fullness + 7);
  if (!s.count) s.status = 'won';
  return amount;
}
export function secondStomach(s) {
  if (s.status !== 'playing' || s.used) return false;
  s.used = true; s.fullness = 0; return true;
}
