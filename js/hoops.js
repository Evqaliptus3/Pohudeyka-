// Соло-тренировки баскетбола: одно кольцо и один мяч.
// kind: 'time' — упражнение на время (sec × sets), 'shots' — броски с подсчётом попаданий (att — попыток), 'reps' — просто сделать.

export const DRILLS = {
  // Дриблинг
  pound: { name: 'Силовой дриблинг на месте', kind: 'time', sec: 30, sets: 2, tip: 'Бей мяч сильно, выше колена не поднимай. По подходу каждой рукой. Смотри вперёд, не на мяч.' },
  crossover: { name: 'Кроссоверы на месте', kind: 'time', sec: 45, tip: 'Низкий и быстрый перевод перед собой, мяч ниже колен.' },
  between: { name: 'Между ног на месте', kind: 'time', sec: 45, tip: 'Ноги в выпаде, меняй ведущую ногу каждые 10 секунд.' },
  behind: { name: 'За спиной на месте', kind: 'time', sec: 30, tip: 'Толкай мяч кистью за спиной к противоположному бедру.' },
  spider: { name: 'Паук (spider dribble)', kind: 'time', sec: 30, tip: 'Мяч между стоп: правая спереди, левая спереди, правая сзади, левая сзади. Очень быстрые касания.' },
  figure8: { name: 'Восьмёрка вокруг ног', kind: 'time', sec: 30, tip: 'Без ударов о пол, мяч проводишь восьмёркой между ног. Разогревает пальцы.' },
  zigzag: { name: 'Зигзаг-дриблинг по площадке', kind: 'time', sec: 60, tip: 'Диагонали от боковой к боковой, на каждой смене направления — кроссовер или между ног.' },
  // Бросок
  formshot: { name: 'Бросок с одной руки у кольца', kind: 'shots', att: 20, tip: '1–2 метра от кольца, одна рука, локоть под мячом, кисть «в корзину». Ставим механику.' },
  mikan: { name: 'Майкан-дрилл', kind: 'shots', att: 20, tip: 'Под кольцом, лэй-ап поочерёдно справа правой и слева левой, мяч не опускается ниже плеч.' },
  spots: { name: 'Средний: 5 точек × 5 бросков', kind: 'shots', att: 25, tip: 'Угол, 45°, центр, 45°, угол на линии штрафной. Стопы к кольцу, одинаковая механика.' },
  three: { name: 'Трёхочковые: 5 точек × 5', kind: 'shots', att: 25, tip: 'Если не долетает — бросай на шаг ближе. Сила идёт от ног, не от рук.' },
  ft: { name: 'Штрафные', kind: 'shots', att: 20, tip: 'Одинаковый ритуал перед каждым: 2 удара мячом, вдох, бросок.' },
  ftTired: { name: 'Штрафные на усталости', kind: 'shots', att: 10, tip: 'Сразу после рывков, пульс высокий — как в игре в 4-й четверти.' },
  selfpass: { name: 'Ловля и бросок с подкруткой', kind: 'shots', att: 20, tip: 'Подкрути мяч себе вперёд с обратным вращением, поймай в стойке «тройная угроза» и сразу бросай.' },
  pullup: { name: 'Бросок после дриблинга (1–2 удара)', kind: 'shots', att: 20, tip: 'Удар — остановка в два шага или прыжком — бросок. Чередуй направления.' },
  // Проходы и завершение
  layups: { name: 'Лэй-апы справа и слева', kind: 'shots', att: 20, tip: 'Справа — правой, слева — левой. Отталкивайся дальней ногой, мяч в верхний угол квадрата.' },
  reverse: { name: 'Реверс-лэй-ап', kind: 'shots', att: 10, tip: 'Проход под кольцом, бросок с обратной стороны, мяч закрыт телом от защитника.' },
  euro: { name: 'Евростеп + лэй-ап', kind: 'shots', att: 10, tip: 'Шаг в одну сторону, второй — резко в другую. Мяч держи двумя руками у плеча.' },
  floater: { name: 'Флоутер', kind: 'shots', att: 10, tip: 'С 2–3 метров, высокая дуга одной рукой, над вытянутыми руками высокого защитника.' },
  // Атлетизм и кондиция
  slides: { name: 'Защитные перемещения по ширине трёхсекундной', kind: 'time', sec: 30, sets: 3, tip: 'Низкая стойка, ноги не скрещиваются, касайся линий рукой. Отдых 30 с между подходами.' },
  sprints: { name: 'Челнок: лицевая — штрафная — центр — лицевая', kind: 'time', sec: 45, sets: 2, tip: 'Касайся каждой линии рукой. Максимальный темп.' },
  shootRun: { name: 'Бросок — рывок к центру — бросок', kind: 'shots', att: 10, tip: 'Бросок со среднего, подбор, рывок с дриблингом до центра и обратно, следующий бросок. Без пауз.' },
  tipjumps: { name: 'Прыжки к щиту на время', kind: 'time', sec: 30, sets: 2, tip: 'Касайся щита или сетки как можно выше. Мягкое приземление, сразу следующий прыжок.' },
};

