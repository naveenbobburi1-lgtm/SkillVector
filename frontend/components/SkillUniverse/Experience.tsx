"use client"

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { useSkillStore } from './store'

function Scene() {
    return (
        <>
            <color attach="background" args={['#F5F5F0']} />
            <fog attach="fog" args={['#F5F5F0', 5, 25]} />
        </>
    )
}

export default function SkillUniverseExperience() {
    const setIsLoaded = useSkillStore((state) => state.setIsLoaded)

    useEffect(() => {
        setIsLoaded(true)
    }, [setIsLoaded])

    return (
        <div className="w-full h-screen bg-black">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white font-mono tracking-widest text-xs">LOADING UNIVERSE...</div>}>
                <Canvas camera={{ position: [0, 0, 15], fov: 35 }}>
                    <Scene />
                </Canvas>
            </Suspense>
        </div>
    )
}
