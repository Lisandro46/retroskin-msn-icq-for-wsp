/**
 * Builds the images for the download page (web/assets): screenshots of each skin from the
 * local preview (fictional data), the social card and app icons.
 *
 *   npm run web:assets
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { app, BrowserWindow, nativeImage } from 'electron'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'web/assets')
const PREVIEW = 'http://127.0.0.1:4173'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function startPreview() {
  const server = spawn(process.platform === 'win32' ? 'node.exe' : 'node', [path.join(root, 'scripts/preview-retro.mjs')], {
    stdio: ['ignore', 'pipe', 'inherit']
  })
  return new Promise((resolve, reject) => {
    server.stdout.on('data', (chunk) => String(chunk).includes('127.0.0.1') && resolve(server))
    server.on('exit', (code) => reject(new Error(`La vista de prueba terminó (${code}). ¿El puerto 4173 está ocupado?`)))
  })
}

async function window(width, height, url) {
  const win = new BrowserWindow({ width, height, show: false, useContentSize: true, webPreferences: { offscreen: true } })
  win.webContents.setZoomFactor(1)
  await win.loadURL(url)
  return win
}

/** Screenshot of the preview stage (the app window) for each skin. */
async function captureSkins() {
  const win = await window(1100, 760, PREVIEW)
  await sleep(1500)
  for (const [skin, file] of [['msn', 'msn'], ['icq', 'icq']]) {
    await win.webContents.executeJavaScript(`document.querySelector('#controls [data-skin="${skin}"]').click()`)
    await sleep(1200)
    const rect = await win.webContents.executeJavaScript(
      `(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } })()`
    )
    const image = await win.webContents.capturePage(rect)
    await fs.writeFile(path.join(out, `${file}.png`), image.toPNG())
    console.log(`web/assets/${file}.png ${image.getSize().width}×${image.getSize().height}`)
  }
  win.destroy()
}

/** 1200×630 card used when the link is shared (WhatsApp, X, LinkedIn…). */
async function captureSocialCard() {
  const data = async (file) => `data:image/png;base64,${(await fs.readFile(path.join(out, file))).toString('base64')}`
  const html = `<!doctype html><meta charset="utf-8">
  <style>
    html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#000;color:#f5f5f7;font-family:'Segoe UI',Inter,Arial,sans-serif}
    body{display:grid;grid-template-columns:470px 1fr;align-items:center;background:radial-gradient(circle at 80% 20%,rgba(255,107,44,.22),transparent 55%),#000}
    .text{padding:0 0 0 64px}
    img.icon{width:96px;height:96px}
    h1{font:700 64px/1.02 'Segoe UI',Arial,sans-serif;margin:20px 0 16px;letter-spacing:-.02em}
    p{font-size:26px;line-height:1.35;color:#c9c9cf;margin:0}
    .brand{margin-top:34px;font-size:20px;color:#FF6B2C;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
    .shot{position:relative;height:630px}
    .shot img{position:absolute;width:780px;border-radius:6px;box-shadow:0 30px 80px rgba(0,0,0,.8)}
    .shot .a{top:70px;left:40px}
    .shot .b{top:300px;left:250px;width:560px}
  </style>
  <div class="text">
    <img class="icon" src="${await data('icon-512.png')}">
    <h1>Retro Messenger</h1>
    <p>Tu WhatsApp con la cara de MSN Messenger e ICQ. Gratis, para Windows, Mac y Linux.</p>
    <div class="brand">retro.trincherai.com</div>
  </div>
  <div class="shot"><img class="a" src="${await data('msn.png')}"><img class="b" src="${await data('icq.png')}"></div>`
  const win = await window(1200, 630, `data:text/html;base64,${Buffer.from(html).toString('base64')}`)
  await sleep(1500)
  const image = (await win.webContents.capturePage()).resize({ width: 1200, height: 630, quality: 'best' })
  await fs.writeFile(path.join(out, 'og.png'), image.toPNG())
  console.log('web/assets/og.png 1200×630')
  win.destroy()
}

async function icons() {
  const icon = nativeImage.createFromPath(path.join(root, 'build/icon.png'))
  for (const size of [32, 192, 512]) {
    await fs.writeFile(path.join(out, `icon-${size}.png`), icon.resize({ width: size, height: size, quality: 'best' }).toPNG())
  }
  console.log('web/assets/icon-{32,192,512}.png')
}

app.disableHardwareAcceleration()
// Each step closes its own window; the script decides when to quit.
app.on('window-all-closed', () => {})
app.whenReady().then(async () => {
  let server
  try {
    await fs.mkdir(out, { recursive: true })
    await icons()
    server = await startPreview()
    await captureSkins()
    await captureSocialCard()
    app.exit(0)
  } catch (error) {
    console.error(error)
    app.exit(1)
  } finally {
    server?.kill()
  }
})
