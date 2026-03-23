"use client";

import { useEffect, useRef } from "react";
import { useCursor } from "../_hooks/useCursor";

export function CustomCursor() {
  const { position, isHovering, isTouchDevice } = useCursor();
  const ringRef = useRef<HTMLDivElement>(null);
  
  // Ref for the lerped position to avoid state updates on every frame
  const lerpedPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isTouchDevice) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      // Calculate delta time for consistent lerp regardless of frame rate
      // const deltaTime = time - lastTime;
      // lastTime = time;
      
      // Lerp factor 0.12
      const targetX = position.x;
      const targetY = position.y;
      
      lerpedPosition.current.x += (targetX - lerpedPosition.current.x) * 0.12;
      lerpedPosition.current.y += (targetY - lerpedPosition.current.y) * 0.12;
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${lerpedPosition.current.x}px, ${lerpedPosition.current.y}px, 0) translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`;
        ringRef.current.style.opacity = isHovering ? "0.3" : "0.6";
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [position, isHovering, isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <>
      <div 
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2"
        style={{ 
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${isHovering ? 2 : 1})`,
          transition: "transform 0.15s ease-out"
        }}
      />
      <div 
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 border border-primary rounded-full pointer-events-none z-[99] will-change-transform"
        style={{ transition: "scale 0.2s ease-out, opacity 0.2s ease-out" }}
      />
    </>
  );
}
