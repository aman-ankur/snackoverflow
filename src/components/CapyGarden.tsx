"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GardenState } from "@/lib/useGardenState";

// ── Types ─────────────────────────────────────────────────────────────

interface CapyGardenProps {
  garden: GardenState;
  isActive: boolean;
  onCapyTap?: () => void;
}

interface TimeOfDayParams {
  skyTopColor: THREE.Color;
  skyBottomColor: THREE.Color;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPosition: THREE.Vector3;
  fogColor: THREE.Color;
  fogNear: number;
  fogFar: number;
  starsOpacity: number;
  moonOpacity: number;
  firefliesOpacity: number;
  bgGradientTop: string;
  bgGradientBottom: string;
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

// ── Time-of-Day Engine ───────────────────────────────────────────────

function lerpColor(a: string, b: string, t: number): THREE.Color {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function colorToHex(c: THREE.Color): string {
  return "#" + c.getHexString();
}

function getTimeOfDayParams(hour: number, minute: number): TimeOfDayParams {
  const t = hour + minute / 60; // fractional hour

  // Phase definitions: [startHour, skyTop, skyBottom, ambientHex, ambientInt, sunHex, sunInt, sunAngleDeg, fogHex, fogNear, fogFar, stars, moon, fireflies]
  type Phase = { h: number; skyT: string; skyB: string; ambC: string; ambI: number; sunC: string; sunI: number; sunAng: number; fogC: string; fogN: number; fogF: number; stars: number; moon: number; fire: number };

  const phases: Phase[] = [
    { h: 0,  skyT: "#0B1026", skyB: "#192048", ambC: "#8899CC", ambI: 0.7, sunC: "#99AADD", sunI: 0.5, sunAng: -30, fogC: "#253060", fogN: 14, fogF: 40, stars: 1.0, moon: 1.0, fire: 0.8 },
    { h: 5,  skyT: "#0B1026", skyB: "#192048", ambC: "#8899CC", ambI: 0.7, sunC: "#99AADD", sunI: 0.5, sunAng: -10, fogC: "#253060", fogN: 14, fogF: 40, stars: 1.0, moon: 1.0, fire: 0.8 },
    { h: 6,  skyT: "#2D1B4E", skyB: "#FF6B6B", ambC: "#CC8866", ambI: 0.55, sunC: "#FF9966", sunI: 0.6, sunAng: 5,   fogC: "#6A4070", fogN: 12, fogF: 35, stars: 0.3, moon: 0.3, fire: 0.3 },
    { h: 7.5,skyT: "#FF9966", skyB: "#FFD4A8", ambC: "#FFCC88", ambI: 0.6, sunC: "#FFDDAA", sunI: 0.8, sunAng: 25,  fogC: "#D4A080", fogN: 12, fogF: 30, stars: 0.0, moon: 0.0, fire: 0.0 },
    { h: 9,  skyT: "#87CEEB", skyB: "#E8F5E0", ambC: "#FFF5E6", ambI: 0.65, sunC: "#FFFFFF", sunI: 0.95, sunAng: 50, fogC: "#E8F0E4", fogN: 12, fogF: 30, stars: 0.0, moon: 0.0, fire: 0.0 },
    { h: 12, skyT: "#5BA3D9", skyB: "#F5E6D0", ambC: "#FFF8F0", ambI: 0.7,  sunC: "#FFFFFF", sunI: 1.0, sunAng: 80,  fogC: "#E0E8D8", fogN: 12, fogF: 30, stars: 0.0, moon: 0.0, fire: 0.0 },
    { h: 16, skyT: "#6BAFE0", skyB: "#F0E0C8", ambC: "#FFE8CC", ambI: 0.65, sunC: "#FFCC88", sunI: 0.85, sunAng: 50, fogC: "#D8DCC8", fogN: 12, fogF: 30, stars: 0.0, moon: 0.0, fire: 0.0 },
    { h: 17.5,skyT: "#FF7043", skyB: "#FFD54F", ambC: "#FFAA66", ambI: 0.6,  sunC: "#FF8844", sunI: 0.7, sunAng: 20,  fogC: "#D4A060", fogN: 12, fogF: 30, stars: 0.0, moon: 0.0, fire: 0.2 },
    { h: 19, skyT: "#4A1A6B", skyB: "#2D1B4E", ambC: "#9977CC", ambI: 0.6, sunC: "#CC8866", sunI: 0.5, sunAng: 2,  fogC: "#3A2860", fogN: 13, fogF: 35, stars: 0.5, moon: 0.5, fire: 0.6 },
    { h: 20, skyT: "#0B1026", skyB: "#192048", ambC: "#8899CC", ambI: 0.7, sunC: "#99AADD", sunI: 0.5, sunAng: -20, fogC: "#253060", fogN: 14, fogF: 40, stars: 1.0, moon: 1.0, fire: 0.8 },
    { h: 24, skyT: "#0B1026", skyB: "#192048", ambC: "#8899CC", ambI: 0.7, sunC: "#99AADD", sunI: 0.5, sunAng: -30, fogC: "#253060", fogN: 14, fogF: 40, stars: 1.0, moon: 1.0, fire: 0.8 },
  ];

  // Find the two phases to lerp between
  let a = phases[0], b = phases[1];
  for (let i = 0; i < phases.length - 1; i++) {
    if (t >= phases[i].h && t < phases[i + 1].h) {
      a = phases[i];
      b = phases[i + 1];
      break;
    }
  }

  const range = b.h - a.h;
  const frac = range > 0 ? (t - a.h) / range : 0;

  const sunAngleRad = lerpNum(a.sunAng, b.sunAng, frac) * (Math.PI / 180);
  const sunDist = 8;

  return {
    skyTopColor: lerpColor(a.skyT, b.skyT, frac),
    skyBottomColor: lerpColor(a.skyB, b.skyB, frac),
    ambientColor: lerpColor(a.ambC, b.ambC, frac),
    ambientIntensity: lerpNum(a.ambI, b.ambI, frac),
    sunColor: lerpColor(a.sunC, b.sunC, frac),
    sunIntensity: lerpNum(a.sunI, b.sunI, frac),
    sunPosition: new THREE.Vector3(
      Math.cos(sunAngleRad) * sunDist,
      Math.sin(sunAngleRad) * sunDist,
      3
    ),
    fogColor: lerpColor(a.fogC, b.fogC, frac),
    fogNear: lerpNum(a.fogN, b.fogN, frac),
    fogFar: lerpNum(a.fogF, b.fogF, frac),
    starsOpacity: lerpNum(a.stars, b.stars, frac),
    moonOpacity: lerpNum(a.moon, b.moon, frac),
    firefliesOpacity: lerpNum(a.fire, b.fire, frac),
    bgGradientTop: colorToHex(lerpColor(a.skyT, b.skyT, frac)),
    bgGradientBottom: colorToHex(lerpColor(a.skyB, b.skyB, frac)),
  };
}

// ── Dynamic Sky Dome ─────────────────────────────────────────────────

function DynamicSkyDome() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const lastTopRef = useRef("");
  const frameCount = useRef(59); // start at 59 so first frame triggers update

  const mat = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 256;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d")!;
    // Initialize with correct time-of-day colors
    const now = new Date();
    const initParams = getTimeOfDayParams(now.getHours(), now.getMinutes());
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, colorToHex(initParams.skyTopColor));
    gradient.addColorStop(0.5, colorToHex(lerpColor(colorToHex(initParams.skyTopColor), colorToHex(initParams.skyBottomColor), 0.5)));
    gradient.addColorStop(1, colorToHex(initParams.skyBottomColor));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    const tex = new THREE.CanvasTexture(canvas);
    texRef.current = tex;
    const m = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false });
    matRef.current = m;
    return m;
  }, []);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 60 !== 0) return; // update every ~1s
    const now = new Date();
    const params = getTimeOfDayParams(now.getHours(), now.getMinutes());
    const topHex = colorToHex(params.skyTopColor);
    if (topHex === lastTopRef.current) return;
    lastTopRef.current = topHex;

    const canvas = canvasRef.current;
    const tex = texRef.current;
    if (!canvas || !tex) return;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, colorToHex(params.skyTopColor));
    gradient.addColorStop(0.5, colorToHex(lerpColor(colorToHex(params.skyTopColor), colorToHex(params.skyBottomColor), 0.5)));
    gradient.addColorStop(1, colorToHex(params.skyBottomColor));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    tex.needsUpdate = true;
  });

  return (
    <mesh scale={[15, 15, 15]}>
      <sphereGeometry args={[1, 16, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ── Dynamic Lighting ─────────────────────────────────────────────────

function DynamicLighting() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const moonlightRef = useRef<THREE.DirectionalLight>(null);
  const frameCount = useRef(29); // start at 29 so first frame triggers update

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 30 !== 0) return; // update every ~0.5s
    const now = new Date();
    const params = getTimeOfDayParams(now.getHours(), now.getMinutes());

    if (ambientRef.current) {
      ambientRef.current.color.copy(params.ambientColor);
      ambientRef.current.intensity = params.ambientIntensity;
    }
    if (sunRef.current) {
      sunRef.current.color.copy(params.sunColor);
      sunRef.current.intensity = params.sunIntensity;
      sunRef.current.position.copy(params.sunPosition);
    }
    if (fillRef.current) {
      // Fill light — always provides base illumination, stronger at night
      const isNight = params.starsOpacity > 0.3;
      fillRef.current.intensity = isNight ? 0.4 : 0.2;
      fillRef.current.color.copy(isNight ? new THREE.Color("#AABBEE") : new THREE.Color("#B0D0FF"));
    }
    if (moonlightRef.current) {
      // Dedicated moonlight — shines down on the garden at night
      const moonStr = params.moonOpacity;
      moonlightRef.current.intensity = moonStr * 0.6;
      moonlightRef.current.visible = moonStr > 0.05;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.7} color="#FFF5E6" />
      <directionalLight
        ref={sunRef}
        position={[5, 8, 3]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <directionalLight ref={fillRef} position={[-3, 5, -2]} intensity={0.3} color="#B0D0FF" />
      {/* Moonlight — dedicated top-down light for night visibility */}
      <directionalLight
        ref={moonlightRef}
        position={[-4, 8, -3]}
        intensity={0}
        color="#CCDDFF"
        visible={false}
      />
    </>
  );
}

// ── Dynamic Fog ──────────────────────────────────────────────────────

function DynamicFog() {
  const { scene } = useThree();
  const frameCount = useRef(59); // start at 59 so first frame triggers update

  useEffect(() => {
    const now = new Date();
    const initParams = getTimeOfDayParams(now.getHours(), now.getMinutes());
    scene.fog = new THREE.Fog(colorToHex(initParams.fogColor), initParams.fogNear, initParams.fogFar);
    return () => { scene.fog = null; };
  }, [scene]);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 60 !== 0) return;
    if (!scene.fog) return;
    const now = new Date();
    const params = getTimeOfDayParams(now.getHours(), now.getMinutes());
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(params.fogColor);
    fog.near = params.fogNear;
    fog.far = params.fogFar;
  });

  return null;
}

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
        <cylinderGeometry args={[5.5, 5.5, 0.15, 48]} />
        <meshStandardMaterial color={grassColor} />
      </mesh>
      {/* Grass edge ring — slightly darker */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <ringGeometry args={[4.8, 5.5, 48]} />
        <meshStandardMaterial color={new THREE.Color(grassColor).multiplyScalar(0.85)} side={THREE.DoubleSide} />
      </mesh>
      {/* Earth sides */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[5.5, 5.0, 0.45, 48]} />
        <meshStandardMaterial color={EARTH_BROWN} />
      </mesh>
    </group>
  );
}

