import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  nativeTheme,
  screen,
  shell,
  Tray,
  WebContentsView,
  type MenuItemConstructorOptions
} from 'electron'
import type { MenuId, Rect, Settings, SkinId, SoundId, WaState } from '@shared/types'
import { ICQ_STATUS_LABEL, MSN_STATUS_LABEL, type IcqStatus, type MsnStatus } from '@shared/types'
import baseCss from '@wa/css/base.css?raw'
import chromeCss from '@wa/css/chrome.css?raw'
import msnCss from '@wa/css/msn.css?raw'
import icqCss from '@wa/css/icq.css?raw'
import { iconCssVars } from '@shared/icons'
import { ensureSoundsDir, soundsDir, store } from './store'
import { showToast } from './toast'

const WHATSAPP_URL = 'https://web.whatsapp.com/'
/** WhatsApp only serves browsers it knows, so the view introduces itself as plain Chrome. */
const CHROME_UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome.split('.')[0]}.0.0.0 Safari/537.36`

let win: BrowserWindow | undefined
let wa: WebContentsView | undefined
let tray: Tray | undefined
let waState: WaState = 'loading'
let waVisible = true
let contentRect: Rect = { x: 0, y: 0, width: 0, height: 0 }

const settings = (): Settings => store.get()

const sendShell = (channel: string, ...args: unknown[]): void => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, ...args)
}
const sendWa = (channel: string, ...args: unknown[]): void => {
  if (wa && !wa.webContents.isDestroyed()) wa.webContents.send(channel, ...args)
}

function updateSettings(patch: Partial<Settings>): void {
  const next = store.update(patch)
  applyTheme(next.skin)
  applyZoom()
  sendShell('settings', next)
  sendWa('wa:settings', next)
  if (win) {
    win.setAlwaysOnTop(next.alwaysOnTop)
    win.setTitle(windowTitle(next.skin))
    win.setBackgroundColor(BACKGROUND[next.skin])
  }
  refreshTray()
}

/** The retro skins are drawn over WhatsApp's light theme; the original skin follows Windows. */
const applyTheme = (skin: SkinId): void => {
  nativeTheme.themeSource = skin === 'off' ? 'system' : 'light'
}

/** The originals were dense 8-pt UIs; WhatsApp is shrunk a bit to match. */
const ZOOM: Record<SkinId, number> = { msn: 0.9, icq: 0.86, off: 1 }
const applyZoom = (): void => wa?.webContents.setZoomFactor(ZOOM[settings().skin])

const BACKGROUND: Record<SkinId, string> = { msn: '#dbe8f8', icq: '#c0c0c0', off: '#111b21' }
const windowTitle = (skin: SkinId): string => (skin === 'msn' ? 'MSN Messenger' : skin === 'icq' ? 'ICQ' : 'WhatsApp')

/* ----------------------------------------------------------- the WhatsApp view */

function placeView(): void {
  if (!wa) return
  const show = waVisible && waState !== 'loading'
  wa.setVisible(show)
  wa.setBounds({
    x: Math.round(contentRect.x),
    y: Math.round(contentRect.y),
    width: Math.max(0, Math.round(contentRect.width)),
    height: Math.max(0, Math.round(contentRect.height))
  })
}

function createWhatsAppView(window: BrowserWindow): WebContentsView {
  const view = new WebContentsView({
    webPreferences: {
      partition: 'persist:whatsapp',
      preload: join(__dirname, '../preload/whatsapp.js'),
      contextIsolation: true,
      sandbox: false,
      spellcheck: true
    }
  })
  view.setBackgroundColor('#00000000')
  const contents = view.webContents
  contents.setUserAgent(CHROME_UA)
  contents.session.setUserAgent(CHROME_UA)

  const injectCss = (): void => {
    void contents.insertCSS(`${iconCssVars()}\n${baseCss}\n${chromeCss}\n${msnCss}\n${icqCss}`)
    applyZoom()
  }
  contents.on('dom-ready', injectCss)
  contents.on('did-start-navigation', (_event, _url, _inPlace, isMainFrame) => {
    if (isMainFrame) setWaState('loading')
  })

  // Links from chats open in the real browser.
  contents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://web.whatsapp.com')) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  // Notifications and microphone/camera keep working like in Chrome.
  contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(['notifications', 'media', 'clipboard-sanitized-write', 'clipboard-read', 'fullscreen'].includes(permission))
  })

  window.contentView.addChildView(view)
  void contents.loadURL(WHATSAPP_URL)
  return view
}

function setWaState(next: WaState): void {
  if (next === waState) return
  waState = next
  sendShell('wa-state', next)
  placeView()
}

/* --------------------------------------------------------------- shaking */

const SHAKE_PATTERN: [number, number][] = [
  [-10, 0], [10, -6], [-8, 8], [8, -8], [-10, 6], [10, 0], [-6, -8], [6, 8],
  [-10, 0], [10, -6], [-8, 8], [8, -4], [-6, 6], [6, 0], [-4, -4], [2, 2], [0, 0]
]
let shaking = false
let lastShake = 0

function shake(): void {
  if (!win || !settings().shake || shaking) return
  if (Date.now() - lastShake < 2500) return
  lastShake = Date.now()
  if (win.isMinimized()) win.restore()
  if (win.isMaximized() || win.isFullScreen()) {
    sendShell('shake')
    return
  }
  shaking = true
  const [x, y] = win.getPosition()
  let i = 0
  const timer = setInterval(() => {
    if (!win || win.isDestroyed()) return clearInterval(timer)
    const [dx, dy] = SHAKE_PATTERN[i++]
    win.setPosition(x + dx, y + dy)
    if (i >= SHAKE_PATTERN.length) {
      clearInterval(timer)
      win.setPosition(x, y)
      shaking = false
    }
  }, 32)
}

/* ------------------------------------------------------------- events from WA */

function play(sound: SoundId): void {
  if (settings().sounds) sendShell('play', sound)
}


/** Only local profile fields and a fixed set of menu actions cross this bridge. */
function registerSidebarEvents(): void {
  ipcMain.on('wa:profile-edit', (event, patch: Record<string, unknown>) => {
    if (event.sender !== wa?.webContents || !patch || typeof patch !== 'object') return
    const clean: Partial<Settings> = {}
    if (typeof patch.nick === 'string') {
      const nick = patch.nick.replace(/\s+/g, ' ').trim().slice(0, 80)
      if (nick) clean.nick = nick
    }
    if (typeof patch.personalMessage === 'string') clean.personalMessage = patch.personalMessage.replace(/\s+/g, ' ').trim().slice(0, 120)
    if (typeof patch.uin === 'string') {
      const uin = patch.uin.replace(/\D/g, '').slice(0, 12)
      if (uin) clean.uin = uin
    }
    if (Object.keys(clean).length) updateSettings(clean)
  })
  ipcMain.on('wa:menu', (event, request: { menu: MenuId; x: number; y: number }) => {
    if (event.sender !== wa?.webContents || !request) return
    if (!['status', 'tools', 'icq-main', 'icq-services'].includes(request.menu)) return
    if (!Number.isFinite(request.x) || !Number.isFinite(request.y)) return
    const zoom = wa!.webContents.getZoomFactor()
    popup(request.menu, contentRect.x + request.x * zoom, contentRect.y + request.y * zoom)
  })
}

function registerWaEvents(): void {
  registerSidebarEvents()
  ipcMain.on('wa:hello', (event) => {
    if (event.sender === wa?.webContents) event.sender.send('wa:settings', settings())
  })
  ipcMain.on('wa:state', (_event, state: WaState) => setWaState(state))
  ipcMain.on('wa:profile-pic', (_event, url: string | null) => sendShell('profile-pic', url))

  ipcMain.on('wa:nudge-sent', () => {
    play('nudge')
    shake()
  })
  ipcMain.on('wa:nudge-received', (_event, { name }: { name: string }) => {
    play('nudge')
    shake()
    win?.flashFrame(!win.isFocused())
    toast('nudge', name, 'te envió un zumbido.')
  })
  ipcMain.on('wa:incoming', (_event, { name, preview, openChat }: { name: string; preview: string; openChat: boolean }) => {
    const focused = !!win?.isFocused()
    if (openChat && focused) return
    play('message')
    if (!focused) {
      win?.flashFrame(true)
      toast('message', name, preview)
    }
  })
  ipcMain.on('wa:online', (_event, { name }: { name: string }) => {
    play('online')
    if (!win?.isFocused()) toast('online', name, '')
  })
}

function toast(kind: 'message' | 'online' | 'nudge', name: string, text: string): void {
  const { skin, toasts } = settings()
  if (!toasts || skin === 'off' || !name) return
  showToast({ skin, kind, name, text }, () => {
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })
}

/* ------------------------------------------------------------------ menus */

function skinItems(): MenuItemConstructorOptions[] {
  const current = settings().skin
  return [
    { label: 'MSN Messenger 7.5', type: 'radio', checked: current === 'msn', click: () => updateSettings({ skin: 'msn' }) },
    { label: 'ICQ 2000b', type: 'radio', checked: current === 'icq', click: () => updateSettings({ skin: 'icq' }) },
    { label: 'WhatsApp original', type: 'radio', checked: current === 'off', click: () => updateSettings({ skin: 'off' }) }
  ]
}

function toggleItems(spanish: boolean): MenuItemConstructorOptions[] {
  const s = settings()
  return [
    { label: spanish ? 'Sonidos' : 'Sounds', type: 'checkbox', checked: s.sounds, click: () => updateSettings({ sounds: !s.sounds }) },
    { label: spanish ? 'Sacudir la ventana con los zumbidos' : 'Shake window on Zumbido', type: 'checkbox', checked: s.shake, click: () => updateSettings({ shake: !s.shake }) },
    { label: spanish ? 'Avisos emergentes' : 'Pop-up alerts', type: 'checkbox', checked: s.toasts, click: () => updateSettings({ toasts: !s.toasts }) },
    { label: spanish ? 'Siempre visible' : 'Always on top', type: 'checkbox', checked: s.alwaysOnTop, click: () => updateSettings({ alwaysOnTop: !s.alwaysOnTop }) }
  ]
}

const openSounds = (): void => void shell.openPath(ensureSoundsDir())
const reloadWa = (): void => wa?.webContents.reload()

function buildMenu(id: MenuId): MenuItemConstructorOptions[] {
  const s = settings()
  switch (id) {
    case 'file':
      return [
        { label: 'Cambiar de skin', submenu: skinItems() },
        { label: 'Recargar WhatsApp', click: reloadWa },
        { type: 'separator' },
        { label: 'Cerrar', click: () => win?.close() }
      ]
    case 'contacts':
      return [{ label: 'Buscar un contacto…', accelerator: 'Ctrl+F', click: () => sendWa('wa:focus-search') }]
    case 'actions':
      return [{ label: 'Enviar un zumbido', accelerator: 'Ctrl+G', click: () => sendWa('wa:send-nudge') }]
    case 'tools':
      return [
        { label: 'Skin', submenu: skinItems() },
        { type: 'separator' },
        ...toggleItems(true),
        { type: 'separator' },
        { label: 'Carpeta de sonidos…', click: openSounds },
        { label: 'Opciones…', click: () => sendShell('dialog', 'options') }
      ]
    case 'help':
      return [{ label: 'Acerca de Messenger', click: () => sendShell('dialog', 'about') }]
    case 'status':
      return (Object.keys(MSN_STATUS_LABEL) as MsnStatus[]).map((status) => ({
        label: MSN_STATUS_LABEL[status],
        type: 'radio',
        checked: s.msnStatus === status,
        click: () => updateSettings({ msnStatus: status })
      }))
    case 'icq-main':
      return [
        { label: 'Change Skin', submenu: skinItems() },
        { label: 'Preferences', submenu: [...toggleItems(false), { type: 'separator' }, { label: 'Sounds folder…', click: openSounds }] },
        { label: 'My Details (Nick / ICQ#)…', click: () => sendShell('dialog', 'options') },
        { type: 'separator' },
        { label: 'Reload', click: reloadWa },
        { label: 'About ICQ…', click: () => sendShell('dialog', 'about') },
        { type: 'separator' },
        { label: 'Shut Down', click: () => win?.close() }
      ]
    case 'icq-services':
      return [
        { label: 'Find/Add Users', accelerator: 'Ctrl+F', click: () => sendWa('wa:focus-search') },
        { label: 'Send Zumbido!', accelerator: 'Ctrl+G', click: () => sendWa('wa:send-nudge') }
      ]
    case 'skin':
      return skinItems()
  }
  return []
}

/** ICQ's status menu, shown from the status button and the tray. */
function icqStatusItems(): MenuItemConstructorOptions[] {
  const s = settings()
  return (Object.keys(ICQ_STATUS_LABEL) as IcqStatus[]).map((status) => ({
    label: ICQ_STATUS_LABEL[status],
    type: 'radio',
    checked: s.icqStatus === status,
    click: () => updateSettings({ icqStatus: status })
  }))
}

function popup(id: MenuId, x: number, y: number): void {
  if (!win) return
  const template = id === 'status' && settings().skin === 'icq' ? icqStatusItems() : buildMenu(id)
  Menu.buildFromTemplate(template).popup({ window: win, x: Math.round(x), y: Math.round(y) })
}

/* ------------------------------------------------------------------- tray */

let trayImage: Electron.NativeImage | undefined

function refreshTray(): void {
  if (!tray) return
  const s = settings()
  tray.setToolTip(s.skin === 'icq' ? `ICQ# ${s.uin} - ${s.nick}` : s.skin === 'msn' ? `MSN Messenger - ${s.nick}` : 'WhatsApp')
  if (trayImage) tray.setImage(trayImage)
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir', click: () => (win?.show(), win?.focus()) },
      { label: 'Enviar un zumbido', click: () => sendWa('wa:send-nudge') },
      { label: 'Estado', submenu: s.skin === 'icq' ? icqStatusItems() : buildMenu('status') },
      { label: 'Skin', submenu: skinItems() },
      { type: 'separator' },
      { label: 'Salir', click: () => win?.close() }
    ])
  )
}

