export const MODES = {
  snack: { label: 'おやつ', count: 48, interval: 6 },
  feast: { label: '大食い', count: 96, interval: 5 },
  hell: { label: '無理', count: 160, interval: 4.5, acceleration: 0.25, minInterval: 3 }
};
export const EVOLUTIONS = [
  { at: 0, name: 'ひとくち人間', power: 1 },
  { at: 20, name: '両手食い', power: 2 },
  { at: 50, name: '掃除機食い', power: 5 },
  { at: 100, name: 'ブラックホール食い', power: 10 },
  { at: 220, name: '胃袋ビッグバン', power: 20 }
];
export function evolution(s) { return EVOLUTIONS.findLast(e => s.eaten >= e.at); }
export function createGame(mode = 'snack') {
  const config = MODES[mode] || MODES.snack;
  return { ...config, elapsed: 0, next: config.interval, fullness: 0, eaten: 0, status: 'playing', combo: 0, lastBite: -99, peak: config.count, teaUntil: 0, boostUntil: 0, teaReady: 0, cups: 0, doubles: 0 };
}
export function tick(s, dt) {
  if (s.status !== 'playing') return;
  s.elapsed += dt;
  s.fullness = Math.max(0, s.fullness - dt * 12);
  if (s.teaUntil && s.elapsed >= s.teaUntil) {
    s.fullness = 0; s.boostUntil = s.teaUntil + 4; s.teaUntil = 0;
  }
  while (s.elapsed >= s.next && s.status === 'playing') {
    s.count *= 2; s.peak = Math.max(s.peak, s.count); s.doubles++;
    s.interval = Math.max(s.minInterval || s.interval, s.interval - (s.acceleration || 0));
    s.next += s.interval;
    if (s.count >= 1024) s.status = 'lost';
  }
}
export function bite(s) {
  if (s.status !== 'playing' || s.teaUntil || s.fullness > 90) return 0;
  s.combo = s.elapsed - s.lastBite < 0.7 ? s.combo + 1 : 1;
  s.lastBite = s.elapsed;
  const boosted = s.elapsed < s.boostUntil;
  const amount = Math.min(s.count, evolution(s).power * (boosted ? 2 : 1) * (s.combo % 8 === 0 ? 3 : 1));
  s.count -= amount; s.eaten += amount;
  s.fullness = Math.min(100, s.fullness + (6 + Math.sqrt(amount) * 2));
  if (!s.count) s.status = 'won';
  return amount;
}
export function drinkTea(s) {
  if (s.status !== 'playing' || s.teaUntil || s.elapsed < s.teaReady) return false;
  s.teaUntil = s.elapsed + 1.5; s.teaReady = s.elapsed + 7.5; s.cups++; s.combo = 0;
  return true;
}