// ── 3D Capybara (GLB model) ───────────────────────────────────────────

const CAPY_MODEL_PATH = "/model/capybara.glb";

function Capy3D({ onClick }: { onClick?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(CAPY_MODEL_PATH);
  const [bouncing, setBouncing] = useState(false);
  const bounceTime = useRef(0);
  const baseY = 0.08;

  // Clone the scene so each instance is independent
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Boost materials so the capybara is clearly visible day and night
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            const m = mat as THREE.MeshStandardMaterial;
            if (m.isMeshStandardMaterial) {
              // Keep original texture colors — don't wash them out
              // Moderate emissive for night visibility
              m.emissive = new THREE.Color("#8B6B4A");
              m.emissiveIntensity = 0.2;
              m.roughness = Math.min(m.roughness, 0.75);
              m.needsUpdate = true;
            }
          });
        }
      }
    });
    return clone;
  }, [scene]);

  useFrame((_state: unknown, delta: number) => {
    if (!groupRef.current) return;
    const t = Date.now() * 0.001;

    // Idle breathing
    const breathScale = 1 + Math.sin(t * 1.5) * 0.012;
    groupRef.current.scale.set(breathScale, breathScale, breathScale);

    // Gentle sway
    groupRef.current.rotation.y = -Math.PI * 0.35 + Math.sin(t * 0.3) * 0.02;

    // Bounce on tap
    if (bouncing) {
      bounceTime.current += delta * 8;
      const b = Math.sin(bounceTime.current * Math.PI) * 0.3;
      groupRef.current.position.y = baseY + Math.max(0, b);
      if (bounceTime.current >= 1) {
        setBouncing(false);
        bounceTime.current = 0;
        groupRef.current.position.y = baseY;
      }
    }
  });

  const handleClick = useCallback(() => {
    setBouncing(true);
    bounceTime.current = 0;
    onClick?.();
  }, [onClick]);

  return (
    <group ref={groupRef} position={[0, baseY, 0]} rotation={[0, -Math.PI * 0.35, 0]} onClick={handleClick}>
      {/* The GLB model — scale to fit the garden */}
      <primitive object={clonedScene} scale={1.8} position={[0, 0, 0]} />

      {/* Dedicated lights on the capybara so it's always clearly visible */}
      <pointLight position={[0, 2.5, 1.5]} intensity={4} distance={6} color="#FFF8F0" />
      <pointLight position={[-1, 1.5, 1]} intensity={2} distance={5} color="#FFE8CC" />
      <pointLight position={[1, 1, -0.5]} intensity={1.5} distance={4} color="#FFF0E0" />

      {/* Plant in pot — sitting on capybara's head */}
      <group position={[0, 0.85, 0.42]}>
        <PlantInPot />
      </group>

    </group>
  );
}

