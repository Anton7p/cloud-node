import { Markup } from 'telegraf';
import {
  ACTIONS,
  LEGAL_LINKS,
  ACCESS_PRICES,
  PLATFORM_GUIDES,
} from '../templates/clean.templates';

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
    [Markup.button.callback('🚀 Быстрый старт', ACTIONS.BUY_MENU)],
  ];

  // Row 2: 📁 Мои ключи | 🧭 Как подключить
  rows.push([
    Markup.button.callback('🔑 Мои ключи', ACTIONS.MY_KEYS),
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

  // Бесплатный тест (0 месяцев = 0 дней, для обратной совместимости)
  const freeTest = ACCESS_PRICES.find((p) => p.months === 0);
  if (freeTest) {
    rows.push([
      Markup.button.callback(
        `[🎁] ${freeTest.label} ✦ ${freeTest.devices} 📱 ✦ ${freeTest.price}₽`,
        ACTIONS.FREE_TEST,
      ),
    ]);
  }

  // Неделя (0.25 месяца)
  const week = ACCESS_PRICES.find((p) => p.months === 0.25);
  if (week) {
    rows.push([
      Markup.button.callback(`${week.label} ✦ ${week.price}₽`, ACTIONS.WEEK),
    ]);
  }

  // Месяц (1 месяц)
  const month1 = ACCESS_PRICES.find((p) => p.months === 1);
  if (month1) {
    rows.push([
      Markup.button.callback(
        `${month1.label} ✦ ${month1.price}₽`,
        ACTIONS.MONTH_1,
      ),
    ]);
  }

  // 3 Месяца
  const month3 = ACCESS_PRICES.find((p) => p.months === 3);
  if (month3) {
    rows.push([
      Markup.button.callback(
        `${month3.label} ✦ ${month3.price}₽`,
        ACTIONS.MONTH_3,
      ),
    ]);
  }

  // 6 Месяцев
  const month6 = ACCESS_PRICES.find((p) => p.months === 6);
  if (month6) {
    rows.push([
      Markup.button.callback(
        `${month6.label} ✦ ${month6.price}₽`,
        ACTIONS.MONTH_6,
      ),
    ]);
  }

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
 * ⤴️ В меню (на всю ширину)
 */
export const platformKeyboard = () => {
  const rows: any[] = [];

  // Row 1: 🤖 Android ↗️ | 🖥 Windows ↗️
  rows.push([
    Markup.button.url('🤖 Android', PLATFORM_GUIDES.ANDROID),
    Markup.button.url('🖥 Windows', PLATFORM_GUIDES.WINDOWS),
  ]);

  // Row 2: 📱 iPhone ↗️ | 💻 macOS ↗️
  rows.push([
    Markup.button.url('📱 iPhone', PLATFORM_GUIDES.IOS),
    Markup.button.url('💻 macOS', PLATFORM_GUIDES.MACOS),
  ]);

  // Row 3: ⤴️ В меню (на всю ширину)
  rows.push([Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)]);

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
 * 🧠 FAQ и ответы
 * � Написать в поддержку
 * �📄 Условия сервиса
 * 📄 Политика конфиденциальности
 * ⤴️ В меню
 */
export const legalKeyboard = () => {
  const rows: any[] = [];

  // FAQ
  rows.push([
    Markup.button.url(`${LEGAL_LINKS.FAQ.name} `, LEGAL_LINKS.FAQ.url),
  ]);

  // Написать в поддержку (ВК)
  rows.push([Markup.button.url(`${LEGAL_LINKS.VK.name} `, LEGAL_LINKS.VK.url)]);

  // Условия сервиса
  rows.push([
    Markup.button.url(`${LEGAL_LINKS.TERMS.name} `, LEGAL_LINKS.TERMS.url),
  ]);

  // Политика конфиденциальности
  rows.push([
    Markup.button.url(`${LEGAL_LINKS.PRIVACY.name} `, LEGAL_LINKS.PRIVACY.url),
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
 * Клавиатура с кнопкой ⤴️ В меню
 */
export const backKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)],
  ]);

/**
 * Клавиатура для экрана платформы:
 * - 📖 Открыть инструкцию (guideUrl)
 * - ⤴️ В меню
 */
export const platformDetailKeyboard = (guideUrl?: string) => {
  const rows: any[] = [];

  if (guideUrl) {
    rows.push([Markup.button.url('📖 Открыть инструкцию', guideUrl)]);
  }

  rows.push([Markup.button.callback('⤴️ В меню', ACTIONS.START_MENU)]);

  return Markup.inlineKeyboard(rows);
};
