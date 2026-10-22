// Достижения и фраза дня
import { weightStats, foodStreak, trackStreak, dayActive } from './calc.js';
import { dateKey } from './store.js';

const QUOTES = [
  'Не надо быть идеальным. Надо не пропускать два дня подряд.',
  'Вес на весах прыгает. Смотри на тренд, а не на одно утро.',
  'Каждая игра — это минус 500 ккал и плюс к форме. Ты уже в деле.',
  'Мышцы растут не в зале, а во сне и с белком. Поешь и выспись.',
  'Минус 15 кг — это 30 раз по полкило. Сегодня работаем над одним.',
  'Сильные ноги — выше прыжок, быстрее рывок, меньше травм.',
  'Дисциплина — это выбрать то, чего хочешь больше, вместо того, чего хочешь сейчас.',
  'Ты не на диете. Ты строишь тело, в котором играть легче.',
  'Записал еду — уже победил. Учёт сам по себе снижает калории на 10–15%.',
  'Сорвался вечером? Завтра обычный день, без наказаний и голодовок.',
  'Прогресс в силовой — лучший знак, что худеешь жиром, а не мышцами.',
  'Первые 5 кг — самые мотивирующие. Последние 5 — самые ценные.',
  'Сравнивай себя с собой месяц назад, а не с чужими фото.',
  'Вода, сон, белок, шаги. Скучно, но работает.',
];

export function quoteOfDay() {
  const d = new Date();
  const n = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  return QUOTES[n % QUOTES.length];
}

function countWorkouts(s) {
  return Object.values(s.workouts).flat().filter((w) => w.finished).length;
}

function hoopsTotals(s) {
  const runs = Object.values(s.hoops || {}).flat().filter((x) => x.finished);
  return { sessions: runs.length, made: runs.reduce((a, r) => a + r.steps.reduce((b, x) => b + x.made, 0), 0) };
}

function countSports(s) {
  return Object.values(s.activities).flat().length;
}

function sportHours(s) {
  return Object.values(s.activities).flat().reduce((t, a) => t + a.minutes, 0) / 60;
}

function activeDaysTotal(s) {
  const keys = new Set([...Object.keys(s.activities), ...Object.keys(s.workouts)]);
  return [...keys].filter((k) => dayActive(s, k)).length;
}

export const ACHIEVEMENTS = [
  { id: 'start', icon: '🚀', name: 'Старт', desc: 'Заполнил профиль', test: (s) => !!s.profile },
  { id: 'w1', icon: '⚖️', name: 'Первое взвешивание', desc: 'Записал вес', test: (s) => s.weights.length >= 1 },
  { id: 'food1', icon: '🍽', name: 'Первая запись', desc: 'Записал еду', test: (s) => Object.values(s.food).some((d) => d.length) },
  { id: 'loss1', icon: '🥉', name: '−1 кг', desc: 'Тренд веса ниже старта на 1 кг', test: (s) => weightStats(s).lost >= 1 },
  { id: 'loss3', icon: '🥈', name: '−3 кг', desc: 'Тренд веса ниже старта на 3 кг', test: (s) => weightStats(s).lost >= 3 },
  { id: 'loss5', icon: '🥇', name: '−5 кг', desc: 'Треть пути!', test: (s) => weightStats(s).lost >= 5 },
  { id: 'loss10', icon: '🏅', name: '−10 кг', desc: 'Две трети пути', test: (s) => weightStats(s).lost >= 10 },
  { id: 'goal', icon: '🏆', name: 'Цель!', desc: 'Достиг целевого веса', test: (s) => s.profile && s.weights.length > 0 && weightStats(s).toGo <= 0 },
  { id: 'str3', icon: '🔥', name: 'Серия 3', desc: '3 дня подряд записываешь еду', test: (s) => foodStreak(s) >= 3 },
  { id: 'str7', icon: '🔥', name: 'Неделя учёта', desc: '7 дней подряд записываешь еду', test: (s) => foodStreak(s) >= 7 },
  { id: 'str30', icon: '💎', name: 'Месяц учёта', desc: '30 дней подряд', test: (s) => foodStreak(s) >= 30 },
  { id: 'track7', icon: '🎯', name: 'Снайпер', desc: '7 дней подряд в норме калорий', test: (s) => trackStreak(s) >= 7 },
  { id: 'gym1', icon: '🏋️', name: 'Первая силовая', desc: 'Завершил тренировку', test: (s) => countWorkouts(s) >= 1 },
  { id: 'gym10', icon: '💪', name: '10 силовых', desc: 'Завершил 10 тренировок', test: (s) => countWorkouts(s) >= 10 },
  { id: 'gym30', icon: '🦾', name: '30 силовых', desc: 'Железная привычка', test: (s) => countWorkouts(s) >= 30 },
  { id: 'hoops1', icon: '🏀', name: 'Один на один с кольцом', desc: 'Первая соло-тренировка с мячом', test: (s) => hoopsTotals(s).sessions >= 1 },
  { id: 'made100', icon: '🎯', name: '100 попаданий', desc: 'Забил 100 мячей на соло-тренировках', test: (s) => hoopsTotals(s).made >= 100 },
  { id: 'made1000', icon: '👑', name: '1000 попаданий', desc: 'Тысяча мячей в кольцо', test: (s) => hoopsTotals(s).made >= 1000 },
  { id: 'steps10k', icon: '👟', name: '10 000 шагов', desc: 'День с 10 000 шагов по данным Health', test: (s) => Object.values(s.health?.steps || {}).some((v) => v >= 10000) },
  { id: 'sport10', icon: '🏀', name: '10 игр', desc: 'Записал 10 активностей', test: (s) => countSports(s) >= 10 },
  { id: 'hours20', icon: '⏱', name: '20 часов спорта', desc: 'Наиграл 20 часов', test: (s) => sportHours(s) >= 20 },
  { id: 'active50', icon: '⚡', name: '50 активных дней', desc: 'Двигался 50 разных дней', test: (s) => activeDaysTotal(s) >= 50 },
];

// Возвращает новые достижения, полученные после изменения данных
export function checkAchievements(state) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.unlocked[a.id] && a.test(state)) fresh.push(a);
  }
  return fresh;
}

export function markUnlocked(state, list) {
  list.forEach((a) => (state.unlocked[a.id] = dateKey()));
}
