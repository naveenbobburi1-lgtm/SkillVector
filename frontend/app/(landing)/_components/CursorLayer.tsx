"use client"
import { useCursor } from "../_hooks/useCursor"

export function CursorLayer() {
  const { dotRef, ringRef } = useCursor()

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed z-[9999] pointer-events-none"
        style={{
          width: 10, height: 10,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 0 2px var(--bg-base), 0 0 12px var(--accent)",
          transition: "transform 0.15s var(--ease-spring)",
          willChange: "left, top, transform",
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed z-[9998] pointer-events-none"
        style={{
          width: 40, height: 40,
          borderRadius: "50%",
          border: "1.5px solid rgba(79,63,240,0.4)",
          transition: "transform 0.15s var(--ease-spring)",
          willChange: "left, top, transform",
        }}
      />
    </>
  )
}
