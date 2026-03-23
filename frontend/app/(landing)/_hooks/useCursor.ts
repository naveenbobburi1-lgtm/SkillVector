"use client"
import { useCallback, useEffect, useRef } from "react"

export function useCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const pos     = useRef({ mx: 0, my: 0, rx: 0, ry: 0 })
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(pointer: coarse)").matches) return

    document.body.style.cursor = "none"

    const onMove = (e: MouseEvent) => {
      pos.current.mx = e.clientX
      pos.current.my = e.clientY
      const dot = dotRef.current
      if (dot) {
        dot.style.left = e.clientX - 5 + "px"
        dot.style.top  = e.clientY - 5 + "px"
      }
    }

    const loop = () => {
      const p = pos.current
      p.rx += (p.mx - p.rx) * 0.1
      p.ry += (p.my - p.ry) * 0.1
      const ring = ringRef.current
      if (ring) {
        ring.style.left = p.rx - 20 + "px"
        ring.style.top  = p.ry - 20 + "px"
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafRef.current)
      document.body.style.cursor = ""
    }
  }, [])

  const onEnter = useCallback(() => {
    dotRef.current?.style.setProperty("transform", "scale(2.8)")
    ringRef.current?.style.setProperty("transform", "scale(1.5)")
    ringRef.current?.style.setProperty("border-color", "var(--accent)")
    ringRef.current?.style.setProperty("opacity", "1")
  }, [])

  const onLeave = useCallback(() => {
    dotRef.current?.style.setProperty("transform", "scale(1)")
    ringRef.current?.style.setProperty("transform", "scale(1)")
    ringRef.current?.style.setProperty(
      "border-color", "rgba(79,63,240,0.4)")
    ringRef.current?.style.setProperty("opacity", "1")
  }, [])

  return { dotRef, ringRef, onEnter, onLeave }
}

export function useCursorEvents() {
  const { onEnter, onLeave } = useCursor();
  return { onMouseEnter: onEnter, onMouseLeave: onLeave };
}
