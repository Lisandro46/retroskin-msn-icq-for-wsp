import './styles/toast.css'
import { icqFlower, msnLogo } from '@shared/icons'

const params = new URLSearchParams(location.search)
const skin = params.get('skin') === 'icq' ? 'icq' : 'msn'
const kind = params.get('kind') ?? 'message'
const name = params.get('name') ?? ''
const text = params.get('text') ?? ''

const box = document.getElementById('toast') as HTMLElement
document.body.dataset.skin = skin

const strong = document.createElement('b')
strong.textContent = name
const line = document.createElement('span')

if (skin === 'msn') {
  const title = kind === 'online' ? 'acaba de iniciar sesión.' : kind === 'nudge' ? 'te envió un zumbido.' : 'dice:'
  line.textContent = kind === 'message' ? text : ''
  box.innerHTML = `<div class="bar"><span>${msnLogo(14)}</span>MSN Messenger<i>×</i></div><div class="body"><span class="logo">${msnLogo(40)}</span><p></p></div><div class="foot">Opciones</div>`
  const p = box.querySelector('p') as HTMLElement
  p.append(strong, document.createTextNode(` ${title}`), document.createElement('br'), line)
} else {
  const title = kind === 'online' ? 'is Online' : kind === 'nudge' ? 'sent you a Zumbido!' : 'Incoming Message'
  line.textContent = kind === 'message' ? text : ''
  box.innerHTML = `<div class="bar">${icqFlower('logo', 14)}<span>ICQ</span><i>×</i></div><div class="body"><span class="logo">${icqFlower(kind === 'online' ? 'online' : 'logo', 36)}</span><p></p></div>`
  const p = box.querySelector('p') as HTMLElement
  const header = document.createElement('em')
  header.textContent = title
  p.append(header, document.createElement('br'), strong, document.createElement('br'), line)
}
