/** The window chrome around WhatsApp for each skin. Plain template strings. */
import type { Settings } from '@shared/types'
import { icqFlower, msnBuddy, msnLogo } from '@shared/icons'

const esc = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const winButtons = (maximized: boolean): string => `
  <div class="tbtns">
    <button data-win="minimize" title="Minimizar"><i class="g-min"></i></button>
    <button data-win="maximize" title="${maximized ? 'Restaurar' : 'Maximizar'}"><i class="${maximized ? 'g-restore' : 'g-max'}"></i></button>
    <button data-win="close" class="close" title="Cerrar"><i class="g-close"></i></button>
  </div>`

/* ------------------------------------------------------------------ MSN 7.5 */

export function msnChrome(s: Settings, maximized: boolean): string {
  return `
  <div class="window">
    <div class="titlebar">
      <span class="ticon">${msnBuddy(s.msnStatus, 16)}</span>
      <span class="ttext">MSN Messenger</span>
      ${winButtons(maximized)}
    </div>
    <nav class="menubar">
      <button data-menu="file">Archivo</button>
      <button data-menu="contacts">Contactos</button>
      <button data-menu="actions">Acciones</button>
      <button data-menu="tools">Herramientas</button>
      <button data-menu="help">Ayuda</button>
    </nav>
    <main id="content"><div class="loading"><div class="spin">${msnLogo(72)}</div><p>Iniciando sesión...</p></div></main>
  </div>`
}

/* ----------------------------------------------------------------- ICQ 2000b */

export function icqChrome(s: Settings, maximized: boolean): string {
  return `
  <div class="window">
    <div class="titlebar">
      <span class="ticon">${icqFlower(s.icqStatus, 16)}</span>
      <span class="ttext">${esc(s.nick)}</span>
      ${winButtons(maximized)}
    </div>
    <nav class="icq-menubar"><button class="btn98" data-menu="icq-main">Main</button><button class="btn98" data-menu="icq-services">Services</button><button class="btn98" data-menu="skin">Skin ▾</button></nav>
    <main id="content"><div class="loading"><div class="blink">${icqFlower('logo',64)}</div><p>Connecting...</p></div></main>
  </div>`
}

/* ------------------------------------------------------- WhatsApp original */

export function offChrome(_s: Settings, maximized: boolean): string {
  return `
  <div class="window">
    <div class="titlebar">
      <span class="ttext">WhatsApp</span>
      <button class="skinbtn" data-menu="skin">Skin ▾</button>
      ${winButtons(maximized)}
    </div>
    <main id="content"><div class="loading"><p>Cargando WhatsApp…</p></div></main>
  </div>`
}

/* ---------------------------------------------------------------- dialogs */

export function optionsDialog(s: Settings): string {
  const icq = s.skin === 'icq'
  return `
  <form class="dialog" method="dialog">
    <div class="titlebar"><span class="ttext">${icq ? 'My Details' : 'Opciones'}</span>
      <div class="tbtns"><button type="button" data-close class="close"><i class="g-close"></i></button></div></div>
    <div class="dialog-body">
      <p class="hint">${icq ? 'Only shown here. Nothing is sent to WhatsApp.' : 'Solo se muestra en esta ventana: nada de esto cambia tu WhatsApp.'}</p>
      <label>${icq ? 'Nickname' : 'Nombre para mostrar'}<input name="nick" value="${esc(s.nick)}" maxlength="80" /></label>
      ${icq ? '' : `<label>Mensaje personal<input name="personalMessage" value="${esc(s.personalMessage)}" maxlength="120" /></label>`}
      ${icq ? `<label>ICQ#<input name="uin" value="${esc(s.uin)}" maxlength="12" inputmode="numeric" /></label>` : ''}
      <div class="actions"><button type="submit" class="btn">${icq ? 'Save' : 'Aceptar'}</button>
        <button type="button" data-close class="btn">${icq ? 'Cancel' : 'Cancelar'}</button></div>
    </div>
  </form>`
}

export function aboutDialog(s: Settings): string {
  const icq = s.skin === 'icq'
  return `
  <div class="dialog about">
    <div class="titlebar"><span class="ttext">${icq ? 'About ICQ' : 'Acerca de Messenger'}</span>
      <div class="tbtns"><button type="button" data-close class="close"><i class="g-close"></i></button></div></div>
    <div class="dialog-body">
      <div class="about-logo">${icq ? icqFlower('logo', 64) : msnLogo(64)}</div>
      <h2>Retro Messenger para WhatsApp</h2>
      <p>${icq ? 'ICQ 2000b-style' : 'Estilo MSN Messenger 7.5'} sobre WhatsApp Web.</p>
      <p class="hint">Proyecto de fan, gratis y de código abierto. Todo es estético: WhatsApp funciona igual que siempre.
      No está afiliado a WhatsApp, Meta, Microsoft ni ICQ. Íconos y sonidos son imitaciones hechas a mano.</p>
      <div class="actions"><button type="button" data-close class="btn">${icq ? 'OK' : 'Aceptar'}</button></div>
    </div>
  </div>`
}
