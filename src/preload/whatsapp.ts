/**
 * Runs inside web.whatsapp.com (isolated world). It never reads or sends anything
 * on its own: it only tags existing nodes with data-wm-* attributes for the skin CSS,
 * draws a small overlay (toolbar, pictures, status line) and, when the user asks,
 * types *ZUMBIDO* in the composer and presses send.
 */
import { ipcRenderer } from 'electron'
import { NUDGE_TEXT, type Settings, type SkinId, type WaState } from '@shared/types'
import { icqFlower, msnLogo, nudgeIcon, samplePicture, smileyIcon, svgUrl } from '@shared/icons'
import { sidebarProfile, sidebarFooter, sidebarTools } from '@shared/sidebar'
import { buttonWithIcon, first, hasIcon, ICON, ONLINE_RE, PRE_PLAIN_RE, SEL, TYPING_RE } from '@wa/selectors'

let settings: Settings | undefined
let state: WaState | undefined
const html = (): HTMLElement => document.documentElement
const skin = (): SkinId => settings?.skin ?? 'off'

const NUDGE_COOLDOWN_MS = 10_000

ipcRenderer.on('wa:settings', (_event, next: Settings) => {
  const skinChanged = next.skin !== settings?.skin
  settings = next
  applySkin()
  if (skinChanged) buildOverlay()
  syncSidebar()
  tick()
})
ipcRenderer.on('wa:send-nudge', () => void sendNudge())
ipcRenderer.on('wa:focus-search', () => focusSearch())

function applySkin(): void {
  const root = html()
  if (!root) return
  const value = skin() === 'off' ? undefined : skin()
  if (root.dataset.skin !== value) {
    if (value) root.dataset.skin = value
    else delete root.dataset.skin
  }
}

const setData = (el: HTMLElement, key: string, value: string): void => {
  if (el.dataset[key] !== value) el.dataset[key] = value
}

/* ----------------------------------------------------------------- overlay */

let overlay: HTMLElement | undefined
let sidebarFingerprint = ''
let layoutObserver: ResizeObserver | undefined
let observedLayout: Element[] = []
const part = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
  overlay?.querySelector<T>(`#${id}`) ?? null

function buildOverlay(): void {
  if (!document.body) return
  overlay?.remove()
  overlay = document.createElement('div')
  overlay.id = 'wm-root'
  sidebarFingerprint = ''
  const s = skin()
  if (s === 'off') {
    overlay.innerHTML = `<div id="wm-bar" class="wm-off"><button id="wm-nudge" title="Enviar un zumbido (Ctrl+G)">${nudgeIcon(16)}</button></div>`
  } else if (s === 'msn') {
    overlay.innerHTML = `
      <div id="wm-login"><span class="wm-logo">${msnLogo(48)}</span>
        <div><b>Iniciar sesión</b><span>Escaneá el código con WhatsApp en tu teléfono para iniciar sesión en Messenger.</span></div></div>
      <div id="wm-status"></div>
      <div id="wm-bar">
        <button id="wm-font" title="Cambiar la fuente"><b>A</b> Fuente</button>
        <button id="wm-emoji" title="Emoticonos">${smileyIcon(16)}<span class="wm-caret">▾</span></button>
        <button id="wm-nudge" title="Enviar un zumbido (Ctrl+G)">${nudgeIcon(16)} Zumbido</button>
        <span class="wm-grow"></span>
        <button id="wm-send" title="Enviar (Enter)">Enviar</button>
      </div>
      <img id="wm-pic-contact" alt="" /><img id="wm-pic-own" alt="" />`
  } else {
    overlay.innerHTML = `
      <div id="wm-login"><span class="wm-logo">${icqFlower('logo', 44)}</span>
        <div><b>ICQ Login</b><span>Scan the code with WhatsApp on your phone to link WhatsApp. Your ICQ details stay local.</span></div></div>
      <div id="wm-bar">

        <span id="wm-status"></span>
        <button id="wm-send" title="Send (Enter)">Send</button>
      </div>`
  }
  if (s !== 'off') overlay.insertAdjacentHTML('afterbegin', `<section id="wm-profile"></section><footer id="wm-side-footer"></footer><div id="wm-chat-title"></div>${s === 'icq' ? `<nav id="wm-side-tools" aria-label="ICQuick">${sidebarTools()}</nav>` : ''}`)
  document.body.appendChild(overlay)
  bindSidebar()
  syncSidebar()
  // Toolbar buttons must not steal focus from WhatsApp's composer.
  overlay.addEventListener('mousedown', (event) => {
    if ((event.target as HTMLElement).closest('button')) event.preventDefault()
  })
  part('wm-nudge')?.addEventListener('click', () => void sendNudge())
  part('wm-emoji')?.addEventListener('click', () => buttonWithIcon(document.querySelector(SEL.footer), ICON.emoji)?.click())
  part('wm-font')?.addEventListener('click', () => notice('Las fuentes de Messenger no viajan por WhatsApp :)'))
  part('wm-send')?.addEventListener('click', () => pressSend())
  lastPics = { contact: '', own: '' }
}

