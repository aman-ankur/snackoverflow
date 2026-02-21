"use client";

import { useRef, useMemo, useCallback, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { GardenState } from "@/lib/useGardenState";

// ── Types ─────────────────────────────────────────────────────────────

interface CapyGardenProps {
  garden: GardenState;
  isActive: boolean;
  onCapyTap?: () => void;
}

// ── Color constants ───────────────────────────────────────────────────

const CAPY_BODY = "#C4956A";
const CAPY_BELLY = "#E8CBA8";
const CAPY_DARK = "#5C3D20";
const CAPY_NOSE = "#A07850";
const SPROUT_GREEN = "#5AAC5A";
const GRASS_GREEN = "#6BBF6B";
const GRASS_DRY = "#B8A878";
const EARTH_BROWN = "#8B6B4A";
const TRUNK_BROWN = "#7A5C3A";
const CANOPY_GREEN = "#4A9E4A";
const WATER_BLUE = "#7EC8E3";
const FLOWER_COLORS = ["#FF8FAB", "#FFD166", "#FFFFFF", "#C084FC", "#FB923C"];

// ── Ground Island ─────────────────────────────────────────────────────

function Ground({ health }: { health: number }) {
  const grassColor = useMemo(() => {
    const t = Math.max(0, Math.min(1, health / 100));
    const c1 = new THREE.Color(GRASS_DRY);
    const c2 = new THREE.Color(GRASS_GREEN);
    return c1.lerp(c2, t);
  }, [health]);

  return (
    <group>
      {/* Top grass */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[3.5, 3.5, 0.15, 32]} />
        <meshStandardMaterial color={grassColor} />
      </mesh>
      {/* Earth sides */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[3.5, 3.2, 0.45, 32]} />
        <meshStandardMaterial color={EARTH_BROWN} />
      </mesh>
    </group>
  );
}

// ── 3D Capybara ───────────────────────────────────────────────────────

function Capy3D({ hasCrown, onClick }: { hasCrown: boolean; onClick?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [bouncing, setBouncing] = useState(false);
  const bounceTime = useRef(0);

  useFrame((_state: unknown, delta: number) => {
    if (!groupRef.current) return;
    // Idle breathing
    const t = Date.now() * 0.001;
    groupRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.015;

    // Bounce on tap
    if (bouncing) {
      bounceTime.current += delta * 8;
      const b = Math.sin(bounceTime.current * Math.PI) * 0.3;
      groupRef.current.position.y = Math.max(0, b);
      if (bounceTime.current >= 1) {
        setBouncing(false);
        bounceTime.current = 0;
        groupRef.current.position.y = 0;
      }
    }
  });

  const handleClick = useCallback(() => {
    setBouncing(true);
    bounceTime.current = 0;
    onClick?.();
  }, [onClick]);

  return (
    <group ref={groupRef} position={[0, 0.08, 0]} onClick={handleClick}>
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial color={CAPY_BODY} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.48, 0.2]}>
        <sphereGeometry args={[0.38, 12, 10]} />
        <meshStandardMaterial color={CAPY_BELLY} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.05, 0.15]} castShadow>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshStandardMaterial color={CAPY_BODY} />
      </mesh>
      {/* Face lighter area */}
      <mesh position={[0, 1.0, 0.35]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color={"#D4A87A"} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 0.98, 0.5]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={CAPY_NOSE} />
      </mesh>
      {/* Nose tip */}
      <mesh position={[0, 1.0, 0.58]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color={CAPY_DARK} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.15, 1.1, 0.4]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15, 1.1, 0.4]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.15, 1.1, 0.45]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color={CAPY_DARK} />
      </mesh>
      <mesh position={[0.15, 1.1, 0.45]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color={CAPY_DARK} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.3, 1.3, 0.05]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color={CAPY_BODY} />
      </mesh>
      <mesh position={[0.3, 1.3, 0.05]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color={CAPY_BODY} />
      </mesh>
      {/* Inner ears */}
      <mesh position={[-0.3, 1.3, 0.1]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={CAPY_BELLY} />
      </mesh>
      <mesh position={[0.3, 1.3, 0.1]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={CAPY_BELLY} />
      </mesh>
      {/* Sprout on head */}
      <SproutOnHead />
      {/* Feet */}
      <mesh position={[-0.25, 0.08, 0.15]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={CAPY_NOSE} />
      </mesh>
      <mesh position={[0.25, 0.08, 0.15]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={CAPY_NOSE} />
      </mesh>
      {/* Blush cheeks */}
      <mesh position={[-0.28, 1.0, 0.38]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color="#F5B0A0" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.28, 1.0, 0.38]}>
        <sphereGeometry args={[0.08, 8, 6]} />
        <meshStandardMaterial color="#F5B0A0" transparent opacity={0.4} />
      </mesh>
      {/* Crown */}
      {hasCrown && <Crown />}
    </group>
  );
}

function SproutOnHead() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(Date.now() * 0.002) * 0.1;
  });
  return (
    <group ref={ref} position={[0, 1.42, 0.1]}>
      {/* Stem */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.2, 6]} />
        <meshStandardMaterial color={SPROUT_GREEN} />
      </mesh>
      {/* Left leaf */}
      <mesh position={[-0.08, 0.2, 0]} rotation={[0, 0, 0.5]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={SPROUT_GREEN} />
      </mesh>
      {/* Right leaf */}
      <mesh position={[0.08, 0.22, 0]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#8FCC8F" />
      </mesh>
    </group>
  );
}

