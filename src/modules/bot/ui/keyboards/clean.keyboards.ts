import { Markup } from 'telegraf';
import { ACTIONS } from '../templates/clean.templates';

// ============================================================================
// CLEAN UI KEYBOARDS
// ============================================================================

// Главное меню: ПОЛУЧИТЬ КЛЮЧ (широкая), ИНСТРУКЦИИ | ПОДДЕРЖКА
export const mainKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('ПОЛУЧИТЬ КЛЮЧ', ACTIONS.GET_KEY)],
    [
      Markup.button.callback('ИНСТРУКЦИИ', ACTIONS.INSTRUCTIONS),
      Markup.button.callback('ПОДДЕРЖКА', ACTIONS.SUPPORT),
    ],
  ]);

// Выбор срока: 1 МЕСЯЦ | 3 МЕСЯЦА, НАЗАД
export const durationKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('1 МЕСЯЦ', ACTIONS.MONTH_1),
      Markup.button.callback('3 МЕСЯЦА', ACTIONS.MONTH_3),
    ],
    [Markup.button.callback('НАЗАД', ACTIONS.BACK_TO_MAIN)],
  ]);

// Клавиатура с кнопкой НАЗАД
export const backKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('НАЗАД', ACTIONS.BACK_TO_MAIN)],
  ]);

// Удаление ReplyKeyboard для показа системной кнопки
export const removeReplyKeyboard = () => Markup.removeKeyboard();