// Preload the model
useGLTF.preload(CAPY_MODEL_PATH);

function PlantInPot() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    // Gentle wobble like it's balancing
    const t = Date.now() * 0.001;
    ref.current.rotation.z = Math.sin(t * 1.2) * 0.06;
    ref.current.rotation.x = Math.sin(t * 0.9) * 0.03;
  });
  return (
    <group ref={ref}>
      {/* ── Terracotta pot ── */}
      {/* Pot body — tapered cylinder */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.07, 0.05, 0.1, 12]} />
        <meshStandardMaterial color="#C4713B" roughness={0.8} />
      </mesh>
      {/* Pot rim — wider ring at top */}
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.08, 0.075, 0.025, 12]} />
        <meshStandardMaterial color="#D4814B" roughness={0.7} />
      </mesh>
      {/* Soil — dark circle on top */}
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 12]} />
        <meshStandardMaterial color="#5C3D20" />
      </mesh>

      {/* ── Plant growing from pot ── */}
      {/* Main stem */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.18, 6]} />
        <meshStandardMaterial color="#5A9E3E" />
      </mesh>
      {/* Left leaf — lower */}
      <mesh position={[-0.06, 0.24, 0]} rotation={[0, 0, 0.6]} scale={[1, 0.6, 0.8]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color={SPROUT_GREEN} />
      </mesh>
      {/* Right leaf — lower */}
      <mesh position={[0.06, 0.22, 0]} rotation={[0, 0, -0.6]} scale={[1, 0.6, 0.8]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#8FCC8F" />
      </mesh>
      {/* Top left leaf — higher */}
      <mesh position={[-0.04, 0.32, 0.02]} rotation={[0.2, 0, 0.4]} scale={[1, 0.6, 0.8]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#6BBF4A" />
      </mesh>
      {/* Top right leaf — higher */}
      <mesh position={[0.04, 0.34, -0.02]} rotation={[-0.2, 0, -0.4]} scale={[1, 0.6, 0.8]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color={SPROUT_GREEN} />
      </mesh>
      {/* Tiny top bud */}
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color="#8FCC8F" />
      </mesh>
    </group>
  );
}

function HotSpring({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const steamRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    // Animate steam puffs
    if (steamRef.current) {
      const t = Date.now() * 0.001;
      steamRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const phase = (t * 0.4 + i * 0.6) % 2.0;
        mesh.position.y = 0.05 + phase * 0.4;
        mesh.position.x = Math.sin(t * 0.3 + i * 1.5) * 0.08;
        mesh.position.z = Math.cos(t * 0.4 + i * 2.0) * 0.06;
        const s = 0.03 + phase * 0.04;
        mesh.scale.setScalar(s / 0.03);
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(0, 0.35 - phase * 0.15);
      });
    }
    // Gentle water shimmer
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.7 + Math.sin(Date.now() * 0.002) * 0.08;
    }
  });

  return (
    <group position={[2.5, 0.08, 2.0]}>
      {/* Stone rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.45, 0.58, 24]} />
        <meshStandardMaterial color="#8B8682" roughness={0.9} />
      </mesh>
      {/* Inner wall */}
      <mesh position={[0, 0.0, 0]}>
        <cylinderGeometry args={[0.45, 0.48, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#7A7570" side={THREE.DoubleSide} />
      </mesh>
      {/* Warm water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.44, 24]} />
        <meshStandardMaterial
          color="#7EC8E3"
          emissive="#4A9EBF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Warm glow from water */}
      <pointLight position={[0, 0.15, 0]} intensity={0.6} distance={2.0} color="#FFD4A8" />
      {/* Steam puffs */}
      <group ref={steamRef} position={[0, 0.08, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
      {/* Small rocks around the edge */}
      {[0, 1.2, 2.5, 3.8, 5.0].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.55, 0.06, Math.sin(a) * 0.55]}>
          <sphereGeometry args={[0.06 + (i % 2) * 0.02, 6, 5]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#9E9A95" : "#8B8682"} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ── Flowers ───────────────────────────────────────────────────────────

function Flowers({ count, health }: { count: number; health: number }) {
  const flowers = useMemo(() => {
    const items: { pos: [number, number, number]; color: string; scale: number; angle: number }[] = [];
    for (let i = 0; i < Math.min(count, 30); i++) {
      const angle = (i / 30) * Math.PI * 2 * 3 + i * 0.5;
      const radius = 1.5 + (i / 30) * 3.3;
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

function RoundTree({ position, trunkH, canopy, trunkColor, canopyColor, canopy2Color }: {
  position: [number, number, number]; trunkH: number; canopy: number;
  trunkColor: string; canopyColor: string; canopy2Color?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, trunkH, 8]} />
        <meshStandardMaterial color={trunkColor} />
      </mesh>
      <mesh position={[0, trunkH + canopy * 0.3, 0]} castShadow>
        <sphereGeometry args={[canopy, 10, 8]} />
        <meshStandardMaterial color={canopyColor} />
      </mesh>
      {canopy2Color && (
        <mesh position={[0.12, trunkH + canopy * 0.7, 0.08]} castShadow>
          <sphereGeometry args={[canopy * 0.65, 10, 8]} />
          <meshStandardMaterial color={canopy2Color} />
        </mesh>
      )}
    </group>
  );
}

function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 8]} />
        <meshStandardMaterial color="#5C3D20" />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <coneGeometry args={[0.35, 0.5, 8]} />
        <meshStandardMaterial color="#1B5E20" />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[0.27, 0.45, 8]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.18, 0.35, 8]} />
        <meshStandardMaterial color="#388E3C" />
      </mesh>
    </group>
  );
}

function SpruceTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 0.7, 6]} />
        <meshStandardMaterial color="#4A3520" />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <coneGeometry args={[0.22, 0.7, 6]} />
        <meshStandardMaterial color="#1A472A" />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[0.15, 0.5, 6]} />
        <meshStandardMaterial color="#2D5F3E" />
      </mesh>
    </group>
  );
}

function BirchTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.7, 8]} />
        <meshStandardMaterial color="#E8E0D0" />
      </mesh>
      {/* Birch bark marks */}
      <mesh position={[0.04, 0.3, 0]} castShadow>
        <boxGeometry args={[0.01, 0.04, 0.06]} />
        <meshStandardMaterial color="#3E3E3E" />
      </mesh>
      <mesh position={[-0.03, 0.45, 0.02]} castShadow>
        <boxGeometry args={[0.01, 0.03, 0.05]} />
        <meshStandardMaterial color="#3E3E3E" />
      </mesh>
      {/* Canopy — lighter green, slightly oval */}
      <mesh position={[0, 0.75, 0]} castShadow scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.3, 10, 8]} />
        <meshStandardMaterial color="#7CB342" />
      </mesh>
      <mesh position={[0.1, 0.85, 0.05]} castShadow>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#9CCC65" />
      </mesh>
    </group>
  );
}

function WillowTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.8, 8]} />
        <meshStandardMaterial color="#6D5B3A" />
      </mesh>
      {/* Drooping canopy layers */}
      <mesh position={[0, 0.85, 0]} castShadow scale={[1.2, 0.7, 1.2]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#558B2F" transparent opacity={0.85} />
      </mesh>
      {/* Hanging fronds */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.35, 0.55, Math.sin(a) * 0.35]} castShadow>
          <cylinderGeometry args={[0.015, 0.005, 0.35, 4]} />
          <meshStandardMaterial color="#689F38" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Trees({ level }: { level: number }) {
  if (level <= 0) return null;

  const trunkH = 0.3 + level * 0.25;
  const canopy = 0.2 + level * 0.15;

  return (
    <group>
      {/* Main oak tree — back-left */}
      <RoundTree
        position={[-3.5, 0.08, -2.5]}
        trunkH={trunkH} canopy={canopy}
        trunkColor={TRUNK_BROWN} canopyColor={CANOPY_GREEN}
        canopy2Color={level >= 3 ? "#5AB85A" : undefined}
      />

      {/* Second round tree — right side */}
      {level >= 2 && (
        <RoundTree
          position={[3.2, 0.08, -1.8]}
          trunkH={trunkH * 0.5} canopy={canopy * 0.55}
          trunkColor={TRUNK_BROWN} canopyColor="#4A9E4A"
        />
      )}

      {/* Birch tree — level 2+ */}
      {level >= 2 && <BirchTree position={[4.0, 0.08, 1.5]} />}

      {/* Cherry blossom tree — level 3+ */}
      {level >= 3 && (
        <RoundTree
          position={[-1.5, 0.08, -3.5]}
          trunkH={trunkH * 0.6} canopy={canopy * 0.6}
          trunkColor="#6B4226" canopyColor="#FFB7C5"
        />
      )}

      {/* Pine tree — level 3+ */}
      {level >= 3 && <PineTree position={[2.0, 0.08, -3.2]} />}

      {/* Spruce tree — level 3+ */}
      {level >= 3 && <SpruceTree position={[-4.0, 0.08, 0.5]} scale={0.9} />}

      {/* Willow tree — level 4 */}
      {level >= 4 && <WillowTree position={[0.5, 0.08, -4.0]} />}

      {/* Second pine — level 4 */}
      {level >= 4 && <PineTree position={[-2.5, 0.08, -3.8]} scale={0.75} />}

      {/* Small spruce — level 4 */}
      {level >= 4 && <SpruceTree position={[3.8, 0.08, -3.0]} scale={0.65} />}

      {/* Bushes — level 2+ */}
      {level >= 2 && (
        <>
          <mesh position={[-2.0, 0.12, 2.5]} castShadow>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial color="#3D8B3D" />
          </mesh>
          <mesh position={[3.5, 0.12, 0.5]} castShadow>
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshStandardMaterial color="#4A9E4A" />
          </mesh>
        </>
      )}
      {level >= 3 && (
        <>
          <mesh position={[-3.0, 0.1, 1.5]} castShadow>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color="#2E7D32" />
          </mesh>
          <mesh position={[1.5, 0.1, 3.5]} castShadow>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial color="#388E3C" />
          </mesh>
          <mesh position={[-4.2, 0.1, -1.0]} castShadow>
            <sphereGeometry args={[0.17, 8, 6]} />
            <meshStandardMaterial color="#43A047" />
          </mesh>
        </>
      )}

      {/* Mushrooms — level 3+ */}
      {level >= 3 && (
        <>
          <Mushroom position={[-1.0, 0.08, 2.0]} color="#E57373" />
          <Mushroom position={[2.8, 0.08, 1.8]} color="#FFD54F" />
        </>
      )}
      {level >= 4 && (
        <>
          <Mushroom position={[-2.5, 0.08, -0.5]} color="#CE93D8" />
          <Mushroom position={[0.8, 0.08, 3.0]} color="#E57373" />
          <Mushroom position={[-3.5, 0.08, 0.0]} color="#FFD54F" />
        </>
      )}
    </group>
  );
}