function Crown() {
  return (
    <group position={[0, 1.45, 0.1]}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.22, 0.1, 5]} />
        <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Crown points */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.17, 0.1, Math.sin(angle) * 0.17]}>
            <coneGeometry args={[0.04, 0.1, 4]} />
            <meshStandardMaterial color="#FFD700" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Flowers ───────────────────────────────────────────────────────────

function Flowers({ count, health }: { count: number; health: number }) {
  const flowers = useMemo(() => {
    const items: { pos: [number, number, number]; color: string; scale: number; angle: number }[] = [];
    for (let i = 0; i < Math.min(count, 30); i++) {
      const angle = (i / 30) * Math.PI * 2 * 3 + i * 0.5;
      const radius = 1.2 + (i / 30) * 1.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      items.push({
        pos: [x, 0.08, z],
        color: FLOWER_COLORS[i % FLOWER_COLORS.length],
        scale: 0.6 + Math.random() * 0.4,
        angle: Math.random() * Math.PI * 2,
      });
    }
    return items;
  }, [count]);

  const droopFactor = health < 40 ? (40 - health) / 40 : 0;

  return (
    <group>
      {flowers.map((f, i) => (
        <Flower key={i} position={f.pos} color={f.color} scale={f.scale} droop={droopFactor} />
      ))}
    </group>
  );
}

