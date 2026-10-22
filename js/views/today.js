import { getState, dateKey, update } from '../store.js';
import { h, ring, bar, fmt, fmt1 } from '../ui.js';
import { targets, dayTotals, SPORTS, weightStats, foodStreak, weekActiveDays, INTENSITY } from '../calc.js';
import { openAddFood, openAddWeight, openAddActivity, removeActivity, openMealIdeas } from '../actions.js';
import { nextProgramDay, DAY_NAMES, PREGAME } from '../workouts.js';
import { quoteOfDay } from '../motivation.js';
import { SPORT_TIPS } from '../foods.js';
import { startWorkout } from './train.js';

export function renderToday(root) {
  const s = getState();
  const key = dateKey();
  const t = targets(s, key);
  const eaten = dayTotals(s, key);
  const left = t.kcal - eaten.kcal;
  const now = new Date();
  const dow = now.getDay();
  const planned = s.schedule[dow] || [];
  const acts = s.activities[key] || [];
  const ws = weightStats(s);
  const weighedToday = s.weights.some((w) => w.date === key);
  const streak = foodStreak(s);
  const water = s.water[key] || 0;
  const todayWorkout = (s.workouts[key] || [])[0];

  const hello = now.getHours() < 12 ? 'Доброе утро' : now.getHours() < 18 ? 'Добрый день' : 'Добрый вечер';
  const dateStr = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  root.append(
    h('header', { class: 'page-head' }, h('small', null, dateStr), h('h1', null, hello + ' 👋')),

    // Калории
    h('div', { class: 'card calories' },
      ring(eaten.kcal, t.kcal, { label: left >= 0 ? fmt(left) : '+' + fmt(-left), sub: left >= 0 ? 'ккал осталось' : 'ккал сверх нормы' }),
      h('div', { class: 'cal-side' },
        stat('Норма', fmt(t.kcal)),
        stat('Съедено', fmt(eaten.kcal)),
        stat('Спорт', t.sport ? '+' + fmt(t.eatBack) : '—'),
      ),
      h('div', { class: 'macros' },
        macro('Белки', eaten.p, t.protein, 'p'),
        macro('Жиры', eaten.f, t.fat, 'f'),
        macro('Углеводы', eaten.c, t.carbs, 'c'),
      ),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn primary', onclick: () => openAddFood(key) }, '＋ Еда'),
        h('button', { class: 'btn ghost', onclick: () => openMealIdeas(key, undefined, null, left) }, '🍱 Что съесть?'),
      ),
    ),

    // План на сегодня
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, `План на ${DAY_NAMES[dow].toLowerCase()}`), h('a', { href: '#train', class: 'link' }, 'Неделя ›')),
      !planned.length && !acts.length && h('p', { class: 'muted' }, 'День отдыха. Прогулка 30–40 минут ускорит восстановление.'),
      planned.filter((p) => p !== 'gym').map((sp) => {
        const done = acts.some((a) => a.type === sp);
        return h('div', { class: 'plan-item' + (done ? ' done' : '') },
          h('span', { class: 'plan-icon' }, SPORTS[sp].icon),
          h('div', { class: 'row-main' }, h('b', null, SPORTS[sp].name), h('small', null, done ? 'Записано ✓' : 'Перед игрой — разминка 8 мин')),
          !done && h('button', { class: 'btn small primary', onclick: () => openAddActivity(key, sp) }, 'Записать'),
        );
      }),
      planned.includes('gym') && (() => {
        const day = todayWorkout ? null : nextProgramDay(s);
        const done = todayWorkout?.finished;
        return h('div', { class: 'plan-item' + (done ? ' done' : '') },
          h('span', { class: 'plan-icon' }, '🏋️'),
          h('div', { class: 'row-main' }, h('b', null, 'Силовая' + (day ? ' ' + day.title : '')), h('small', null, done ? 'Завершена ✓' : todayWorkout ? 'Начата — продолжи' : '≈ 50–60 минут')),
          !done && h('button', { class: 'btn small primary', onclick: () => startWorkout() }, todayWorkout ? 'Продолжить' : 'Начать'),
        );
      })(),
      planned.some((p) => p !== 'gym' && p !== 'cycling') && h('details', { class: 'pregame' }, h('summary', null, '🔥 Разминка перед игрой'), h('ol', null, PREGAME.map((x) => h('li', null, x)))),
      acts.length > 0 && h('div', { class: 'list-title' }, 'Записано сегодня'),
      acts.map((a) => h('div', { class: 'plan-item done' },
        h('span', { class: 'plan-icon' }, SPORTS[a.type].icon),
        h('div', { class: 'row-main' }, h('b', null, SPORTS[a.type].name), h('small', null, `${a.minutes} мин · ${INTENSITY[a.intensity].toLowerCase()} · ${fmt(a.kcal)} ккал`)),
        h('button', { class: 'icon-btn', onclick: () => confirm('Удалить запись?') && removeActivity(key, a.id) }, '✕'),
      )),
      h('button', { class: 'btn ghost block', onclick: () => openAddActivity(key, planned.find((p) => p !== 'gym') || 'basketball') }, '＋ Записать активность'),
    ),

    // Вес
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, 'Вес'), h('a', { href: '#weight', class: 'link' }, 'График ›')),
      h('div', { class: 'stats3' },
        stat('Сейчас', fmt1(ws.cur) + ' кг'),
        stat('Сброшено', (ws.lost > 0 ? '−' : '') + fmt1(Math.abs(ws.lost)) + ' кг'),
        stat('До цели', fmt1(Math.max(0, ws.toGo)) + ' кг'),
      ),
      bar(ws.pct, 100, 'goal'),
      !weighedToday && h('button', { class: 'btn primary block', onclick: () => openAddWeight(key) }, '⚖️ Взвеситься'),
    ),

    // Вода
    h('div', { class: 'card water' },
      h('div', { class: 'row-main' }, h('h3', null, '💧 Вода'), h('small', null, `${fmt1(water / 1000)} из ${fmt1(waterGoal(s) / 1000)} л`)),
      bar(water, waterGoal(s), 'water-bar'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost small', onclick: () => addWater(key, -250) }, '−'),
        h('button', { class: 'btn ghost small', onclick: () => addWater(key, 250) }, '+ стакан'),
        h('button', { class: 'btn ghost small', onclick: () => addWater(key, 500) }, '+ 0.5 л'),
      ),
    ),

    // Мотивация
    h('div', { class: 'card motivation' },
      h('div', { class: 'streaks' },
        h('div', null, h('b', null, `🔥 ${streak}`), h('small', null, 'дней подряд с дневником')),
        h('div', null, h('b', null, `⚡ ${weekActiveDays(s)}/7`), h('small', null, 'активных дней за неделю')),
      ),
      h('blockquote', null, quoteOfDay()),
      planned.some((p) => p !== 'gym') && h('p', { class: 'tip' }, '💡 ' + SPORT_TIPS[now.getDate() % 3]),
      !planned.some((p) => p !== 'gym') && h('p', { class: 'tip' }, '💡 ' + SPORT_TIPS[3 + (now.getDate() % (SPORT_TIPS.length - 3))]),
    ),
  );
}

function waterGoal(s) {
  const w = s.weights.length ? s.weights[s.weights.length - 1].kg : s.profile.startWeight;
  const sportMin = (s.activities[dateKey()] || []).reduce((t, a) => t + a.minutes, 0);
  return Math.round((w * 30 + sportMin * 10) / 250) * 250;
}

function addWater(key, ml) {
  update((s) => (s.water[key] = Math.max(0, (s.water[key] || 0) + ml)));
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('small', null, label), h('b', null, value));
}

function macro(label, v, max, cls) {
  return h('div', { class: 'macro' }, h('div', { class: 'macro-top' }, h('span', null, label), h('small', null, `${fmt(v)} / ${fmt(max)} г`)), bar(v, max, cls));
}