function Mushroom({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.08, 6]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[0.05, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// ── Baby Capybaras (using same GLB model, scaled down) ──────────────

function BabyCapybaras({ count }: { count: number }) {
  if (count <= 0) return null;
  const positions: [number, number, number][] = [
    [1.2, 0.02, 0.8],
    [-0.8, 0.02, 1.2],
    [0.5, 0.02, -1.0],
  ];
  const rotations: number[] = [-0.5, 0.8, -1.8];
  return (
    <group>
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <BabyCapy key={i} position={positions[i]} rotationY={rotations[i]} index={i} />
      ))}
    </group>
  );
}

function BabyCapy({ position, rotationY, index }: { position: [number, number, number]; rotationY: number; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(CAPY_MODEL_PATH);

  const babyScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            const m = mat as THREE.MeshStandardMaterial;
            if (m.isMeshStandardMaterial) {
              m.emissive = new THREE.Color("#8B6B4A");
              m.emissiveIntensity = 0.2;
              m.roughness = Math.min(m.roughness, 0.75);
              m.needsUpdate = true;
            }
          });
        }
      }
    });
    return clone;
  }, [scene]);

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.001 + index * 2.1;
    // Gentle idle sway
    ref.current.rotation.y = rotationY + Math.sin(t * 0.5) * 0.1;
    // Tiny hop
    ref.current.position.y = position[1] + Math.abs(Math.sin(t * 1.5 + index)) * 0.015;
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={babyScene} scale={0.55} position={[0, 0, 0]} />
      {/* Small light so baby is visible at night */}
      <pointLight position={[0, 0.5, 0.3]} intensity={1} distance={2} color="#FFF8F0" />
    </group>
  );
}