function Flower({
  position,
  color,
  scale,
  droop,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  droop: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(Date.now() * 0.001 + position[0]) * 0.05;
  });

  const stemHeight = 0.25 * scale;
  const petalSize = 0.06 * scale;
  const droopRotation = droop * 0.8;

  return (
    <group ref={ref} position={position} rotation={[droopRotation, 0, 0]}>
      {/* Stem */}
      <mesh position={[0, stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.015, stemHeight, 4]} />
        <meshStandardMaterial color="#4A8B4A" />
      </mesh>
      {/* Center */}
      <mesh position={[0, stemHeight + 0.02, 0]}>
        <sphereGeometry args={[petalSize * 0.6, 6, 6]} />
        <meshStandardMaterial color="#FFE066" />
      </mesh>
      {/* Petals */}
      {[0, 1, 2, 3, 4].map((j) => {
        const a = (j / 5) * Math.PI * 2;
        return (
          <mesh
            key={j}
            position={[
              Math.cos(a) * petalSize * 1.2,
              stemHeight + 0.02,
              Math.sin(a) * petalSize * 1.2,
            ]}
          >
            <sphereGeometry args={[petalSize, 6, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Trees ─────────────────────────────────────────────────────────────

function Trees({ level }: { level: number }) {
  if (level <= 0) return null;

  const trunkHeight = 0.3 + level * 0.25;
  const canopySize = 0.2 + level * 0.15;

  return (
    <group position={[-2.2, 0.08, -1.5]}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, trunkHeight, 8]} />
        <meshStandardMaterial color={TRUNK_BROWN} />
      </mesh>
      {/* Canopy layers */}
      <mesh position={[0, trunkHeight + canopySize * 0.3, 0]} castShadow>
        <sphereGeometry args={[canopySize, 10, 8]} />
        <meshStandardMaterial color={CANOPY_GREEN} />
      </mesh>
      {level >= 3 && (
        <mesh position={[0.15, trunkHeight + canopySize * 0.7, 0.1]} castShadow>
          <sphereGeometry args={[canopySize * 0.7, 10, 8]} />
          <meshStandardMaterial color="#5AB85A" />
        </mesh>
      )}
      {level >= 2 && (
        <group position={[1.5, 0, 0.8]}>
          <mesh position={[0, trunkHeight * 0.6 / 2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.07, trunkHeight * 0.6, 8]} />
            <meshStandardMaterial color={TRUNK_BROWN} />
          </mesh>
          <mesh position={[0, trunkHeight * 0.6 + canopySize * 0.2, 0]} castShadow>
            <sphereGeometry args={[canopySize * 0.6, 10, 8]} />
            <meshStandardMaterial color={CANOPY_GREEN} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Pond ──────────────────────────────────────────────────────────────

function Pond({ level }: { level: number }) {
  if (level <= 0) return null;

  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.6 + Math.sin(Date.now() * 0.002) * 0.1;
  });

  const pondSize = 0.4 + level * 0.2;

  return (
    <group position={[1.8, 0.02, -1.2]}>
      {/* Water surface */}
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[pondSize, 24]} />
        <meshStandardMaterial color={WATER_BLUE} transparent opacity={0.7} />
      </mesh>
      {/* Pond edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[pondSize, pondSize + 0.08, 24]} />
        <meshStandardMaterial color={EARTH_BROWN} />
      </mesh>
      {/* Fish */}
      {level >= 3 && <Fish pondSize={pondSize} />}
    </group>
  );
}

function Fish({ pondSize }: { pondSize: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001;
    ref.current.position.x = Math.cos(t) * pondSize * 0.5;
    ref.current.position.z = Math.sin(t) * pondSize * 0.5;
    ref.current.rotation.y = -t + Math.PI / 2;
  });
  return (
    <mesh ref={ref} position={[0, 0.03, 0]}>
      <coneGeometry args={[0.04, 0.12, 4]} />
      <meshStandardMaterial color="#FF8C42" />
    </mesh>
  );
}

// ── Butterflies ───────────────────────────────────────────────────────

function Butterflies({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <group>
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <Butterfly key={i} index={i} />
      ))}
    </group>
  );
}

function Butterfly({ index }: { index: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingRef1 = useRef<THREE.Mesh>(null);
  const wingRef2 = useRef<THREE.Mesh>(null);
  const offset = index * 1.3;

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001 + offset;
    const radius = 1.5 + index * 0.3;
    ref.current.position.x = Math.cos(t * 0.5) * radius;
    ref.current.position.z = Math.sin(t * 0.7) * radius;
    ref.current.position.y = 1.5 + Math.sin(t * 2) * 0.3;
    ref.current.rotation.y = -t * 0.5 + Math.PI / 2;

    // Wing flap
    if (wingRef1.current && wingRef2.current) {
      const flap = Math.sin(t * 12) * 0.6;
      wingRef1.current.rotation.y = flap;
      wingRef2.current.rotation.y = -flap;
    }
  });

  const wingColor = FLOWER_COLORS[index % FLOWER_COLORS.length];

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.015, 0.06, 4, 6]} />
        <meshStandardMaterial color={CAPY_DARK} />
      </mesh>
      {/* Wings */}
      <mesh ref={wingRef1} position={[-0.03, 0, 0]}>
        <planeGeometry args={[0.08, 0.06]} />
        <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh ref={wingRef2} position={[0.03, 0, 0]}>
        <planeGeometry args={[0.08, 0.06]} />
        <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── Rainbow ───────────────────────────────────────────────────────────

