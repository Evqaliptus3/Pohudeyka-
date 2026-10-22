// Распознавание еды по фото через Claude API.
// Ключ API хранится только в localStorage этого телефона и не попадает в резервную копию.
const KEY_STORAGE = 'pohudeyka.apikey';
const MODEL = 'claude-opus-5-5';

export function getApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {}
}

let sdk = null;
async function client() {
  // SDK тяжёлый (~200 КБ), грузим только когда нужен
  if (!sdk) sdk = (await import('./vendor/anthropic-sdk.js')).default;
  return { Anthropic: sdk, api: new sdk({ apiKey: getApiKey(), dangerouslyAllowBrowser: true }) };
}

// Уменьшаем фото до 1280 px: быстрее загрузка и дешевле запрос, точность та же
export function prepareImage(file, maxSide = 1280) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ dataUrl, base64: dataUrl.split(',')[1] });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось открыть фото'));
    };
    img.src = url;
  });
}

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          grams: { type: 'number' },
          kcal_per_100g: { type: 'number' },
          protein_per_100g: { type: 'number' },
          fat_per_100g: { type: 'number' },
          carbs_per_100g: { type: 'number' },
        },
        required: ['name', 'grams', 'kcal_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g'],
        additionalProperties: false,
      },
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    note: { type: 'string' },
  },
  required: ['items', 'confidence', 'note'],
  additionalProperties: false,
};

const SYSTEM = `Ты нутрициолог. По фото еды оцениваешь состав и калорийность для дневника питания человека, который худеет.

Как работать:
- Раздели блюдо на отдельные компоненты (гарнир, мясо, соус, хлеб, напиток), каждый — отдельной позицией.
- Вес порции оценивай по размеру тарелки, приборов и рук в кадре. Стандартная тарелка — около 24–26 см.
- Учитывай скрытые калории: масло при жарке, заправки, соусы, сахар в напитках. Если они вероятны, добавь их отдельной позицией с реалистичным количеством.
- Значения на 100 г — типичные справочные для готового продукта в том виде, как он на фото.
- Названия на русском, коротко и понятно («Гречка варёная», «Куриная грудка жареная», «Масло подсолнечное»).
- Если пользователь дал комментарий, он важнее твоей оценки по фото.
- В note одной-двумя фразами напиши, что учёл и в чём не уверен. Если на фото нет еды — верни пустой items и объясни в note.`;

export async function analyzeFood(base64, comment = '') {
  if (!getApiKey()) throw new Error('Нужен ключ API — добавь его в Профиле');
  const { Anthropic, api } = await client();

  const params = {
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: comment ? `Комментарий: ${comment}` : 'Оцени, что на фото.' },
        ],
      },
    ],
  };

  let res;
  try {
    // При отказе классификаторов запрос автоматически перезапускается на рекомендованной модели
    res = await api.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
  } catch (e) {
    throw humanError(Anthropic, e);
  }

  if (res.stop_reason === 'refusal') throw new Error('Модель отказалась обрабатывать это фото. Попробуй другое фото.');
  if (res.stop_reason === 'max_tokens') throw new Error('Ответ оборвался. Попробуй ещё раз.');
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Не удалось разобрать ответ. Попробуй ещё раз.');
  }
  data.items = (data.items || []).filter((i) => i.grams > 0 && i.kcal_per_100g >= 0);
  return data;
}

function humanError(Anthropic, e) {
  if (e instanceof Anthropic.AuthenticationError) return new Error('Неверный ключ API. Проверь его в Профиле.');
  if (e instanceof Anthropic.PermissionDeniedError) return new Error('Нет доступа: проверь, что на балансе есть средства.');
  if (e instanceof Anthropic.RateLimitError) return new Error('Слишком много запросов. Подожди минуту.');
  if (e instanceof Anthropic.BadRequestError) {
    const msg = e.message || '';
    if (/credit|balance/i.test(msg)) return new Error('На балансе API закончились средства. Пополни на console.anthropic.com.');
    return new Error('Запрос отклонён: ' + msg.slice(0, 160));
  }
  if (e instanceof Anthropic.APIConnectionError) return new Error('Нет связи с сервером. Проверь интернет.');
  if (e instanceof Anthropic.APIError) return new Error('Ошибка сервиса (' + (e.status ?? '?') + '). Попробуй позже.');
  return e;
}
