// Силовые программы под игровые виды спорта: ноги, корпус, спина, плечи.
// Упор на силу и профилактику травм колен, голеностопа и плеч.

// unit: 'reps' — повторы, 'sec' — секунды. w: работаем с весом.
export const EX = {
  // Зал
  squat: { name: 'Присед со штангой', sets: 4, reps: [6, 8], w: true, step: 2.5, tip: 'Колени по линии носков, спина нейтральная, глубина до параллели и ниже.' },
  bench: { name: 'Жим штанги лёжа', sets: 4, reps: [6, 8], w: true, step: 2.5, tip: 'Лопатки сведены, штанга к низу груди, ноги упираются в пол.' },
  row: { name: 'Тяга штанги в наклоне', sets: 3, reps: [8, 10], w: true, step: 2.5, tip: 'Корпус под 45°, тяни к поясу, локти вдоль корпуса.' },
  bulgarian: { name: 'Болгарские выпады с гантелями', sets: 3, reps: [8, 10], w: true, step: 2, side: true, tip: 'Задняя нога на скамье. Лучшее упражнение для коленей и ускорений.' },
  calf: { name: 'Подъём на носки стоя', sets: 3, reps: [12, 15], w: true, step: 5, tip: 'Пауза наверху и внизу. Защищает ахилл и голеностоп.' },
  rdl: { name: 'Румынская тяга', sets: 4, reps: [8, 10], w: true, step: 2.5, tip: 'Таз назад, спина прямая, гриф скользит по ногам. Задняя поверхность бедра — защита от травм.' },
  ohp: { name: 'Жим гантелей сидя над головой', sets: 3, reps: [8, 10], w: true, step: 2, tip: 'Не прогибай поясницу, пресс напряжён.' },
  pulldown: { name: 'Подтягивания или тяга верхнего блока', sets: 4, reps: [6, 10], w: true, step: 2.5, tip: 'Тяни локти вниз к рёбрам, без раскачки.' },
  stepup: { name: 'Зашагивания на тумбу с гантелями', sets: 3, reps: [8, 10], w: true, step: 2, side: true, tip: 'Толкайся ногой на тумбе, а не задней.' },
  dips: { name: 'Отжимания на брусьях', sets: 3, reps: [8, 12], w: true, step: 2.5, tip: 'Небольшой наклон вперёд, опускайся до 90° в локте.' },
  legpress: { name: 'Жим ногами', sets: 3, reps: [10, 12], w: true, step: 5, tip: 'Поясница прижата, колени не схлопываются внутрь.' },
  inclinedb: { name: 'Жим гантелей на наклонной скамье', sets: 3, reps: [8, 10], w: true, step: 2, tip: 'Угол 30°, гантели опускай до уровня груди.' },
  dbrow: { name: 'Тяга гантели одной рукой', sets: 3, reps: [10, 12], w: true, step: 2, side: true, tip: 'Опора на скамью, тяни к бедру.' },
  hipthrust: { name: 'Ягодичный мост со штангой', sets: 3, reps: [8, 12], w: true, step: 5, tip: 'Подбородок к груди, пауза наверху. Сила для рывков и прыжков.' },
  facepull: { name: 'Тяга каната к лицу', sets: 3, reps: [12, 15], w: true, step: 2.5, tip: 'Здоровые плечи для падела и бросков.' },
  // Без зала и с гантелями
  goblet: { name: 'Гоблет-присед с гантелью', sets: 4, reps: [10, 12], w: true, step: 2, tip: 'Гантель у груди, локти между коленями внизу.' },
  pushup: { name: 'Отжимания', sets: 4, reps: [8, 15], tip: 'Тело — прямая линия. Легко: ноги на возвышение. Тяжело: с паузой внизу.' },
  dbbench: { name: 'Жим гантелей лёжа (на полу или скамье)', sets: 3, reps: [10, 12], w: true, step: 2, tip: 'Локти под 45° к корпусу.' },
  dbrdl: { name: 'Румынская тяга с гантелями', sets: 3, reps: [10, 12], w: true, step: 2, tip: 'Таз назад, гантели вдоль ног.' },
  dbohp: { name: 'Жим гантелей стоя', sets: 3, reps: [8, 12], w: true, step: 2, tip: 'Ягодицы и пресс напряжены.' },
  dbreverse: { name: 'Выпады назад с гантелями', sets: 3, reps: [10, 12], w: true, step: 2, side: true, tip: 'Шаг назад, колено почти касается пола.' },
  pullup: { name: 'Подтягивания на турнике', sets: 4, reps: [3, 10], tip: 'Не получается — делай негативные: запрыгнул и медленно опускаешься 5 секунд.' },
  aussie: { name: 'Австралийские подтягивания', sets: 3, reps: [8, 15], tip: 'Низкая перекладина, тело прямое, грудью к перекладине.' },
  bwsquat: { name: 'Приседания', sets: 4, reps: [15, 25], tip: 'Стало легко — переходи на присед с выпрыгиванием или с паузой внизу.' },
  splitsq: { name: 'Сплит-присед (болгарский) на скамейке', sets: 3, reps: [8, 15], side: true, tip: 'Задняя нога на лавке. Самое сильное упражнение на ноги без веса.' },
  sllunge: { name: 'Выпады в ходьбе', sets: 3, reps: [10, 16], side: true, tip: 'Корпус прямой, широкий шаг.' },
  slcalf: { name: 'Подъём на носок на одной ноге', sets: 3, reps: [12, 20], side: true, tip: 'На ступеньке, с полной амплитудой.' },
  pikepush: { name: 'Отжимания «пайк» (на плечи)', sets: 3, reps: [6, 12], tip: 'Таз высоко, голова опускается между рук.' },
  glutebridge: { name: 'Ягодичный мост на одной ноге', sets: 3, reps: [10, 15], side: true, tip: 'Пауза 2 с наверху.' },
  barsdips: { name: 'Отжимания на брусьях (площадка)', sets: 3, reps: [6, 12], tip: 'Нет брусьев — обратные отжимания от лавки.' },
  // Корпус и профилактика
  plank: { name: 'Планка', sets: 3, reps: [40, 60], unit: 'sec', tip: 'Ягодицы и пресс напряжены, не провисай.' },
  sideplank: { name: 'Боковая планка', sets: 2, reps: [30, 45], unit: 'sec', side: true, tip: 'Защищает колени при смене направления.' },
  deadbug: { name: 'Мёртвый жук', sets: 3, reps: [8, 12], side: true, tip: 'Поясница прижата к полу всё время.' },
  copenhagen: { name: 'Копенгагенская планка', sets: 2, reps: [15, 30], unit: 'sec', side: true, tip: 'Профилактика паха — must have для футбола.' },
  nordic: { name: 'Нордические сгибания', sets: 3, reps: [3, 6], tip: 'Партнёр держит пятки, медленно опускайся вперёд. Снижает риск травм задней поверхности бедра в разы.' },
  hanging: { name: 'Подъём коленей в висе', sets: 3, reps: [8, 15], tip: 'Без раскачки, таз подкручивай вверх.' },
  // Взрывная сила
  boxjump: { name: 'Прыжки на тумбу', sets: 3, reps: [5, 5], tip: 'Мягко приземляйся, спрыгивай шагом. Делай в начале тренировки, пока свежий.' },
  broadjump: { name: 'Прыжки в длину с места', sets: 3, reps: [5, 5], tip: 'Мах руками, мягкое приземление на обе ноги.' },
  lateralbound: { name: 'Боковые прыжки с ноги на ногу', sets: 3, reps: [6, 8], side: true, tip: 'Приземлись и удержи 1 секунду. Стабильность колена для баскета и падела.' },
};

