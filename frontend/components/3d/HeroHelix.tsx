'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/appStore';
import { Project } from '../../types';

const SECTORS: Project['sector'][] = [
  'Roads', 'Railways', 'Power', 'Coal & Mining', 'Urban Transport',
  'Irrigation', 'Telecom', 'Health Infrastructure', 'Ports & Shipping'
];

const SectorNode = ({ sector, index, total, radius }: { sector: string, index: number, total: number, radius: number }) => {
  const meshRef = useRef<THREE.Group>(null);
  const theme = useAppStore(state => state.theme);
  const setFilter = useAppStore(state => state.setFilter);
  const activeSector = useAppStore(state => state.filters.sector);

  const angle = (index / total) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const isActive = activeSector === sector;
  const color = isActive ? '#F5C56B' : (theme === 'dark' ? '#22D3EE' : '#1D4ED8');
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0); // Always face center
    }
  });

  return (
    <group ref={meshRef} position={[x, 0, z]} onClick={() => setFilter('sector', isActive ? 'All' : sector as Project['sector'])}>
      <mesh>
        <sphereGeometry args={[isActive ? 0.2 : 0.1, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text 
        position={[0, 0.4, 0]} 
        fontSize={0.2} 
        color={theme === 'dark' ? '#F1F5F9' : '#0F172A'}
        anchorX="center" 
        anchorY="middle"
      >
        {sector}
      </Text>
    </group>
  );
};

const HelixRing = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {SECTORS.map((sector, i) => (
        <SectorNode key={sector} sector={sector} index={i} total={SECTORS.length} radius={3} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.9, 3.1, 64]} />
        <meshBasicMaterial color="#94A3B8" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const HeroHelix: React.FC = () => {
  return (
    <div className="w-full h-[400px]">
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <HelixRing />
      </Canvas>
    </div>
  );
};
