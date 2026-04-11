// ============================================================================
// CLEAN UI: УПРОЩЕННЫЙ ИНТЕРФЕЙС
// ============================================================================

// Новый чистый интерфейс (основной)
export {
  MESSAGES,
  ACTIONS,
  ACCESS_PRICES,
  IMAGES,
  MENU_COMMANDS,
  CHAT_MENU_BUTTON,
} from './clean.templates';

// Обратная совместимость (устаревшее)
export {
  EMOJI,
  RENTAL_PRICES,
  PLATFORM_APPS,
  UI_UTILS,
  COMMON_MESSAGES,
} from './common.templates';

export { START_MESSAGES, START_ACTIONS } from './start.templates';

export { PROFILE_MESSAGES, PROFILE_ACTIONS } from './profile.templates';

export { RENT_MESSAGES, RENT_ACTIONS, RENT_PATTERNS } from './rent.templates';

export {
  INSTRUCTIONS_MESSAGES,
  INSTRUCTIONS_ACTIONS,
  INSTRUCTIONS_PATTERNS,
} from './instructions.templates';

export {
  NAVIGATION_ACTIONS,
  NAVIGATION_LABELS,
  type NavigationAction,
} from './navigation.templates';

// CYBERPUNK: Устаревшие экспорты
export {
  CYBER_EMOJI,
  SYS_PREFIX,
  HUD_ICONS,
  TERMINAL,
  CYBER_MESSAGES,
  REPLY_KEYBOARD_CONFIG,
} from './cyberpunk.templates';