let noticeUntil = 0
let noticeText = ''
function notice(text: string): void {
  noticeText = text
  noticeUntil = Date.now() + 4000
  tick()
}


function syncSidebar(): void {
  if (!settings || skin() === 'off') return
  const profile = part('wm-profile')
  const footer = part('wm-side-footer')
  const fingerprint = JSON.stringify(settings)
  if (fingerprint === sidebarFingerprint || profile?.contains(document.activeElement)) return
  if (profile) profile.innerHTML = sidebarProfile(settings)
  if (footer) footer.innerHTML = sidebarFooter(settings)
  const img = part<HTMLImageElement>('wm-profile-pic')
  if (img) {
    img.src = ownPicture() || svgUrl(samplePicture(96))
    img.onerror = () => { img.onerror = null; img.src = svgUrl(samplePicture(96)) }
  }
  sidebarFingerprint = fingerprint
}

function bindSidebar(): void {
  overlay?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.closest('[data-wm-action="search"]')) return focusSearch()
    const button = target.closest<HTMLElement>('[data-wm-menu]')
    if (!button) return
    const r = button.getBoundingClientRect()
    ipcRenderer.send('wa:menu', {
      menu: button.dataset.wmMenu, x: r.left,
      y: button.closest('#wm-side-footer') ? r.top : r.bottom
    })
  })
  overlay?.addEventListener('keydown', (event) => {
    const field = (event.target as HTMLElement).closest<HTMLElement>('[data-wm-edit]')
    if (!field || !settings) return
    // Editing local nick/PM must not send a chat message or a zumbido.
    event.stopPropagation()
    if (event.key === 'Enter') { event.preventDefault(); field.blur() }
    if (event.key === 'Escape') {
      field.textContent = String(settings[field.dataset.wmEdit as keyof Settings] ?? '')
      field.blur()
    }
  })
  overlay?.addEventListener('focusout', (event) => {
    const field = (event.target as HTMLElement).closest<HTMLElement>('[data-wm-edit]')
    if (!field || !settings) return
    const key = field.dataset.wmEdit as 'nick' | 'personalMessage' | 'uin'
    let value = (field.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (key === 'uin') value = value.replace(/\D/g, '').slice(0, 12) || settings.uin
    if (key === 'nick') value = value.slice(0, 80) || settings.nick
    if (key === 'personalMessage') value = value.slice(0, 120)
    field.textContent = value
    if (value !== settings[key]) ipcRenderer.send('wa:profile-edit', { [key]: value })
  })
}

