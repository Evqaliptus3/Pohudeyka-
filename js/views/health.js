// Экран связи с Apple Health: синхронизация, отправка и инструкция по настройке «Команд»
import { getState, update, dateKey } from '../store.js';
import { h, sheet, toast, fmt, mount } from '../ui.js';
import { parseHealthText, applyHealth, runShortcut, exportPayload, markExported, IMPORT_SHORTCUT, EXPORT_SHORTCUT } from '../health.js';

export function healthSummary(s, key = dateKey()) {
  const hd = s.health || {};
  return { steps: hd.steps?.[key], active: hd.active?.[key], lastSync: hd.lastSync };
}

function ago(ts) {
  if (!ts) return 'ещё не было';
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  if (min < 60 * 24) return `${Math.round(min / 60)} ч назад`;
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function openHealth() {
  sheet('❤️ Apple Health', (close) => {
    const statsBox = h('div');
    const renderStats = () => {
      const sum = healthSummary(getState());
      statsBox.innerHTML = '';
      mount(statsBox, 
        h('div', { class: 'stats-grid' },
          h('div', { class: 'stat' }, h('small', null, 'Шаги сегодня'), h('b', null, sum.steps != null ? fmt(sum.steps) : '—')),
          h('div', { class: 'stat' }, h('small', null, 'Активная энергия'), h('b', null, sum.active != null ? `${fmt(sum.active)} ккал` : '—')),
        ),
        h('p', { class: 'muted small' }, `Последняя синхронизация: ${ago(sum.lastSync)}`),
      );
    };
    renderStats();
    const result = h('div');
    const paste = h('textarea', { class: 'answer', rows: 4, placeholder: 'Если кнопка «Вставить» не сработала — вставь сюда вручную' });

    const doImport = (text) => {
      try {
        const data = parseHealthText(text);
        let added = 0;
        update((st) => (added = applyHealth(st, data)));
        renderStats();
        const nW = Object.keys(data.weights).length;
        const nS = Object.keys(data.steps).length;
        const nA = Object.keys(data.active).length;
        result.innerHTML = '';
        mount(result, h('p', { class: 'tip' }, `✓ Вес: ${nW} дн. (новых ${added}) · шаги: ${nS} дн. · активная энергия: ${nA} дн.`));
        toast('Данные из Health загружены ✓');
      } catch (e) {
        result.innerHTML = '';
        mount(result, h('p', { class: 'tip over-tip' }, '⚠️ ' + e.message));
      }
    };

    const send = () => {
      const st = getState();
      const { payload, totals } = exportPayload(st);
      if (!Object.keys(payload).length) return toast('Новых данных для Health нет');
      update((x) => markExported(x, dateKey(), totals));
      runShortcut(EXPORT_SHORTCUT, JSON.stringify(payload));
    };

    return h('div', null,
      statsBox,

      h('h3', { style: { marginTop: '14px' } }, 'Загрузить из Health'),
      h('p', { class: 'muted small' }, 'Вес (в том числе с умных весов), шаги и активная энергия с часов.'),
      h('button', { class: 'btn primary block', onclick: () => runShortcut(IMPORT_SHORTCUT) }, `1. Запустить «${IMPORT_SHORTCUT}»`),
      h('button', { class: 'btn primary block', onclick: async () => {
        try {
          doImport(await navigator.clipboard.readText());
        } catch {
          toast('Вставь данные вручную в поле ниже');
          paste.focus();
        }
      } }, '2. Вставить данные'),
      paste,
      h('button', { class: 'btn ghost block', onclick: () => doImport(paste.value) }, 'Разобрать вставленное'),
      result,

      h('h3', { style: { marginTop: '18px' } }, 'Отправить в Health'),
      h('p', { class: 'muted small' }, 'Калории и БЖУ за сегодня (только то, что ещё не отправлено) и вес, записанный в приложении.'),
      h('button', { class: 'btn ghost block', onclick: send }, `Запустить «${EXPORT_SHORTCUT}»`),

      h('h3', { style: { marginTop: '18px' } }, 'Настройка (один раз)'),
      guide(),
      h('button', { class: 'btn ghost block', onclick: close }, 'Закрыть'),
    );
  });
}

function guide() {
  return h('div', { class: 'guide' },
    h('details', null,
      h('summary', null, h('b', null, `Команда «${IMPORT_SHORTCUT}» (Health → приложение)`)),
      h('ol', null,
        h('li', null, 'Открой приложение «Команды» → «+» (новая команда). Назови её точно: ', h('code', null, IMPORT_SHORTCUT), '.'),
        h('li', null, 'Добавь действие «Найти образцы Здоровья» (Find Health Samples). Тип: ', h('b', null, 'Вес'), '. Добавь фильтр «Дата начала» → «за последние» → 30 дней.'),
        h('li', null, 'Добавь «Повторить с каждым» (Repeat with Each). Внутри — действие «Текст» и напиши в нём: ', h('code', null, 'W'), ', пробел, переменную «Объект повтора» → нажми на неё → «Дата начала», пробел, ещё раз «Объект повтора» → «Значение».'),
        h('li', null, 'Ещё раз «Найти образцы Здоровья»: тип ', h('b', null, 'Шаги'), ', за последние 7 дней, «Группировать по: День». Затем «Повторить с каждым» с текстом ', h('code', null, 'S [Дата начала] [Значение]'), '.'),
        h('li', null, 'То же для типа ', h('b', null, 'Активная энергия'), ' с текстом ', h('code', null, 'A [Дата начала] [Значение]'), '.'),
        h('li', null, 'В конце — «Текст», в который вставь три переменные «Результаты повтора» (каждую с новой строки), и «Скопировать в буфер обмена».'),
        h('li', null, 'Запусти команду один раз вручную и разреши доступ к Здоровью.'),
      ),
      h('p', { class: 'muted small' }, 'Формат даты не важен — приложение понимает и «2026-10-22», и «22 окт. 2026 г.». Если что-то не так, вставь результат в поле выше: я покажу, что не распозналось.'),
    ),
    h('details', null,
      h('summary', null, h('b', null, `Команда «${EXPORT_SHORTCUT}» (приложение → Health)`)),
      h('ol', null,
        h('li', null, 'Новая команда с именем ', h('code', null, EXPORT_SHORTCUT), '.'),
        h('li', null, 'Действие «Получить словарь из» → «Входные данные команды».'),
        h('li', null, 'Для каждого ключа: «Получить значение для ключа» (', h('code', null, 'kcal'), ', ', h('code', null, 'protein'), ', ', h('code', null, 'fat'), ', ', h('code', null, 'carbs'), ', ', h('code', null, 'weight'), ') и «Записать образец Здоровья» с этим значением: Потреблённая энергия, Белки, Жиры (всего), Углеводы, Вес.'),
        h('li', null, 'Перед каждым «Записать» можно добавить «Если значение имеет любое значение», чтобы пустые ключи пропускались.'),
      ),
    ),
    h('details', null,
      h('summary', null, h('b', null, 'Автоматически каждое утро')),
      h('p', { class: 'small' }, '«Команды» → «Автоматизация» → «+» → «Время суток» 09:00 → «Запускать сразу» → действие «Запустить команду» → ', h('code', null, IMPORT_SHORTCUT), '. Утром данные уже будут в буфере — открой приложение и нажми «Вставить данные».'),
    ),
  );
}
