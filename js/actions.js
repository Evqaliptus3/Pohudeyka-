// Шторки для добавления данных: еда, вес, активность
import { getState, update, uid, dateKey } from './store.js';
import { h, sheet, toast, fmt, fmt1, num, numInput, segmented, field } from './ui.js';
import { SPORTS, INTENSITY, activityKcal, currentWeight } from './calc.js';
import { searchFoods, searchOnline, portion, MEALS, mealItems, mealTotals } from './foods.js';
import { getApiKey, setApiKey, prepareImage, analyzeFood } from './photo.js';

export const MEAL_NAMES = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' };

export function defaultMeal() {
  const hr = new Date().getHours();
  if (hr < 11) return 'breakfast';
  if (hr < 16) return 'lunch';
  if (hr < 21) return 'dinner';
  return 'snack';
}

function mealPicker(value, onChange) {
  return segmented(
    Object.entries(MEAL_NAMES).map(([v, label]) => ({ value: v, label })),
    value,
    onChange,
  );
}

// Последние продукты из дневника, чтобы добавлять в одно касание
function recentFoods(state) {
  const seen = new Map();
  const keys = Object.keys(state.food).sort().reverse().slice(0, 21);
  for (const k of keys) {
    for (const it of [...state.food[k]].reverse()) {
      if (!it.base || seen.has(it.name)) continue;
      seen.set(it.name, { id: 'r' + seen.size, name: it.name, ...it.base, lastG: it.grams, unit: it.unit, unitG: it.unitG });
    }
  }
  return [...seen.values()].slice(0, 15);
}

function addItems(key, meal, items) {
  update((s) => {
    s.food[key] = s.food[key] || [];
    items.forEach((it) => s.food[key].push({ id: uid(), meal, ...it }));
  });
}

export function openAddFood(key = dateKey(), meal = defaultMeal()) {
  let curMeal = meal;
  sheet('Добавить еду', (close) => {
    const state = getState();
    const list = h('div', { class: 'list' });
    const search = h('input', { type: 'search', placeholder: 'Поиск: гречка, яйцо, кофе…', autocomplete: 'off', class: 'search' });
    let onlineResults = [];

    const row = (f) =>
      h(
        'button',
        { class: 'row', onclick: () => openPortion(f, key, curMeal, close) },
        h('div', { class: 'row-main' }, h('b', null, f.name), h('small', null, `${fmt(f.kcal)} ккал · Б ${fmt1(f.p)} Ж ${fmt1(f.f)} У ${fmt1(f.c)} на 100 г`)),
        h('span', { class: 'chev' }, '›'),
      );

    const render = () => {
      list.innerHTML = '';
      const q = search.value.trim();
      if (!q) {
        const rec = recentFoods(state);
        if (rec.length) list.append(h('div', { class: 'list-title' }, 'Недавние'), ...rec.map(row));
        list.append(h('div', { class: 'list-title' }, 'Все продукты'));
      }
      const res = searchFoods(q, state.customFoods);
      list.append(...res.slice(0, q ? 60 : 40).map(row));
      if (onlineResults.length) list.append(h('div', { class: 'list-title' }, 'Open Food Facts'), ...onlineResults.map(row));
      if (q && !res.length && !onlineResults.length) list.append(h('p', { class: 'muted center' }, 'Ничего не нашлось. Поищи в интернете или добавь свой продукт.'));
    };
    search.addEventListener('input', () => {
      onlineResults = [];
      render();
    });

    const onlineBtn = h('button', { class: 'btn ghost small', onclick: async () => {
      const q = search.value.trim();
      if (!q) return toast('Введи название для поиска');
      onlineBtn.textContent = 'Ищу…';
      try {
        onlineResults = await searchOnline(q);
        if (!onlineResults.length) toast('В интернете тоже не нашлось');
      } catch {
        toast('Нет связи с базой продуктов');
      }
      onlineBtn.textContent = '🌐 Искать в интернете';
      render();
    } }, '🌐 Искать в интернете');

    render();
    setTimeout(() => search.focus(), 300);
    return h(
      'div',
      null,
      mealPicker(curMeal, (v) => (curMeal = v)),
      h('button', { class: 'btn primary block', onclick: () => openPhotoFood(key, curMeal, close) }, '📷 Фото еды — посчитать калории'),
      search,
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost small', onclick: () => openMealIdeas(key, curMeal, close) }, '🍱 Блюда'),
        h('button', { class: 'btn ghost small', onclick: () => openQuickKcal(key, curMeal, close) }, '⚡ Быстро'),
        h('button', { class: 'btn ghost small', onclick: () => openCustomFood(close) }, '＋ Свой'),
      ),
      list,
      h('div', { class: 'center', style: { marginTop: '12px' } }, onlineBtn),
    );
  });
}

