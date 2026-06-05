import { OmegaMaterialDefinition, OmegaSide } from '../data/omegaBalancerData';

export interface OmegaPhysicsMaterial {
  instanceId: string;
  definition: OmegaMaterialDefinition;
  side: OmegaSide;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  settled: boolean;
  falling: boolean;
  massMultiplier: number;
  frictionMultiplier: number;
}

export interface OmegaPhysicsState {
  bodies: OmegaPhysicsMaterial[];
  beamAngle: number;
  beamAngularVelocity: number;
  gravity: number;
  frictionMultiplier: number;
  width: number;
  height: number;
  beamY: number;
  beamWidth: number;
  failSide: OmegaSide | null;
  fallBodyId: string | null;
}

export interface OmegaDropOptions {
  material: OmegaMaterialDefinition;
  side: OmegaSide;
  x: number;
  massMultiplier?: number;
  frictionMultiplier?: number;
}

export interface OmegaDropSimulationOptions extends OmegaDropOptions {
  frames?: number;
}

export const OMEGA_FIELD_WIDTH = 360;
export const OMEGA_FIELD_HEIGHT = 640;
export const OMEGA_BEAM_WIDTH = 292;
export const OMEGA_BEAM_Y = 510;
export const OMEGA_MAX_BEAM_ANGLE = 21;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const degToRad = (value: number) => value * Math.PI / 180;
const randomId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createOmegaPhysicsState = (): OmegaPhysicsState => ({
  bodies: [],
  beamAngle: 0,
  beamAngularVelocity: 0,
  gravity: 0.62,
  frictionMultiplier: 1,
  width: OMEGA_FIELD_WIDTH,
  height: OMEGA_FIELD_HEIGHT,
  beamY: OMEGA_BEAM_Y,
  beamWidth: OMEGA_BEAM_WIDTH,
  failSide: null,
  fallBodyId: null,
});

export const createFallingOmegaBody = (options: OmegaDropOptions): OmegaPhysicsMaterial => ({
  instanceId: randomId(),
  definition: options.material,
  side: options.side,
  x: clamp(options.x, 34, OMEGA_FIELD_WIDTH - 34),
  y: 74,
  vx: 0,
  vy: 0,
  angle: 0,
  angularVelocity: (Math.random() - 0.5) * 1.5,
  settled: false,
  falling: true,
  massMultiplier: options.massMultiplier ?? 1,
  frictionMultiplier: options.frictionMultiplier ?? 1,
});

export const cloneOmegaPhysicsState = (state: OmegaPhysicsState): OmegaPhysicsState => ({
  ...state,
  bodies: state.bodies.map(body => ({ ...body, definition: body.definition })),
});

export const getBeamContactY = (state: OmegaPhysicsState, x: number) => {
  const centerX = state.width / 2;
  const tangent = Math.tan(degToRad(state.beamAngle));
  return state.beamY + (x - centerX) * tangent;
};

export const calculateOmegaTorque = (state: Pick<OmegaPhysicsState, 'bodies' | 'width'>) => {
  const centerX = state.width / 2;
  return state.bodies
    .filter(body => body.settled)
    .reduce((sum, body) => {
      const lever = (body.x - centerX) / 100;
      const mass = body.definition.mass * body.massMultiplier;
      return sum + lever * mass;
    }, 0);
};

export const withRestoredBeam = (state: OmegaPhysicsState, amount: number): OmegaPhysicsState => ({
  ...state,
  beamAngle: state.beamAngle * (1 - amount),
  beamAngularVelocity: state.beamAngularVelocity * 0.35,
});

