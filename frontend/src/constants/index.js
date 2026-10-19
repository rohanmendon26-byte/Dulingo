export const LANGS = { en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' };

export const TOPIC_ICONS = {
  Pensions: '👴',
  Taxes: '🧾',
  Certificates: '📜',
  Payments: '💳',
  Grievances: '📣',
  'Travel and Transport': '🚆',
  Transport: '🚆',
  'Govt Applications': '🏛️',
  General: '⭐',
};

export const TYPE_LABEL = {
  audio_mcq: 'Listen & choose',
  fill_blank: 'Fill in the blank',
  essay: 'Essay write',
  mock_form: 'Mock form',
};

/** Returns the item with title/prompt/options/etc. replaced by the chosen language where a translation exists. */
export function localize(item, lang) {
  const tr = lang !== 'en' && item?.translations?.[lang];
  return tr ? { ...item, ...tr } : item;
}
