import { getState, dateKey, addDays, parseKey } from '../store.js';
import { h, bar, fmt, fmt1, mount } from '../ui.js';
import { targets, dayTotals } from '../calc.js';
import { openAddFood, openEditFoodItem, openMealIdeas, openPhotoFood, MEAL_NAMES } from '../actions.js';
import { SPORT_TIPS } from '../foods.js';

let viewKey = null;

export function renderFood(root, rerender) {
  const s = getState();
  const today = dateKey();
  if (!viewKey || viewKey > today) viewKey = today;
  const key = viewKey;
  const t = targets(s, key);
  const tot = dayTotals(s, key);
  const items = s.food[key] || [];
  const left = t.kcal - tot.kcal;

  const label = key === today ? 'Сегодня' : key === addDays(today, -1) ? 'Вчера' : parseKey(key).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  const go = (n) => {
    viewKey = addDays(key, n);
    rerender();
  };

  mount(root, 
    h('header', { class: 'page-head' }, h('h1', null, 'Питание')),
    h('div', { class: 'day-nav' },
      h('button', { class: 'icon-btn', onclick: () => go(-1) }, '‹'),
      h('b', null, label),
      h('button', { class: 'icon-btn', disabled: key >= today, onclick: () => go(1) }, '›'),
    ),
    h('div', { class: 'card' },
      h('div', { class: 'kcal-line' },
        h('div', null, h('b', { class: 'big' }, fmt(tot.kcal)), h('small', null, ` / ${fmt(t.kcal)} ккал`)),
        h('span', { class: left >= 0 ? 'ok' : 'over' }, left >= 0 ? `осталось ${fmt(left)}` : `перебор ${fmt(-left)}`),
      ),
      bar(tot.kcal, t.kcal, left < -t.kcal * 0.05 ? 'over' : ''),
      h('div', { class: 'macro-grid' },
        macroCell('Белки', tot.p, t.protein, 'p'),
        macroCell('Жиры', tot.f, t.fat, 'f'),
        macroCell('Углеводы', tot.c, t.carbs, 'c'),
      ),
      tot.p < t.protein * 0.7 && items.length > 2 && h('p', { class: 'tip' }, `💪 Не хватает ${fmt(t.protein - tot.p)} г белка. Это творог, курица, рыба, яйца или протеин.`),
    ),
    Object.entries(MEAL_NAMES).map(([meal, name]) => {
      const list = items.filter((i) => i.meal === meal);
      const kc = list.reduce((a, i) => a + i.kcal, 0);
      return h('div', { class: 'card meal' },
        h('div', { class: 'card-head' }, h('h3', null, name), h('small', null, kc ? `${fmt(kc)} ккал` : '')),
        list.map((i) => h('button', { class: 'row', onclick: () => openEditFoodItem(key, i) },
          h('div', { class: 'row-main' }, h('b', null, (i.photo ? '📷 ' : '') + i.name), h('small', null, `${i.grams ? i.grams + ' г · ' : ''}Б ${fmt1(i.p)} Ж ${fmt1(i.f)} У ${fmt1(i.c)}`)),
          h('span', { class: 'kc' }, fmt(i.kcal)),
        )),
        h('div', { class: 'btn-row tight' },
          h('button', { class: 'btn ghost small', onclick: () => openAddFood(key, meal) }, '＋ Добавить'),
          h('button', { class: 'btn ghost small', onclick: () => openPhotoFood(key, meal) }, '📷 Фото'),
        ),
      );
    }),
    h('div', { class: 'card' },
      h('h3', null, '🍱 Идеи под твою норму'),
      h('p', { class: 'muted' }, 'Блюда с высоким белком: собраны из продуктов базы и добавляются одним касанием.'),
      h('button', { class: 'btn primary block', onclick: () => openMealIdeas(key, undefined, null, left) }, 'Подобрать блюдо'),
    ),
    h('div', { class: 'card' },
      h('h3', null, '📚 Питание и спорт'),
      h('ul', { class: 'tips' }, SPORT_TIPS.map((x) => h('li', null, x))),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Как считается норма'),
      h('div', { class: 'explain' },
        line('Базовый обмен (Миффлин — Сан Жеор)', t.bmr),
        line('С учётом образа жизни', t.base),
        line('Дефицит для похудения', -t.deficit),
        line(`Спорт за день (${s.profile.eatBack ?? 60}% от ${fmt(t.sport)})`, t.eatBack),
        h('div', { class: 'explain-total' }, h('span', null, 'Норма'), h('b', null, fmt(t.kcal) + ' ккал')),
      ),
      h('p', { class: 'muted' }, `Белок ${t.protein} г (≈1,8 г на кг) сохраняет и растит мышцы на дефиците. Жиры ${t.fat} г, остальное — углеводы для игр.`),
    ),
  );
}

function macroCell(label, v, max, cls) {
  return h('div', { class: 'macro-cell' }, h('small', null, label), h('b', null, `${fmt(v)}`), h('small', null, `из ${fmt(max)} г`), bar(v, max, cls));
}

function line(label, v) {
  return h('div', { class: 'explain-line' }, h('span', null, label), h('b', null, (v > 0 ? '' : v < 0 ? '−' : '') + fmt(Math.abs(v))));
}