export const stepOmegaPhysics = (state: OmegaPhysicsState): OmegaPhysicsState => {
  if (state.failSide) return state;

  const torque = calculateOmegaTorque(state);
  const targetAngle = clamp(torque * 5.0, -OMEGA_MAX_BEAM_ANGLE, OMEGA_MAX_BEAM_ANGLE);
  const beamAngularVelocity = (state.beamAngularVelocity + (targetAngle - state.beamAngle) * 0.058) * 0.8;
  const beamAngle = clamp(state.beamAngle + beamAngularVelocity, -OMEGA_MAX_BEAM_ANGLE, OMEGA_MAX_BEAM_ANGLE);

  let failSide: OmegaSide | null = null;
  let fallBodyId: string | null = null;
  const halfBeam = state.beamWidth / 2;
  const centerX = state.width / 2;
  const tangent = Math.tan(degToRad(beamAngle));

  const bodies = state.bodies.map(body => {
    const next = { ...body };
    if (next.falling) {
      next.vy += state.gravity;
      next.y += next.vy;
      next.angle += next.angularVelocity;
      const stackedContactY = state.bodies
        .filter(other => other.instanceId !== next.instanceId && other.settled)
        .reduce((bestY, other) => {
          const overlapX = Math.abs(other.x - next.x) < (other.definition.width + next.definition.width) * 0.38;
          if (!overlapX) return bestY;
          const candidateY = other.y - other.definition.height / 2 - next.definition.height / 2 + 2;
          return Math.min(bestY, candidateY);
        }, Number.POSITIVE_INFINITY);
      const beamContactY = state.beamY + (next.x - centerX) * tangent - next.definition.height / 2 + 1;
      const contactY = Math.min(beamContactY, stackedContactY);
      if (next.y >= contactY) {
        next.y = contactY;
        next.vy *= -next.definition.restitution;
        next.falling = Math.abs(next.vy) > 2.4;
        next.settled = !next.falling;
        if (next.settled) {
          next.vy = 0;
          next.vx *= 0.35;
        }
        next.angularVelocity *= 0.35;
      }
    } else if (next.settled) {
      const friction = next.definition.friction * next.frictionMultiplier * state.frictionMultiplier;
      const slideForce = Math.sin(degToRad(beamAngle)) * (1.05 - clamp(friction, 0.1, 1));
      next.vx += slideForce;
      next.vx *= 0.88 + clamp(friction, 0.1, 0.9) * 0.08;
      next.x += next.vx;
      next.y = state.beamY + (next.x - centerX) * tangent - next.definition.height / 2 + 1;
      next.angle = beamAngle * 0.72;
    }

    const leftEdge = next.x - next.definition.width / 2;
    const rightEdge = next.x + next.definition.width / 2;
    const outOfBeam = leftEdge < centerX - halfBeam || rightEdge > centerX + halfBeam;
    const outOfWorld = next.y > state.height + 60 || rightEdge < -20 || leftEdge > state.width + 20;
    if ((outOfBeam && next.settled) || outOfWorld) {
      failSide = next.side;
      fallBodyId = next.instanceId;
    }
    return next;
  });

  return {
    ...state,
    bodies,
    beamAngle,
    beamAngularVelocity,
    failSide,
    fallBodyId,
  };
};

export const simulateOmegaDrop = (state: OmegaPhysicsState, options: OmegaDropSimulationOptions): OmegaPhysicsState => {
  let next = cloneOmegaPhysicsState(state);
  const body = createFallingOmegaBody(options);
  next = { ...next, bodies: [...next.bodies, body] };
  const frames = options.frames ?? 360;
  for (let i = 0; i < frames; i += 1) {
    next = stepOmegaPhysics(next);
    if (next.failSide) break;
    if (isOmegaPhysicsAtRest(next)) break;
  }
  return next;
};

export const isOmegaDropSettled = (state: OmegaPhysicsState, bodyId: string | null) => {
  if (!bodyId || state.failSide) return true;
  const body = state.bodies.find(candidate => candidate.instanceId === bodyId);
  return !!body && body.settled && Math.abs(body.vx) < 0.18 && Math.abs(body.vy) < 0.18;
};

export const isOmegaPhysicsAtRest = (state: OmegaPhysicsState) => {
  if (state.failSide) return true;
  if (Math.abs(state.beamAngularVelocity) > 0.08) return false;
  return state.bodies.every(body =>
    body.settled &&
    !body.falling &&
    Math.abs(body.vx) < 0.18 &&
    Math.abs(body.vy) < 0.18 &&
    Math.abs(body.angularVelocity) < 0.18,
  );
};

export const getOmegaSafeDropRange = (fineControl: boolean) => ({
  min: fineControl ? 46 : 62,
  max: fineControl ? OMEGA_FIELD_WIDTH - 46 : OMEGA_FIELD_WIDTH - 62,
});
