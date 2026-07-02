// src/components/helpCenter/useScrollReveal.ts
import { useEffect, useRef } from 'react'

export function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.querySelectorAll<HTMLElement>('.hc-reveal')
    if (targets.length === 0) {
      // if the element itself is the reveal target
      el.classList.add('hc-reveal-hidden')
    } else {
      targets.forEach((t) => t.classList.add('hc-reveal-hidden'))
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('hc-reveal-hidden')
            entry.target.classList.add('hc-reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    const allTargets = targets.length > 0 ? Array.from(targets) : [el]
    allTargets.forEach((t) => observer.observe(t))

    return () => observer.disconnect()
  }, [threshold])

  return ref as React.RefObject<HTMLElement>
}