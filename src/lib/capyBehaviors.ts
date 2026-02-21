// ── Capybara Behavior State Machine ──────────────────────────────────
// Lightweight FSM for capybara idle tasks, wandering, interactions, etc.
// Used by both main capybara and baby capybaras in the garden scene.

export type CapyState =
  | "idle"
  | "wander"
  | "eat"
  | "splash"
  | "chase_butterfly"
  | "tapped"
  | "dance";

/** Which random reaction plays on tap */
export type TapReaction = "squash" | "wiggle" | "nuzzle" | "look";

export interface CapyBehavior {
  state: CapyState;
  /** Elapsed time in current state (seconds) */
  elapsed: number;
  /** Duration the current state should last (seconds) */
  duration: number;
  /** Current world position */
  posX: number;
  posZ: number;
  /** Target position for wander/splash/chase */
  targetX: number;
  targetZ: number;
  /** Position at the start of a move (for lerp) */
  startX: number;
  startZ: number;
  /** Current facing rotation Y */
  rotationY: number;
  /** Target facing rotation Y */
  targetRotationY: number;
  /** Timestamp of last tap (for double-tap detection) */
  lastTapTime: number;
  /** Which tap reaction is currently playing */
  tapReaction: TapReaction;
}

// ── Config ───────────────────────────────────────────────────────────

export interface CapyBehaviorConfig {
  /** Max wander radius from home position */
  wanderRadius: number;
  /** Home position (center of wander area) */
  homeX: number;
  homeZ: number;
  /** Whether hot spring is available (for splash) */
  hasHotSpring: boolean;
  /** Number of butterflies in the scene */
  butterflyCount: number;
  /** Whether this is a baby capybara */
  isBaby: boolean;
  /** Main capybara position (for baby follow behavior) */
  mainCapyX?: number;
  mainCapyZ?: number;
}

// ── Duration ranges per state ────────────────────────────────────────

const DURATION_RANGES: Record<CapyState, [number, number]> = {
  idle: [6, 14],
  wander: [6, 10],
  eat: [4, 7],
  splash: [6, 9],
  chase_butterfly: [5, 8],
  tapped: [0.8, 1.0],
  dance: [1.8, 2.2],
};

// Max distance from center that capybaras should stay within (camera-visible area)
const MAX_VISIBLE_RADIUS = 2.8;
const BABY_MAX_VISIBLE_RADIUS = 2.2;

// ── Helpers ──────────────────────────────────────────────────────────

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clampToIsland(x: number, z: number, maxRadius: number): [number, number] {
  const dist = Math.sqrt(x * x + z * z);
  if (dist > maxRadius) {
    const scale = maxRadius / dist;
    return [x * scale, z * scale];
  }
  return [x, z];
}

function angleTo(fromX: number, fromZ: number, toX: number, toZ: number): number {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

/** Pick a random position within wanderRadius of home, clamped to visible area */
function randomWanderTarget(config: CapyBehaviorConfig): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  // Use smaller of wanderRadius and max visible radius
  const maxR = config.isBaby ? BABY_MAX_VISIBLE_RADIUS : MAX_VISIBLE_RADIUS;
  const dist = 0.3 + Math.random() * Math.min(config.wanderRadius, maxR * 0.6);
  const x = config.homeX + Math.cos(angle) * dist;
  const z = config.homeZ + Math.sin(angle) * dist;
  return clampToIsland(x, z, maxR);
}

// Hot spring position in the scene
const HOT_SPRING_POS: [number, number] = [2.5, 2.0];

// ── State Transitions ────────────────────────────────────────────────

/** Pick the next automatic state (not tapped/dance — those are triggered) */
function pickNextState(config: CapyBehaviorConfig): CapyState {
  const candidates: { state: CapyState; weight: number }[] = [
    { state: "idle", weight: 55 },
    { state: "wander", weight: 20 },
    { state: "eat", weight: 15 },
  ];

  if (config.hasHotSpring) {
    candidates.push({ state: "splash", weight: 8 });
  }

  if (config.butterflyCount > 0) {
    candidates.push({ state: "chase_butterfly", weight: 12 });
  }

  // Baby follow: 20% chance to wander toward main capy
  // (handled inside wander target selection, not a separate state)

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) return c.state;
  }
  return "idle";
}

// ── Create initial behavior ──────────────────────────────────────────

export function createCapyBehavior(startX: number, startZ: number): CapyBehavior {
  return {
    state: "idle",
    elapsed: 0,
    duration: randRange(DURATION_RANGES.idle[0], DURATION_RANGES.idle[1]),
    posX: startX,
    posZ: startZ,
    targetX: startX,
    targetZ: startZ,
    startX: startX,
    startZ: startZ,
    rotationY: 0,
    targetRotationY: 0,
    lastTapTime: 0,
    tapReaction: "squash" as TapReaction,
  };
}