// ── Cozy Home ────────────────────────────────────────────────────────

function CozyHome({ level }: { level: number }) {
  if (level <= 0) return null;

  const smokeRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!smokeRef.current) return;
    const t = Date.now() * 0.001;
    smokeRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.position.y = 0.1 + ((t * 0.3 + i * 0.4) % 1.2);
      mesh.position.x = Math.sin(t * 0.5 + i) * 0.05;
      const scale = 0.03 + ((t * 0.3 + i * 0.4) % 1.2) * 0.03;
      mesh.scale.setScalar(scale / 0.03);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.4 - ((t * 0.3 + i * 0.4) % 1.2) * 0.3);
    });
  });

  const wallH = level >= 3 ? 0.45 : level >= 2 ? 0.35 : 0.25;
  const roofH = level >= 3 ? 0.3 : level >= 2 ? 0.25 : 0.2;
  const wallW = level >= 3 ? 0.5 : level >= 2 ? 0.4 : 0.3;
  const wallD = level >= 3 ? 0.4 : level >= 2 ? 0.35 : 0.25;

  return (
    <group position={[-2.5, 0.08, -0.5]}>
      {/* Foundation */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[wallW + 0.1, 0.04, wallD + 0.1]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      {/* Walls */}
      <mesh position={[0, wallH / 2 + 0.04, 0]} castShadow>
        <boxGeometry args={[wallW, wallH, wallD]} />
        <meshStandardMaterial color={level >= 2 ? "#D4A76A" : "#C4956A"} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, wallH + 0.04 + roofH / 2, 0]} castShadow>
        <coneGeometry args={[wallW * 0.8, roofH, 4]} />
        <meshStandardMaterial color={level >= 3 ? "#8B4513" : "#A0522D"} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.12, wallD / 2 + 0.001]}>
        <boxGeometry args={[0.08, 0.16, 0.01]} />
        <meshStandardMaterial color="#5C3D20" />
      </mesh>
      {/* Window — level 2+ */}
      {level >= 2 && (
        <mesh position={[wallW * 0.3, wallH * 0.5 + 0.04, wallD / 2 + 0.001]}>
          <boxGeometry args={[0.07, 0.07, 0.01]} />
          <meshStandardMaterial color="#87CEEB" emissive="#FFE4B5" emissiveIntensity={0.3} />
        </mesh>
      )}
      {/* Chimney — level 3 */}
      {level >= 3 && (
        <>
          <mesh position={[wallW * 0.25, wallH + roofH * 0.6 + 0.04, 0]} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color="#8B6B4A" />
          </mesh>
          {/* Smoke puffs */}
          <group ref={smokeRef} position={[wallW * 0.25, wallH + roofH * 0.6 + 0.14, 0]}>
            {[0, 1, 2].map((i) => (
              <mesh key={i}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshStandardMaterial color="#D0D0D0" transparent opacity={0.3} />
              </mesh>
            ))}
          </group>
        </>
      )}
      {/* Fence — level 2+ */}
      {level >= 2 && (
        <group position={[0, 0, wallD / 2 + 0.15]}>
          {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => (
            <mesh key={x} position={[x, 0.06, 0]}>
              <boxGeometry args={[0.015, 0.12, 0.015]} />
              <meshStandardMaterial color="#C4956A" />
            </mesh>
          ))}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.45, 0.015, 0.015]} />
            <meshStandardMaterial color="#C4956A" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.45, 0.015, 0.015]} />
            <meshStandardMaterial color="#C4956A" />
          </mesh>
        </group>
      )}
    </group>
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

