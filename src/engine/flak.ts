import type { AngleIndex, Attack, DamageTarget, HitBreakdown, Rules } from '@/domain/types';
import { resolveHit } from './hit';

export interface FlakInput {
  projectile: Attack;
  explosion: Attack;
  shrapnel: Attack;
  target: DamageTarget;
  /** Cuantos fragmentos conectan de verdad con esta parte. */
  fragmentsHitting: number;
  rules: Rules;
  angle?: AngleIndex;
}

export interface FlakResult {
  projectile: HitBreakdown;
  explosion: HitBreakdown;
  fragment: HitBreakdown;
  fragmentCount: number;
  fragmentsHitting: number;
  /** Cota superior inalcanzable: los 30 fragmentos en la misma parte. */
  theoreticalMax: number;
  /** Estimacion con el numero de fragmentos que el usuario declara. */
  realistic: number;
}

/**
 * El maximo teorico y el daño realista son conceptos distintos y no deben
 * mezclarse. 30 x 110 = 3.300 solo ocurriria si los treinta fragmentos
 * impactaran y penetraran la misma parte; contra un objetivo unico la metralla
 * se dispersa y solo conecta una fraccion.
 */
export function resolveFlak(input: FlakInput): FlakResult {
  const { projectile, explosion, shrapnel, target, fragmentsHitting, rules, angle = 0 } = input;

  const projectileHit = resolveHit(projectile, target, { rules, angle });
  const explosionHit = resolveHit(explosion, target, { rules });
  const fragmentHit = resolveHit(shrapnel, target, { rules, angle });

  const fragmentCount = explosion.shrapnel?.count ?? 0;
  const base = projectileHit.finalDamage + explosionHit.finalDamage;

  return {
    projectile: projectileHit,
    explosion: explosionHit,
    fragment: fragmentHit,
    fragmentCount,
    fragmentsHitting,
    theoreticalMax: base + fragmentHit.finalDamage * fragmentCount,
    realistic: base + fragmentHit.finalDamage * fragmentsHitting,
  };
}
