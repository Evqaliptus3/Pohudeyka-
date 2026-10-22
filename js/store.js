// Хранилище: всё лежит в localStorage на телефоне.
const KEY = 'pohudeyka.v1';

const DEFAULT = {
  profile: null, // заполняется на онбординге
  weights: [], // [{date, kg}]
  food: {}, // {date: [{id, meal, name, grams, kcal, p, f, c}]}
  customFoods: [], // [{id, name, kcal, p, f, c, portion?}]
  activities: {}, // {date: [{id, type, minutes, intensity, kcal}]}
  workouts: {}, // {date: [{id, day, exercises: [{id, sets: [{reps, kg, done}]}], finished}]}
  hoops: {}, // {date: [{id, session, steps: [{id, round, made, att, sets, done}], finished}]}
  health: { steps: {}, active: {}, exported: {} }, // данные из Apple Health через «Команды»
  water: {}, // {date: ml}
  schedule: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] }, // день недели -> виды спорта
  programPos: 0, // какая тренировка программы следующая
  unlocked: {}, // {achievementId: date}
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(DEFAULT), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('load failed', e);
  }
  return structuredClone(DEFAULT);
}

export function getState() {
  return state;
}

export function update(fn) {
  fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    alert('Не удалось сохранить данные: ' + e.message);
  }
  listeners.forEach((l) => l(state));
}

export function subscribe(fn) {
  listeners.add(fn);
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (typeof data !== 'object' || !data) throw new Error('Неверный файл');
  update((s) => {
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, structuredClone(DEFAULT), data);
  });
}

export function resetAll() {
  update((s) => {
    Object.keys(s).forEach((k) => delete s[k]);
    Object.assign(s, structuredClone(DEFAULT));
  });
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Даты в локальном времени, формат YYYY-MM-DD
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
