/**
 * Local chrome attached to the contact pane, outside React's managed DOM.
 * Resources are our own drawings; labels and layouts reference MSN 7.5 / ICQ 2000b.
 */
import { ICQ_STATUS_LABEL, MSN_STATUS_LABEL, type Settings } from './types'
import { icqFlower, msnLogo, noteIcon, searchIcon, settingsIcon, smileyIcon } from './icons'

const esc = (value: string): string => value.replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export function sidebarProfile(s: Settings): string {
  if (s.skin === 'msn') return `
    <div class="wm-profile-picture"><img id="wm-profile-pic" alt="Tu imagen para mostrar" /></div>
    <div class="wm-profile-info">
      <div class="wm-profile-line">
        <span data-wm-edit="nick" contenteditable="plaintext-only" role="textbox" aria-multiline="false" spellcheck="false" aria-label="Nombre para mostrar">${esc(s.nick)}</span>
        <button data-wm-menu="status" title="Estado local">(${MSN_STATUS_LABEL[s.msnStatus]}) ▾</button>
      </div>
      <div class="wm-personal-message" data-wm-edit="personalMessage" contenteditable="plaintext-only" role="textbox" aria-multiline="false"
        spellcheck="false" aria-label="Mensaje personal" data-placeholder="&lt;Escribe un mensaje personal&gt;">${esc(s.personalMessage)}</div>
      <div class="wm-profile-links">${msnLogo(14)} <span>MSN Messenger</span>
        <button data-wm-menu="tools" title="Opciones de Messenger">${settingsIcon(14)}</button></div>
    </div>`
  return `
    <div class="wm-icq-brand">${icqFlower('logo', 16)}<b>ICQ<span>2000b</span></b>
      <button data-wm-menu="icq-main" title="My Details / Preferences">${settingsIcon(14)}</button></div>
    <div class="wm-icq-details">
      <span data-wm-edit="nick" contenteditable="plaintext-only" role="textbox" aria-multiline="false" spellcheck="false" aria-label="Nickname">${esc(s.nick)}</span>
      <span class="wm-uin">ICQ# <span data-wm-edit="uin" contenteditable="plaintext-only" role="textbox" aria-multiline="false" spellcheck="false" aria-label="Local ICQ number">${esc(s.uin)}</span></span>
    </div>`
}

export function sidebarFooter(s: Settings): string {
  if (s.skin === 'msn') return `
    <div class="wm-add-contact"><button data-wm-action="search">${searchIcon(14)} Buscar un contacto</button></div>
    <div class="wm-ad" title="Publicidad ficticia de época"><span>${smileyIcon(22)}</span>
      <div><b>Personalizá tu Messenger</b><small>Emoticonos · fondos · conversaciones</small></div></div>`
  return `
    <div class="wm-system-notice">${noteIcon(14)}<span>System Notice</span><button data-wm-menu="icq-services" title="Services">▾</button></div>
    <div class="wm-icq-bottom">
      <button data-wm-menu="icq-main" class="wm-icq-main" title="Main menu">ICQ</button>
      <button data-wm-menu="status" class="wm-icq-status" title="Local status">${icqFlower(s.icqStatus, 16)}<span>${ICQ_STATUS_LABEL[s.icqStatus].split(' (')[0]}</span> ▾</button>
    </div>`
}

export function sidebarTools(): string {
  return `
    <button data-wm-action="search" title="Find users">${searchIcon(16)}</button>
    <button data-wm-menu="icq-services" title="Services">${noteIcon(16)}</button>
    <button data-wm-menu="icq-main" title="Preferences">${settingsIcon(16)}</button>`
}
