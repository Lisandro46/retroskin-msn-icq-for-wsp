import { SEL } from './selectors'

export function isVisible(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && element.checkVisibility({ checkVisibilityCSS: true })
}

/**
 * The chrome lives outside React's DOM. Yield to native dialogs/menus, including
 * viewers without accessibility roles that cover the underlying panes. Ignore
 * our own elements during hit testing so hiding/showing never oscillates.
 */
export function nativeLayerOpen(overlay: HTMLElement, panes: (HTMLElement | null)[]): boolean {
  if (document.fullscreenElement) return true
  if ([...document.querySelectorAll(SEL.nativeLayer)].some(element =>
    !overlay.contains(element) && isVisible(element) && !element.closest('[aria-hidden="true"]')
  )) return true

  return panes.filter(isVisible).some(pane => {
    const r = pane.getBoundingClientRect()
    const left = Math.max(0, r.left), right = Math.min(innerWidth, r.right)
    const top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom)
    if (right - left < 4 || bottom - top < 4) return false
    return [left + 2, (left + right) / 2, right - 2].some(x =>
      [top + 2, (top + bottom) / 2, bottom - 2].some(y => {
        const native = document.elementsFromPoint(x, y).find(element =>
          element !== overlay && !overlay.contains(element))
        return !!native && !pane.contains(native)
      })
    )
  })
}