export const EQUIPMENT = [
  { id: 'gym', name: 'Зал', note: 'Штанга, гантели, тренажёры' },
  { id: 'home', name: 'Дома с гантелями', note: 'Разборные гантели, скамья по желанию' },
  { id: 'none', name: 'Площадка / без веса', note: 'Турник, брусья, лавка' },
];

export const PROGRAMS = {
  gym: [
    { id: 'A', title: 'A · Ноги и жим', ex: ['boxjump', 'squat', 'bench', 'row', 'bulgarian', 'calf', 'plank'] },
    { id: 'B', title: 'B · Задняя цепь и спина', ex: ['rdl', 'pulldown', 'ohp', 'stepup', 'dips', 'nordic', 'deadbug'] },
    { id: 'C', title: 'C · Атлетизм', ex: ['lateralbound', 'legpress', 'inclinedb', 'dbrow', 'hipthrust', 'facepull', 'copenhagen'] },
  ],
  home: [
    { id: 'A', title: 'A · Ноги и жим', ex: ['broadjump', 'goblet', 'dbbench', 'dbrow', 'dbreverse', 'slcalf', 'plank'] },
    { id: 'B', title: 'B · Задняя цепь и плечи', ex: ['dbrdl', 'pushup', 'dbohp', 'splitsq', 'glutebridge', 'deadbug', 'sideplank'] },
    { id: 'C', title: 'C · Атлетизм', ex: ['lateralbound', 'goblet', 'dbrow', 'pikepush', 'dbreverse', 'copenhagen', 'plank'] },
  ],
  none: [
    { id: 'A', title: 'A · Ноги и жим', ex: ['broadjump', 'bwsquat', 'pushup', 'aussie', 'splitsq', 'slcalf', 'plank'] },
    { id: 'B', title: 'B · Турник и задняя цепь', ex: ['pullup', 'sllunge', 'barsdips', 'glutebridge', 'hanging', 'nordic', 'sideplank'] },
    { id: 'C', title: 'C · Атлетизм', ex: ['lateralbound', 'splitsq', 'pikepush', 'aussie', 'glutebridge', 'copenhagen', 'deadbug'] },
  ],
};