function placeOverlay(): void {
  if (!overlay) return
  const main = document.querySelector<HTMLElement>(SEL.main)
  const footer = document.querySelector<HTMLElement>(SEL.footer)
  const side = document.querySelector<HTMLElement>(SEL.side)
  const layoutNodes = [side, main, footer, document.querySelector(SEL.header)].filter((el): el is HTMLElement => el instanceof HTMLElement)
  if (layoutObserver && (layoutNodes.length !== observedLayout.length || layoutNodes.some((node, i) => node !== observedLayout[i]))) {
    layoutObserver.disconnect()
    layoutNodes.forEach(node => layoutObserver?.observe(node))
    observedLayout = layoutNodes
  }
  const sideRect = side?.getBoundingClientRect()
  const sideVisible = state === 'ready' && skin() !== 'off' && !!sideRect && sideRect.width > 0 && sideRect.height > 0
  overlay.classList.toggle('wm-sidebar', sideVisible)
  if (side) {
    if (sideVisible) setData(side, 'wmSidebar', '1')
    else delete side.dataset.wmSidebar
  }
  const mainRect = main?.getBoundingClientRect()
  const footerRect = footer?.getBoundingClientRect()
  const visible = state === 'ready' && !!mainRect && !!footerRect && mainRect.width > 0 && mainRect.height > 0 && footerRect.height > 0
  overlay.classList.toggle('wm-chat', visible)
  if (main) setData(main, 'wmChatFrame', visible && skin() !== 'off' ? '1' : '0')
  const vars: Record<string, number> = {}
  if (sideVisible && sideRect) Object.assign(vars, {
    'side-top': sideRect.top, 'side-left': sideRect.left,
    'side-width': sideRect.width, 'side-bottom': sideRect.bottom
  })
  if (visible && main && footer) {
    const m = mainRect!
    const f = footerRect!
    const header = document.querySelector<HTMLElement>(SEL.header)
    setData(html(), 'wmCompact', m.width < 520 ? '1' : '0')
    Object.assign(vars, {
      'main-top': m.top, 'main-left': m.left, 'main-width': m.width, 'main-bottom': m.bottom,
      'footer-top': f.top, 'footer-left': f.left, 'footer-width': f.width,
      'header-bottom': header ? header.getBoundingClientRect().bottom : m.top
    })
    const title = part('wm-chat-title')
    const name = headerInfo().name
    const caption = skin() === 'icq' ? `Message Session - ${name}` : `${name} - Conversación`
    if (title && title.textContent !== caption) title.textContent = caption
  }
  for (const [name, value] of Object.entries(vars)) {
    const css = `${Math.round(value)}px`
    if (overlay.style.getPropertyValue(`--wm-${name}`) !== css) overlay.style.setProperty(`--wm-${name}`, css)
  }
}

/* ------------------------------------------------------- open conversation */

function headerInfo(): { name: string; subtitle: string } {
  const header = document.querySelector<HTMLElement>(SEL.header)
  if (!header) return { name: '', subtitle: '' }
  const title = header.querySelector<HTMLElement>(SEL.chatTitle)
  const name = (title?.textContent ?? '').trim()
  const info = header.querySelector<HTMLElement>(SEL.chatInfo) ?? header
  const subtitle =
    [...info.querySelectorAll<HTMLElement>('span')]
      .filter((s) => s.childElementCount === 0 && !title?.contains(s))
      .map((s) => (s.textContent ?? '').trim())
      .find((t) => ONLINE_RE.test(t) || TYPING_RE.test(t)) ?? ''
  return { name, subtitle }
}

let currentChat = ''
let chatOpenedAt = 0
let wasOnline = false
const seenIds = new Set<string>()
let lastIncoming: { date: string; time: string } | undefined

function parseClock(time: string): number | undefined {
  const m = /(\d{1,2}):(\d{2})\s*([ap])?/i.exec(time)
  if (!m) return undefined
  let hours = Number(m[1]) % 24
  if (m[3]) hours = (hours % 12) + (m[3].toLowerCase() === 'p' ? 12 : 0)
  return hours * 60 + Number(m[2])
}

/** Messages that arrive while the chat is open (as opposed to history being loaded). */
function isFresh(time: string): boolean {
  const minutes = parseClock(time)
  if (minutes === undefined) return true
  const now = new Date()
  const diff = Math.abs(now.getHours() * 60 + now.getMinutes() - minutes)
  return Math.min(diff, 1440 - diff) <= 3
}

