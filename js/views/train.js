import { getState, update, dateKey, uid, addDays, parseKey } from '../store.js';
import { h, sheet, toast, fmt, numInput, num, beep, unlockAudio, mount } from '../ui.js';
import { SPORTS, INTENSITY, activityKcal, currentWeight } from '../calc.js';
import { EX, PROGRAMS, WARMUP, PREGAME, DAY_NAMES, WEEK_ORDER, nextProgramDay, suggestion, unitLabel, repRange, fmtKg, EQUIPMENT } from '../workouts.js';
import { openAddActivity, removeActivity } from '../actions.js';
import { placeStrength } from './onboarding.js';
import { renderHoopsCard } from './hoops.js';

export function renderTrain(root) {
  const s = getState();
  const key = dateKey();
  const todayW = (s.workouts[key] || [])[0];
  const next = nextProgramDay(s);
  const eq = EQUIPMENT.find((e) => e.id === (s.profile.equipment || 'gym'));

  mount(root, 
    h('header', { class: 'page-head' }, h('h1', null, 'Тренировки')),

    h('div', { class: 'card hero-card' },
      h('small', null, todayW?.finished ? 'Сегодня уже сделано ✓' : todayW ? 'Тренировка начата' : 'Следующая силовая'),
      h('h2', null, todayW ? PROGRAMS[s.profile.equipment || 'gym'].find((d) => d.id === todayW.day)?.title : next.title),
      h('p', { class: 'muted' }, `${eq.name} · ${(todayW ? todayW.exercises.length : next.ex.length)} упражнений · ≈ 50–60 мин`),
      !todayW?.finished && h('button', { class: 'btn primary block', onclick: () => startWorkout() }, todayW ? '▶ Продолжить' : '▶ Начать тренировку'),
      todayW?.finished && h('button', { class: 'btn ghost block', onclick: () => openWorkoutScreen(key) }, 'Посмотреть результат'),
    ),

    renderHoopsCard(),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, 'Неделя'), h('button', { class: 'link', onclick: () => {
        update((st) => placeStrength(st.schedule, st.profile.strengthDays || 3));
        toast('Силовые расставлены по свободным дням');
      } }, '⚙︎ Авто-силовые')),
      h('p', { class: 'muted' }, 'Нажми на день, чтобы поменять план.'),
      h('div', { class: 'week' }, WEEK_ORDER.map((d) => {
        const items = s.schedule[d] || [];
        const isToday = new Date().getDay() === d;
        return h('button', { class: 'week-row' + (isToday ? ' today' : ''), onclick: () => editDay(d) },
          h('b', null, DAY_NAMES[d]),
          h('div', { class: 'week-items' }, items.length ? items.map((it) => h('span', { class: 'pill ' + (it === 'gym' ? 'gym' : '') }, it === 'gym' ? '🏋️ Силовая' : `${SPORTS[it].icon} ${SPORTS[it].name}`)) : h('span', { class: 'muted' }, 'Отдых')),
        );
      })),
    ),

    h('div', { class: 'card' },
      h('h3', null, 'Программа'),
      h('p', { class: 'muted' }, 'Тренировки A → B → C по кругу. Двойная прогрессия: сначала добиваешь верх диапазона повторов во всех подходах, потом прибавляешь вес. Приложение подскажет.'),
      PROGRAMS[s.profile.equipment || 'gym'].map((day) => h('details', { class: 'program-day' },
        h('summary', null, day.title, day.id === next.id ? h('span', { class: 'pill gym' }, 'следующая') : null),
        h('ol', null, day.ex.map((id) => h('li', null, h('b', null, EX[id].name), h('small', null, ` ${EX[id].sets}×${repRange(EX[id])} ${unitLabel(EX[id])}${EX[id].side ? ' на сторону' : ''}`), h('div', { class: 'muted small' }, EX[id].tip)))),
      )),
    ),

    h('div', { class: 'card' },
      h('details', null, h('summary', null, h('b', null, '🔥 Разминка перед игрой (8 мин)')), h('ol', null, PREGAME.map((x) => h('li', null, x)))),
    ),

    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, 'История за 2 недели'), h('button', { class: 'link', onclick: () => openAddActivity(key) }, '＋ Активность')),
      history(s),
    ),
  );
}

