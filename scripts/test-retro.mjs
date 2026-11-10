/** Regression checks against the real preload/CSS in Chromium, using fictional data. */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { mkdtempSync } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { createPreviewServer } from './preview-retro.mjs'

app.disableHardwareAcceleration()
app.setPath('userData', mkdtempSync(path.join(app.getPath('temp'), 'retro-ui-tests-')))
app.on('window-all-closed', () => {})
async function main() {
  const server = createPreviewServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const win = new BrowserWindow({ show: false, width: 1040, height: 690, useContentSize: true,
    webPreferences: { offscreen: true, backgroundThrottling: false } })
  let failures = 0
  let passes = 0
  const output = path.resolve(import.meta.dirname, '../output/issue-1')
  await fs.mkdir(output, { recursive: true })
  const run = (fn, ...args) => win.webContents.executeJavaScript(`(${fn})(${args.map(a => JSON.stringify(a)).join(',')})`)
  const settle = () => run(() => new Promise(resolve => setTimeout(resolve, 850)))
  const check = async (label, test) => {
    try { await test(); passes++; console.log(`PASS ${label}`) }
    catch (error) { failures++; console.error(`FAIL ${label}: ${error.message}`) }
  }

  try {
    await win.loadURL(`http://127.0.0.1:${server.address().port}/wa`)
    await settle()
    for (const skin of ['msn', 'icq', 'off']) {
      await run(skin => window.postMessage({ skin }, location.origin), skin)
      await settle()
      await check(`${skin}: persistent listbox does not hide retro chrome`, async () => {
        await run(() => document.querySelector('#pane-side').setAttribute('role', 'listbox'))
        await settle()
        assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-bar')).visibility), 'visible')
        if (skin !== 'off') assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-side-footer')).visibility), 'visible')
      })
      await run(() => document.querySelector('#pane-side').removeAttribute('role'))
      await check(`${skin}: pane whitespace with pointer-events none keeps chrome visible`, async () => {
        await run(() => {
          const style = document.createElement('style')
          style.id = 'test-pointer-events'
          style.textContent = '#side, #main { pointer-events: none } #side > *, #main > * { pointer-events: auto }'
          document.head.append(style)
        })
        await settle()
        assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-bar')).visibility), 'visible')
      })
      await run(() => document.querySelector('#test-pointer-events').remove())
      await check(`${skin}: formatting menu preserves banner, profile and nudge`, async () => {
        await run(() => {
          const menu = document.createElement('div')
          menu.id = 'test-format-menu'
          menu.role = 'menu'
          const footer = document.querySelector('#main footer').getBoundingClientRect()
          menu.style = `position:fixed;left:${footer.left + 70}px;top:${footer.top + 3}px;width:200px;height:30px;z-index:100;background:white`
          menu.textContent = 'B I U'
          document.querySelector('#app').append(menu)
        })
        await settle()
        const ids = skin === 'off' ? ['wm-bar'] : ['wm-profile', 'wm-side-footer', 'wm-bar']
        for (const id of ids) assert.equal(await run(id => getComputedStyle(document.getElementById(id)).visibility, id), 'visible', id)
      })
      await run(() => document.querySelector('#test-format-menu').remove())
      await settle()
      if (skin === 'msn') {
        await check('msn: restored nudge button is clickable and emits the sound/shake event', async () => {
          const hit = await run(() => {
            window.testNudges = 0
            window.addEventListener('message', event => {
              if (event.data.name === 'wa:nudge-sent') window.testNudges++
            })
            const button = document.querySelector('#wm-nudge')
            const r = button.getBoundingClientRect()
            const target = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button')
            if (target === button) target.click()
            return target?.id
          })
          await settle()
          assert.equal(hit, 'wm-nudge')
          assert.equal(await run(() => window.testNudges), 1)
          assert.equal(await run(() => document.querySelector('[contenteditable="true"]').textContent), '*ZUMBIDO*')
          await run(() => { document.querySelector('[contenteditable="true"]').textContent = '' })
        })
      }
      if (process.argv.includes('--chrome-only')) continue
      await check(`${skin}: normal chat controls are visible`, async () => {
        assert.equal(await run(() => {
          const bar = document.querySelector('#wm-bar')
          return bar.getBoundingClientRect().height > 0 && getComputedStyle(bar).visibility === 'visible'
        }), true)
      })
      await check(`${skin}: native media viewer and forward dialog stay above retro controls`, async () => {
        await run(() => {
          const layer = document.createElement('div')
          layer.id = 'test-native-layer'
          layer.role = 'dialog'
          layer.style = 'position:fixed;inset:0;z-index:100;background:white'
          layer.innerHTML = '<button id="test-recipient" style="position:absolute;inset:0">Elegir destinatario / cerrar imagen</button>'
          document.querySelector('#app').append(layer)
        })
        await settle()
        const hits = await run(() => [[100, 30], [600, 8], [990, 170], [600, 600]].map(([x, y]) =>
          document.elementFromPoint(x, y)?.id))
        assert.ok(hits.every(id => id === 'test-recipient'), JSON.stringify(hits))
        assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-bar')).visibility), 'hidden')
        if (skin === 'msn') await fs.writeFile(path.join(output, 'native-dialog.png'), (await win.webContents.capturePage()).toPNG())
      })
      await run(() => document.querySelector('#test-native-layer')?.remove())
      await settle()
      await check(`${skin}: unlabelled zoom viewer also takes priority`, async () => {
        await run(() => {
          const viewer = document.createElement('div')
          viewer.id = 'test-unlabelled'
          viewer.style = 'position:fixed;inset:0;z-index:100;background:white'
          document.querySelector('#app').append(viewer)
        })
        await settle()
        assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-bar')).visibility), 'hidden')
        await run(() => document.querySelector('#test-unlabelled').remove())
        await settle()
        assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-bar')).visibility), 'visible')
      })
      await check(`${skin}: a native menu can open, hide and reopen`, async () => {
        await run(() => {
          const menu = document.createElement('div')
          menu.id = 'test-menu'
          menu.role = 'menu'
          menu.style = 'position:fixed;left:0;top:0;width:220px;height:130px;z-index:100;background:white'
          document.querySelector('#side').append(menu)
        })
        for (const hidden of [false, true, false, true]) {
          await run(hidden => { document.querySelector('#test-menu').hidden = hidden }, hidden)
          await settle()
          assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-bar')).visibility), 'visible')
          if (skin !== 'off') {
            assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-profile')).visibility), hidden ? 'visible' : 'hidden')
            assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-side-footer')).visibility), 'visible')
          }
        }
        await run(() => document.querySelector('#test-menu').remove())
      })
      await check(`${skin}: selection footer remains accessible without composer`, async () => {
        await run(() => {
          const composer = document.querySelector('[contenteditable="true"]')
          composer.hidden = true
          const button = document.createElement('button')
          button.id = 'test-forward'
          button.textContent = 'Reenviar'
          button.style = 'position:absolute;right:10px;bottom:10px;width:90px;height:40px'
          document.querySelector('#main footer').append(button)
        })
        await settle()
        const id = await run(() => {
          const r = document.querySelector('#test-forward').getBoundingClientRect()
          return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.id
        })
        assert.equal(id, 'test-forward')
        assert.equal(await run(() => document.querySelector('#wm-root').classList.contains('wm-chat')), false)
        if (skin !== 'off') {
          assert.deepEqual(await run(() => [
            getComputedStyle(document.querySelector('#main')).paddingRight,
            getComputedStyle(document.querySelector('#main footer')).marginTop
          ]), ['0px', '0px'])
        }
      })
      await run(() => {
        document.querySelector('#test-forward')?.remove()
        document.querySelector('[contenteditable="true"]').hidden = false
      })
      await settle()
      await check(`${skin}: composer and chrome return after selection`, async () => {
        assert.equal(await run(() => document.querySelector('#wm-root').classList.contains('wm-chat') &&
          getComputedStyle(document.querySelector('#wm-bar')).visibility === 'visible'), true)
      })
      await check(`${skin}: font changes affect local chat text only`, async () => {
        const headerFont = await run(() => getComputedStyle(document.querySelector('#main header')).fontFamily)
        const originalText = await run(() => document.querySelector('[data-testid="selectable-text"]').textContent)
        const originalFont = await run(() => getComputedStyle(document.querySelector('[data-testid="selectable-text"]')).fontFamily)
        await run(() => window.postMessage({ chatFont: 'verdana' }, location.origin))
        await settle()
        const fonts = await run(() => ['[data-testid="selectable-text"]', '[contenteditable="true"]'].map(selector =>
          getComputedStyle(document.querySelector(selector)).fontFamily))
        if (skin === 'off') assert.equal(fonts[0], originalFont)
        else assert.ok(fonts.every(font => font.startsWith('Verdana')), JSON.stringify(fonts))
        assert.equal(await run(() => getComputedStyle(document.querySelector('#main header')).fontFamily), headerFont)
        assert.equal(await run(() => document.querySelector('[data-testid="selectable-text"]').textContent), originalText)
        await run(() => window.postMessage({ chatFont: 'default' }, location.origin))
        await settle()
        assert.equal(await run(() => getComputedStyle(document.querySelector('[data-testid="selectable-text"]')).fontFamily), originalFont)
      })
      if (skin === 'msn') {
        await check('msn: display picture menu, local preview and reset work', async () => {
          const original = await run(() => document.querySelector('#wm-profile-pic').src)
          const custom = await run(() => {
            const canvas = document.createElement('canvas')
            canvas.width = canvas.height = 64
            const context = canvas.getContext('2d')
            context.fillStyle = '#729bdf'
            context.fillRect(0, 0, 64, 64)
            context.fillStyle = '#ffda57'
            context.beginPath()
            context.arc(32, 32, 20, 0, Math.PI * 2)
            context.fill()
            return canvas.toDataURL()
          })
          await run(() => {
            window.testPictureMenu = null
            window.addEventListener('message', event => {
              if (event.data.name === 'wa:menu') window.testPictureMenu = event.data.value?.menu
            })
            document.querySelector('[data-wm-menu="picture"]').click()
          })
          await settle()
          assert.equal(await run(() => window.testPictureMenu), 'picture')
          await run(displayPicture => window.postMessage({ displayPicture }, location.origin), custom)
          await settle()
          for (const id of ['wm-profile-pic', 'wm-pic-own']) {
            assert.equal(await run(id => document.getElementById(id).src, id), custom)
            assert.ok(await run(id => document.getElementById(id).naturalWidth > 0, id))
          }
          await fs.writeFile(path.join(output, 'msn-custom-picture.png'), (await win.webContents.capturePage()).toPNG())
          for (const selectedSkin of ['icq', 'msn']) {
            await run(skin => window.postMessage({ skin }, location.origin), selectedSkin)
            await settle()
          }
          assert.equal(await run(() => document.querySelector('#wm-profile-pic').src), custom)
          await run(() => window.postMessage({ displayPicture: '' }, location.origin))
          await settle()
          assert.equal(await run(() => document.querySelector('#wm-profile-pic').src), original)
        })
        await check('msn: font button opens the native font menu', async () => {
          await run(() => {
            window.fontMenu = null
            window.addEventListener('message', event => {
              if (event.data.name === 'wa:menu') window.fontMenu = event.data.value
            })
            document.querySelector('#wm-font').click()
          })
          await settle()
          assert.equal(await run(() => window.fontMenu?.menu), 'font')
        })
        await check('msn: decorative banner does not promise links', async () => {
          assert.equal(await run(() => document.querySelector('.wm-ad b').textContent), 'Personalizá tu Messenger')
          assert.match(await run(() => document.querySelector('.wm-ad').title), /sin enlaces/)
          assert.equal(await run(() => document.querySelector('.wm-ad').querySelectorAll('button,a').length), 0)
        })
        await fs.writeFile(path.join(output, 'msn-fixed.png'), (await win.webContents.capturePage()).toPNG())
        await check('msn: compact layout reserves no photo column', async () => {
          win.setContentSize(720, 690)
          await settle()
          assert.equal(await run(() => getComputedStyle(document.querySelector('#main')).paddingRight), '0px')
          assert.equal(await run(() => getComputedStyle(document.querySelector('#wm-pic-own')).display), 'none')
          await fs.writeFile(path.join(output, 'msn-compact-fixed.png'), (await win.webContents.capturePage()).toPNG())
        })
        win.setContentSize(1040, 690)
        await settle()
      }
      if (skin === 'off') continue
      if (skin === 'icq') {
        await check('icq: Ctrl+G still triggers the nudge event', async () => {
          const before = await run(() => window.testNudges)
          await run(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, bubbles: true })))
          await settle()
          assert.equal(await run(() => window.testNudges), before + 1)
          await run(() => { document.querySelector('[contenteditable="true"]').textContent = '' })
        })
        await fs.writeFile(path.join(output, 'icq-fixed.png'), (await win.webContents.capturePage()).toPNG())
      }
      await check(`${skin}: a late-loading message is not a grey system notice`, async () => {
        await run(() => {
          const row = document.createElement('div')
          row.role = 'row'
          row.id = 'test-late-row'
          document.querySelector('[data-testid="conversation-background"]').append(row)
        })
        await settle()
        await run(() => {
          document.querySelector('#test-late-row').innerHTML = '<div data-id="late"><div data-testid="msg-container"><div data-pre-plain-text="[18:05, 11/10/2026] Ana: "><span data-testid="selectable-text">Mensaje cargado tarde</span></div></div></div>'
        })
        await settle()
        const result = await run(() => ({
          system: document.querySelector('#test-late-row').hasAttribute('data-wm-system'),
          color: getComputedStyle(document.querySelector('#test-late-row [data-testid="selectable-text"]')).color
        }))
        assert.equal(result.system, false)
        assert.equal(result.color, 'rgb(0, 0, 0)')
        // WhatsApp also exposes selectable-text as a class instead of a test id.
        await run(() => {
          const text = document.querySelector('#test-late-row [data-testid="selectable-text"]')
          text.removeAttribute('data-testid')
          text.className = 'selectable-text'
          text.style.color = '#8a8a8a'
        })
        await settle()
        assert.equal(await run(() => getComputedStyle(document.querySelector('#test-late-row .selectable-text')).color), 'rgb(0, 0, 0)')
        // And recycles rows back to separators: old message labels must disappear.
        await run(() => { document.querySelector('#test-late-row').innerHTML = 'Hoy' })
        await settle()
        assert.equal(await run(() => document.querySelector('#test-late-row').dataset.wmSystem), '1')
      })
      await run(() => document.querySelector('#test-late-row')?.remove())
    }
  } finally {
    win.destroy()
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    console.log(`${passes} passed, ${failures} failed`)
    app.exit(failures ? 1 : 0)
  }
}
app.whenReady().then(main).catch(error => { console.error(error); app.exit(1) })
