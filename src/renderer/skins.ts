/** The window chrome around WhatsApp for each skin. Plain template strings. */
import { ICQ_STATUS_LABEL, MSN_STATUS_LABEL, type Settings } from '@shared/types'
import { icqFlower, msnBuddy, msnLogo, nudgeIcon, smileyIcon } from '@shared/icons'

const esc = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const winButtons = (maximized: boolean): string => `
  <div class="tbtns">
    <button data-win="minimize" title="Minimizar"><i class="g-min"></i></button>
    <button data-win="maximize" title="${maximized ? 'Restaurar' : 'Maximizar'}"><i class="${maximized ? 'g-restore' : 'g-max'}"></i></button>
    <button data-win="close" class="close" title="Cerrar"><i class="g-close"></i></button>
  </div>`

/* ------------------------------------------------------------------ MSN 7.5 */

const ADS = [
  ['¡Bajate 1000 emoticones animados GRATIS!', 'Hacé clic acá ►'],
  ['Tonos polifónicos para tu celular', 'Enviá TONO al 2020'],
  ['¿Tenés fotolog? Subí tus fotos HOY', '¡Firmame!'],
  ['Ganá una PC con 256 MB de RAM y lectora de CD', 'Participá ►'],
  ['Fondos animados para tus conversaciones', 'Descargar ►']
]

export function adBanner(index: number): string {
  const [title, cta] = ADS[index % ADS.length]
  return `<div class="ad-art">${smileyIcon(34)}</div><div class="ad-text"><b>${title}</b><span>${cta}</span></div>`
}

export function msnChrome(s: Settings, maximized: boolean): string {
  const status = MSN_STATUS_LABEL[s.msnStatus]
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
    <div class="msn-body">
      <aside class="msn-tabs" aria-hidden="true">
        <span class="on">${msnLogo(22)}</span>
        <span>${smileyIcon(18)}</span>
        <span>${nudgeIcon(18)}</span>
      </aside>
      <div class="msn-panel">
        <header class="msn-profile">
          <div class="msn-pic"><img id="own-pic" alt="" /></div>
          <div class="msn-info">
            <div class="msn-nickline">
              <span class="msn-nick" data-edit="nick" contenteditable="plaintext-only" spellcheck="false">${esc(s.nick)}</span>
              <button class="msn-status" data-menu="status">(${status}) ▾</button>
            </div>
            <div class="msn-pm" data-edit="personalMessage" contenteditable="plaintext-only" spellcheck="false"
              data-placeholder="&lt;Escribe un mensaje personal&gt;">${esc(s.personalMessage)}</div>
          </div>
          <div class="msn-mail" title="Correo">✉ <span>(0)</span></div>
        </header>
        <div class="msn-search" data-action="search">
          <span>Buscar un contacto o un número...</span>
          <button data-action="nudge" title="Enviar un zumbido (Ctrl+G)">${nudgeIcon(14)}</button>
        </div>
        <main id="content">
          <div class="loading">
            <div class="spin">${msnLogo(72)}</div>
            <p>Iniciando sesión...</p>
          </div>
        </main>
        <footer class="msn-ad" id="ad">${adBanner(0)}</footer>
      </div>
    </div>
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
    <div class="icq-head">
      <span class="icq-logo">${icqFlower('logo', 30)}</span>
      <div class="icq-ids">
        <div>ICQ# <span class="icq-uin" data-edit="uin" contenteditable="plaintext-only" spellcheck="false">${esc(s.uin)}</span></div>
        <div class="icq-nick" data-edit="nick" contenteditable="plaintext-only" spellcheck="false">${esc(s.nick)}</div>
      </div>
      <div class="icq-tools">
        <button class="btn98" data-action="search">Search</button>
        <button class="btn98" data-action="nudge">${icqFlower('ffc', 14)} Zumbido!</button>
      </div>
    </div>
    <div class="icq-tabs"><span class="on">All</span><span>Online</span><span class="sep"></span><span>Users</span><span class="on">Groups</span></div>
    <main id="content">
      <div class="loading">
        <div class="blink">${icqFlower('logo', 64)}</div>
        <p>Connecting...</p>
      </div>
    </main>
    <footer class="icq-bottom">
      <div class="icq-row">
        <button class="btn98 icq-yellow" data-menu="icq-main">${icqFlower('logo', 16)} Main</button>
        <button class="btn98 icq-yellow" data-menu="icq-services">Services</button>
        <button class="btn98 icq-sysnotice" title="System Notice">${icqFlower('na', 14)}</button>
      </div>
      <button class="btn98 icq-statusbtn" data-menu="status">${icqFlower(s.icqStatus, 16)} <span>${ICQ_STATUS_LABEL[s.icqStatus].split(' (')[0]}</span></button>
    </footer>
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
      <label>ICQ#<input name="uin" value="${esc(s.uin)}" maxlength="12" inputmode="numeric" /></label>
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
