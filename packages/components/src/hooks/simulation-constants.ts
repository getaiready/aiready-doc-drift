/**
 * Constants for force simulation defaults and configuration
 */
export const SIMULATION_DEFAULTS = {
  CHARGE_STRENGTH: -300,
  LINK_DISTANCE: 100,
  LINK_STRENGTH: 1,
  COLLISION_STRENGTH: 1,
  COLLISION_RADIUS: 10,
  CENTER_STRENGTH: 0.1,
  ALPHA_DECAY: 0.0228,
  VELOCITY_DECAY: 0.4,
  ALPHA_TARGET: 0,
  WARM_ALPHA: 0.3,
  ALPHA_MIN: 0.01,
  TICK_THROTTLE_MS: 33, // ~30 fps
  MAX_SIMULATION_TIME_MS: 3000,
  STABILIZE_ON_STOP: true,
} as const;

/**
 * Force names used in d3-force
 */
export const FORCE_NAMES = {
  LINK: 'link',
  CHARGE: 'charge',
  CENTER: 'center',
  COLLISION: 'collision',
  X: 'x',
  Y: 'y',
} as const;

/**
 * Event names used in d3-force
 */
export const EVENT_NAMES = {
  TICK: 'tick',
  END: 'end',
} as const;
