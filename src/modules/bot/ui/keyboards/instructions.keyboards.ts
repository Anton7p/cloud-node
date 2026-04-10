import { Markup } from 'telegraf';
import { EMOJI } from '../templates/common.templates';
import { NAVIGATION_ACTIONS, NAVIGATION_LABELS } from '../templates/navigation.templates';

export const instructionsKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(`${EMOJI.APPLE} ${NAVIGATION_LABELS.IOS}`, NAVIGATION_ACTIONS.INSTRUCTION_IOS),
      Markup.button.callback(`${EMOJI.ANDROID} ${NAVIGATION_LABELS.ANDROID}`, NAVIGATION_ACTIONS.INSTRUCTION_ANDROID),
    ],
    [
      Markup.button.callback(`${EMOJI.WINDOWS} ${NAVIGATION_LABELS.WINDOWS}`, NAVIGATION_ACTIONS.INSTRUCTION_WINDOWS),
      Markup.button.callback(`${EMOJI.MACOS} ${NAVIGATION_LABELS.MACOS}`, NAVIGATION_ACTIONS.INSTRUCTION_MACOS),
    ],
    [Markup.button.callback(`${EMOJI.BACK} ${NAVIGATION_LABELS.BACK}`, NAVIGATION_ACTIONS.BACK_TO_START)],
  ]);

export const platformInfoKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJI.PROFILE} Перейти в профиль`, NAVIGATION_ACTIONS.PROFILE)],
    [Markup.button.callback(`${EMOJI.BACK} ${NAVIGATION_LABELS.OTHER_PLATFORMS}`, NAVIGATION_ACTIONS.INSTRUCTIONS)],
    [Markup.button.callback(`${EMOJI.BACK} ${NAVIGATION_LABELS.BACK_TO_MENU}`, NAVIGATION_ACTIONS.BACK_TO_START)],
  ]);
