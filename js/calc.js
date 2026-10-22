// Расчёты: калории, БЖУ, расход на спорте, статистика веса.
import { dateKey, addDays, parseKey } from './store.js';

// Значения MET по Compendium of Physical Activities: [легко, средне, тяжело]
export const SPORTS = {
  basketball: { name: 'Баскетбол', icon: '🏀', met: [4.5, 6.5, 8] },
  football: { name: 'Футбол', icon: '⚽', met: [5, 7, 10] },
  padel: { name: 'Падел', icon: '🎾', met: [4.5, 6, 7.5] },
  cycling: { name: 'Велосипед', icon: '🚴', met: [4, 6.8, 9.5] },
  strength: { name: 'Силовая', icon: '🏋️', met: [3.5, 5, 6] },
  running: { name: 'Бег', icon: '🏃', met: [7, 9, 11] },
  walking: { name: 'Ходьба', icon: '🚶', met: [3, 3.5, 4.5] },
  swimming: { name: 'Плавание', icon: '🏊', met: [6, 8, 10] },
  other: { name: 'Другое', icon: '⚡', met: [3, 5, 7] },
};

export const INTENSITY = ['Легко', 'Средне', 'Тяжело'];

export const LIFESTYLE = [
  { id: 'sit', name: 'Сидячая работа', factor: 1.2 },
  { id: 'mixed', name: 'Немного хожу днём', factor: 1.3 },
  { id: 'feet', name: 'Весь день на ногах', factor: 1.45 },
];

export const PACES = [
  { kg: 0.4, name: 'Мягко', note: '−0.4 кг/нед, легко держать' },
  { kg: 0.6, name: 'Оптимально', note: '−0.6 кг/нед, мышцы сохраняются' },
  { kg: 0.8, name: 'Быстро', note: '−0.8 кг/нед, нужна дисциплина' },
];

// Расход сверх базового обмена, поэтому вычитаем 1 MET покоя
export function activityKcal(type, intensity, minutes, weight) {
  const met = SPORTS[type]?.met[intensity] ?? 5;
  return Math.round((met - 1) * weight * (minutes / 60));
}

export function currentWeight(state) {
  const w = state.weights;
  if (w.length) return w[w.length - 1].kg;
  return state.profile?.startWeight ?? 80;
}

export function age(profile) {
  if (!profile.birthYear) return profile.age ?? 30;
  return new Date().getFullYear() - profile.birthYear;
}

// Миффлин — Сан Жеор
export function bmr(profile, weight) {
  const base = 10 * weight + 6.25 * profile.height - 5 * age(profile);
  return Math.round(profile.sex === 'f' ? base - 161 : base + 5);
}

export function dayActivityKcal(state, key) {
  return (state.activities[key] || []).reduce((s, a) => s + a.kcal, 0);
}

// Сколько калорий съедать в этот день
export function targets(state, key = dateKey()) {
  const p = state.profile;
  const w = currentWeight(state);
  const b = bmr(p, w);
  const factor = LIFESTYLE.find((l) => l.id === p.lifestyle)?.factor ?? 1.3;
  const base = Math.round(b * factor);
  const deficit = Math.round(((p.pace ?? 0.6) * 7700) / 7);
  const sport = dayActivityKcal(state, key);
  // Часы и формулы обычно завышают расход, поэтому «съедаем» только часть
  const eatBack = Math.round(sport * ((p.eatBack ?? 60) / 100));
  const floor = p.sex === 'f' ? 1300 : 1600;
  const kcal = Math.max(floor, base - deficit + eatBack);

  // Белок высокий, чтобы худеть жиром, а не мышцами
  const refW = Math.min(w, (p.goalWeight ?? w) + 5);
  const protein = Math.round(1.8 * refW);
  const fat = Math.round(Math.max(0.7 * refW, (kcal * 0.22) / 9));
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs, bmr: b, base, deficit, sport, eatBack };
}

export function dayTotals(state, key) {
  const items = state.food[key] || [];
  return items.reduce(
    (t, i) => ({ kcal: t.kcal + i.kcal, p: t.p + i.p, f: t.f + i.f, c: t.c + i.c }),
    { kcal: 0, p: 0, f: 0, c: 0 },
  );
}

// Сглаженный вес: экспоненциальное среднее, убирает скачки воды
export function smoothWeights(weights) {
  let ema = null;
  return weights.map((w) => {
    ema = ema === null ? w.kg : ema + 0.25 * (w.kg - ema);
    return { ...w, trend: Math.round(ema * 10) / 10 };
  });
}

export function weightStats(state) {
  const p = state.profile;
  const ws = smoothWeights(state.weights);
  const start = p.startWeight;
  const cur = ws.length ? ws[ws.length - 1].trend : start;
  const lost = Math.round((start - cur) * 10) / 10;
  const toGo = Math.round((cur - p.goalWeight) * 10) / 10;
  const total = start - p.goalWeight;
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((lost / total) * 100))) : 0;

  // Темп за последние ~3 недели по тренду
  let rate = null;
  if (ws.length >= 2) {
    const last = ws[ws.length - 1];
    const cutoff = addDays(last.date, -21);
    const first = ws.find((w) => w.date >= cutoff) || ws[0];
    const days = (parseKey(last.date) - parseKey(first.date)) / 864e5;
    if (days >= 6) rate = Math.round(((first.trend - last.trend) / days) * 7 * 100) / 100;
  }
  let eta = null;
  if (rate && rate > 0.05 && toGo > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Math.round((toGo / rate) * 7));
    eta = d;
  }
  return { start, cur, lost, toGo, pct, rate, eta, series: ws };
}

// День считается «в плане», если есть записи еды и калории в коридоре ±10%
export function dayOnTrack(state, key) {
  const items = state.food[key];
  if (!items || !items.length) return false;
  const t = targets(state, key);
  const eaten = dayTotals(state, key).kcal;
  return eaten >= t.kcal * 0.6 && eaten <= t.kcal * 1.1;
}

export function dayActive(state, key) {
  return (state.activities[key] || []).length > 0 || (state.workouts[key] || []).some((w) => w.finished);
}

function streak(state, test) {
  let key = dateKey();
  // сегодняшний день ещё не закончен: не обнуляем серию
  if (!test(state, key)) key = addDays(key, -1);
  let n = 0;
  while (test(state, key)) {
    n++;
    key = addDays(key, -1);
  }
  return n;
}

export const foodStreak = (state) => streak(state, (s, k) => (s.food[k] || []).length > 0);
export const trackStreak = (state) => streak(state, dayOnTrack);

export function weekActiveDays(state) {
  let n = 0;
  for (let i = 0; i < 7; i++) if (dayActive(state, addDays(dateKey(), -i))) n++;
  return n;
}

export const round = (x) => Math.round(x);
export const r1 = (x) => Math.round(x * 10) / 10;
