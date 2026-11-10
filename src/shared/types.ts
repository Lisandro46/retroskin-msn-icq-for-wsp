export type SkinId = 'msn' | 'icq' | 'off'

export type MsnStatus = 'online' | 'busy' | 'brb' | 'away' | 'phone' | 'lunch' | 'offline'
export type IcqStatus = 'online' | 'ffc' | 'away' | 'na' | 'occupied' | 'dnd' | 'invisible'

export type SoundId = 'message' | 'nudge' | 'online'

/** Fonts for your own text. Like the rest, a local decoration: WhatsApp cannot carry a font. */
export const CHAT_FONTS = {
  default: { label: 'Predeterminada', labelEn: 'Default', family: '' },
  tahoma: { label: 'Tahoma', labelEn: 'Tahoma', family: 'Tahoma' },
  arial: { label: 'Arial', labelEn: 'Arial', family: 'Arial' },
  verdana: { label: 'Verdana', labelEn: 'Verdana', family: 'Verdana' },
  comic: { label: 'Comic Sans MS', labelEn: 'Comic Sans MS', family: "'Comic Sans MS'" },
  times: { label: 'Times New Roman', labelEn: 'Times New Roman', family: "'Times New Roman'" },
  courier: { label: 'Courier New', labelEn: 'Courier New', family: "'Courier New'" }
} as const
export type ChatFont = keyof typeof CHAT_FONTS

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
  /** Play single-emoji messages as big winks over the conversation. */
  winks: boolean
  chatFont: ChatFont
}

/** What the WhatsApp page looks like right now. */
export type WaState = 'loading' | 'login' | 'ready'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type MenuId = 'file' | 'contacts' | 'actions' | 'tools' | 'help' | 'status' | 'icq-main' | 'icq-services' | 'skin' | 'font' | 'winks'

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