function openPortion(food, key, meal, closeParent) {
  sheet(food.name, (close) => {
    const unitG = food.unitG;
    const grams = numInput({ value: food.lastG || unitG || 100, class: 'big-input' });
    const preview = h('div', { class: 'preview' });
    const upd = () => {
      const g = num(grams.value) || 0;
      const p = portion(food, g);
      preview.innerHTML = '';
      preview.append(h('b', null, `${fmt(p.kcal)} ккал`), h('span', null, `Б ${fmt1(p.p)} · Ж ${fmt1(p.f)} · У ${fmt1(p.c)}`));
    };
    grams.addEventListener('input', upd);
    upd();
    const set = (g) => {
      grams.value = g;
      upd();
    };
    const quick = [];
    if (unitG) [0.5, 1, 2, 3].forEach((m) => quick.push(h('button', { class: 'chip', onclick: () => set(Math.round(unitG * m)) }, `${m === 0.5 ? '½' : m} ${food.unit} · ${Math.round(unitG * m)} г`)));
    [50, 100, 150, 200, 300].forEach((g) => quick.push(h('button', { class: 'chip', onclick: () => set(g) }, `${g} г`)));
    return h(
      'div',
      null,
      field('Сколько граммов (мл)', grams),
      h('div', { class: 'chips' }, quick),
      preview,
      h('button', { class: 'btn primary block', onclick: () => {
        const g = num(grams.value);
        if (!g || g <= 0) return toast('Укажи вес порции');
        const p = portion(food, g);
        addItems(key, meal, [{ ...p, base: { kcal: food.kcal, p: food.p, f: food.f, c: food.c }, unit: food.unit, unitG: food.unitG }]);
        if (food.online) saveCustom({ name: food.name, kcal: food.kcal, p: food.p, f: food.f, c: food.c });
        toast(`+ ${p.kcal} ккал · ${MEAL_NAMES[meal]}`);
        close();
        closeParent && closeParent();
      } }, 'Добавить'),
    );
  });
}

function saveCustom(f) {
  update((s) => {
    if (!s.customFoods.some((x) => x.name === f.name)) s.customFoods.unshift({ id: 'c' + uid(), ...f });
  });
}

function openCustomFood(closeParent) {
  sheet('Свой продукт', (close) => {
    const name = h('input', { type: 'text', placeholder: 'Например: Батончик Fit' });
    const kcal = numInput({ placeholder: 'ккал' });
    const p = numInput({ placeholder: 'г' });
    const f = numInput({ placeholder: 'г' });
    const c = numInput({ placeholder: 'г' });
    return h(
      'div',
      null,
      h('p', { class: 'muted' }, 'Значения на 100 г — их пишут на упаковке.'),
      field('Название', name),
      field('Калории на 100 г', kcal),
      h('div', { class: 'grid3' }, field('Белки', p), field('Жиры', f), field('Углеводы', c)),
      h('button', { class: 'btn primary block', onclick: () => {
        if (!name.value.trim() || num(kcal.value) == null) return toast('Нужны название и калории');
        saveCustom({ name: name.value.trim(), kcal: num(kcal.value), p: num(p.value) || 0, f: num(f.value) || 0, c: num(c.value) || 0 });
        toast('Продукт сохранён — найди его в поиске');
        close();
        closeParent && closeParent();
      } }, 'Сохранить'),
    );
  });
}