export const WARMUP = [
  'Лёгкий бег или скакалка — 3 мин',
  'Круги тазом и махи ногами вперёд и в стороны — по 10',
  'Выпады с поворотом корпуса — 6 на ногу',
  'Голеностоп: подъёмы на носки и перекаты — 15',
  'Отжимания с вращением (T-push-up) — 6',
  'Первое упражнение: 2 разминочных подхода с лёгким весом',
];

// Короткая профилактика перед игрой (8 минут)
export const PREGAME = [
  'Бег с захлёстом и высоким подниманием бедра — 2×20 м',
  'Боковые приставные шаги в мини-приседе — 2×10 м',
  'Выпады с поворотом — 6 на ногу',
  'Прыжки на месте с мягким приземлением — 10',
  'Ускорения на 70–80% — 3×15 м',
  'Смена направления (змейка) — 2 повтора',
];

export const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function nextProgramDay(state) {
  const days = PROGRAMS[state.profile.equipment || 'gym'];
  return days[(state.programPos || 0) % days.length];
}

// Последний результат по упражнению: для подсказки прогрессии
export function lastResult(state, exId, beforeKey) {
  const keys = Object.keys(state.workouts)
    .filter((k) => !beforeKey || k < beforeKey)
    .sort()
    .reverse();
  for (const k of keys) {
    for (const w of state.workouts[k]) {
      if (!w.finished) continue;
      const e = w.exercises.find((x) => x.id === exId);
      if (e && e.sets.some((s) => s.done)) return { date: k, sets: e.sets.filter((s) => s.done) };
    }
  }
  return null;
}

// Двойная прогрессия: сначала добиваем верх диапазона повторов, потом прибавляем вес
export function suggestion(state, exId, beforeKey) {
  const ex = EX[exId];
  const last = lastResult(state, exId, beforeKey);
  if (!last) {
    return { kg: null, reps: ex.reps[0], text: ex.w ? 'Первый раз: подбери вес, с которым остаётся 2 повтора в запасе.' : `Цель: ${repRange(ex)} ${unitLabel(ex)}` };
  }
  const maxKg = Math.max(...last.sets.map((s) => s.kg || 0));
  const allTop = last.sets.length >= ex.sets && last.sets.every((s) => s.reps >= ex.reps[1]);
  if (ex.w && maxKg > 0) {
    if (allTop) return { kg: maxKg + ex.step, reps: ex.reps[0], text: `Все подходы на максимум 💪 Прибавь вес: ${fmtKg(maxKg + ex.step)} кг.` };
    return { kg: maxKg, reps: ex.reps[1], text: `Прошлый раз: ${fmtSets(last.sets, ex)}. Тот же вес, добавь повтор.` };
  }
  if (allTop) return { kg: null, reps: ex.reps[1], text: `Верх диапазона взят. Усложни вариант или добавь медленный негатив (3 с).` };
  const best = Math.max(...last.sets.map((s) => s.reps));
  return { kg: null, reps: Math.min(ex.reps[1], best + 1), text: `Прошлый раз: ${fmtSets(last.sets, ex)}. Цель: +1 ${unitLabel(ex)}.` };
}

export function repRange(ex) {
  return ex.reps[0] === ex.reps[1] ? `${ex.reps[0]}` : `${ex.reps[0]}–${ex.reps[1]}`;
}

export function unitLabel(ex) {
  return ex.unit === 'sec' ? 'сек' : 'повт.';
}

export const fmtKg = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');

function fmtSets(sets, ex) {
  return sets.map((s) => (s.kg ? `${fmtKg(s.kg)}×${s.reps}` : `${s.reps}${ex.unit === 'sec' ? 'с' : ''}`)).join(', ');
}

// Расстановка силовых на неделе: дни без игр, не подряд, не накануне игры
export function autoStrengthDays(schedule, n) {
  const days = WEEK_ORDER;
  const sports = (d) => (schedule[d] || []).filter((s) => s !== 'gym');
  let best = null;
  const combos = (start, picked) => {
    if (picked.length === n) {
      let cost = 0;
      picked.forEach((d) => {
        cost += sports(d).length * 3;
        const next = (d + 1) % 7;
        if (sports(next).some((s) => s !== 'cycling')) cost += 1.5;
        if (picked.includes(next)) cost += 4;
      });
      if (!best || cost < best.cost) best = { cost, picked: [...picked] };
      return;
    }
    for (let i = start; i < days.length; i++) combos(i + 1, [...picked, days[i]]);
  };
  combos(0, []);
  return best ? best.picked : [];
}
