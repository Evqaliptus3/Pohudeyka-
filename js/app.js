import { getState, subscribe, update } from './store.js';
import { h, toast } from './ui.js';
import { checkAchievements, markUnlocked } from './motivation.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderToday } from './views/today.js';
import { renderFood } from './views/food.js';
import { renderTrain } from './views/train.js';
import { renderWeight } from './views/weight.js';
import { renderProfile } from './views/profile.js';

const TABS = [
  { id: 'today', icon: '🏠', name: 'Сегодня', render: renderToday },
  { id: 'food', icon: '🍽', name: 'Питание', render: renderFood },
  { id: 'train', icon: '💪', name: 'Спорт', render: renderTrain },
  { id: 'weight', icon: '⚖️', name: 'Вес', render: renderWeight },
  { id: 'profile', icon: '👤', name: 'Профиль', render: renderProfile },
];

const main = document.getElementById('main');
const nav = document.getElementById('tabbar');
let lastTab = null;

function currentTab() {
  const id = location.hash.replace('#', '');
  return TABS.find((t) => t.id === id) || TABS[0];
}

function render() {
  const s = getState();
  main.innerHTML = '';
  if (!s.profile) {
    nav.hidden = true;
    renderOnboarding(main);
    return;
  }
  nav.hidden = false;
  const tab = currentTab();
  const scroll = tab.id === lastTab ? window.scrollY : 0;
  lastTab = tab.id;
  tab.render(main, render);
  window.scrollTo(0, scroll);
  nav.querySelectorAll('a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab.id));
}

nav.append(...TABS.map((t) => h('a', { href: '#' + t.id, 'data-tab': t.id }, h('span', null, t.icon), h('small', null, t.name))));

window.addEventListener('hashchange', render);
subscribe(() => {
  render();
  if (!getState().profile) return;
  const fresh = checkAchievements(getState());
  if (fresh.length) {
    update((s) => markUnlocked(s, fresh));
    fresh.forEach((a, i) => setTimeout(() => toast(`${a.icon} Достижение: ${a.name}!`, 3000), 600 + i * 1800));
  }
});

// Новый день — перерисовать (если приложение висело открытым с вечера)
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && render());

render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
}
