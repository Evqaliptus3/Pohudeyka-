import { getState, update, exportJSON, importJSON, resetAll, dateKey } from '../store.js';
import { h, sheet, toast, segmented, fmt } from '../ui.js';
import { targets, bmr, currentWeight, age } from '../calc.js';
import { ACHIEVEMENTS } from '../motivation.js';
import { profileForm, placeStrength } from './onboarding.js';
import { openApiKey } from '../actions.js';
import { getApiKey } from '../photo.js';

export function renderProfile(root) {
  const s = getState();
  const p = s.profile;
  const t = targets(s);
  const got = ACHIEVEMENTS.filter((a) => s.unlocked[a.id]).length;
  const hM = p.height / 100;
  const bmi = currentWeight(s) / (hM * hM);

  root.append(
    h('header', { class: 'page-head' }, h('h1', null, 'Профиль')),
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h3', null, `🏆 Достижения ${got}/${ACHIEVEMENTS.length}`)),
      h('div', { class: 'ach-grid' }, ACHIEVEMENTS.map((a) => h('div', { class: 'ach' + (s.unlocked[a.id] ? ' on' : ''), title: a.desc },
        h('span', null, a.icon), h('b', null, a.name), h('small', null, a.desc)))),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Мои данные'),
      h('div', { class: 'stats-grid' },
        stat('Возраст', `${age(p)}`),
        stat('Рост', `${p.height} см`),
        stat('ИМТ', bmi.toFixed(1).replace('.', ',')),
        stat('Базовый обмен', `${fmt(bmr(p, currentWeight(s)))} ккал`),
        stat('Норма в день отдыха', `${fmt(t.kcal - t.eatBack)} ккал`),
        stat('Белок', `${t.protein} г`),
      ),
      h('button', { class: 'btn ghost block', onclick: editProfile }, '✏️ Изменить данные и цель'),
    ),
    h('div', { class: 'card' },
      h('h3', null, 'Калории со спорта'),
      h('p', { class: 'muted' }, 'Какую часть сожжённого на играх добавлять к норме еды. Формулы и часы обычно завышают расход, поэтому 50–70% — безопасно.'),
      segmented([0, 50, 60, 75, 100].map((v) => ({ value: v, label: v + '%' })), p.eatBack ?? 60, (v) => update((x) => (x.profile.eatBack = v))),
    ),
    h('div', { class: 'card' },
      h('h3', null, '📷 Распознавание еды по фото'),
      h('p', { class: 'muted' }, getApiKey() ? 'Ключ подключён ✓ Фото анализирует Claude, одно фото стоит примерно 2–3 цента.' : 'Работает и без ключа: через приложение Claude по подписке (кнопка 📷 → «Через Claude»). С ключом API результат приходит прямо в приложение.'),
      h('button', { class: 'btn ghost block', onclick: () => openApiKey(() => location.reload()) }, getApiKey() ? 'Изменить ключ' : 'Подключить ключ API'),
    ),
    h('div', { class: 'card' },
      h('h3', null, '📲 Установка на iPhone'),
      h('ol', { class: 'small' },
        h('li', null, 'Открой это приложение в Safari'),
        h('li', null, 'Нажми «Поделиться» (квадрат со стрелкой)'),
        h('li', null, 'Выбери «На экран Домой» → «Добавить»'),
        h('li', null, 'Запускай с иконки — работает на весь экран и без интернета'),
      ),
    ),
    h('div', { class: 'card' },
      h('h3', null, '💾 Резервная копия'),
      h('p', { class: 'muted' }, 'Данные хранятся только на этом телефоне. Раз в неделю-две сохраняй копию в «Файлы» или iCloud Drive.'),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn ghost', onclick: doExport }, '⬇️ Сохранить копию'),
        h('button', { class: 'btn ghost', onclick: doImport }, '⬆️ Восстановить'),
      ),
    ),
    h('button', { class: 'btn danger block', onclick: () => {
      if (!confirm('Удалить ВСЕ данные? Это необратимо.')) return;
      if (!confirm('Точно? Сначала лучше сохранить копию.')) return;
      resetAll();
      location.hash = '';
      location.reload();
    } }, 'Сбросить все данные'),
    h('p', { class: 'muted center small' }, 'Похудейка · данные не покидают устройство'),
  );
}

function stat(label, v) {
  return h('div', { class: 'stat' }, h('small', null, label), h('b', null, v));
}

function editProfile() {
  const s = getState();
  sheet('Мои данные', (close) =>
    profileForm(s.profile, s.schedule, (profile, sched) => {
      update((x) => {
        const strengthChanged = x.profile.strengthDays !== profile.strengthDays;
        x.profile = { ...x.profile, ...profile };
        if (strengthChanged) placeStrength(x.schedule, profile.strengthDays);
      });
      toast('Сохранено');
      close();
    }, { submitLabel: 'Сохранить', showSchedule: false }),
  );
}

async function doExport() {
  const text = exportJSON();
  const name = `pohudeyka-${dateKey()}.json`;
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = h('a', { href: URL.createObjectURL(file), download: name });
  document.body.append(a);
  a.click();
  a.remove();
}

function doImport() {
  const input = h('input', { type: 'file', accept: 'application/json,.json' });
  input.addEventListener('change', async () => {
    const f = input.files[0];
    if (!f) return;
    try {
      importJSON(await f.text());
      toast('Данные восстановлены ✓');
      location.hash = '#today';
    } catch (e) {
      toast('Не получилось: ' + e.message);
    }
  });
  input.click();
}
