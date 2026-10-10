import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

const alias = { '@shared': resolve('src/shared'), '@wa': resolve('src/wa') }

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: {
      rollupOptions: {
        input: { shell: resolve('src/preload/shell.ts'), whatsapp: resolve('src/preload/whatsapp.ts') }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: { alias },
    build: {
      rollupOptions: {
        input: { index: resolve('src/renderer/index.html'), toast: resolve('src/renderer/toast.html') }
      }
    }
  }
})