function markMessages(chatName: string): void {
  const rows = [...document.querySelectorAll<HTMLElement>(SEL.rows)]
  // In groups WhatsApp prints the author inside the bubble; the skin reuses it.
  const group = !!document.querySelector(`${SEL.main} ${SEL.author}`)
  const main = document.querySelector<HTMLElement>(SEL.main)
  if (main) setData(main, 'wmGroup', group ? '1' : '0')
  const seeding = Date.now() - chatOpenedAt < 2000
  let previous = ''
  let previousDir: 'in' | 'out' | undefined
  lastIncoming = undefined
  rows.forEach((row, index) => {
    const bubble = row.querySelector<HTMLElement>(SEL.bubble)
    if (!bubble) {
      // Date separators and system notices break the "X dice:" grouping.
      setData(row, 'wmSystem', '1')
      previous = ''
      previousDir = undefined
      return
    }
    const wrapper = row.querySelector<HTMLElement>(SEL.messageWrapper) ?? row
    const pre = bubble.querySelector(SEL.prePlainText)?.getAttribute('data-pre-plain-text') ?? ''
    const parsed = PRE_PLAIN_RE.exec(pre)

    // WhatsApp draws a tail on the first bubble of each run; the rest follow it.
    const tail = row.querySelector(SEL.tail)?.getAttribute('data-testid')
    let dir: 'in' | 'out' | undefined = tail === 'tail-out' ? 'out' : tail === 'tail-in' ? 'in' : previousDir
    if (!dir) {
      const label = (bubble.querySelector('span[aria-label]')?.getAttribute('aria-label') ?? '').replace(/:\s*$/, '').trim()
      dir = parsed && label === parsed[3].trim() ? 'in' : 'out'
    }
    const out = dir === 'out'
    const sender = out ? settings?.nick || 'Yo' : parsed?.[3]?.trim() || (tail ? chatName : previous) || chatName
    const time = parsed?.[1]?.trim() || (row.querySelector(SEL.messageMeta)?.textContent ?? '').trim()

    setData(wrapper, 'wmMsg', dir)
    setData(wrapper, 'wmSender', sender)
    setData(wrapper, 'wmTime', time)
    setData(wrapper, 'wmFirst', tail || sender !== previous ? '1' : '0')
    previous = sender
    previousDir = dir
    if (!out && parsed) lastIncoming = { date: parsed[2].trim(), time }

    const text = bubble.querySelector<HTMLElement>(SEL.messageText)
    const nudge = !!text && (text.textContent ?? '').trim() === NUDGE_TEXT && !!text.querySelector('strong, b')
    setData(wrapper, 'wmNudge', nudge ? '1' : '0')

    const id = wrapper.getAttribute('data-id') ?? `${chatName}#${index}#${pre}`
    if (seenIds.has(id)) return
    seenIds.add(id)
    if (seeding || out || index < rows.length - 3 || !isFresh(time)) return
    if (nudge) ipcRenderer.send('wa:nudge-received', { name: sender })
    else if (!document.hasFocus()) {
      ipcRenderer.send('wa:incoming', { name: sender, preview: (text?.textContent ?? '').trim().slice(0, 120), openChat: true })
    }
  })
}

function statusLine(name: string, subtitle: string): string {
  if (Date.now() < noticeUntil) return noticeText
  const s = skin()
  if (TYPING_RE.test(subtitle)) return s === 'icq' ? `${name} is typing...` : `${name} está escribiendo un mensaje...`
  if (s === 'icq') return ''
  if (lastIncoming) return `Último mensaje recibido el ${lastIncoming.date} a las ${lastIncoming.time}.`
  return ''
}