function openQuickKcal(key, meal, closeParent) {
  sheet('Быстрая запись', (close) => {
    const name = h('input', { type: 'text', placeholder: 'Что это было? (необязательно)' });
    const kcal = numInput({ placeholder: '0', class: 'big-input' });
    const p = numInput({ placeholder: '0' });
    return h(
      'div',
      null,
      h('p', { class: 'muted' }, 'Когда ешь в кафе или не знаешь состав — просто оцени калории.'),
      field('Калории', kcal),
      field('Белок, г (если знаешь)', p),
      field('Название', name),
      h('button', { class: 'btn primary block', onclick: () => {
        const k = num(kcal.value);
        if (!k) return toast('Укажи калории');
        addItems(key, meal, [{ name: name.value.trim() || 'Быстрая запись', grams: 0, kcal: Math.round(k), p: num(p.value) || 0, f: 0, c: 0 }]);
        toast(`+ ${Math.round(k)} ккал`);
        close();
        closeParent && closeParent();
      } }, 'Добавить'),
    );
  });
}

export function openMealIdeas(key = dateKey(), meal = defaultMeal(), closeParent, remaining) {
  sheet('Готовые блюда', (close) => {
    const tags = ['Все', 'Завтрак', 'Обед', 'Ужин', 'Перекус', 'После тренировки'];
    let tag = 'Все';
    const list = h('div', { class: 'list' });
    const render = () => {
      list.innerHTML = '';
      MEALS.filter((m) => tag === 'Все' || m.tag === tag).forEach((m) => {
        const t = mealTotals(m);
        const fits = remaining == null || t.kcal <= remaining + 50;
        list.append(
          h(
            'div',
            { class: 'meal-card' + (fits ? '' : ' dim') },
            h('div', { class: 'row-main' }, h('b', null, m.name), h('small', null, `${fmt(t.kcal)} ккал · Б ${fmt(t.p)} Ж ${fmt(t.f)} У ${fmt(t.c)}`), h('small', { class: 'muted' }, m.items.map(([n, g]) => `${n.replace(/ \(.*\)/, '')} ${g} г`).join(', '))),
            h('button', { class: 'btn primary small', onclick: () => {
              addItems(key, meal, mealItems(m).map((it) => ({ ...it })));
              toast(`+ ${t.kcal} ккал · ${m.name}`);
              close();
              closeParent && closeParent();
            } }, '＋'),
          ),
        );
      });
    };
    render();
    return h(
      'div',
      null,
      remaining != null && h('p', { class: 'muted' }, `Осталось на сегодня: ${fmt(Math.max(0, remaining))} ккал. Блюда, которые не влезают, приглушены.`),
      h('div', { class: 'chips scroll' }, tags.map((t) => h('button', { class: 'chip' + (t === tag ? ' on' : ''), onclick: (e) => {
        tag = t;
        e.target.parentNode.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        e.target.classList.add('on');
        render();
      } }, t))),
      list,
    );
  });
}

export function openEditFoodItem(key, item) {
  sheet(item.name, (close) => {
    const grams = numInput({ value: item.grams || '', class: 'big-input' });
    const hasBase = !!item.base;
    return h(
      'div',
      null,
      h('p', { class: 'muted' }, `${fmt(item.kcal)} ккал · Б ${fmt1(item.p)} Ж ${fmt1(item.f)} У ${fmt1(item.c)}`),
      hasBase && field('Граммы', grams),
      hasBase && h('button', { class: 'btn primary block', onclick: () => {
        const g = num(grams.value);
        if (!g) return toast('Укажи граммы');
        update((s) => {
          const it = s.food[key].find((x) => x.id === item.id);
          Object.assign(it, portion({ ...it.base, name: it.name }, g));
        });
        close();
      } }, 'Сохранить'),
      h('button', { class: 'btn danger block', onclick: () => {
        update((s) => (s.food[key] = s.food[key].filter((x) => x.id !== item.id)));
        close();
      } }, 'Удалить'),
    );
  });
}

