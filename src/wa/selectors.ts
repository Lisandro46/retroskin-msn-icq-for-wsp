/**
 * Every hook into WhatsApp Web's DOM lives here. Its class names are atomic and
 * change on every deploy, so only ids, roles, data-testid, aria labels and the
 * <title> of its SVG icons are used. When WhatsApp changes something, fix it here.
 */
export const SEL = {
  app: '#app',
  /** Present once the chat list is on screen (logged in). */
  ready: '#pane-side',
  /** QR login screen (the QR itself, or the instructions while it reloads). */
  login: '[data-testid="link-device-qr-code"], #link-device-instructions-list, canvas[aria-label*="QR" i]',
  qrBox: '[data-testid="link-device-qr-code"]',
  downloadCard: '[data-testid="download-native-client-button"]',
  loginBranding: ['[data-testid="wa-logo"]', '[data-testid="wa-wordmark"]'],

  side: '#side',
  chatList: '#pane-side',
  listRows: '#pane-side [role="row"]',
  listCell: '[data-testid="cell-frame-container"]',
  listTitle: '[data-testid="cell-frame-title"] span[title]',
  listPreview: '[data-testid="last-msg-status"]',
  unreadBadge: '[data-testid="icon-unread-count"]',
  searchBox: ['[data-testid="chat-list-search-container"] input', '#side input[role="textbox"]', '#side div[contenteditable="true"]'],
  /** Own profile picture: the "You" button at the bottom of the left rail. */
  ownPicture: ['[data-testid="navbar-footer-section"] img', '[data-navbar-item-index] img[src*="cdn.whatsapp"]'],

  main: '#main',
  header: '#main header',
  headerAvatar: '#main header > div:first-child > [role="button"]:not([data-testid])',
  author: '[data-testid="author"]',
  chatTitle:'[data-testid="conversation-info-header-chat-title"]',
  chatInfo: '[data-testid="conversation-info-header"]',
  footer: '#main footer',
  composer: '#main [data-testid="conversation-compose-box-input"], #main footer div[contenteditable="true"]',
  /** Message rows in the open conversation. */
  rows: '#main [role="row"]',
  bubble: '[data-testid="msg-container"]',
  tail: '[data-testid="tail-in"], [data-testid="tail-out"]',
  /** Carries "[6:55 pm, 10/10/2026] Juan: " for text messages. */
  prePlainText: '[data-pre-plain-text]',
  messageText: '[data-testid="selectable-text"], .selectable-text',
  messageMeta: '[data-testid="msg-meta"]',
  messageWrapper: '[data-id]'
} as const

/** WhatsApp names its icons in the SVG <title>. */
export const ICON = {
  send: /send/i,
  emoji: /smiley|emoji|sticker/i,
  group: /group/i
}

export const ONLINE_RE = /^(en línea|online|on-line)$/i
export const TYPING_RE = /(escribiendo|typing|digitando|grabando|recording)/i
/** "[6:55 pm, 10/10/2026] Juan Pérez: " → time, date, name */
export const PRE_PLAIN_RE = /^\[([^,\]]+),\s*([^\]]+)\]\s(.*?):\s?$/

export function first<T extends Element = HTMLElement>(selectors: readonly string[] | string, root: ParentNode = document): T | null {
  for (const selector of typeof selectors === 'string' ? [selectors] : selectors) {
    const found = root.querySelector<T>(selector)
    if (found) return found
  }
  return null
}

/** A button whose SVG icon title matches, e.g. WhatsApp's send button. */
export function buttonWithIcon(root: ParentNode | null, icon: RegExp): HTMLElement | null {
  if (!root) return null
  for (const title of root.querySelectorAll('button svg title, [role="button"] svg title')) {
    if (icon.test(title.textContent ?? '')) return title.closest<HTMLElement>('button, [role="button"]')
  }
  return null
}

export const hasIcon = (root: ParentNode, icon: RegExp): boolean =>
  [...root.querySelectorAll('svg title')].some((title) => icon.test(title.textContent ?? ''))
