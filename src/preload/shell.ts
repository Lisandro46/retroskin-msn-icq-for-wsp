import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { ShellApi } from '@shared/types'

const on =
  <T>(channel: string) =>
  (callback: (payload: T) => void): void => {
    ipcRenderer.on(channel, (_event: IpcRendererEvent, payload: T) => callback(payload))
  }

const api: ShellApi = {
  getSettings: () => ipcRenderer.invoke('shell:settings'),
  setSettings: (patch) => ipcRenderer.send('shell:settings:set', patch),
  layout: (rect) => ipcRenderer.send('shell:layout', rect),
  windowControl: (action) => ipcRenderer.send('shell:window', action),
  openMenu: (menu, x, y) => ipcRenderer.send('shell:menu', { menu, x, y }),
  setWaVisible: (visible) => ipcRenderer.send('shell:wa-visible', visible),
  setIcon: (dataUrl) => ipcRenderer.send('shell:icon', dataUrl),
  soundFile: (skin, sound) => ipcRenderer.invoke('shell:sound-file', skin, sound),
  sendNudge: () => ipcRenderer.send('shell:nudge'),
  focusSearch: () => ipcRenderer.send('shell:focus-search'),
  onSettings: on('settings'),
  onWaState: on('wa-state'),
  onPlay: on('play'),
  onShake: on('shake'),
  onMaximized: on('maximized'),
  onDialog: on('dialog'),
  onProfilePic: on('profile-pic')
}

contextBridge.exposeInMainWorld('messenger', api)
