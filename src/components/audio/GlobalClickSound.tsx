'use client'

import { useEffect, useRef } from 'react'
import { getAudioManager } from '@/lib/audio/AudioManager'

const INTERACTIVE_SELECTORS = [
  'button',
  'a[href]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'label',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="radio"]',
  '[role="option"]',
  '[role="combobox"]',
  '[tabindex]:not([tabindex="-1"])',
  '[data-clickable="true"]',
  '.clickable',
  '.cursor-pointer',
].join(', ')

/**
 * GlobalClickSound
 * Centralized, high-performance global audio effect provider.
 * Listens on the document with capture delegation to trigger a subtle click SFX
 * on all interactive elements across every page, without blocking or altering existing click logic.
 */
export function GlobalClickSound() {
  const lastClickRef = useRef<number>(0)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Eliminate synthetic double-clicks (e.g. label clicking corresponding input in <30ms)
      const now = performance.now()
      if (now - lastClickRef.current < 30) {
        return
      }

      // Ensure target is a valid DOM Element
      if (!e.target || !(e.target instanceof Element)) {
        return
      }

      const target = e.target

      // Find the nearest interactive element ancestor safely
      let interactiveEl: HTMLElement | null = null
      try {
        interactiveEl = target.closest(INTERACTIVE_SELECTORS) as HTMLElement | null
      } catch {
        // Safe fallback if closest throws on any unexpected element
        return
      }

      // Check if target or ancestor has cursor: pointer (for custom interactive components)
      let isInteractive = !!interactiveEl
      if (!isInteractive && target instanceof HTMLElement) {
        try {
          const style = window.getComputedStyle(target)
          if (style.cursor === 'pointer') {
            isInteractive = true
          }
        } catch {}
      }

      if (!isInteractive) return

      // Do not trigger for disabled elements
      const activeEl = (interactiveEl || target) as HTMLElement
      if (
        activeEl.hasAttribute?.('disabled') ||
        activeEl.getAttribute?.('aria-disabled') === 'true' ||
        activeEl.classList?.contains('disabled') ||
        activeEl.classList?.contains('pointer-events-none')
      ) {
        return
      }

      lastClickRef.current = now

      // Play click sound without interfering with any event behavior
      try {
        getAudioManager().playClick()
      } catch (err) {
        console.warn('Global click sound error:', err)
      }
    }

    // Capture delegation ensures all interactive elements, portals, and dynamic components are supported
    document.addEventListener('click', handleClick, { capture: true, passive: true })

    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [])

  return null
}
