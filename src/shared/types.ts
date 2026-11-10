export type SkinId = 'msn' | 'icq' | 'off'

export type MsnStatus = 'online' | 'busy' | 'brb' | 'away' | 'phone' | 'lunch' | 'offline'
export type IcqStatus = 'online' | 'ffc' | 'away' | 'na' | 'occupied' | 'dnd' | 'invisible'

export type SoundId = 'message' | 'nudge' | 'online'

/** Everything here is local decoration: none of it reaches WhatsApp. */
export interface Settings {
  skin: SkinId
  nick: string
  personalMessage: string
  msnStatus: MsnStatus
  icqStatus: IcqStatus
  uin: string
  sounds: boolean
  shake: boolean
  toasts: boolean
  alwaysOnTop: boolean
}

/** What the WhatsApp page looks like right now. */
export type WaState = 'loading' | 'login' | 'ready'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type MenuId = 'file' | 'contacts' | 'actions' | 'tools' | 'help' | 'status' | 'icq-main' | 'icq-services' | 'skin'

export interface ToastData {
  skin: SkinId
  kind: 'message' | 'online' | 'nudge'
  name: string
  text: string
}

export interface ShellApi {
  getSettings(): Promise<Settings>
  setSettings(patch: Partial<Settings>): void
  layout(rect: Rect): void
  windowControl(action: 'minimize' | 'maximize' | 'close'): void
  openMenu(menu: MenuId, x: number, y: number): void
  setWaVisible(visible: boolean): void
  setIcon(dataUrl: string): void
  soundFile(skin: SkinId, sound: SoundId): Promise<string | null>
  sendNudge(): void
  onSettings(cb: (settings: Settings) => void): void
  onWaState(cb: (state: WaState) => void): void
  onPlay(cb: (sound: SoundId) => void): void
  onShake(cb: () => void): void
  onMaximized(cb: (maximized: boolean) => void): void
  onDialog(cb: (dialog: 'options' | 'about') => void): void
}

export const MSN_STATUS_LABEL: Record<MsnStatus, string> = {
  online: 'Conectado',
  busy: 'Ocupado',
  brb: 'Vuelvo enseguida',
  away: 'Ausente',
  phone: 'Al teléfono',
  lunch: 'Salí a comer',
  offline: 'Desconectado'
}

export const ICQ_STATUS_LABEL: Record<IcqStatus, string> = {
  online: 'Online',
  ffc: 'Free For Chat',
  away: 'Away',
  na: 'N/A (Extended Away)',
  occupied: 'Occupied (Urgent Msgs)',
  dnd: 'DND (Do not Disturb)',
  invisible: 'Privacy (Invisible)'
}

export const NUDGE_TEXT = 'ZUMBIDO'
