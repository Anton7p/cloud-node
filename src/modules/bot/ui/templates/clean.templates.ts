// ============================================================================
// CLEAN UI: УПРОЩЕННЫЙ ИНТЕРФЕЙС ДЛЯ ПРОДАЖИ VPN-КЛЮЧЕЙ
// ============================================================================

// Цены на доступ
export const ACCESS_PRICES = [
  {
    months: 0,
    price: 0,
    label: 'Бесплатный тест на 3дн.',
    devices: 2,
  },
  { months: 0.25, price: 49, label: 'Неделя', devices: 2 },
  { months: 1, price: 99, label: 'Месяц', devices: 2 },
  { months: 3, price: 279, label: '3 Месяца', devices: 2 },
  {
    months: 6,
    price: 449,
    label: '6 Месяцев',
    devices: 2,
  },
] as const;

// Команды меню для BotFather
export const MENU_COMMANDS = {
  START: { command: 'start', description: 'Главное меню' },
  SUPPORT: { command: 'support', description: 'Поддержка' },
} as const;

// ============================================================================
// ПОДПИСИ КНОПОК / ОБЩИЕ ЯРЛЫКИ UI (единый источник для текстов и клавиатур)
// ============================================================================

export const UI_LABELS = {
  QUICK_START: '🚀 Быстрый старт',
} as const;

// ============================================================================
// УВЕДОМЛЕНИЯ (parse_mode: HTML, см. BotService.sendMessage)
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const NOTIFY_HTML = {
  SUBSCRIPTION_SUCCESS: (subscriptionUrl: string) => {
    const safe = escapeHtml(subscriptionUrl);
    return (
      `✅ <b>Подписка успешно активирована!</b>\n\n` +
      `Ваш ключ доступа:\n` +
      `<code>${safe}</code>\n\n` +
      `Нажмите на ключ, чтобы скопировать его.`
    );
  },

  SUBSCRIPTION_EXPIRING_SOON: (until: string) =>
    `⏳ <b>Подписка скоро закончится</b>\n\n` +
    `Действует до: <b>${escapeHtml(until)}</b>\n\n` +
    `Продлите доступ в боте через «${UI_LABELS.QUICK_START}», чтобы не потерять VPN.`,

  SUBSCRIPTION_FAILED: (errorMessage: string) =>
    `❌ <b>Ошибка активации подписки</b>\n\n` +
    `К сожалению, не удалось создать подписку.\n` +
    `Ошибка: ${escapeHtml(errorMessage)}\n\n` +
    `Пожалуйста, обратитесь в поддержку.`,
} as const;

// ============================================================================
// СООБЩЕНИЯ
// ============================================================================

export const MESSAGES = {
  // Главное меню с фото
  MAIN_TITLE:
    '⚡️ Добро пожаловать в самый быстрый и стабильный VPN!\n\n' +
    '➖ Нам более года\n' +
    '➖ Высокая скорость\n' +
    '➖ Приватность\n' +
    '➖ Быстрая поддержка\n' +
    '➖ Поддержка ПК, Телефонов, Телевизоров!\n\n' +
    'VPN прямо в Telegram!\n\n' +
    '🎁 3 Дня бесплатной подписки ⬇️',

  // Экран выбора срока
  SELECT_DURATION: 'Выберите срок подписки:',

  // Экран с ключом (новая покупка)
  KEY_READY: (duration: string, key: string) =>
    `🔑 Ключ доступа (${duration})\n\n` + `\`\`\`\n${key}\n\`\`\``,

  // Экран успеха продления
  EXTEND_SUCCESS: (newEndDate: string) =>
    `✅ Подписка продлена\n\n` +
    `Доступ активен до: ${newEndDate}\n\n` +
    `Ваш текущий ключ продолжает работать.`,

  // Показать текущий ключ
  MY_KEY_TITLE: '🧾 Ваш текущий ключ:',
  NO_KEY:
    '🧾 Мои ключи\n\nПока пусто. Перейдите в «🚀 Быстрый старт», чтобы получить доступ.',

  // Инструкции (выбор платформы)
  INSTRUCTIONS_TITLE: '🧭 Выберите платформу для настройки:',

  // Заголовок экрана платформы
  PLATFORM_TITLE: (platform: string) => `📱 ${platform}`,

  // Поддержка / Условия
  SUPPORT:
    '⚖️ Условия и поддержка\n\nНаши ресурсы:\n▬ FAQ и ответы на вопросы\n▬ Условия сервиса\n▬ Политика конфиденциальности',

  // Экран с моими ключами (когда есть ключ)
  MY_KEYS_ACTIVE: (expiryDate: string, key: string) =>
    `🧾 Мои ключи\n\n` +
    `✅ Активная подписка до: ${expiryDate}\n\n` +
    `\`\`\`\n${key}\n\`\`\``,

  // Ошибки
  UNKNOWN_COMMAND: 'Неизвестная команда',
  ERROR: 'Ошибка. Попробуйте позже.',
  COPY_KEY_ERROR: '❌ Ошибка: ключ не найден',

  // Копирование ключа
  COPY_KEY_READY: (key: string) =>
    `📋 Ваш ключ:\n\n\`\`\`\n${key}\n\`\`\`\n\n✅ Нажмите на ключ выше, чтобы скопировать его`,
} as const;

