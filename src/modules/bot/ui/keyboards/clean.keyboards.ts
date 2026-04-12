import { Markup } from 'telegraf';
import { ACTIONS } from '../templates/clean.templates';

// ============================================================================
// CLEAN UI KEYBOARDS - Новая структура 1:1 с референсом
// ============================================================================

/**
 * Главное меню (/start):
 * Сетка 1-2-2:
 * 🚀 Быстрый старт
 * 📁 Мои ключи | 🧭 Как подключить
 * 🤝 Партнёрам | ⚖️ Условия
 */
export const mainKeyboard = () => {
  const rows: any[] = [
    // Row 1: 🚀 Быстрый старт
    [Markup.button.callback('� Быстрый старт', ACTIONS.BUY_MENU)],
  ];

  // Row 2: 📁 Мои ключи | 🧭 Как подключить
  rows.push([
    Markup.button.callback('� Мои ключи', ACTIONS.MY_KEYS),
    Markup.button.callback('🧭 Как подключить', ACTIONS.INSTRUCTIONS),
  ]);

  // Row 3: 🤝 Партнёрам | ⚖️ Условия
  rows.push([
    Markup.button.callback('🤝 Партнёрам', ACTIONS.PARTNERS),
    Markup.button.callback('⚖️ Условия', ACTIONS.LEGAL),
  ]);

  return Markup.inlineKeyboard(rows);
};

/**
 * Выбор тарифа (Быстрый старт):
 * Вертикально с разделителем ✦
 * [Logo] Бесплатный тест на 3дн. ✦ 2 📱 ✦ 0₽
 * Неделя ✦ 49₽, Месяц ✦ 99₽, 3 Месяца ✦ 279₽, 6 Месяцев ✦ 449₽
 * ⤴️ В меню
 */
export const durationKeyboard = () => {
  const rows: any[] = [];

  // Бесплатный тест
  rows.push([
    Markup.button.callback(
      '[🎁] Бесплатный тест на 3дн. ✦ 2 📱 ✦ 0₽',
      ACTIONS.FREE_TEST,
    ),
  ]);

  // Неделя
  rows.push([Markup.button.callback('Неделя ✦ 49₽', ACTIONS.WEEK)]);

  // Месяц
  rows.push([Markup.button.callback('Месяц ✦ 99₽', ACTIONS.MONTH_1)]);

  // 3 Месяца
  rows.push([Markup.button.callback('3 Месяца ✦ 279₽', ACTIONS.MONTH_3)]);

  // 6 Месяцев
  rows.push([Markup.button.callback('6 Месяцев ✦ 449₽', ACTIONS.MONTH_6)]);

  // ⤴️ В меню
  rows.push([Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)]);

  return Markup.inlineKeyboard(rows);
};

/**
 * Клавиатура "Мои ключи" (Пусто):
 * Дублирует структуру Главного меню
 */
export const emptyKeysKeyboard = () => mainKeyboard();

/**
 * Инструкции (Сетка 2x2 + навигация):
 * 🤖 Android ↗️ | 🖥 Windows ↗️
 * 📱 iPhone ↗️ | 💻 macOS ↗️
 * 🧾 Мои ключи | ⤴️ В меню
 */
export const platformKeyboard = () => {
  const rows: any[] = [];

  // Row 1: 🤖 Android ↗️ | 🖥 Windows ↗️
  rows.push([
    Markup.button.url(
      '🤖 Android ↗️',
      'https://telegra.ph/Podklyuchenie-VPN-na-Android-01-12',
    ),
    Markup.button.url(
      '🖥 Windows ↗️',
      'https://telegra.ph/Podklyuchenie-VPN-na-Windows-01-12',
    ),
  ]);

  // Row 2: 📱 iPhone ↗️ | 💻 macOS ↗️
  rows.push([
    Markup.button.url('📱 iPhone ↗️', 'https://telegra.ph/IPhone-03-02-5'),
    Markup.button.url('💻 macOS ↗️', 'https://telegra.ph/IPhone-03-02-5'),
  ]);

  // Row 3: 🧾 Мои ключи | ⤴️ В меню
  rows.push([
    Markup.button.callback('🧾 Мои ключи', ACTIONS.MY_KEYS),
    Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU),
  ]);

  return Markup.inlineKeyboard(rows);
};

/**
 * Партнёрская программа:
 * 📲 Поделиться ссылкой (switch_inline_query)
 * ⤴️ В меню
 */
export const partnersKeyboard = (referralLink: string) => {
  const rows: any[] = [];

  // Поделиться ссылкой
  rows.push([
    Markup.button.switchToChat(
      '📲 Поделиться ссылкой',
      `Присоединяйся! ${referralLink}`,
    ),
  ]);

  // ⤴️ В меню
  rows.push([Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)]);

  return Markup.inlineKeyboard(rows);
};

/**
 * Условия и Поддержка:
 * 🧠 FAQ и ответы ↗️
 * 📄 Условия сервиса ↗️
 * 📄 Политика конфиденциальности ↗️
 * ⤴️ В меню
 */
export const legalKeyboard = () => {
  const rows: any[] = [];

  // FAQ
  rows.push([
    Markup.button.url('🧠 FAQ и ответы ↗️', 'https://telegra.ph/VPN-01-10-14'),
  ]);

  // Условия сервиса
  rows.push([
    Markup.button.url(
      '� Условия сервиса ↗️',
      'https://telegra.ph/Polzovatelskoe-soglashenie-04-01-19',
    ),
  ]);

  // Политика конфиденциальности
  rows.push([
    Markup.button.url(
      '📄 Политика конфиденциальности ↗️',
      'https://telegra.ph/Politika-konfidencialnosti-04-01-26',
    ),
  ]);

  // ⤴️ В меню
  rows.push([Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)]);

  return Markup.inlineKeyboard(rows);
};

/**
 * Клавиатура для экрана с ключом: большая кнопка СКОПИРОВАТЬ + ⤴️ В меню
 */
export const keyDisplayKeyboard = (key: string) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        '📋 Скопировать ключ',
        `${ACTIONS.COPY_KEY}:${key}`,
      ),
    ],
    [Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)],
  ]);

/**
 * Клавиатура для успеха продления: ⤴️ В меню
 */
export const extendSuccessKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)],
  ]);

/**
 * Legacy: Клавиатура с кнопкой НАЗАД (для старых экранов)
 */
export const backKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)],
  ]);

// Удаление ReplyKeyboard для показа системной кнопки
export const removeReplyKeyboard = () => Markup.removeKeyboard();

/**
 * Клавиатура для экрана платформы с кнопкой назад
 * Legacy: используется в старых platform командах
 */
export const platformDetailKeyboard = (guideUrl?: string) => {
  const rows: any[] = [];

  if (guideUrl) {
    rows.push([Markup.button.url('📖 Открыть инструкцию', guideUrl)]);
  }

  rows.push([Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)]);

  return Markup.inlineKeyboard(rows);
};
