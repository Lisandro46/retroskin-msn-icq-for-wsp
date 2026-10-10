import type { ShellApi } from '../shared/types'

declare global {
  interface Window {
    messenger: ShellApi
  }
}

export {}