function history(s) {
  const out = [];
  for (let i = 0; i < 14; i++) {
    const k = addDays(dateKey(), -i);
    const acts = s.activities[k] || [];
    const wos = (s.workouts[k] || []).filter((w) => w.finished);
    if (!acts.length && !wos.length) continue;
    const label = parseKey(k).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    out.push(h('div', { class: 'list-title' }, label));
    wos.forEach((w) => out.push(h('button', { class: 'row', onclick: () => openWorkoutScreen(k) },
      h('div', { class: 'row-main' }, h('b', null, '🏋️ Силовая ' + w.day), h('small', null, `Объём ${fmt(volume(w))} кг · ${w.exercises.reduce((t, e) => t + e.sets.filter((x) => x.done).length, 0)} подходов`)),
      h('span', { class: 'chev' }, '›'))));
    acts.filter((a) => !a.fromWorkout).forEach((a) => out.push(h('div', { class: 'row' },
      h('div', { class: 'row-main' }, h('b', null, `${SPORTS[a.type].icon} ${SPORTS[a.type].name}${a.hoops ? ' · соло' : ''}`), h('small', null, `${a.minutes} мин · ${INTENSITY[a.intensity].toLowerCase()} · ${fmt(a.kcal)} ккал`)),
      h('button', { class: 'icon-btn', onclick: () => confirm('Удалить запись?') && removeActivity(k, a.id) }, '✕'))));
  }
  return out.length ? out : h('p', { class: 'muted' }, 'Пока пусто. Записывай игры и силовые — тут появится история.');
}

function volume(w) {
  return w.exercises.reduce((t, e) => t + e.sets.filter((x) => x.done).reduce((a, x) => a + (x.kg || 0) * (x.reps || 0), 0), 0);
}

function editDay(d) {
  sheet(`${DAY_NAMES[d]} — план`, (close) => {
    const cur = [...(getState().schedule[d] || [])];
    const opts = ['gym', 'basketball', 'football', 'padel', 'cycling', 'running', 'swimming', 'walking'];
    const chips = h('div', { class: 'chips' });
    const render = () => {
      chips.innerHTML = '';
      opts.forEach((o) => mount(chips, h('button', { class: 'chip' + (cur.includes(o) ? ' on' : ''), onclick: () => {
        const i = cur.indexOf(o);
        i >= 0 ? cur.splice(i, 1) : cur.push(o);
        render();
      } }, o === 'gym' ? '🏋️ Силовая' : `${SPORTS[o].icon} ${SPORTS[o].name}`)));
    };
    render();
    return h('div', null, chips, h('button', { class: 'btn primary block', onclick: () => {
      update((s) => (s.schedule[d] = cur));
      close();
    } }, 'Сохранить'));
  });
}

// ---------- Режим тренировки ----------

export function startWorkout() {
  const key = dateKey();
  const s = getState();
  if (!(s.workouts[key] || []).length) {
    const day = nextProgramDay(s);
    update((st) => {
      st.workouts[key] = [{
        id: uid(),
        day: day.id,
        startedAt: Date.now(),
        finished: false,
        exercises: day.ex.map((id) => {
          const sug = suggestion(st, id, key);
          return { id, sets: Array.from({ length: EX[id].sets }, () => ({ kg: sug.kg, reps: sug.reps, done: false })) };
        }),
      }];
    });
  }
  openWorkoutScreen(key);
}

let restTimer = null;
let wakeLock = null;

