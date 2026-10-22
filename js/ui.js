// Мини-хелперы для DOM без фреймворков
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

let sheetStack = [];

// Нижняя шторка в стиле iOS. Возвращает функцию закрытия.
export function sheet(title, body, { onClose } = {}) {
  const close = () => {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 250);
    sheetStack = sheetStack.filter((s) => s !== close);
    onClose && onClose();
  };
  const overlay = h(
    'div',
    { class: 'overlay', onclick: (e) => e.target === overlay && close() },
    h(
      'div',
      { class: 'sheet' },
      h('div', { class: 'sheet-head' }, h('div', { class: 'grabber' }), h('h3', null, title), h('button', { class: 'icon-btn', onclick: close, 'aria-label': 'Закрыть' }, '✕')),
      h('div', { class: 'sheet-body' }, typeof body === 'function' ? body(close) : body),
    ),
  );
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  sheetStack.push(close);
  return close;
}

export function closeAllSheets() {
  [...sheetStack].forEach((c) => c());
}

export function toast(text, ms = 2200) {
  const t = h('div', { class: 'toast' }, text);
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

export function confirmBox(text) {
  return window.confirm(text);
}

export const fmt = (x) => Math.round(x).toLocaleString('ru-RU');
export const fmt1 = (x) => (Math.round(x * 10) / 10).toLocaleString('ru-RU');

export function numInput(props = {}) {
  return h('input', { type: 'number', inputmode: 'decimal', step: 'any', ...props });
}

export function num(v) {
  const x = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : null;
}

// Кольцевой индикатор (SVG)
export function ring(value, max, { size = 168, stroke = 14, color = 'var(--accent)', over = 'var(--danger)', label, sub } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? value / max : 0;
  const shown = Math.min(1, ratio);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.innerHTML = `
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${ratio > 1.05 ? over : color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - shown)}"
      transform="rotate(-90 ${size / 2} ${size / 2})" style="transition: stroke-dashoffset .5s"/>`;
  return h('div', { class: 'ring', style: { width: size + 'px', height: size + 'px' } }, svg, h('div', { class: 'ring-label' }, h('b', null, label), h('span', null, sub)));
}

export function bar(value, max, cls = '') {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return h('div', { class: 'bar ' + cls }, h('div', { style: { width: pct + '%' } }));
}

export function segmented(options, value, onChange) {
  const wrap = h('div', { class: 'seg' });
  options.forEach((o) => {
    const b = h('button', { type: 'button', class: o.value === value ? 'on' : '', onclick: () => {
      wrap.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      onChange(o.value);
    } }, o.label);
    wrap.append(b);
  });
  return wrap;
}

export function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', null, label), input, hint && h('small', null, hint));
}

// Звук таймера. iOS разрешает звук только после нажатия, поэтому unlockAudio вызываем из обработчика клика.
let audioCtx = null;

export function unlockAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {}
}

export function beep(times = 3) {
  try {
    if (!audioCtx) return;
    for (let i = 0; i < times; i++) {
      const t = i * 0.25;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + t);
      o.stop(audioCtx.currentTime + t + 0.2);
    }
  } catch {}
}
