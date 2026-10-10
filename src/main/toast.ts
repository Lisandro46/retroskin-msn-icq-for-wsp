import { join } from 'node:path'
import { BrowserWindow, screen } from 'electron'
import type { ToastData } from '@shared/types'

const WIDTH = 200
const HEIGHT = 120
const LIFETIME_MS = 6000
const open: BrowserWindow[] = []

function restack(): void {
  const area = screen.getPrimaryDisplay().workArea
  open.forEach((toast, i) => {
    if (!toast.isDestroyed()) toast.setPosition(area.x + area.width - WIDTH - 8, area.y + area.height - (HEIGHT + 6) * (i + 1))
  })
}

/** The little "X dice:" window that slides up over the clock, MSN style. */
export function showToast(data: ToastData, onClick: () => void): void {
  if (open.length >= 3) open[0].close()
  const toast = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: data.skin === 'icq' ? '#c0c0c0' : '#e7f0fb',
    webPreferences: { sandbox: true, contextIsolation: true }
  })
  toast.setAlwaysOnTop(true, 'screen-saver')
  open.push(toast)
  restack()

  const query = new URLSearchParams({ skin: data.skin, kind: data.kind, name: data.name, text: data.text }).toString()
  if (process.env.ELECTRON_RENDERER_URL) void toast.loadURL(`${process.env.ELECTRON_RENDERER_URL}/toast.html?${query}`)
  else void toast.loadFile(join(__dirname, '../renderer/toast.html'), { search: query })

  toast.once('ready-to-show', () => toast.showInactive())
  // A click activates the window: treat it as "open the conversation".
  toast.on('focus', () => {
    onClick()
    toast.close()
  })
  const timer = setTimeout(() => !toast.isDestroyed() && toast.close(), LIFETIME_MS)
  toast.on('closed', () => {
    clearTimeout(timer)
    open.splice(open.indexOf(toast), 1)
    restack()
  })
}
