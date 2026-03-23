"use client"
import { useEffect, useRef, useState } from "react"

export function useCountUp(
  end: number,
  duration = 1800,
  suffix = ""
) {
  const [value, setValue] = useState("0" + suffix)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 4)
        setValue(Math.round(ease * end) + suffix)
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [end, duration, suffix])

  return { value, ref }
}