const RAINBOW_COLORS = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#8B00FF"];

function Rainbow({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[-1.5, 0.5, -1.5]} rotation={[0, -Math.PI * 0.75, 0]}>
      {RAINBOW_COLORS.map((color, i) => (
        <mesh key={i}>
          <torusGeometry args={[2.5 - i * 0.12, 0.08, 8, 64, Math.PI]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.2}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
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

// ── Stars (night sky) ────────────────────────────────────────────────

function Stars() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const count = 200;
  const frameCount = useRef(0);

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribute on upper hemisphere of a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45; // upper hemisphere only
      const r = 12 + Math.random() * 2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      ph[i] = Math.random() * Math.PI * 2; // random twinkle phase
    }
    return { positions: pos, phases: ph };
  }, []);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;

    // Slow rotation for subtle star drift
    ref.current.rotation.y += 0.00005;

    // Update opacity based on time of day
    frameCount.current++;
    if (frameCount.current % 60 !== 0) return;
    const now = new Date();
    const params = getTimeOfDayParams(now.getHours(), now.getMinutes());
    matRef.current.opacity = params.starsOpacity * 0.9;

    // Twinkle via size
    const t = Date.now() * 0.001;
    const sizes = ref.current.geometry.attributes.size;
    if (sizes) {
      for (let i = 0; i < count; i++) {
        sizes.setX(i, 0.06 + Math.sin(t * 2 + phases[i]) * 0.03);
      }
      sizes.needsUpdate = true;
    }
  });

  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) s[i] = 0.05 + Math.random() * 0.04;
    return s;
  }, []);

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color="#FFFFFF"
        size={0.08}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ── Moon ──────────────────────────────────────────────────────────────