export function openAddWeight(key = dateKey()) {
  sheet('Взвешивание', (close) => {
    const state = getState();
    const existing = state.weights.find((w) => w.date === key);
    const kg = numInput({ value: existing?.kg ?? currentWeight(state), class: 'big-input' });
    const waist = numInput({ value: existing?.waist ?? '', placeholder: 'см' });
    const step = (d) => {
      kg.value = Math.round(((num(kg.value) || 0) + d) * 10) / 10;
    };
    return h(
      'div',
      null,
      h('p', { class: 'muted' }, 'Лучше всего утром, после туалета, до еды. Вес скачет на 0.5–1.5 кг из-за воды — приложение смотрит на тренд.'),
      h('div', { class: 'stepper' }, h('button', { class: 'btn ghost', onclick: () => step(-0.1) }, '−0.1'), kg, h('button', { class: 'btn ghost', onclick: () => step(0.1) }, '+0.1')),
      field('Талия, см (раз в неделю)', waist, 'Талия уходит, даже когда вес стоит из-за мышц'),
      h('button', { class: 'btn primary block', onclick: () => {
        const v = num(kg.value);
        if (!v || v < 30 || v > 300) return toast('Проверь вес');
        update((s) => {
          s.weights = s.weights.filter((w) => w.date !== key);
          const entry = { date: key, kg: v };
          if (num(waist.value)) entry.waist = num(waist.value);
          s.weights.push(entry);
          s.weights.sort((a, b) => (a.date < b.date ? -1 : 1));
        });
        toast('Вес записан ✓');
        close();
      } }, 'Сохранить'),
    );
  });
}

export function openAddActivity(key = dateKey(), type = 'basketball') {
  sheet('Спорт и активность', (close) => {
    const state = getState();
    let cur = type;
    let intensity = 1;
    const minutes = numInput({ value: 60, class: 'big-input' });
    const preview = h('div', { class: 'preview' });
    const upd = () => {
      const kc = activityKcal(cur, intensity, num(minutes.value) || 0, currentWeight(state));
      preview.innerHTML = '';
      preview.append(h('b', null, `≈ ${fmt(kc)} ккал`), h('span', null, `к норме еды добавится ${fmt((kc * (state.profile.eatBack ?? 60)) / 100)} ккал`));
    };
    minutes.addEventListener('input', upd);
    const typeChips = h('div', { class: 'chips' });
    Object.entries(SPORTS).forEach(([id, s]) => {
      typeChips.append(h('button', { class: 'chip' + (id === cur ? ' on' : ''), onclick: (e) => {
        cur = id;
        typeChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
        e.currentTarget.classList.add('on');
        upd();
      } }, `${s.icon} ${s.name}`));
    });
    upd();
    return h(
      'div',
      null,
      typeChips,
      field('Минут (чистого времени)', minutes),
      h('div', { class: 'chips' }, [30, 45, 60, 90, 120].map((m) => h('button', { class: 'chip', onclick: () => {
        minutes.value = m;
        upd();
      } }, `${m} мин`))),
      h('div', { class: 'field' }, h('span', null, 'Интенсивность'), segmented(INTENSITY.map((l, i) => ({ value: i, label: l })), intensity, (v) => {
        intensity = v;
        upd();
      })),
      preview,
      h('button', { class: 'btn primary block', onclick: () => {
        const m = num(minutes.value);
        if (!m) return toast('Укажи минуты');
        const kc = activityKcal(cur, intensity, m, currentWeight(state));
        update((s) => {
          s.activities[key] = s.activities[key] || [];
          s.activities[key].push({ id: uid(), type: cur, minutes: m, intensity, kcal: kc });
        });
        toast(`${SPORTS[cur].icon} Записано: ${kc} ккал`);
        close();
      } }, 'Записать'),
    );
  });
}

