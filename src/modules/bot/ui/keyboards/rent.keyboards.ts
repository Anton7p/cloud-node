import { Markup } from 'telegraf';
import { EMOJI } from '../templates/common.templates';
import {
  NAVIGATION_ACTIONS,
  NAVIGATION_LABELS,
} from '../templates/navigation.templates';

export const rentServerKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        NAVIGATION_LABELS.RENT_1M,
        NAVIGATION_ACTIONS.RENT_1M,
      ),
      Markup.button.callback(
        NAVIGATION_LABELS.RENT_3M,
        NAVIGATION_ACTIONS.RENT_3M,
      ),
    ],
    [
      Markup.button.callback(
        NAVIGATION_LABELS.RENT_12M,
        NAVIGATION_ACTIONS.RENT_12M,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.BACK} ${NAVIGATION_LABELS.BACK}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);

export const rentTermDetailsKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.CARD} ${NAVIGATION_LABELS.PAY}`,
        NAVIGATION_ACTIONS.PAY_RENTAL,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.BACK} ${NAVIGATION_LABELS.OTHER_TERM}`,
        NAVIGATION_ACTIONS.RENT_SERVER,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.BACK} ${NAVIGATION_LABELS.BACK_TO_MENU}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);

export const rentActivatedKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${EMOJI.PROFILE} Перейти в профиль`,
        NAVIGATION_ACTIONS.PROFILE,
      ),
    ],
    [
      Markup.button.callback(
        `${EMOJI.BACK} ${NAVIGATION_LABELS.BACK_TO_MENU}`,
        NAVIGATION_ACTIONS.BACK_TO_START,
      ),
    ],
  ]);
