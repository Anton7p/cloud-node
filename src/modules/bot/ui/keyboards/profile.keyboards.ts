import { Markup } from 'telegraf';
import { EMOJI } from '../templates/common.templates';
import {
  NAVIGATION_ACTIONS,
  NAVIGATION_LABELS,
} from '../templates/navigation.templates';

// ============================================================================
// CYBERPUNK PROFILE KEYBOARDS
// ============================================================================

export const profileKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.LOCK} ${NAVIGATION_LABELS.GET_ACCESS}`,
        NAVIGATION_ACTIONS.GET_ACCESS,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.BOLT} ${NAVIGATION_LABELS.EXTEND_RENTAL}`,
        NAVIGATION_ACTIONS.RENT_SERVER,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.BACK}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);

export const noServersKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.RENT_SERVER}`,
        NAVIGATION_ACTIONS.RENT_SERVER,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.BACK}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);

export const accessInfoKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.BACK_TO_PROFILE}`,
        NAVIGATION_ACTIONS.PROFILE,
      ),
    ],
  ]);

export const referralKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.BACK}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);

export const helpKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.RENT_SERVER}`,
        NAVIGATION_ACTIONS.RENT_SERVER,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.SQUARE} ${NAVIGATION_LABELS.BACK}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);
