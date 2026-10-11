import './styles/shell.css'
import './styles/msn.css'
import './styles/icq.css'
import type { Settings, WaState } from '@shared/types'
import { icqFlower, msnBuddy, svgUrl } from '@shared/icons'
import { aboutDialog, icqChrome, msnChrome, offChrome, optionsDialog } from './skins'
import { clearSoundCache, playSound } from './sounds'

const api = window.messenger
const root = document.getElementById('root') as HTMLElement
const modal = document.getElementById('modal') as HTMLElement

let settings: Settings
let waState: WaState = 'loading'
let maximized = false
let contentObserver: ResizeObserver | undefined

function render(): void {
  const s = settings
  document.body.dataset.skin = s.skin
  root.innerHTML = s.skin === 'msn' ? msnChrome(s, maximized) : s.skin === 'icq' ? icqChrome(s, maximized) : offChrome(s, maximized)
  document.title = s.skin === 'msn' ? 'MSN Messenger' : s.skin === 'icq' ? 'ICQ' : 'WhatsApp'
  applyWaState()
  watchContent()
  void updateIcon()
}

function applyWaState(): void {
  root.dataset.wa = waState
}

/** Tell the main process where WhatsApp goes. */
function watchContent(): void {
  contentObserver?.disconnect()
  const content = document.getElementById('content')
  if (!content) return
  const report = (): void => {
    const r = content.getBoundingClientRect()
    api.layout({ x: r.left, y: r.top, width: r.width, height: r.height })
  }
  contentObserver = new ResizeObserver(report)
  contentObserver.observe(content)
  report()
}

/** Window and tray icon, drawn from the skin's SVG. */
async function updateIcon(): Promise<void> {
  const s = settings
  const markup = s.skin === 'icq' ? icqFlower(s.icqStatus, 64) : msnBuddy(s.skin === 'msn' ? s.msnStatus : 'online', 64)
  const img = new Image()
  img.src = svgUrl(markup)
  await img.decode().catch(() => undefined)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  canvas.getContext('2d')?.drawImage(img, 0, 0, 64, 64)
  api.setIcon(canvas.toDataURL('image/png'))
}

/* ---------------------------------------------------------------- events */

root.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const win = target.closest<HTMLElement>('[data-win]')
  if (win) return api.windowControl(win.dataset.win as 'minimize' | 'maximize' | 'close')
  const menu = target.closest<HTMLElement>('[data-menu]')
  if (menu) {
    const r = menu.getBoundingClientRect()
    const below = !menu.closest('.icq-bottom')
    return api.openMenu(menu.dataset.menu as never, r.left, below ? r.bottom : r.top)
  }
  const action = target.closest<HTMLElement>('[data-action]')
  if (action?.dataset.action === 'nudge') return api.sendNudge()
  if (action?.dataset.action === 'search') return api.focusSearch()
})

root.addEventListener('dblclick', (event) => {
  if ((event.target as HTMLElement).closest('.titlebar') && !(event.target as HTMLElement).closest('button')) {
    api.windowControl('maximize')
  }
})

/* ---------------------------------------------------------------- dialogs */

function openDialog(kind: 'options' | 'about'): void {
  modal.innerHTML = kind === 'options' ? optionsDialog(settings) : aboutDialog(settings)
  modal.hidden = false
  api.setWaVisible(false)
  const close = (): void => {
    modal.hidden = true
    modal.innerHTML = ''
    api.setWaVisible(true)
  }
  modal.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close))
  const form = modal.querySelector('form')
  form?.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const patch: Partial<Settings> = {}
    const nick = String(data.get('nick') ?? '').trim()
    if (nick) patch.nick = nick
    if (data.has('personalMessage')) patch.personalMessage = String(data.get('personalMessage')).trim()
    const uin = String(data.get('uin') ?? '').replace(/\D/g, '')
    if (uin) patch.uin = uin.slice(0, 12)
    api.setSettings(patch)
    close()
  })
  modal.querySelector<HTMLInputElement>('input')?.focus()
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) modal.querySelector<HTMLElement>('[data-close]')?.click()
  if (event.ctrlKey && event.key.toLowerCase() === 'g') api.sendNudge()
})

/* -------------------------------------------------------------- main bus */

api.onSettings((next) => {
  const skinChanged = next.skin !== settings.skin
  settings = next
  if (skinChanged) clearSoundCache()
  render()
})
api.onWaState((state) => {
  waState = state
  applyWaState()
})
api.onPlay((sound) => void playSound(settings.skin, sound))
api.onShake(() => {
  root.classList.remove('shake')
  void root.offsetWidth
  root.classList.add('shake')
  setTimeout(() => root.classList.remove('shake'), 900)
})
api.onMaximized((value) => {
  maximized = value
  render()
})
api.onDialog(openDialog)

void api.getSettings().then((s) => {
  settings = s
  render()
})
