// ============================================================================
// CLEAN UI KEYBOARD EXPORTS
// ============================================================================

// Новый чистый интерфейс (основной)
export {
  mainKeyboard,
  durationKeyboard,
  backKeyboard,
  removeReplyKeyboard,
} from './clean.keyboards';

// Устаревшие экспорты (для обратной совместимости)
export { startKeyboard, MAIN_LAUNCH_BUTTON } from './start.keyboards';

export {
  profileKeyboard,
  noServersKeyboard,
  accessInfoKeyboard,
  referralKeyboard,
  helpKeyboard,
} from './profile.keyboards';

export {
  rentServerKeyboard,
  rentTermDetailsKeyboard,
  rentActivatedKeyboard,
} from './rent.keyboards';

export {
  instructionsKeyboard,
  platformInfoKeyboard,
} from './instructions.keyboards';