export function openWorkoutScreen(key) {
  const s = getState();
  const w = s.workouts[key][0];
  const prog = PROGRAMS[s.profile.equipment || 'gym'];
  const title = prog.find((d) => d.id === w.day)?.title || 'Силовая ' + w.day;
  const readonly = w.finished;

  if (!readonly && 'wakeLock' in navigator) navigator.wakeLock.request('screen').then((l) => (wakeLock = l)).catch(() => {});

  const patch = (fn) => update((st) => fn(st.workouts[key][0]));

  const restBox = h('div', { class: 'rest hidden' });
  const startRest = (sec) => {
    clearInterval(restTimer);
    const end = Date.now() + sec * 1000;
    let extra = 0;
    restBox.classList.remove('hidden');
    const tick = () => {
      const left = Math.round((end + extra - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(restTimer);
        beep();
        restBox.innerHTML = '';
        mount(restBox, h('b', null, 'Поехали! 💪'));
        setTimeout(() => restBox.classList.add('hidden'), 2500);
        return;
      }
      restBox.innerHTML = '';
      mount(restBox, 
        h('span', null, 'Отдых'),
        h('b', null, `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`),
        h('button', { class: 'btn ghost small', onclick: () => (extra += 30000) }, '+30 с'),
        h('button', { class: 'btn ghost small', onclick: () => {
          clearInterval(restTimer);
          restBox.classList.add('hidden');
        } }, 'Пропустить'),
      );
    };
    tick();
    restTimer = setInterval(tick, 500);
  };

  const elapsed = h('span', { class: 'muted' });
  const clock = setInterval(() => {
    const end = w.finishedAt || Date.now();
    const m = Math.floor((end - w.startedAt) / 60000);
    elapsed.textContent = `${m} мин`;
  }, 1000);

  const exCard = (e, ei) => {
    const ex = EX[e.id];
    const sug = suggestion(getState(), e.id, key);
    const rows = h('div', { class: 'sets' });
    const renderRows = () => {
      rows.innerHTML = '';
      mount(rows, h('div', { class: 'set-row head' }, h('span', null, '#'), ex.w ? h('span', null, 'кг') : h('span', null, ''), h('span', null, unitLabel(ex)), h('span', null, '')));
      getState().workouts[key][0].exercises[ei].sets.forEach((st, si) => {
        const kg = ex.w ? numInput({ value: st.kg ?? '', placeholder: '—', disabled: readonly, onchange: (ev) => patch((wk) => (wk.exercises[ei].sets[si].kg = num(ev.target.value))) }) : h('span');
        const reps = numInput({ value: st.reps ?? '', inputmode: 'numeric', disabled: readonly, onchange: (ev) => patch((wk) => (wk.exercises[ei].sets[si].reps = num(ev.target.value))) });
        const btn = h('button', { class: 'check' + (st.done ? ' on' : ''), disabled: readonly, onclick: () => {
          unlockAudio();
          const was = getState().workouts[key][0].exercises[ei].sets[si].done;
          patch((wk) => {
            const x = wk.exercises[ei].sets[si];
            x.done = !was;
            if (ex.w) x.kg = num(kg.value);
            x.reps = num(reps.value);
          });
          btn.classList.toggle('on', !was);
          row.classList.toggle('done', !was);
          if (!was) startRest(ex.unit === 'sec' || !ex.w ? 60 : ex.reps[1] <= 8 ? 150 : 90);
        } }, '✓');
        const row = h('div', { class: 'set-row' + (st.done ? ' done' : '') }, h('span', null, si + 1), kg, reps, btn);
        mount(rows, row);
      });
    };
    renderRows();
    return h('div', { class: 'card ex-card' },
      h('div', { class: 'card-head' }, h('h3', null, `${ei + 1}. ${ex.name}`)),
      h('small', { class: 'muted' }, `${ex.sets}×${repRange(ex)} ${unitLabel(ex)}${ex.side ? ' на каждую сторону' : ''}`),
      !readonly && h('p', { class: 'tip' }, sug.text),
      h('details', null, h('summary', null, 'Техника'), h('p', null, ex.tip)),
      rows,
      !readonly && h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost small', onclick: () => {
          patch((wk) => {
            const sets = wk.exercises[ei].sets;
            const last = sets[sets.length - 1] || {};
            sets.push({ kg: last.kg ?? null, reps: last.reps ?? ex.reps[0], done: false });
          });
          renderRows();
        } }, '＋ подход'),
        h('button', { class: 'btn ghost small', onclick: () => {
          patch((wk) => wk.exercises[ei].sets.length > 1 && wk.exercises[ei].sets.pop());
          renderRows();
        } }, '− подход'),
      ),
    );
  };

  const closeScreen = () => {
    clearInterval(clock);
    clearInterval(restTimer);
    wakeLock?.release?.().catch(() => {});
    wakeLock = null;
    screen.remove();
  };

  const finish = () => {
    const wk = getState().workouts[key][0];
    const doneSets = wk.exercises.reduce((t, e) => t + e.sets.filter((x) => x.done).length, 0);
    if (!doneSets) return toast('Отметь хотя бы один подход ✓');
    if (!confirm('Завершить тренировку?')) return;
    const minutes = Math.max(20, Math.min(120, Math.round((Date.now() - wk.startedAt) / 60000)));
    update((st) => {
      const x = st.workouts[key][0];
      x.finished = true;
      x.finishedAt = Date.now();
      st.programPos = (st.programPos || 0) + 1;
      st.activities[key] = st.activities[key] || [];
      st.activities[key].push({ id: uid(), type: 'strength', minutes, intensity: 1, kcal: activityKcal('strength', 1, minutes, currentWeight(st)), fromWorkout: true });
    });
    closeScreen();
    toast(`Тренировка завершена! ${doneSets} подходов 💪`, 3000);
  };

  const screen = h('div', { class: 'screen' },
    h('div', { class: 'screen-head' },
      h('button', { class: 'icon-btn', onclick: closeScreen, 'aria-label': 'Свернуть' }, '‹'),
      h('div', null, h('b', null, title), h('br'), elapsed),
      !readonly ? h('button', { class: 'btn primary small', onclick: finish }, 'Готово') : h('span'),
    ),
    h('div', { class: 'screen-body' },
      !readonly && h('div', { class: 'card' }, h('details', null, h('summary', null, h('b', null, '🔥 Разминка 7–10 мин')), h('ol', null, WARMUP.map((x) => h('li', null, x))))),
      w.exercises.map(exCard),
      !readonly && h('button', { class: 'btn primary block', onclick: finish }, 'Завершить тренировку'),
      !readonly && h('button', { class: 'btn danger block', onclick: () => {
        if (!confirm('Отменить тренировку? Результаты не сохранятся.')) return;
        update((st) => delete st.workouts[key]);
        closeScreen();
      } }, 'Отменить'),
      h('div', { style: { height: '90px' } }),
    ),
    restBox,
  );
  document.body.append(screen);
}
