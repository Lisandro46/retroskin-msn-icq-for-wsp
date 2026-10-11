import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { EOL, userInfo } from 'node:os'
import { join } from 'node:path'
import { app, type Rectangle } from 'electron'
import type { Settings } from '@shared/types'

const dir = (): string => {
  const path = app.getPath('userData')
  mkdirSync(path, { recursive: true })
  return path
}

function readJson<T>(file: string, fallback: T): T {
  const path = join(dir(), file)
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

const writeJson = (file: string, value: unknown): void =>
  writeFileSync(join(dir(), file), JSON.stringify(value, null, 2))

function defaultNick(): string {
  try {
    return userInfo().username
  } catch {
    return 'Yo'
  }
}

/** A made-up 9-digit ICQ number, fixed on first run. */
const randomUin = (): string => String(100_000_000 + Math.floor(Math.random() * 899_999_999))

interface Stored extends Settings {
  bounds?: Rectangle
  maximized?: boolean
}

let cache: Stored | undefined

function load(): Stored {
  if (cache) return cache
  const stored = readJson<Partial<Stored>>('settings.json', {})
  cache = {
    skin: 'msn',
    nick: defaultNick(),
    personalMessage: '',
    msnStatus: 'online',
    icqStatus: 'online',
    uin: randomUin(),
    sounds: true,
    shake: true,
    toasts: true,
    alwaysOnTop: false,
    ...stored
  }
  if (!stored.uin) writeJson('settings.json', cache)
  return cache
}

export const store = {
  get(): Settings {
    const { bounds: _bounds, maximized: _maximized, ...settings } = load()
    return settings
  },
  update(patch: Partial<Settings>): Settings {
    cache = { ...load(), ...patch }
    writeJson('settings.json', cache)
    return store.get()
  },
  windowState: (): Pick<Stored, 'bounds' | 'maximized'> => ({ bounds: load().bounds, maximized: load().maximized }),
  saveWindowState(bounds: Rectangle, maximized: boolean): void {
    cache = { ...load(), bounds, maximized }
    writeJson('settings.json', cache)
  }
}

/** Where users can drop their own .wav/.mp3 to replace the bundled sounds. */
export const soundsDir = (): string => join(dir(), 'sounds')

export function ensureSoundsDir(): string {
  const root = soundsDir()
  for (const skin of ['msn', 'icq']) mkdirSync(join(root, skin), { recursive: true })
  const readme = join(root, 'LEEME.txt')
  if (!existsSync(readme)) {
    writeFileSync(
      readme,
      [
        'Poné acá tus propios sonidos y la app los usa en lugar de los originales que trae.',
        '',
        'msn/message.wav  -> mensaje nuevo',
        'msn/nudge.wav    -> zumbido',
        'msn/online.wav   -> contacto en línea',
        'icq/message.wav  -> mensaje nuevo ("Uh-oh!")',
        'icq/nudge.wav    -> zumbido',
        'icq/online.wav   -> contacto en línea',
        '',
        'También sirven .mp3 u .ogg con el mismo nombre.'
      ].join(EOL)
    )
  }
  return root
}
