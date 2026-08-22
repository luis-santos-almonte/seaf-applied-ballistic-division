import { clampFraction } from './rounding';

/**
 * PASO 1 — Durabilidad.
 *
 *   raw = standard x (1 - durability) + durable x durability
 *
 * Una parte con durabilidad 0 recibe el damage standard completo; una con
 * durabilidad 1 recibe solo el durable. Las explosiones no pasan por aqui:
 * aplican siempre su valor durable.
 */
export function blendDurability(standard: number, durable: number, durability: number): number {
  const d = clampFraction(durability);
  return standard * (1 - d) + durable * d;
}

export function standardContribution(standard: number, durability: number): number {
  return standard * (1 - clampFraction(durability));
}

export function durableContribution(durable: number, durability: number): number {
  return durable * clampFraction(durability);
}
