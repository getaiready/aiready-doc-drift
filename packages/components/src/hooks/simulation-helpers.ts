import { SimulationNode } from './simulation-types';

/**
 * Stabilizes nodes by zeroing velocities and rounding positions.
 * Extracted to reduce duplicate patterns in useForceSimulation.
 */
export function stabilizeNodes(nodes: SimulationNode[]): void {
  nodes.forEach((n) => {
    n.vx = 0;
    n.vy = 0;
    if (typeof n.x === 'number') n.x = Number(n.x.toFixed(3));
    if (typeof n.y === 'number') n.y = Number(n.y.toFixed(3));
  });
}

/**
 * Seeds nodes with initial positions in a spread circle.
 * This ensures nodes don't stack at origin and have some initial velocity.
 */
export function seedCircularPositions(
  nodes: SimulationNode[],
  width: number,
  height: number
): void {
  const radius = Math.min(width, height) * 0.45;
  nodes.forEach((n, i) => {
    const angle = (i * 2 * Math.PI) / nodes.length;
    n.x = width / 2 + radius * Math.cos(angle);
    n.y = height / 2 + radius * Math.sin(angle);
    // Add very small random velocity to avoid large initial motion
    n.vx = (Math.random() - 0.5) * 2;
    n.vy = (Math.random() - 0.5) * 2;
  });
}

/**
 * Seeds nodes with random positions within bounds.
 * Used as fallback when initial positioning fails.
 */
export function seedRandomPositions(
  nodes: SimulationNode[],
  width: number,
  height: number
): void {
  nodes.forEach((n) => {
    n.x = Math.random() * width;
    n.y = Math.random() * height;
    n.vx = (Math.random() - 0.5) * 10;
    n.vy = (Math.random() - 0.5) * 10;
  });
}

/**
 * Safely stops a d3 simulation and performs cleanup tasks.
 */
export function safelyStopSimulation(
  simulation: d3.Simulation<SimulationNode, any>,
  nodes: SimulationNode[],
  options: { stabilize?: boolean } = {}
): void {
  try {
    if (options.stabilize) {
      stabilizeNodes(nodes);
    }
    simulation.stop();
  } catch (error) {
    console.warn('AIReady: Failed to stop simulation safely:', error);
  }
}
