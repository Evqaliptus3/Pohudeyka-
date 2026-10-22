// Онбординг: данные о себе, цель, спорт по дням недели
import { update, dateKey } from '../store.js';
import { h, numInput, num, segmented, field, toast } from '../ui.js';
import { LIFESTYLE, PACES, SPORTS } from '../calc.js';
import { EQUIPMENT, DAY_NAMES, WEEK_ORDER, autoStrengthDays } from '../workouts.js';

const GAME_SPORTS = ['basketball', 'football', 'padel', 'cycling'];

// Общая форма для онбординга и редактирования профиля
export function profileForm(initial, schedule, onSave, { submitLabel = 'Поехали 🚀', showSchedule = true } = {}) {
  const p = { sex: 'm', lifestyle: 'sit', pace: 0.6, equipment: 'gym', strengthDays: 3, eatBack: 60, ...initial };
  const sched = structuredClone(schedule || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] });

  const birthYear = numInput({ value: p.birthYear ?? '', placeholder: '1990', inputmode: 'numeric' });
  const height = numInput({ value: p.height ?? '', placeholder: '180', inputmode: 'numeric' });
  const weight = numInput({ value: p.startWeight ?? '', placeholder: '100' });
  const goal = numInput({ value: p.goalWeight ?? '', placeholder: 'на 15 кг меньше' });
  weight.addEventListener('change', () => {
    if (!goal.value && num(weight.value)) goal.value = Math.round(num(weight.value) - 15);
  });

  const paceNote = h('small', null, PACES.find((x) => x.kg === p.pace)?.note);

  const schedGrid = h('div', { class: 'sched' });
  const renderSched = () => {
    schedGrid.innerHTML = '';
    WEEK_ORDER.forEach((d) => {
      schedGrid.append(
        h('div', { class: 'sched-row' }, h('b', null, DAY_NAMES[d]), h('div', { class: 'chips' }, GAME_SPORTS.map((s) => h('button', { type: 'button', class: 'chip' + (sched[d].includes(s) ? ' on' : ''), onclick: () => {
          sched[d] = sched[d].includes(s) ? sched[d].filter((x) => x !== s) : [...sched[d], s];
          renderSched();
        } }, SPORTS[s].icon)))),
      );
    });
  };
  renderSched();

  return h(
    'form',
    { class: 'form', onsubmit: (e) => {
      e.preventDefault();
      const out = {
        ...p,
        birthYear: num(birthYear.value),
        height: num(height.value),
        startWeight: num(weight.value),
        goalWeight: num(goal.value),
      };
      if (!out.birthYear || out.birthYear < 1920 || out.birthYear > 2015) return toast('Укажи год рождения');
      if (!out.height || out.height < 120 || out.height > 230) return toast('Укажи рост в см');
      if (!out.startWeight || out.startWeight < 35) return toast('Укажи текущий вес');
      if (!out.goalWeight || out.goalWeight >= out.startWeight) return toast('Целевой вес должен быть меньше текущего');
      onSave(out, sched);
    } },
    h('div', { class: 'card' },
      h('h3', null, 'О тебе'),
      h('div', { class: 'field' }, h('span', null, 'Пол'), segmented([{ value: 'm', label: 'Мужской' }, { value: 'f', label: 'Женский' }], p.sex, (v) => (p.sex = v))),
      h('div', { class: 'grid2' }, field('Год рождения', birthYear), field('Рост, см', height)),
      h('div', { class: 'grid2' }, field('Вес сейчас, кг', weight), field('Цель, кг', goal)),
      h('div', { class: 'field' }, h('span', null, 'Жизнь вне спорта'), segmented(LIFESTYLE.map((l) => ({ value: l.id, label: l.name })), p.lifestyle, (v) => (p.lifestyle = v))),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Темп'),
      h('div', { class: 'field' }, segmented(PACES.map((x) => ({ value: x.kg, label: x.name })), p.pace, (v) => {
        p.pace = v;
        paceNote.textContent = PACES.find((x) => x.kg === v).note;
      }), paceNote),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Силовые'),
      h('div', { class: 'field' }, h('span', null, 'Где тренируешься'), segmented(EQUIPMENT.map((x) => ({ value: x.id, label: x.name })), p.equipment, (v) => (p.equipment = v))),
      h('div', { class: 'field' }, h('span', null, 'Силовых в неделю'), segmented([2, 3, 4].map((n) => ({ value: n, label: String(n) })), p.strengthDays, (v) => (p.strengthDays = v)), h('small', null, 'При 3–4 играх в неделю оптимально 2–3 силовые')),
    ),
    showSchedule && h('div', { class: 'card' },
      h('h3', null, 'Когда играешь'),
      h('p', { class: 'muted' }, '🏀 баскет · ⚽ футбол · 🎾 падел · 🚴 велик. Отметь обычную неделю — силовые расставлю в свободные дни.'),
      schedGrid,
    ),
    h('button', { class: 'btn primary block', type: 'submit' }, submitLabel),
  );
}

export function placeStrength(sched, n) {
  WEEK_ORDER.forEach((d) => (sched[d] = sched[d].filter((x) => x !== 'gym')));
  autoStrengthDays(sched, n).forEach((d) => sched[d].push('gym'));
  return sched;
}

export function renderOnboarding(root) {
  root.append(
    h('div', { class: 'onboard' },
      h('div', { class: 'hero' }, h('div', { class: 'hero-icon' }, '🔥'), h('h1', null, 'Похудейка'), h('p', null, 'Минус 15 кг, сильные мышцы и форма для баскета, футбола и падела. Всё хранится только на твоём телефоне.')),
      profileForm({}, null, (profile, sched) => {
        update((s) => {
          s.profile = { ...profile, startDate: dateKey() };
          s.weights = [{ date: dateKey(), kg: profile.startWeight }];
          s.schedule = placeStrength(sched, profile.strengthDays);
        });
        location.hash = '#today';
      }),
    ),
  );
}