// ============================================================================
// ДЕЙСТВИЯ (callback data)
// ============================================================================

export const ACTIONS = {
  // Главное меню
  START_MENU: 'start_menu',
  BUY_MENU: 'buy_menu',
  MY_KEYS: 'my_keys',
  INSTRUCTIONS: 'instructions',
  LEGAL: 'legal',

  /** Алиас LEGAL: callback «условия» и маршрут SupportCommand */
  SUPPORT: 'legal',

  // Платформы для инструкций
  PLATFORM_IOS: 'platform_ios',
  PLATFORM_ANDROID: 'platform_android',
  PLATFORM_WINDOWS: 'platform_windows',
  PLATFORM_MACOS: 'platform_macos',

  // Выбор срока
  FREE_TEST: 'free_test',
  WEEK: 'week',
  MONTH_1: 'month_1',
  MONTH_3: 'month_3',
  MONTH_6: 'month_6',

  // Копирование ключа
  COPY_KEY: 'copy_key',
} as const;

// ============================================================================
// КОНФИГУРАЦИЯ МЕНЮ
// ============================================================================

export const CHAT_MENU_BUTTON = {
  type: 'commands',
  text: '[ МЕНЮ ]',
} as const;

// Ссылки для раздела Условия и поддержка
export const LEGAL_LINKS = {
  FAQ: {
    name: '🧠 FAQ и ответы',
    url: 'https://telegra.ph/VPN-01-10-14',
  },
  TERMS: {
    name: '📄 Условия сервиса',
    url: 'https://telegra.ph/Polzovatelskoe-soglashenie-04-01-19',
  },
  PRIVACY: {
    name: '📄 Политика конфиденциальности',
    url: 'https://telegra.ph/Politika-konfidencialnosti-04-01-26',
  },
} as const;

// Ссылки на инструкции для платформ
export const PLATFORM_GUIDES = {
  IOS: 'https://telegra.ph/IPhone-03-02-5',
  ANDROID: 'https://telegra.ph/Podklyuchenie-VPN-na-Android-01-12',
  WINDOWS: 'https://telegra.ph/Podklyuchenie-VPN-na-Windows-01-12',
  MACOS: 'https://telegra.ph/IPhone-03-02-5',
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  DEFAULT:
    '⚠️ *Произошла небольшая ошибка*\n\nМы уже работаем над её устранением. Попробуйте позже или обратитесь в поддержку.',
  DATABASE:
    '⚠️ *Проблема с базой данных*\n\nНе удалось сохранить данные. Пожалуйста, попробуйте через минуту.',
  NETWORK:
    '⚠️ *Проблема со связью*\n\nНе удалось связаться с сервером. Попробуйте позже.',
  VALIDATION: '⚠️ *Некорректные данные*\n\nПроверьте ввод и попробуйте снова.',
} as const;
