/**
 * Hand-drawn SVG look-alikes (no original artwork is shipped).
 * Shared by the shell, the toast and the WhatsApp overlay.
 */
import type { IcqStatus, MsnStatus } from './types'

const svg = (size: number, body: string, viewBox = '0 0 32 32'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${body}</svg>`

/** One Messenger "buddy": round head, pill body. */
function buddyShape(x: number, y: number, fill: string, dark: string, scale = 1): string {
  const s = scale
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M2 26c0-6 4.5-10 10-10s10 4 10 10v1H2z" fill="${fill}" stroke="${dark}" stroke-width="1.2"/>
    <circle cx="12" cy="9" r="6.5" fill="${fill}" stroke="${dark}" stroke-width="1.2"/>
    <ellipse cx="9.6" cy="6.8" rx="2.4" ry="1.6" fill="#fff" opacity=".55"/>
    <path d="M4.5 21.5c2-2.6 4.4-3.6 7.5-3.6" stroke="#fff" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/>
  </g>`
}

const MSN_BUDDY_COLOR: Record<MsnStatus, [string, string]> = {
  online: ['#5ec245', '#2b7a1c'],
  busy: ['#e8463c', '#94160f'],
  brb: ['#f2b233', '#9a6400'],
  away: ['#f2b233', '#9a6400'],
  phone: ['#e8463c', '#94160f'],
  lunch: ['#f2b233', '#9a6400'],
  offline: ['#b4b8bd', '#6b7076']
}

