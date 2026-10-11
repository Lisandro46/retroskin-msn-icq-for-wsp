/**
 * Renders build/icon.png at 1024×1024 from the same drawings the app uses
 * (MSN two-buddies logo + ICQ flower). macOS needs at least 512 px.
 *
 *   npm run icon
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'

const SIZE = 1024
const root = path.resolve(import.meta.dirname, '..')

async function loadIcons() {
  const { default: ts } = await import('typescript')
  const source = await fs.readFile(path.join(root, 'src/shared/icons.ts'), 'utf8')
  const js = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
}

/** Places a standalone <svg> inside the icon canvas. */
const inner = (markup, x, y, size) =>
  markup.replace('<svg ', `<svg x="${x}" y="${y}" `).replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)

async function render() {
  const { msnLogo, icqFlower } = await loadIcons()
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    ${inner(msnLogo(SIZE), 0, 0, SIZE)}
    ${inner(icqFlower('logo', SIZE), SIZE * 0.48, SIZE * 0.48, SIZE * 0.5)}
  </svg>`
  const win = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    frame: false,
    transparent: true,
    useContentSize: true,
    webPreferences: { offscreen: true }
  })
  const html = `<!doctype html><style>html,body{margin:0;background:transparent;overflow:hidden}</style>${icon}`
  await win.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  const image = (await win.webContents.capturePage()).resize({ width: SIZE, height: SIZE, quality: 'best' })
  await fs.writeFile(path.join(root, 'build/icon.png'), image.toPNG())
  console.log(`build/icon.png ${image.getSize().width}×${image.getSize().height}`)
}

app.disableHardwareAcceleration()
app
  .whenReady()
  .then(render)
  .then(() => app.exit(0))
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
