import { Markup } from 'telegraf';
import { ACTIONS } from '../templates/clean.templates';

// ============================================================================
// CLEAN UI KEYBOARDS
// ============================================================================

// Главное меню: динамическая главная кнопка (ПОЛУЧИТЬ/ПРОДЛИТЬ), ИНСТРУКЦИИ | ПОДДЕРЖКА
export const mainKeyboard = (hasSubscription: boolean = false) => {
  const mainButton = hasSubscription
    ? Markup.button.callback('🔄 ПРОДЛИТЬ СРОК', ACTIONS.EXTEND_KEY)
    : Markup.button.callback('🔵 ПОЛУЧИТЬ КЛЮЧ', ACTIONS.GET_KEY);

  return Markup.inlineKeyboard([
    [mainButton],
    [
      Markup.button.callback('ИНСТРУКЦИИ', ACTIONS.INSTRUCTIONS),
      Markup.button.callback('ПОДДЕРЖКА', ACTIONS.SUPPORT),
    ],
  ]);
};

// Выбор срока: 1 МЕСЯЦ | 3 МЕСЯЦА, НАЗАД
export const durationKeyboard = (isExtend: boolean = false) => {
  const titleText = isExtend ? 'ПРОДЛИТЬ НА:' : 'ПОЛУЧИТЬ НА:';
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⏱ ${titleText}`, 'duration_title')],
    [
      Markup.button.callback('1 МЕСЯЦ', ACTIONS.MONTH_1),
      Markup.button.callback('3 МЕСЯЦА', ACTIONS.MONTH_3),
    ],
    [Markup.button.callback('◀ НАЗАД', ACTIONS.BACK_TO_MAIN)],
  ]);
};

// Клавиатура выбора платформы: IOS, ANDROID, WINDOWS, MACOS, НАЗАД
export const platformKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('🍎 IOS', ACTIONS.PLATFORM_IOS),
      Markup.button.callback('🤖 ANDROID', ACTIONS.PLATFORM_ANDROID),
    ],
    [
      Markup.button.callback('💻 WINDOWS', ACTIONS.PLATFORM_WINDOWS),
      Markup.button.callback('🖥 MACOS', ACTIONS.PLATFORM_MACOS),
    ],
    [Markup.button.callback('◀ НАЗАД', ACTIONS.BACK_TO_MAIN)],
  ]);

// Клавиатура с кнопкой НАЗАД
export const backKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('◀ НАЗАД', ACTIONS.BACK_TO_MAIN)],
  ]);

// Удаление ReplyKeyboard для показа системной кнопки
export const removeReplyKeyboard = () => Markup.removeKeyboard();

// Клавиатура для экрана платформы с кнопкой назад
export const platformDetailKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('◀ НАЗАД К ПЛАТФОРМАМ', ACTIONS.INSTRUCTIONS)],
    [Markup.button.callback('◀◀ ГЛАВНОЕ МЕНЮ', ACTIONS.BACK_TO_MAIN)],
  ]);
