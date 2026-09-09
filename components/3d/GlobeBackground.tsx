'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useMediaQuery } from '../ui/useMediaQuery';
import { useAppStore } from '../../store/appStore';

const Particles = ({ count }: { count: number }) => {
  const points = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y -= delta * 0.05;
      points.current.rotation.x -= delta * 0.02;
    }
  });

  const theme = useAppStore((state) => state.theme);
  const color = theme === 'dark' ? '#22D3EE' : '#1D4ED8';

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial transparent color={color} size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
    </Points>
  );
};

const WireframeGlobe = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const theme = useAppStore((state) => state.theme);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 32, 32]} position={[0, 0, 0]}>
      <meshBasicMaterial 
        color={theme === 'dark' ? '#0A0E1A' : '#F4F6FB'} 
        transparent 
        opacity={0.8}
      />
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.SphereGeometry(2, 32, 32)]} />
        <lineBasicMaterial attach="material" color={theme === 'dark' ? '#22D3EE' : '#1D4ED8'} transparent opacity={0.15} />
      </lineSegments>
    </Sphere>
  );
};

export const GlobeBackground: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  if (isMobile || prefersReducedMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-bg-base to-panel opacity-50 transition-all duration-700 pointer-events-none" />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <WireframeGlobe />
        <Particles count={2000} />
      </Canvas>
    </div>
  );
};