/** Status badge drawn over the buddy (clock for away, minus for busy…). */
function msnBadge(status: MsnStatus): string {
  switch (status) {
    case 'away':
    case 'brb':
    case 'lunch':
      return `<circle cx="24" cy="24" r="6.5" fill="#fff" stroke="#9a6400" stroke-width="1.2"/><path d="M24 20.5v3.8l2.6 1.6" stroke="#9a6400" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    case 'busy':
    case 'phone':
      return `<circle cx="24" cy="24" r="6.5" fill="#e8463c" stroke="#94160f" stroke-width="1.2"/><rect x="20.5" y="23" width="7" height="2.2" rx="1" fill="#fff"/>`
    case 'offline':
      return `<circle cx="24" cy="24" r="6.5" fill="#fff" stroke="#6b7076" stroke-width="1.2"/><path d="M21.5 21.5l5 5m0-5l-5 5" stroke="#6b7076" stroke-width="1.6" stroke-linecap="round"/>`
    default:
      return ''
  }
}

export function msnBuddy(status: MsnStatus = 'online', size = 16): string {
  const [fill, dark] = MSN_BUDDY_COLOR[status]
  return svg(size, buddyShape(3, 2, fill, dark, 1.1) + msnBadge(status))
}

/** The two-buddies logo (green in front, blue behind). */
export function msnLogo(size = 32): string {
  return svg(size, buddyShape(10, 1, '#3d8ee8', '#164f99', 0.95) + buddyShape(1, 4, '#5ec245', '#2b7a1c', 1.05))
}

/** Generic "group" icon for WhatsApp groups: three small buddies. */
export function msnGroup(size = 16): string {
  return svg(
    size,
    buddyShape(12, 1, '#3d8ee8', '#164f99', 0.75) + buddyShape(0, 1, '#f2b233', '#9a6400', 0.75) + buddyShape(5, 7, '#5ec245', '#2b7a1c', 0.95)
  )
}

/** ICQ-like flower: eight narrow petals around a yellow centre. */
function flowerShape(petals: string[], center = '#ffd21f', opacity = 1): string {
  const parts = petals.map((color, i) => {
    const angle = (i * 360) / petals.length - 90
    return `<ellipse cx="16" cy="7.5" rx="3.6" ry="5.8" fill="${color}" stroke="rgba(0,0,0,.45)" stroke-width=".8" transform="rotate(${angle + 90} 16 16)"/>`
  })
  return `<g opacity="${opacity}">${parts.join('')}<circle cx="16" cy="16" r="4.4" fill="${center}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/></g>`
}

const GREEN = '#35b033'
const RED = '#e3261c'

export function icqFlower(status: IcqStatus | 'offline' | 'logo' | 'unknown' = 'online', size = 16): string {
  const all = (c: string): string[] => Array(8).fill(c)
  switch (status) {
    case 'logo': {
      const petals = all(GREEN)
      petals[1] = RED
      return svg(size, flowerShape(petals))
    }
    case 'unknown':
      return svg(size, flowerShape(all('#aaa'), '#ddd'))
    case 'offline':
      return svg(size, flowerShape(all(RED)))
    case 'invisible':
      return svg(size, flowerShape(all(GREEN), '#ffd21f', 0.4))
    case 'away':
      return svg(size, flowerShape(all(GREEN)) + `<circle cx="25" cy="25" r="6" fill="#fff6a8" stroke="#8a7a00"/><path d="M25 21.6v3.6l2.4 1.4" stroke="#8a7a00" stroke-width="1.4" fill="none"/>`)
    case 'na':
      return svg(size, flowerShape(all(GREEN), '#c9c9c9') + `<rect x="18.5" y="19" width="13" height="12" rx="2" fill="#fff" stroke="#555"/><text x="25" y="28.5" font-size="9" font-family="Tahoma" text-anchor="middle" fill="#333">zz</text>`)
    case 'occupied':
      return svg(size, flowerShape(all('#e86d1c')) + `<circle cx="25" cy="25" r="6" fill="${RED}" stroke="#6b0000"/><rect x="21.5" y="24" width="7" height="2" fill="#fff"/>`)
    case 'dnd':
      return svg(size, flowerShape(all(RED)) + `<circle cx="25" cy="25" r="6" fill="#fff" stroke="#6b0000"/><rect x="21.5" y="24" width="7" height="2" fill="${RED}"/>`)
    case 'ffc':
      return svg(size, flowerShape(all(GREEN)) + `<path d="M12.8 16.8q3.2 3 6.4 0" stroke="#6b4b00" stroke-width="1.3" fill="none" stroke-linecap="round"/><circle cx="14" cy="14.6" r=".9" fill="#6b4b00"/><circle cx="18" cy="14.6" r=".9" fill="#6b4b00"/>`)
    default:
      return svg(size, flowerShape(all(GREEN)))
  }
}

/** Several small flowers, for WhatsApp groups in the ICQ list. */
export function icqGroup(size = 16): string {
  return svg(
    size,
    `<g transform="translate(-2 -2) scale(.62)">${flowerShape(Array(8).fill(GREEN))}</g>
     <g transform="translate(14 -1) scale(.55)">${flowerShape(Array(8).fill(GREEN))}</g>
     <g transform="translate(6 11) scale(.62)">${flowerShape(Array(8).fill(GREEN))}</g>`
  )
}

/** Default display picture: a little sun over green hills, MSN-sample style. */
export function samplePicture(size = 96): string {
  return svg(
    size,
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb7ff"/><stop offset="1" stop-color="#dff0ff"/></linearGradient></defs>
     <rect width="96" height="96" fill="url(#sky)"/>
     <circle cx="70" cy="26" r="13" fill="#ffd94a" stroke="#f0a800" stroke-width="2"/>
     <path d="M0 70q24-22 50-6t46-4v36H0z" fill="#6cc04a"/>
     <path d="M0 80q30-14 56-2t40-2v20H0z" fill="#3f9a2c"/>
     <g transform="translate(16 30) scale(1.6)">${buddyShape(0, 0, '#5ec245', '#2b7a1c', 1)}</g>`,
    '0 0 96 96'
  )
}

/** Lightning bolt used on the nudge buttons. */
export function nudgeIcon(size = 16): string {
  return svg(size, `<path d="M18 2L6 18h8l-3 12 14-18h-8l3-10z" fill="#ffd21f" stroke="#a66b00" stroke-width="1.4" stroke-linejoin="round"/>`)
}

export function smileyIcon(size = 16): string {
  return svg(
    size,
    `<circle cx="16" cy="16" r="13" fill="#ffd94a" stroke="#b88600" stroke-width="1.6"/><circle cx="11.5" cy="12.5" r="2" fill="#5a3b00"/><circle cx="20.5" cy="12.5" r="2" fill="#5a3b00"/><path d="M9.5 18.5q6.5 6.5 13 0" stroke="#5a3b00" stroke-width="2" fill="none" stroke-linecap="round"/>`
  )
}

export const svgUrl = (markup: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

/** ICQ's blinking yellow note: a message is waiting. */
export function noteIcon(size = 16): string {
  return svg(
    size,
    `<path d="M5 4h18l4 4v20H5z" fill="#fff47a" stroke="#8a7a00" stroke-width="1.4" stroke-linejoin="round"/><path d="M23 4v4h4" fill="#e5d64a" stroke="#8a7a00" stroke-width="1.2"/><path d="M9 12h14M9 16h14M9 20h10" stroke="#8a7a00" stroke-width="1.4"/>`
  )
}

/** CSS custom properties with every icon the WhatsApp skins need. */
export function iconCssVars(): string {
  const v = (markup: string): string => `url("${svgUrl(markup)}")`
  return `:root {
  --wm-msn-buddy: ${v(msnBuddy('online', 32))};
  --wm-msn-contact: ${v(svg(16, buddyShape(3, 2, '#b4b8bd', '#6b7076', 1.1)))};
  --wm-msn-group: ${v(msnGroup(32))};
  --wm-msn-logo: ${v(msnLogo(32))};
  --wm-icq-online: ${v(icqFlower('online', 32))};
  --wm-icq-contact: ${v(icqFlower('unknown', 16))};
  --wm-icq-offline: ${v(icqFlower('offline', 32))};
  --wm-icq-group: ${v(icqGroup(32))};
  --wm-icq-note: ${v(noteIcon(32))};
  --wm-nudge: ${v(nudgeIcon(32))};
}`
}

/** Small original drawings for local actions; aligned to a 16px grid. */
export function searchIcon(size = 16): string {
  return svg(size, '<circle cx="6.5" cy="6.5" r="4.5" fill="#eef6ff" stroke="#315274"/><path d="m10 10 4.5 4.5" stroke="#284664" stroke-width="3"/><path d="m3.5 5 1-1" stroke="#fff" stroke-width="2"/>', '0 0 16 16')
}

export function settingsIcon(size = 16): string {
  return svg(size, '<rect x="2" y="2" width="12" height="12" fill="#ece9d8" stroke="#6b7788"/><path d="M4 5h8M4 8h8M4 11h8" stroke="#7e8791"/><rect x="5" y="4" width="2" height="2" fill="#3883c7"/><rect x="9" y="7" width="2" height="2" fill="#3883c7"/><rect x="6" y="10" width="2" height="2" fill="#3883c7"/>', '0 0 16 16')
}
