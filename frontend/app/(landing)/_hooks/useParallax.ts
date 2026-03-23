"use client"
import { useCallback, useRef } from "react"

export function useParallax(strength = 14) {
  const targetRef   = useRef<HTMLDivElement>(null)
  const sectionRef  = useRef<HTMLElement>(null)

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const section = sectionRef.current
    const target  = targetRef.current
    if (!section || !target) return
    const rect = section.getBoundingClientRect()
    const dx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2
    const dy = ((e.clientY - rect.top)  / rect.height - 0.5) * 2
    target.style.transform =
      `translate(calc(-50% + ${dx * strength}px), ` +
      `calc(-50% + ${dy * strength}px))`
  }, [strength])

  const onMouseLeave = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.style.transform = "translate(-50%, -50%)"
      targetRef.current.style.transition =
        "transform 0.8s var(--ease-out-expo)"
    }
  }, [])

  const onMouseEnter = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.style.transition = "transform 0.1s linear"
    }
  }, [])

  return { targetRef, sectionRef, onMouseMove, onMouseLeave, onMouseEnter }
}
