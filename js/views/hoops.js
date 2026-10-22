// Соло-тренировки баскетбола: карточка на вкладке «Спорт» и экран тренировки
import { getState, update, dateKey, uid } from '../store.js';
import { h, toast, fmt, beep, unlockAudio } from '../ui.js';
import { activityKcal, currentWeight } from '../calc.js';
import { DRILLS, SESSIONS, sessionSteps, shootingStats } from '../hoops.js';

const STAT_GROUPS = [
  { name: 'Штрафные', ids: ['ft', 'ftTired'] },
  { name: 'Средний', ids: ['spots', 'pullup', 'selfpass', 'shootRun'] },
  { name: 'Трёхочковые', ids: ['three'] },
  { name: 'У кольца', ids: ['layups', 'mikan', 'reverse', 'euro', 'floater', 'formshot'] },
];

export function renderHoopsCard() {
  const s = getState();
  const today = (s.hoops?.[dateKey()] || []).find((x) => !x.finished);
  const stats = STAT_GROUPS.map((g) => ({ ...g, st: shootingStats(s, g.ids) })).filter((g) => g.st);

  return h('div', { class: 'card' },
    h('h3', null, '🏀 Баскетбол: кольцо и мяч'),
    h('p', { class: 'muted' }, 'Соло-тренировки на любой площадке. Считай попадания — приложение покажет, как растёт процент.'),
    today && h('button', { class: 'btn primary block', onclick: () => openHoopsScreen(dateKey(), today.id) }, `▶ Продолжить: ${SESSIONS.find((x) => x.id === today.session)?.title}`),
    h('div', { class: 'hoops-list' }, SESSIONS.map((ses) => h('button', { class: 'hoops-item', onclick: () => startHoops(ses.id) },
      h('span', { class: 'plan-icon' }, ses.icon),
      h('div', { class: 'row-main' },
        h('b', null, ses.title),
        h('small', null, `${ses.minutes} мин · ${['легко', 'средне', 'тяжело'][ses.intensity]}${ses.rounds ? ` · ${ses.rounds} круга` : ''}`),
        h('small', { class: 'muted' }, ses.note),
      ),
      h('span', { class: 'chev' }, '›'),
    ))),
    stats.length > 0 && h('div', { class: 'list-title' }, 'Процент попаданий'),
    stats.length > 0 && h('div', { class: 'stats-grid' }, stats.map((g) => h('div', { class: 'stat' },
      h('small', null, g.name),
      h('b', null, `${g.st.last.pct}%`),
      h('small', null, `среднее ${g.st.avg}% · рекорд ${g.st.best}%`),
    ))),
  );
}

export function startHoops(sessionId) {
  const key = dateKey();
  const s = getState();
  const open = (s.hoops?.[key] || []).find((x) => !x.finished && x.session === sessionId);
  if (open) return openHoopsScreen(key, open.id);
  const ses = SESSIONS.find((x) => x.id === sessionId);
  const id = uid();
  update((st) => {
    st.hoops = st.hoops || {};
    st.hoops[key] = st.hoops[key] || [];
    st.hoops[key].push({
      id,
      session: sessionId,
      startedAt: Date.now(),
      finished: false,
      steps: sessionSteps(ses).map((x) => ({ ...x, made: 0, att: 0, sets: 0, done: false })),
    });
  });
  openHoopsScreen(key, id);
}

let timer = null;
let wakeLock = null;