export function removeActivity(key, id) {
  update((s) => (s.activities[key] = (s.activities[key] || []).filter((a) => a.id !== id)));
}

// ---------- Фото еды ----------

export function openPhotoFood(key = dateKey(), meal = defaultMeal(), closeParent) {
  if (!getApiKey()) return openApiKey(() => openPhotoFood(key, meal, closeParent));
  // input.click() должен вызываться прямо из нажатия, иначе iOS не откроет камеру
  const input = h('input', { type: 'file', accept: 'image/*' });
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (file) photoSheet(file, key, meal, closeParent);
  });
  input.click();
}

function photoSheet(file, key, meal, closeParent) {
  sheet('Фото еды', (close) => {
    let curMeal = meal;
    let image = null;
    let items = [];
    const preview = h('div', { class: 'photo-preview' }, h('span', { class: 'muted' }, 'Загружаю фото…'));
    const comment = h('input', { type: 'text', placeholder: 'Подсказка: «жарено на масле», «соус отдельно», «половина порции»' });
    const result = h('div');
    const go = h('button', { class: 'btn primary block', disabled: true, onclick: run }, '✨ Распознать');

    prepareImage(file)
      .then((img) => {
        image = img;
        preview.innerHTML = '';
        preview.append(h('img', { src: img.dataUrl, alt: 'Фото еды' }));
        go.disabled = false;
      })
      .catch((e) => {
        preview.innerHTML = '';
        preview.append(h('p', { class: 'over' }, e.message));
      });

    async function run() {
      go.disabled = true;
      go.textContent = 'Смотрю на тарелку… (10–30 сек)';
      result.innerHTML = '';
      result.append(h('div', { class: 'loader' }));
      try {
        const data = await analyzeFood(image.base64, comment.value.trim());
        items = data.items.map((i) => ({ ...i, grams: Math.round(i.grams), on: true }));
        renderResult(data);
        go.textContent = '🔄 Распознать заново';
      } catch (e) {
        result.innerHTML = '';
        result.append(h('p', { class: 'tip over-tip' }, '⚠️ ' + e.message));
        go.textContent = '✨ Попробовать ещё раз';
      }
      go.disabled = false;
    }

    function calc(i) {
      return portion({ name: i.name, kcal: i.kcal_per_100g, p: i.protein_per_100g, f: i.fat_per_100g, c: i.carbs_per_100g }, i.grams || 0);
    }

    function renderResult(data) {
      result.innerHTML = '';
      if (!items.length) {
        result.append(h('p', { class: 'tip' }, data.note || 'Еды на фото не нашлось.'));
        return;
      }
      const conf = { high: ['уверенно', 'ok'], medium: ['примерно', ''], low: ['очень примерно', 'over'] }[data.confidence] || ['', ''];
      const totalBox = h('div', { class: 'preview' });
      const addBtn = h('button', { class: 'btn primary block' });
      const updTotal = () => {
        const t = items.filter((i) => i.on).map(calc).reduce((a, p) => ({ kcal: a.kcal + p.kcal, p: a.p + p.p, f: a.f + p.f, c: a.c + p.c }), { kcal: 0, p: 0, f: 0, c: 0 });
        totalBox.innerHTML = '';
        totalBox.append(h('b', null, `${fmt(t.kcal)} ккал`), h('span', null, `Б ${fmt1(t.p)} · Ж ${fmt1(t.f)} · У ${fmt1(t.c)}`));
        const n = items.filter((i) => i.on).length;
        addBtn.textContent = n ? `Добавить в «${MEAL_NAMES[curMeal]}» (${n})` : 'Ничего не выбрано';
        addBtn.disabled = !n;
      };
      const rows = items.map((i) => {
        const kc = h('span', { class: 'kc' });
        const updRow = () => (kc.textContent = fmt(calc(i).kcal));
        const g = numInput({ value: i.grams, inputmode: 'numeric', class: 'grams-input', oninput: (e) => {
          i.grams = num(e.target.value) || 0;
          updRow();
          updTotal();
        } });
        const row = h('div', { class: 'photo-item' + (i.on ? '' : ' off') },
          h('button', { class: 'check small-check' + (i.on ? ' on' : ''), onclick: (e) => {
            i.on = !i.on;
            e.currentTarget.classList.toggle('on', i.on);
            row.classList.toggle('off', !i.on);
            updTotal();
          } }, '✓'),
          h('div', { class: 'row-main' }, h('b', null, i.name), h('small', null, `${fmt(i.kcal_per_100g)} ккал / 100 г`)),
          g,
          h('small', { class: 'muted' }, 'г'),
          kc,
        );
        updRow();
        return row;
      });
      updTotal();
      addBtn.onclick = () => {
        const chosen = items.filter((i) => i.on && i.grams > 0);
        addItems(key, curMeal, chosen.map((i) => ({ ...calc(i), base: { kcal: i.kcal_per_100g, p: i.protein_per_100g, f: i.fat_per_100g, c: i.carbs_per_100g }, photo: true })));
        const kcal = chosen.reduce((a, i) => a + calc(i).kcal, 0);
        toast(`📷 + ${fmt(kcal)} ккал · ${MEAL_NAMES[curMeal]}`);
        close();
        closeParent && closeParent();
      };
      result.append(
        h('div', { class: 'card-head', style: { marginTop: '18px' } }, h('h3', null, 'На тарелке'), h('small', { class: conf[1] }, conf[0])),
        h('p', { class: 'muted small' }, 'Поправь граммы, если знаешь точнее. Галочкой можно убрать лишнее.'),
        ...rows,
        totalBox,
        data.note ? h('p', { class: 'tip' }, '💬 ' + data.note) : '',
        h('div', { class: 'field' }, h('span', null, 'Приём пищи'), mealPicker(curMeal, (v) => {
          curMeal = v;
          updTotal();
        })),
        addBtn,
      );
    }

    return h('div', null, preview, field('Комментарий (необязательно)', comment), go, result);
  });
}