function updateConversation(): void {
  const { name, subtitle } = headerInfo()
  if (name !== currentChat) {
    currentChat = name
    chatOpenedAt = Date.now()
    seenIds.clear()
    wasOnline = ONLINE_RE.test(subtitle)
  }
  const status = part('wm-status')
  if (!name) {
    if (status && status.textContent && Date.now() >= noticeUntil) status.textContent = ''
    return
  }
  markMessages(name)

  const online = ONLINE_RE.test(subtitle) || TYPING_RE.test(subtitle)
  if (online && !wasOnline && Date.now() - chatOpenedAt > 2500) ipcRenderer.send('wa:online', { name })
  wasOnline = online

  const line = statusLine(name, subtitle)
  if (status && status.textContent !== line) status.textContent = line
  if (skin() === 'msn') updatePictures()
}

let lastPics = { contact: '', own: '' }
function updatePictures(): void {
  const contact = contactPicture() || svgUrl(samplePicture(96))
  const own = ownPicture() || svgUrl(samplePicture(96))
  const contactImg = part<HTMLImageElement>('wm-pic-contact')
  const ownImg = part<HTMLImageElement>('wm-pic-own')
  if (contactImg && lastPics.contact !== contact) contactImg.src = lastPics.contact = contact
  if (ownImg && lastPics.own !== own) ownImg.src = lastPics.own = own
}

const ownPicture = (): string => first<HTMLImageElement>(SEL.ownPicture)?.src ?? ''

/** The open chat's picture: an <img>, or an <image> inside an SVG mask. Emoji placeholders are skipped. */
function contactPicture(): string {
  const avatar = document.querySelector(SEL.headerAvatar)
  if (!avatar) return ''
  const img = [...avatar.querySelectorAll<HTMLImageElement>('img')].find((i) => !i.classList.contains('emoji') && /^https?:|^blob:/.test(i.src))
  if (img) return img.src
  const image = avatar.querySelector<SVGImageElement>('image')
  return image?.href.baseVal || image?.getAttribute('xlink:href') || ''
}

/* --------------------------------------------------------------- chat list */

let unreadByChat = new Map<string, number>()
let listSeeded = false

function badgeCount(badge: Element): number {
  const n = parseInt(badge.getAttribute('aria-label') ?? badge.textContent ?? '', 10)
  return Number.isFinite(n) ? n : 1
}

function watchChatList(): void {
  const next = new Map<string, number>()
  for (const row of document.querySelectorAll<HTMLElement>(SEL.listRows)) {
    const name = row.querySelector(SEL.listTitle)?.getAttribute('title') ?? ''
    const cell = row.querySelector<HTMLElement>(SEL.listCell)
    const avatar = cell?.firstElementChild?.firstElementChild as HTMLElement | null | undefined
    if (avatar) {
      setData(avatar, 'wmRole', 'avatar')
      setData(row, 'wmRow', hasIcon(avatar, ICON.group) ? 'group' : 'chat')
    }
    const badge = row.querySelector(SEL.unreadBadge)
    setData(row, 'wmUnread', badge ? '1' : '0')
    if (!badge || !name) continue
    const count = badgeCount(badge)
    next.set(name, count)
    if (listSeeded && count > (unreadByChat.get(name) ?? 0)) {
      const status = row.querySelector(SEL.listPreview)
      const preview = (status?.getAttribute('title') || status?.textContent || '').trim()
      const nudge = new RegExp(`(^|:\\s*)\\*?${NUDGE_TEXT}\\*?$`).test(preview)
      if (nudge) ipcRenderer.send('wa:nudge-received', { name })
      else ipcRenderer.send('wa:incoming', { name, preview: preview.slice(0, 120), openChat: name === currentChat })
    }
  }
  unreadByChat = next
  listSeeded = true
}

/* ------------------------------------------------------------------- nudge */

let lastNudge = 0
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const composer = (): HTMLElement | null => document.querySelector<HTMLElement>(SEL.composer)