function Moon() {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const outerGlowRef = useRef<THREE.MeshBasicMaterial>(null);
  const frameCount = useRef(59);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 60 !== 0) return;
    const now = new Date();
    const params = getTimeOfDayParams(now.getHours(), now.getMinutes());
    if (matRef.current) matRef.current.opacity = params.moonOpacity;
    if (glowMatRef.current) glowMatRef.current.opacity = params.moonOpacity * 0.35;
    if (outerGlowRef.current) outerGlowRef.current.opacity = params.moonOpacity * 0.12;
    if (groupRef.current) groupRef.current.visible = params.moonOpacity > 0.05;
  });

  return (
    <group ref={groupRef} position={[-5, 9, -6]} visible={false}>
      {/* Moon sphere — large and bright */}
      <mesh>
        <sphereGeometry args={[0.8, 20, 20]} />
        <meshStandardMaterial
          ref={matRef}
          color="#FFF8E8"
          emissive="#EEEEFF"
          emissiveIntensity={0.7}
          transparent
          opacity={0}
        />
      </mesh>
      {/* Inner glow halo */}
      <mesh>
        <sphereGeometry args={[1.1, 20, 20]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color="#CCDDFF"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* Outer soft glow */}
      <mesh>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          ref={outerGlowRef}
          color="#8899CC"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── Fireflies ────────────────────────────────────────────────────────

function Fireflies() {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const count = 20;
  const frameCount = useRef(0);

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = 0.3 + Math.random() * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: ph };
  }, []);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const t = Date.now() * 0.001;

    // Gentle floating movement
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      pos.setX(i, px + Math.sin(t * 0.3 + phases[i]) * 0.003);
      pos.setY(i, py + Math.cos(t * 0.5 + phases[i] * 2) * 0.002);
      pos.setZ(i, pz + Math.cos(t * 0.4 + phases[i]) * 0.003);
    }
    pos.needsUpdate = true;

    // Update opacity based on time of day
    frameCount.current++;
    if (frameCount.current % 60 !== 0) return;
    const now = new Date();
    const params = getTimeOfDayParams(now.getHours(), now.getMinutes());
    // Pulse each firefly's visibility
    const baseOpacity = params.firefliesOpacity;
    matRef.current.opacity = baseOpacity * (0.5 + Math.sin(t * 3) * 0.5);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color="#FFE4A0"
        size={0.08}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
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

      {/* Dynamic lighting (time-of-day) */}
      <DynamicLighting />

      {/* Dynamic fog (time-of-day) */}
      <DynamicFog />

      {/* Dynamic sky dome (time-of-day) */}
      <DynamicSkyDome />

      {/* Night sky elements */}
      <Stars />
      <Moon />
      <Fireflies />

      {/* Camera controls — full 360° exploration with zoom */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={1.0}
        maxDistance={14}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
      />

      {/* Ground */}
      <Ground health={garden.gardenHealth} />

      {/* Capy */}
      <Capy3D onClick={onCapyTap} />

      {/* Hot Spring (crown/ultimate achievement) */}
      <HotSpring visible={garden.hasCrown} />

      {/* Flowers */}
      <Flowers count={garden.flowers} health={garden.gardenHealth} />

      {/* Trees */}
      <Trees level={garden.treeLevel} />

      {/* Baby Capybaras */}
      <BabyCapybaras count={garden.babyCapybaras ?? 0} />

      {/* Cozy Home */}
      <CozyHome level={garden.homeLevel ?? 0} />

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
  const [bgGradient, setBgGradient] = useState({ top: "#87CEEB", bottom: "#E8F5E0" });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const params = getTimeOfDayParams(now.getHours(), now.getMinutes());
      setBgGradient({ top: params.bgGradientTop, bottom: params.bgGradientBottom });
    };
    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        height: "55vh",
        background: `linear-gradient(to bottom, ${bgGradient.top}, ${bgGradient.bottom})`,
      }}
    >
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