export function openHoopsScreen(key, id) {
  const find = (st) => st.hoops[key].find((x) => x.id === id);
  const run = find(getState());
  const ses = SESSIONS.find((x) => x.id === run.session);
  const patch = (fn) => update((st) => fn(find(st)));

  if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then((l) => (wakeLock = l)).catch(() => {});

  const progress = h('span', { class: 'muted' });
  const updProgress = () => {
    const r = find(getState());
    const done = r.steps.filter((x) => x.done).length;
    const m = Math.floor((Date.now() - r.startedAt) / 60000);
    progress.textContent = `${done}/${r.steps.length} · ${m} мин`;
  };
  const clock = setInterval(updProgress, 1000);
  updProgress();

  const stepCard = (step, si) => {
    const d = DRILLS[step.id];
    const card = h('div', { class: 'card ex-card' + (step.done ? ' done-card' : '') });
    const body = h('div');
    const setDone = (v) => {
      patch((r) => (r.steps[si].done = v));
      card.classList.toggle('done-card', v);
      updProgress();
    };

    const renderShots = () => {
      const st = find(getState()).steps[si];
      const pct = st.att ? Math.round((st.made / st.att) * 100) : 0;
      body.innerHTML = '';
      body.append(
        h('div', { class: 'shot-count' },
          h('b', null, `${st.made}/${st.att}`),
          h('span', null, st.att ? `${pct}%` : `цель: ${d.att} бросков`),
        ),
        h('div', { class: 'bar' }, h('div', { style: { width: Math.min(100, (st.att / d.att) * 100) + '%' } })),
        h('div', { class: 'shot-btns' },
          h('button', { class: 'btn make', onclick: () => shot(true) }, '✓ Попал'),
          h('button', { class: 'btn miss', onclick: () => shot(false) }, '✗ Мимо'),
          h('button', { class: 'icon-btn', 'aria-label': 'Отменить', onclick: undo }, '↺'),
        ),
      );
    };
    const history = [];
    const shot = (made) => {
      history.push(made);
      patch((r) => {
        const x = r.steps[si];
        x.att++;
        if (made) x.made++;
        if (x.att >= d.att && !x.done) {
          x.done = true;
          card.classList.add('done-card');
        }
      });
      updProgress();
      renderShots();
    };
    const undo = () => {
      if (!history.length) return;
      const made = history.pop();
      patch((r) => {
        const x = r.steps[si];
        x.att = Math.max(0, x.att - 1);
        if (made) x.made = Math.max(0, x.made - 1);
      });
      renderShots();
    };

    const renderTime = () => {
      const st = find(getState()).steps[si];
      const sets = d.sets || 1;
      body.innerHTML = '';
      const display = h('b', { class: 'time-left' }, `0:${String(d.sec).padStart(2, '0')}`);
      const startBtn = h('button', { class: 'btn primary', onclick: () => {
        unlockAudio();
        clearInterval(timer);
        const end = Date.now() + d.sec * 1000;
        startBtn.disabled = true;
        const tick = () => {
          const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
          display.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
          if (left <= 0) {
            clearInterval(timer);
            beep();
            patch((r) => {
              const x = r.steps[si];
              x.sets = Math.min(sets, x.sets + 1);
              if (x.sets >= sets) x.done = true;
            });
            if (find(getState()).steps[si].done) card.classList.add('done-card');
            updProgress();
            renderTime();
          }
        };
        tick();
        timer = setInterval(tick, 250);
      } }, st.sets >= sets ? '↻ Ещё раз' : '▶ Старт');
      body.append(
        h('div', { class: 'time-row' }, display, h('span', { class: 'muted' }, `подход ${Math.min(st.sets + 1, sets)} из ${sets}`), startBtn),
        !st.done && h('button', { class: 'link', onclick: () => {
          setDone(true);
          renderTime();
        } }, 'Отметить выполненным'),
      );
    };

    if (d.kind === 'shots') renderShots();
    else renderTime();

    card.append(
      h('div', { class: 'card-head' }, h('h3', null, `${si + 1}. ${d.name}`), step.round && h('span', { class: 'pill gym' }, `круг ${step.round}`)),
      h('small', { class: 'muted' }, d.kind === 'shots' ? `${d.att} бросков` : `${d.sec} с${d.sets ? ` × ${d.sets}` : ''}`),
      h('details', null, h('summary', null, 'Как делать'), h('p', null, d.tip)),
      body,
    );
    return card;
  };

  const closeScreen = () => {
    clearInterval(clock);
    clearInterval(timer);
    wakeLock?.release?.().catch(() => {});
    wakeLock = null;
    screen.remove();
  };

  const finish = () => {
    const r = find(getState());
    if (!r.steps.some((x) => x.done || x.att)) return toast('Сделай хоть одно упражнение 🙂');
    if (!confirm('Завершить тренировку?')) return;
    const minutes = Math.max(10, Math.min(150, Math.round((Date.now() - r.startedAt) / 60000)));
    const made = r.steps.reduce((a, x) => a + x.made, 0);
    const att = r.steps.reduce((a, x) => a + x.att, 0);
    update((st) => {
      const x = find(st);
      x.finished = true;
      x.finishedAt = Date.now();
      st.activities[key] = st.activities[key] || [];
      st.activities[key].push({ id: uid(), type: 'basketball', minutes, intensity: ses.intensity, kcal: activityKcal('basketball', ses.intensity, minutes, currentWeight(st)), hoops: true });
    });
    closeScreen();
    toast(att ? `🏀 Готово! ${made}/${att} (${Math.round((made / att) * 100)}%)` : '🏀 Тренировка записана!', 3500);
  };

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'screen-head' },
      h('button', { class: 'icon-btn', onclick: closeScreen, 'aria-label': 'Свернуть' }, '‹'),
      h('div', null, h('b', null, `${ses.icon} ${ses.title}`), h('br'), progress),
      h('button', { class: 'btn primary small', onclick: finish }, 'Готово'),
    ),
    h('div', { class: 'screen-body' },
      h('div', { class: 'card' }, h('details', null, h('summary', null, h('b', null, '🔥 Разминка 5 мин')), h('ol', null,
        h('li', null, 'Лёгкий бег вокруг площадки с дриблингом — 2 мин'),
        h('li', null, 'Махи ногами, выпады с поворотом — по 8'),
        h('li', null, 'Броски с метра одной рукой — 10'),
      ))),
      h('p', { class: 'tip' }, ses.note),
      ...find(getState()).steps.map(stepCard),
      h('button', { class: 'btn primary block', onclick: finish }, 'Завершить тренировку'),
      h('button', { class: 'btn danger block', onclick: () => {
        if (!confirm('Отменить тренировку? Результаты не сохранятся.')) return;
        update((st) => (st.hoops[key] = st.hoops[key].filter((x) => x.id !== id)));
        closeScreen();
      } }, 'Отменить'),
      h('div', { style: { height: '40px' } }),
    ),
  );
  document.body.append(screen);
}
