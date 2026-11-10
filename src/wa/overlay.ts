import { SEL } from './selectors'

export function isVisible(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && element.checkVisibility({ checkVisibilityCSS: true })
}

const overlaps = (a: DOMRect, b: DOMRect): boolean =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1

/** Ignore normal pane layout and its ancestors, including pointer-transparent whitespace. */
function floatingSurface(element: Element, panes: HTMLElement[]): HTMLElement | null {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (panes.some(pane => node!.contains(pane))) return null
    if (node instanceof HTMLElement && /^(absolute|fixed)$/.test(getComputedStyle(node).position)) return node
  }
  return null
}

/** Only genuine modals hide all chrome. Small popups yield just the parts they overlap. */
export function syncNativeLayers(overlay: HTMLElement, side: HTMLElement | null, main: HTMLElement | null): void {
  const panes = [side, main].filter(isVisible)
  const modal = !!document.fullscreenElement || [...document.querySelectorAll(SEL.nativeModal)].some(element =>
    !overlay.contains(element) && isVisible(element) && !element.closest('[aria-hidden="true"]') &&
    !panes.some(pane => element.contains(pane))
  )
  overlay.classList.toggle('wm-native-layer', modal)

  const popups = [...document.querySelectorAll(SEL.nativePopup)]
    .filter(element => !overlay.contains(element) && !element.closest(SEL.chatList) &&
      isVisible(element) && !element.closest('[aria-hidden="true"]'))
    .map(element => floatingSurface(element, panes))
    .filter((element): element is HTMLElement => !!element)

  for (const part of overlay.children) {
    if (!(part instanceof HTMLElement)) continue
    const r = part.getBoundingClientRect()
    const owner = ['wm-profile', 'wm-side-footer', 'wm-side-tools'].includes(part.id) ? side : main
    let covered = popups.some(popup => overlaps(r, popup.getBoundingClientRect()))
    // Viewers without semantic roles: test this part, never unrelated points in a pane.
    if (!covered && owner && r.width > 0 && r.height > 0) {
      covered = [r.left + 2, (r.left + r.right) / 2, r.right - 2].some(x =>
        [r.top + 2, (r.top + r.bottom) / 2, r.bottom - 2].some(y => {
          const native = document.elementsFromPoint(x, y).find(element =>
            element !== overlay && !overlay.contains(element))
          if (!native || owner.contains(native) || native.contains(owner)) return false
          const surface = floatingSurface(native, panes)
          return !!surface && overlaps(r, surface.getBoundingClientRect())
        })
      )
    }
    part.classList.toggle('wm-covered', covered)
  }
}