/* ----------------------------------------------------------------- window */

function createWindow(): void {
  const s = settings()
  applyTheme(s.skin)
  const { bounds, maximized } = store.windowState()
  const visible = bounds && screen.getAllDisplays().some((d) => {
    const a = d.workArea
    return bounds.x < a.x + a.width && bounds.x + bounds.width > a.x && bounds.y < a.y + a.height && bounds.y + bounds.height > a.y
  })
  win = new BrowserWindow({
    ...(visible ? bounds : { width: 1040, height: 760 }),
    minWidth: 720,
    minHeight: 520,
    frame: false,
    show: false,
    backgroundColor: BACKGROUND[s.skin],
    title: windowTitle(s.skin),
    alwaysOnTop: s.alwaysOnTop,
    webPreferences: {
      preload: join(__dirname, '../preload/shell.js'),
      sandbox: false,
      contextIsolation: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  })
  if (maximized) win.maximize()
  win.once('ready-to-show', () => win?.show())
  win.on('maximize', () => sendShell('maximized', true))
  win.on('unmaximize', () => sendShell('maximized', false))
  win.on('focus', () => win?.flashFrame(false))
  win.on('close', () => {
    if (win) store.saveWindowState(win.getNormalBounds(), win.isMaximized())
  })
  win.on('closed', () => {
    win = undefined
    wa = undefined
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  wa = createWhatsAppView(win)

  if (process.env.ELECTRON_RENDERER_URL) void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void win.loadFile(join(__dirname, '../renderer/index.html'))

  tray = new Tray(nativeImage.createEmpty())
  tray.on('click', () => (win?.isVisible() && win.isFocused() ? win.minimize() : (win?.show(), win?.focus())))
  refreshTray()
}

function registerShellEvents(): void {
  ipcMain.handle('shell:settings', () => settings())
  ipcMain.on('shell:settings:set', (_event, patch: Partial<Settings>) => updateSettings(patch))
  ipcMain.on('shell:layout', (_event, rect: Rect) => {
    contentRect = rect
    placeView()
  })
  ipcMain.on('shell:wa-visible', (_event, visible: boolean) => {
    waVisible = visible
    placeView()
  })
  ipcMain.on('shell:window', (_event, action: 'minimize' | 'maximize' | 'close') => {
    if (!win) return
    if (action === 'minimize') win.minimize()
    else if (action === 'maximize') (win.isMaximized() ? win.unmaximize() : win.maximize())
    else win.close()
  })
  ipcMain.on('shell:menu', (_event, { menu, x, y }: { menu: MenuId; x: number; y: number }) => popup(menu, x, y))
  ipcMain.on('shell:icon', (_event, dataUrl: string) => {
    const image = nativeImage.createFromDataURL(dataUrl)
    if (image.isEmpty()) return
    trayImage = image.resize({ width: 16, height: 16, quality: 'best' })
    win?.setIcon(image)
    refreshTray()
  })
  ipcMain.on('shell:nudge', () => sendWa('wa:send-nudge'))
  ipcMain.on('shell:focus-search', () => sendWa('wa:focus-search'))
  ipcMain.handle('shell:sound-file', (_event, skin: SkinId, sound: SoundId) => {
    for (const [ext, mime] of [['wav', 'audio/wav'], ['mp3', 'audio/mpeg'], ['ogg', 'audio/ogg']]) {
      const path = join(soundsDir(), skin, `${sound}.${ext}`)
      if (existsSync(path)) return `data:${mime};base64,${readFileSync(path).toString('base64')}`
    }
    return null
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  })
  app.setAppUserModelId('com.lisandro.retro-messenger')
  app.whenReady().then(() => {
    ensureSoundsDir()
    registerShellEvents()
    registerWaEvents()
    createWindow()
  })
  app.on('window-all-closed', () => app.quit())
}
