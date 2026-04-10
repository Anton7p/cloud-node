import { Markup } from 'telegraf';
import { EMOJI } from '../templates/common.templates';
import { NAVIGATION_ACTIONS, NAVIGATION_LABELS } from '../templates/navigation.templates';

export const startKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJI.PROFILE} ${NAVIGATION_LABELS.PROFILE}`, NAVIGATION_ACTIONS.PROFILE)],
    [Markup.button.callback(`${EMOJI.SERVER} ${NAVIGATION_LABELS.RENT_SERVER}`, NAVIGATION_ACTIONS.RENT_SERVER)],
    [Markup.button.callback(`${EMOJI.INSTRUCTIONS} ${NAVIGATION_LABELS.INSTRUCTIONS}`, NAVIGATION_ACTIONS.INSTRUCTIONS)],
    [Markup.button.callback(`${EMOJI.REFERRAL} ${NAVIGATION_LABELS.REFERRAL}`, NAVIGATION_ACTIONS.REFERRAL)],
    [Markup.button.callback(`${EMOJI.HELP} ${NAVIGATION_LABELS.HELP}`, NAVIGATION_ACTIONS.HELP)],
  ]);