// ── Transition to a new state ────────────────────────────────────────

function transitionTo(
  behavior: CapyBehavior,
  newState: CapyState,
  config: CapyBehaviorConfig
): CapyBehavior {
  const [minDur, maxDur] = DURATION_RANGES[newState];
  const duration = randRange(minDur, maxDur);

  let targetX = behavior.posX;
  let targetZ = behavior.posZ;

  if (newState === "wander") {
    // Baby: 20% chance to follow main capy
    if (
      config.isBaby &&
      config.mainCapyX !== undefined &&
      config.mainCapyZ !== undefined &&
      Math.random() < 0.2
    ) {
      // Move toward main capy (but not exactly on top)
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = 0.5 + Math.random() * 0.5;
      targetX = config.mainCapyX + Math.cos(offsetAngle) * offsetDist;
      targetZ = config.mainCapyZ + Math.sin(offsetAngle) * offsetDist;
      const maxR = config.isBaby ? BABY_MAX_VISIBLE_RADIUS : MAX_VISIBLE_RADIUS;
      [targetX, targetZ] = clampToIsland(targetX, targetZ, maxR);
    } else {
      [targetX, targetZ] = randomWanderTarget(config);
    }
  } else if (newState === "splash") {
    // Move toward hot spring (but clamp so we don't go off-screen)
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDist = 0.3 + Math.random() * 0.3;
    targetX = HOT_SPRING_POS[0] + Math.cos(offsetAngle) * offsetDist;
    targetZ = HOT_SPRING_POS[1] + Math.sin(offsetAngle) * offsetDist;
    [targetX, targetZ] = clampToIsland(targetX, targetZ, MAX_VISIBLE_RADIUS + 0.5);
  } else if (newState === "chase_butterfly") {
    // Short chase in a random direction (stay visible)
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.6 + Math.random() * 0.8;
    targetX = behavior.posX + Math.cos(angle) * dist;
    targetZ = behavior.posZ + Math.sin(angle) * dist;
    const maxR = config.isBaby ? BABY_MAX_VISIBLE_RADIUS : MAX_VISIBLE_RADIUS;
    [targetX, targetZ] = clampToIsland(targetX, targetZ, maxR);
  }

  const targetRotY =
    newState === "wander" || newState === "splash" || newState === "chase_butterfly"
      ? angleTo(behavior.posX, behavior.posZ, targetX, targetZ)
      : behavior.rotationY;

  return {
    ...behavior,
    state: newState,
    elapsed: 0,
    duration,
    startX: behavior.posX,
    startZ: behavior.posZ,
    targetX,
    targetZ,
    targetRotationY: targetRotY,
  };
}

// ── Tick (called every frame) ────────────────────────────────────────

export function tickCapyBehavior(
  behavior: CapyBehavior,
  delta: number,
  config: CapyBehaviorConfig
): CapyBehavior {
  const next = { ...behavior };
  next.elapsed += delta;

  // Smooth rotation toward target
  let rotDiff = next.targetRotationY - next.rotationY;
  // Normalize to [-PI, PI]
  while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
  while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
  next.rotationY += rotDiff * Math.min(1, delta * 4);

  // Movement states: lerp position
  if (
    next.state === "wander" ||
    next.state === "splash" ||
    next.state === "chase_butterfly"
  ) {
    const t = Math.min(1, next.elapsed / next.duration);
    // Smooth ease-in-out
    const smooth = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    next.posX = next.startX + (next.targetX - next.startX) * smooth;
    next.posZ = next.startZ + (next.targetZ - next.startZ) * smooth;
  }

  // State expired → pick next
  if (next.elapsed >= next.duration) {
    const nextState = pickNextState(config);
    return transitionTo(next, nextState, config);
  }

  return next;
}

// ── Handle tap ───────────────────────────────────────────────────────

export function handleCapyTap(behavior: CapyBehavior): CapyBehavior {
  const now = Date.now();
  const timeSinceLastTap = now - behavior.lastTapTime;

  // Double-tap (within 1s) or tap while already tapped → dance
  if (
    (behavior.state === "tapped" || timeSinceLastTap < 1000) &&
    behavior.state !== "dance"
  ) {
    return {
      ...behavior,
      state: "dance",
      elapsed: 0,
      duration: randRange(DURATION_RANGES.dance[0], DURATION_RANGES.dance[1]),
      lastTapTime: now,
    };
  }

  // Single tap → random reaction
  const reactions: TapReaction[] = ["squash", "wiggle", "nuzzle", "look"];
  const tapReaction = reactions[Math.floor(Math.random() * reactions.length)];
  return {
    ...behavior,
    state: "tapped",
    elapsed: 0,
    duration: randRange(DURATION_RANGES.tapped[0], DURATION_RANGES.tapped[1]),
    lastTapTime: now,
    tapReaction,
  };
}

// ── Animation helpers (used in the render component) ─────────────────

