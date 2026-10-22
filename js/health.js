// Связь с Apple Health через приложение «Команды» (Shortcuts).
// Веб-приложение не может читать HealthKit напрямую, поэтому:
//   Health → приложение: команда собирает данные в текст и кладёт в буфер, приложение его разбирает.
//   Приложение → Health: приложение запускает команду и передаёт ей данные текстом.
import { dateKey } from './store.js';
import { dayTotals } from './calc.js';

export const IMPORT_SHORTCUT = 'Похудейка из Health';
export const EXPORT_SHORTCUT = 'Похудейка в Health';

const MONTHS = {
  янв: 1, фев: 2, мар: 3, апр: 4, мая: 5, май: 5, июн: 6, июл: 7, авг: 8, сен: 9, окт: 10, ноя: 11, дек: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n) => String(n).padStart(2, '0');

// Команды форматируют дату по-разному в зависимости от настроек: понимаем основные варианты
function parseDate(s) {
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = s.match(/(\d{1,2})\s+([а-яёa-z]{3})[а-яёa-z.]*\s+(\d{4})/i);
  if (m && MONTHS[m[2].toLowerCase()]) return `${m[3]}-${pad(MONTHS[m[2].toLowerCase()])}-${pad(m[1])}`;
  m = s.match(/([a-z]{3})[a-z.]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m && MONTHS[m[1].toLowerCase()]) return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}`;
  return null;
}

function parseNumber(s) {
  // «10 532», «103,4 кг», «640.5 ккал»
  const m = s.replace(/[\s  ]/g, '').match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',', '.')) : null;
}

// Строки вида «W 2026-10-22 103,4» (вес), «S … 8532» (шаги), «A … 640» (активная энергия)
export function parseHealthText(text) {
  const out = { weights: {}, steps: {}, active: {} };
  const today = dateKey();
  let lines = 0;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    const m = line.match(/^([WSAВША])(?=[\s;:,])[\s;:,]*(.*)$/i);
    if (!m) continue;
    const kind = { w: 'weights', в: 'weights', s: 'steps', ш: 'steps', a: 'active', а: 'active' }[m[1].toLowerCase()];
    const rest = m[2];
    const date = parseDate(rest) || today;
    // число после даты: убираем дату из строки, чтобы не спутать год со значением
    const valuePart = rest.replace(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{1,2}\s+[а-яёa-z]{3}[а-яёa-z.]*\s+\d{4}( г\.)?|[a-z]{3}[a-z.]*\s+\d{1,2},?\s+\d{4}/gi, ' ').replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ');
    let v = parseNumber(valuePart);
    if (v == null || date > today) continue;
    if (kind === 'weights') {
      if (/lb|фунт/i.test(valuePart)) v = v * 0.4536;
      if (v < 30 || v > 300) continue;
      out.weights[date] = Math.round(v * 10) / 10; // несколько взвешиваний за день — берём последнее
    } else {
      // шаги и энергия могут прийти несколькими записями за день — складываем
      if (v < 0) continue;
      out[kind][date] = (out[kind][date] || 0) + v;
    }
    lines++;
  }
  if (!lines) throw new Error('Не нашёл данных Health. Сначала запусти команду «' + IMPORT_SHORTCUT + '», потом вставь результат.');
  return out;
}

// Записываем импорт в состояние. Ручной вес за тот же день не перезаписываем.
export function applyHealth(s, data) {
  s.health = s.health || { steps: {}, active: {}, exported: {} };
  let added = 0;
  for (const [date, kg] of Object.entries(data.weights)) {
    const ex = s.weights.find((w) => w.date === date);
    if (ex && ex.src !== 'health') continue;
    if (ex) ex.kg = kg;
    else s.weights.push({ date, kg, src: 'health' });
    added++;
  }
  s.weights.sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const [date, v] of Object.entries(data.steps)) s.health.steps[date] = Math.round(v);
  for (const [date, v] of Object.entries(data.active)) s.health.active[date] = Math.round(v);
  s.health.lastSync = Date.now();
  return added;
}

export function runShortcut(name, text) {
  let url = 'shortcuts://run-shortcut?name=' + encodeURIComponent(name);
  if (text != null) url += '&input=text&text=' + encodeURIComponent(text);
  location.href = url;
}

// Что отправить в Health: только прирост с прошлой отправки, чтобы не задвоить калории
export function exportPayload(s, key = dateKey()) {
  const t = dayTotals(s, key);
  const prev = s.health?.exported?.[key] || { kcal: 0, p: 0, f: 0, c: 0 };
  const d = {
    kcal: Math.round(t.kcal - prev.kcal),
    protein: Math.round(t.p - prev.p),
    fat: Math.round(t.f - prev.f),
    carbs: Math.round(t.c - prev.c),
  };
  const out = {};
  if (d.kcal > 0) Object.assign(out, { kcal: d.kcal, protein: Math.max(0, d.protein), fat: Math.max(0, d.fat), carbs: Math.max(0, d.carbs) });
  const w = s.weights.find((x) => x.date === key);
  if (w && w.src !== 'health' && !w.exported) out.weight = w.kg;
  return { payload: out, totals: t };
}

export function markExported(s, key, totals) {
  s.health = s.health || { steps: {}, active: {}, exported: {} };
  s.health.exported = s.health.exported || {};
  s.health.exported[key] = { kcal: totals.kcal, p: totals.p, f: totals.f, c: totals.c };
  const w = s.weights.find((x) => x.date === key);
  if (w && w.src !== 'health') w.exported = true;
}
