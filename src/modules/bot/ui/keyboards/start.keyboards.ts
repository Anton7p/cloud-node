import { Markup } from 'telegraf';
import { EMOJI } from '../templates/common.templates';
import {
  NAVIGATION_ACTIONS,
  NAVIGATION_LABELS,
} from '../templates/navigation.templates';

// ============================================================================
// CYBERPUNK INLINE KEYBOARD (Главное меню)
// ============================================================================

export const startKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.CORE} ${NAVIGATION_LABELS.PROFILE}`,
        NAVIGATION_ACTIONS.PROFILE,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.RENT_SERVER}`,
        NAVIGATION_ACTIONS.RENT_SERVER,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.TERMINAL} ${NAVIGATION_LABELS.INSTRUCTIONS}`,
        NAVIGATION_ACTIONS.INSTRUCTIONS,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.BATTERY} ${NAVIGATION_LABELS.REFERRAL}`,
        NAVIGATION_ACTIONS.REFERRAL,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.SHIELD} ${NAVIGATION_LABELS.HELP}`,
        NAVIGATION_ACTIONS.HELP,
      ),
    ],
  ]);

// ============================================================================
// REPLY KEYBOARD (Главная кнопка запуска)
// ============================================================================

// Главная кнопка для reply keyboard
export const MAIN_LAUNCH_BUTTON = `${EMOJI.CORE} ЗАПУСТИТЬ СИСТЕМУ / ГЛАВНОЕ МЕНЮ`;

// Reply keyboard с перманентной кнопкой запуска
export const launchReplyKeyboard = () =>
  Markup.keyboard([[MAIN_LAUNCH_BUTTON]])
    .resize(true)
    .persistent(true);

// Убрать reply keyboard
export const removeReplyKeyboard = () => Markup.removeKeyboard();