export function openApiKey(onSaved) {
  sheet('Ключ для фото-анализа', (close) => {
    const input = h('input', { type: 'text', placeholder: 'sk-ant-…', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, value: getApiKey() });
    return h('div', null,
      h('p', null, 'Фото распознаёт ИИ Claude. Для этого нужен твой личный ключ API — один раз.'),
      h('ol', { class: 'small' },
        h('li', null, 'Открой ', h('a', { href: 'https://console.anthropic.com/settings/keys', target: '_blank', rel: 'noopener' }, 'console.anthropic.com'), ' и войди (можно через Google).'),
        h('li', null, 'Billing → пополни баланс на $5 — хватит примерно на 150–250 фото.'),
        h('li', null, 'API Keys → Create Key → скопируй ключ и вставь сюда.'),
      ),
      field('Ключ API', input, 'Хранится только на этом телефоне и не попадает в резервную копию.'),
      h('button', { class: 'btn primary block', onclick: () => {
        const v = input.value.trim();
        if (!v.startsWith('sk-ant-')) return toast('Ключ должен начинаться с sk-ant-');
        setApiKey(v);
        toast('Ключ сохранён ✓');
        close();
        onSaved && onSaved();
      } }, 'Сохранить'),
      getApiKey() && h('button', { class: 'btn danger block', onclick: () => {
        setApiKey('');
        toast('Ключ удалён');
        close();
      } }, 'Удалить ключ'),
    );
  });
}
