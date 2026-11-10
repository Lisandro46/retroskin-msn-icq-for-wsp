/**
 * Winks ("guiños"), after MSN Messenger 7: a message that is only one of these emoji
 * plays big over the conversation. Nothing special is sent: it is a plain emoji, so it
 * works with any contact and whoever does not use this app just sees the emoji.
 */
export type WinkAnim = 'kiss' | 'beat' | 'laugh' | 'bloom' | 'break' | 'pop' | 'cry' | 'flame'

export interface Wink {
  id: string
  emoji: string
  /** Menu label in the MSN skin (Spanish) and in the ICQ skin (English). */
  label: string
  labelEn: string
  anim: WinkAnim
}

export const WINKS: readonly Wink[] = [
  { id: 'kiss', emoji: '💋', label: 'Beso', labelEn: 'Kiss', anim: 'kiss' },
  { id: 'heart', emoji: '❤️', label: 'Corazón', labelEn: 'Heart', anim: 'beat' },
  { id: 'laugh', emoji: '😂', label: 'Carcajada', labelEn: 'Laugh', anim: 'laugh' },
  { id: 'rose', emoji: '🌹', label: 'Rosa', labelEn: 'Rose', anim: 'bloom' },
  { id: 'broken', emoji: '💔', label: 'Corazón roto', labelEn: 'Broken heart', anim: 'break' },
  { id: 'party', emoji: '🎉', label: 'Fiesta', labelEn: 'Party', anim: 'pop' },
  { id: 'blow', emoji: '😘', label: 'Besito', labelEn: 'Blow a kiss', anim: 'kiss' },
  { id: 'cry', emoji: '😭', label: 'Llanto', labelEn: 'Crying', anim: 'cry' },
  { id: 'clap', emoji: '👏', label: 'Aplausos', labelEn: 'Applause', anim: 'pop' },
  { id: 'fire', emoji: '🔥', label: 'Fuego', labelEn: 'Fire', anim: 'flame' }
]

/** Variation selectors and skin tones do not change which wink it is. */
const normalize = (text: string): string => text.replace(/[︎️\u{1F3FB}-\u{1F3FF}]/gu, '').trim()

const BY_EMOJI = new Map(WINKS.map((wink) => [normalize(wink.emoji), wink]))

/** The wink for a message whose whole text is one wink emoji. */
export const winkFor = (text: string): Wink | undefined => (text.length > 16 ? undefined : BY_EMOJI.get(normalize(text)))