// Сессии ~40–60 минут. intensity — индекс INTENSITY для расчёта калорий.
export const SESSIONS = [
  {
    id: 'shooter',
    icon: '🎯',
    title: 'Снайпер',
    note: 'Механика и процент. Лёгкая нагрузка — подходит в день после силовой.',
    minutes: 45,
    intensity: 0,
    drills: ['figure8', 'formshot', 'mikan', 'spots', 'selfpass', 'three', 'ft'],
  },
  {
    id: 'handles',
    icon: '🏀',
    title: 'Дриблинг и проходы',
    note: 'Контроль мяча обеими руками и завершение у кольца.',
    minutes: 50,
    intensity: 1,
    drills: ['pound', 'crossover', 'between', 'behind', 'spider', 'zigzag', 'layups', 'euro', 'reverse', 'pullup', 'ft'],
  },
  {
    id: 'burn',
    icon: '🔥',
    title: 'Жиросжигание с мячом',
    note: '3 круга без отдыха внутри круга. Пульс высокий — лучшая тренировка для минус килограммов.',
    minutes: 40,
    intensity: 2,
    rounds: 3,
    drills: ['zigzag', 'shootRun', 'slides', 'layups', 'sprints', 'ftTired'],
  },
  {
    id: 'combo',
    icon: '⚡',
    title: 'Комбо: всё понемногу',
    note: 'Полноценная тренировка, когда нет игры на неделе.',
    minutes: 60,
    intensity: 1,
    drills: ['pound', 'crossover', 'formshot', 'layups', 'floater', 'spots', 'pullup', 'tipjumps', 'shootRun', 'ftTired', 'three'],
  },
];

// Раскрываем круги в плоский список шагов
export function sessionSteps(session) {
  const out = [];
  const rounds = session.rounds || 1;
  for (let r = 0; r < rounds; r++) {
    session.drills.forEach((id) => out.push({ id, round: rounds > 1 ? r + 1 : null }));
  }
  return out;
}

// Процент попаданий по упражнению за последние сессии
export function shootingStats(state, drillIds, last = 5) {
  const sessions = Object.keys(state.hoops || {})
    .sort()
    .flatMap((k) => state.hoops[k].filter((s) => s.finished).map((s) => ({ ...s, date: k })));
  const per = sessions
    .map((s) => {
      let made = 0;
      let att = 0;
      s.steps.forEach((st) => {
        if (drillIds.includes(st.id) && st.att) {
          made += st.made;
          att += st.att;
        }
      });
      return att ? { date: s.date, made, att, pct: Math.round((made / att) * 100) } : null;
    })
    .filter(Boolean);
  if (!per.length) return null;
  const recent = per.slice(-last);
  const sum = recent.reduce((a, x) => ({ made: a.made + x.made, att: a.att + x.att }), { made: 0, att: 0 });
  return {
    last: per[per.length - 1],
    avg: Math.round((sum.made / sum.att) * 100),
    best: Math.max(0, ...per.filter((x) => x.att >= 10).map((x) => x.pct)),
    series: recent.map((x) => x.pct),
  };
}