/** Click WhatsApp's own send button (only shown while there is text). */
function pressSend(): void {
  const box = composer()
  if (!box) return
  if (document.activeElement !== box) box.focus()
  const footer = document.querySelector(SEL.footer)
  const send =
    buttonWithIcon(footer, ICON.send) ??
    footer?.querySelector<HTMLElement>('button[aria-label="Send"], button[aria-label="Enviar"], button[aria-label="Enviar mensaje"]') ??
    null
  if (send) send.click()
  else if ((box.textContent ?? '').trim()) {
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }))
  }
}

async function sendNudge(): Promise<void> {
  const box = composer()
  if (!box) return notice('Abrí una conversación para enviar un zumbido.')
  if (Date.now() - lastNudge < NUDGE_COOLDOWN_MS) {
    return notice(skin() === 'icq' ? 'Esperá un poco antes de otro zumbido.' : 'No podés enviar zumbidos con tanta frecuencia.')
  }
  if ((box.textContent ?? '').trim()) return notice('Enviá o borrá lo que estás escribiendo antes del zumbido.')
  lastNudge = Date.now()
  box.focus()
  document.execCommand('insertText', false, `*${NUDGE_TEXT}*`)
  await wait(150)
  pressSend()
  notice(skin() === 'icq' ? 'Zumbido enviado.' : 'Enviaste un zumbido.')
  ipcRenderer.send('wa:nudge-sent')
}

function focusSearch(): void {
  const box = first<HTMLElement>(SEL.searchBox)
  box?.focus()
  box?.click()
}

window.addEventListener(
  'keydown',
  (event) => {
    if ((event.target as HTMLElement)?.closest?.('[data-wm-edit]')) return
    if (event.ctrlKey && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'g') {
      event.preventDefault()
      event.stopPropagation()
      void sendNudge()
    }
  },
  true
)

/* ------------------------------------------------------------------- login */

/** On the QR screen, tag WhatsApp's own branding and the "download the app" card so the skin can hide them. */
function markLogin(): void {
  for (const selector of SEL.loginBranding) {
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => setData(el, 'wmHide', '1'))
  }
  const qr = document.querySelector(SEL.qrBox)
  const download = document.querySelector(SEL.downloadCard)
  if (!qr || !download) return
  let card: HTMLElement | null = download as HTMLElement
  while (card?.parentElement && !card.parentElement.contains(qr)) card = card.parentElement
  if (card && !card.contains(qr)) setData(card, 'wmHide', '1')
  let box: HTMLElement | null = qr as HTMLElement
  while (box?.parentElement && !box.parentElement.contains(download)) box = box.parentElement
  if (box) setData(box, 'wmRole', 'login-card')
}

/* -------------------------------------------------------------------- loop */

let lastPicSent: string | null | undefined

function detectState(): WaState {
  if (document.querySelector(SEL.ready)) return 'ready'
  if (document.querySelector(SEL.login)) return 'login'
  return 'loading'
}

function tick(): void {
  if (!document.body) return
  applySkin()
  if (!overlay || !overlay.isConnected) buildOverlay()
  const next = detectState()
  if (next !== state) {
    state = next
    html().dataset.wmState = next
    ipcRenderer.send('wa:state', next)
    if (next !== 'ready') listSeeded = false
  }
  if (state === 'login') markLogin()
  if (state === 'ready') {
    syncSidebar()
    const profileImg = part<HTMLImageElement>('wm-profile-pic')
    const own = ownPicture() || svgUrl(samplePicture(96))
    if (profileImg && profileImg.getAttribute('src') !== own) profileImg.src = own
    updateConversation()
    watchChatList()
    const pic = ownPicture() || null
    if (pic !== lastPicSent) {
      lastPicSent = pic
      ipcRenderer.send('wa:profile-pic', pic && pic.startsWith('https:') ? pic : null)
    }
  }
  placeOverlay()
}

let scheduled = false
const schedule = (): void => {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    tick()
  })
}

window.addEventListener('DOMContentLoaded', () => {
  layoutObserver = new ResizeObserver(schedule)
  ipcRenderer.send('wa:hello')
  tick()
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', schedule)
  setInterval(tick, 700)
})
