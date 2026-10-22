import { getState, update, dateKey, parseKey, addDays } from '../store.js';
import { h, bar, fmt1, segmented } from '../ui.js';
import { weightStats } from '../calc.js';
import { openAddWeight } from '../actions.js';

let range = 90;

export function renderWeight(root, rerender) {
  const s = getState();
  const st = weightStats(s);
  const p = s.profile;
  const waists = s.weights.filter((w) => w.waist);

  root.append(
    h('header', { class: 'page-head' }, h('h1', null, 'Вес')),
    h('div', { class: 'card' },
      h('div', { class: 'weight-top' },
        h('div', null, h('small', null, 'Тренд'), h('b', { class: 'big' }, fmt1(st.cur) + ' кг')),
        h('button', { class: 'btn primary', onclick: () => openAddWeight() }, '⚖️ Записать'),
      ),
      chart(s, st, range),
      segmented([{ value: 30, label: '30 дн' }, { value: 90, label: '90 дн' }, { value: 3650, label: 'Всё' }], range, (v) => {
        range = v;
        rerender();
      }),
      h('p', { class: 'muted small' }, 'Точки — взвешивания, линия — сглаженный тренд, пунктир — цель.'),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Прогресс к цели'),
      h('div', { class: 'goal-line' }, h('span', null, `${fmt1(p.startWeight)} кг`), h('b', null, `${st.pct}%`), h('span', null, `${fmt1(p.goalWeight)} кг`)),
      bar(st.pct, 100, 'goal'),
      h('div', { class: 'stats-grid' },
        stat('Сброшено', `${st.lost > 0 ? '−' : ''}${fmt1(Math.abs(st.lost))} кг`),
        stat('Осталось', `${fmt1(Math.max(0, st.toGo))} кг`),
        stat('Темп', st.rate != null ? `${st.rate > 0 ? '−' : '+'}${fmt1(Math.abs(st.rate))} кг/нед` : 'нужна неделя данных'),
        stat('Прогноз', st.eta ? st.eta.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'),
        waists.length >= 1 && stat('Талия', `${fmt1(waists[waists.length - 1].waist)} см`),
        waists.length >= 2 && stat('Талия, изменение', `${fmt1(waists[waists.length - 1].waist - waists[0].waist)} см`),
      ),
      rateComment(st, p),
      milestones(p, st),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Записи'),
      [...s.weights].reverse().slice(0, 30).map((w, i, arr) => {
        const prev = arr[i + 1];
        const diff = prev ? w.kg - prev.kg : 0;
        return h('div', { class: 'row' },
          h('div', { class: 'row-main' }, h('b', null, `${fmt1(w.kg)} кг`, w.waist ? h('small', null, ` · талия ${fmt1(w.waist)} см`) : null), h('small', null, parseKey(w.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' }))),
          prev && h('span', { class: diff <= 0 ? 'ok' : 'over' }, `${diff > 0 ? '+' : ''}${fmt1(diff)}`),
          h('button', { class: 'icon-btn', onclick: () => confirm('Удалить запись?') && update((x) => (x.weights = x.weights.filter((y) => y.date !== w.date))) }, '✕'),
        );
      }),
    ),
  );
}

function stat(label, v) {
  return h('div', { class: 'stat' }, h('small', null, label), h('b', null, v));
}

function rateComment(st, p) {
  if (st.rate == null) return h('p', { class: 'tip' }, 'Взвешивайся каждое утро. Через неделю появится реальный темп и прогноз.');
  const want = p.pace ?? 0.6;
  let text;
  if (st.rate < 0.1) text = 'Вес стоит. Если силовые растут и талия уменьшается — это рекомпозиция, всё ок. Иначе проверь, всё ли записываешь (масло, соусы, напитки).';
  else if (st.rate < want * 0.7) text = 'Темп ниже плана. Нормально для первых недель или если растут мышцы. Можно убрать 100–150 ккал.';
  else if (st.rate > want * 1.4 && st.rate > 1) text = 'Слишком быстро — есть риск потерять мышцы. Добавь 150–200 ккал, лучше углеводов перед играми.';
  else text = 'Отличный темп, ровно по плану. Продолжай! 🔥';
  return h('p', { class: 'tip' }, text);
}

function milestones(p, st) {
  const total = p.startWeight - p.goalWeight;
  const steps = [];
  for (let i = 1; i <= Math.ceil(total / 2.5); i++) steps.push(Math.min(total, i * 2.5));
  return h('div', { class: 'milestones' }, steps.map((m) => h('div', { class: 'milestone' + (st.lost >= m ? ' on' : '') }, h('b', null, `−${fmt1(m)}`), h('small', null, `${fmt1(p.startWeight - m)}`))));
}

function chart(s, st, days) {
  const W = 340;
  const H = 180;
  const pad = { l: 34, r: 8, t: 10, b: 22 };
  const from = addDays(dateKey(), -days);
  const pts = st.series.filter((w) => w.date >= from);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'chart');
  if (pts.length < 2) {
    svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="var(--muted)" font-size="13">Нужно минимум 2 взвешивания</text>`;
    return svg;
  }
  const t0 = parseKey(pts[0].date).getTime();
  const t1 = Math.max(parseKey(pts[pts.length - 1].date).getTime(), t0 + 864e5 * 6);
  const vals = pts.flatMap((p) => [p.kg, p.trend]);
  const goal = s.profile.goalWeight;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (goal >= lo - 3) lo = Math.min(lo, goal);
  lo = Math.floor(lo - 0.5);
  hi = Math.ceil(hi + 0.5);
  const x = (d) => pad.l + ((parseKey(d).getTime() - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);

  let g = '';
  const stepY = Math.max(1, Math.round((hi - lo) / 4));
  for (let v = lo; v <= hi; v += stepY) {
    g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--track)" stroke-width="1"/>`;
    g += `<text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)">${v}</text>`;
  }
  if (goal >= lo && goal <= hi) g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(goal)}" y2="${y(goal)}" stroke="var(--good)" stroke-dasharray="4 4" stroke-width="1.5"/>`;
  [pts[0], pts[pts.length - 1]].forEach((p, i) => {
    g += `<text x="${x(p.date)}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}" font-size="10" fill="var(--muted)">${parseKey(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</text>`;
  });
  pts.forEach((p) => (g += `<circle cx="${x(p.date)}" cy="${y(p.kg)}" r="2.5" fill="var(--muted)" opacity=".6"/>`));
  g += `<polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pts.map((p) => `${x(p.date)},${y(p.trend)}`).join(' ')}"/>`;
  svg.innerHTML = g;
  return svg;
}