/** Get squash-and-stretch scale for tapped state — like being petted */
export function getTappedSquash(elapsed: number, duration: number): {
  scaleX: number;
  scaleY: number;
} {
  const t = elapsed / duration;
  // Quick squash down, then stretch back up, settle to normal
  // Phase 1 (0-0.3): squash down
  // Phase 2 (0.3-0.6): stretch up
  // Phase 3 (0.6-1.0): settle back
  let sy: number, sx: number;
  if (t < 0.25) {
    const p = t / 0.25;
    sy = 1 - p * 0.12; // squash down 12%
    sx = 1 + p * 0.06; // widen 6%
  } else if (t < 0.5) {
    const p = (t - 0.25) / 0.25;
    sy = 0.88 + p * 0.15; // stretch up past normal
    sx = 1.06 - p * 0.08; // narrow slightly
  } else {
    const p = (t - 0.5) / 0.5;
    const ease = 1 - Math.pow(1 - p, 2);
    sy = 1.03 - ease * 0.03; // settle to 1.0
    sx = 0.98 + ease * 0.02; // settle to 1.0
  }
  return { scaleX: sx, scaleY: sy };
}

/** Get the happy wiggle rotation for tapped state — side-to-side body shake */
export function getTappedWiggle(elapsed: number, duration: number): number {
  const t = elapsed / duration;
  // Fast wiggle that decays over time
  const decay = 1 - t;
  return Math.sin(elapsed * 14) * 0.06 * decay;
}

/** Get dance animation values — subtle happy sway, not over-the-top */
export function getDanceValues(elapsed: number): {
  wiggleX: number;
  hopY: number;
  headBob: number;
  spinY: number;
} {
  const t = elapsed;
  return {
    wiggleX: Math.sin(t * 4) * 0.06,  // gentle side-to-side
    hopY: Math.abs(Math.sin(t * 3)) * 0.06, // tiny rhythmic bobs
    headBob: Math.sin(t * 5) * 0.03, // subtle head nod
    spinY: Math.sin(t * 2) * 0.15, // slight sway rotation
  };
}

/** Get waddle/walk animation values — visible waddle at a slow pace */
export function getWaddleValues(elapsed: number, isBaby: boolean): {
  bobY: number;
  rollZ: number;
  leanX: number;
} {
  // Slow step cadence, noticeable sway
  const speed = isBaby ? 2.0 : 1.6;
  const bobAmp = isBaby ? 0.025 : 0.018;
  const rollAmp = isBaby ? 0.06 : 0.04;
  const leanAmp = isBaby ? 0.02 : 0.012;
  return {
    bobY: Math.abs(Math.sin(elapsed * speed * Math.PI)) * bobAmp,
    rollZ: Math.sin(elapsed * speed * Math.PI) * rollAmp,
    leanX: Math.sin(elapsed * speed * 0.5 * Math.PI) * leanAmp,
  };
}

/** Get eat animation tilt — reduced to avoid ground clipping */
export function getEatTilt(elapsed: number): number {
  // Gentle forward tilt with nibble oscillation
  return 0.15 + Math.sin(elapsed * 4) * 0.04;
}

/** Y offset to raise capybara when eating so legs don't clip ground */
export function getEatYOffset(elapsed: number): number {
  const tilt = getEatTilt(elapsed);
  // Compensate: more tilt = raise more
  return tilt * 0.12;
}

// ── Tap reaction animation helpers ──────────────────────────────────

/** Nose nuzzle — tilt head forward like nuzzling your finger */
export function getNuzzleValues(elapsed: number, duration: number): {
  tiltX: number;
  bobY: number;
} {
  const t = elapsed / duration;
  // Dip forward then back, with a little nod
  const dip = Math.sin(t * Math.PI) * 0.2;
  const nod = Math.sin(elapsed * 8) * 0.03 * (1 - t);
  return {
    tiltX: dip + nod,
    bobY: -dip * 0.04, // slight downward as head dips
  };
}

/** Look at camera — turn toward viewer briefly */
export function getLookValues(elapsed: number, duration: number): {
  turnY: number;
  earPerk: number;
} {
  const t = elapsed / duration;
  // Quick turn toward camera, hold, then ease back
  let turnProgress: number;
  if (t < 0.2) {
    turnProgress = t / 0.2; // snap to look
  } else if (t < 0.7) {
    turnProgress = 1; // hold
  } else {
    turnProgress = 1 - (t - 0.7) / 0.3; // ease back
  }
  const eased = 1 - Math.pow(1 - turnProgress, 2);
  return {
    turnY: eased * 0.4, // partial turn toward camera
    earPerk: eased * 0.06, // slight upward scale (ears perk)
  };
}

/** Progress ratio 0→1 for the current state */
export function getStateProgress(behavior: CapyBehavior): number {
  return Math.min(1, behavior.elapsed / behavior.duration);
}