function Rainbow({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.opacity = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
  });
  return (
    <mesh ref={ref} position={[0, 2.5, -2]} rotation={[0, 0, Math.PI / 6]}>
      <torusGeometry args={[2, 0.08, 8, 32, Math.PI]} />
      <meshStandardMaterial color="#FF6B9D" transparent opacity={0.35} />
    </mesh>
  );
}

// ── Sparkle Particles ─────────────────────────────────────────────────

function Sparkles({ health }: { health: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 30;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 1] = Math.random() * 3 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i);
      y += 0.003;
      if (y > 3.5) y = 0.5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  const sparkleColor = health > 50 ? "#FFD700" : "#999999";

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={sparkleColor} size={0.04} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ── Falling Leaves (when wilting) ─────────────────────────────────────

function FallingLeaves({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 15;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = Math.random() * 3 + 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!ref.current || !active) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i);
      let x = pos.getX(i);
      y -= 0.008;
      x += Math.sin(Date.now() * 0.001 + i) * 0.002;
      if (y < 0.1) {
        y = 3 + Math.random();
        x = (Math.random() - 0.5) * 6;
      }
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#C4956A" size={0.06} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ── Sky Dome ──────────────────────────────────────────────────────────

function SkyDome() {
  const mat = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.4, "#B0DFEE");
    gradient.addColorStop(0.7, "#F5E6D0");
    gradient.addColorStop(1, "#FFE4C4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false });
  }, []);

  return (
    <mesh scale={[15, 15, 15]}>
      <sphereGeometry args={[1, 16, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ── Scene Controller (handles pause/resume) ───────────────────────────

function SceneController({ isActive }: { isActive: boolean }) {
  const { gl } = useThree();

  useFrame(() => {
    if (!isActive) {
      gl.setAnimationLoop(null);
    }
  });

  return null;
}

// ── Main Garden Scene ─────────────────────────────────────────────────

function GardenScene({ garden, isActive, onCapyTap }: CapyGardenProps) {
  return (
    <>
      <SceneController isActive={isActive} />

      {/* Lighting */}
      <ambientLight intensity={0.7} color="#FFF5E6" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#B0D0FF" />

      {/* Sky dome */}
      <SkyDome />
      <fog attach="fog" args={["#E8F0E4", 10, 25]} />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 3}
        minAzimuthAngle={-Math.PI / 9}
        maxAzimuthAngle={Math.PI / 9}
        enableDamping
        dampingFactor={0.1}
      />

      {/* Ground */}
      <Ground health={garden.gardenHealth} />

      {/* Capy */}
      <Capy3D hasCrown={garden.hasCrown} onClick={onCapyTap} />

      {/* Flowers */}
      <Flowers count={garden.flowers} health={garden.gardenHealth} />

      {/* Trees */}
      <Trees level={garden.treeLevel} />

      {/* Pond */}
      <Pond level={garden.pondLevel} />

      {/* Butterflies */}
      <Butterflies count={garden.butterflies} />

      {/* Rainbow */}
      <Rainbow visible={garden.hasRainbow} />

      {/* Sparkles */}
      <Sparkles health={garden.gardenHealth} />

      {/* Falling leaves when wilting */}
      <FallingLeaves active={garden.gardenHealth < 30} />
    </>
  );
}

// ── Exported Canvas Wrapper ───────────────────────────────────────────

export default function CapyGarden({ garden, isActive, onCapyTap }: CapyGardenProps) {
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#E8F5E0]" style={{ height: "55vh" }}>
      <Canvas
        camera={{ position: [4, 3.5, 4], fov: 40 }}
        frameloop={isActive ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "low-power" }}
        shadows
      >
        <GardenScene garden={garden} isActive={isActive} onCapyTap={onCapyTap} />
      </Canvas>
    </div>
  );
}
