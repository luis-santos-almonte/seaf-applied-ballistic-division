import type { ArmorResult, AngleIndex, Attack, Rules } from '@/domain/types';

/**
 * PASO 2 — Penetracion de armadura.
 *
 *   AP > AV  -> 100%  (hitmarker rojo)
 *   AP = AV  ->  65%  (hitmarker blanco)
 *   AP < AV  ->   0%  (ricochet)
 *
 * Los multiplicadores vienen de `rules.json` para poder ajustarlos si un
 * parche los cambia, sin tocar codigo.
 */
export function resolveArmor(ap: number, av: number, rules: Rules): ArmorResult {
  const r = rules.armorPenetration;
  if (ap > av) return { multiplier: r.greater, verdict: 'PENETRATED' };
  if (ap === av) return { multiplier: r.equal, verdict: 'EQUAL' };
  return { multiplier: r.lesser, verdict: 'RICOCHET' };
}

/**
 * Un proyectil declara cuatro valores de AP segun el angulo de impacto
 * (0-25 / 26-60 / 61-80 / 81-90 grados). Una explosion declara uno solo.
 */
export function resolveAp(attack: Attack, angle: AngleIndex): number {
  if (Array.isArray(attack.ap)) return attack.ap[angle];
  return attack.ap;
}

/** En el radio exterior de una explosion el AP baja, con un piso. */
export function outerRadiusAp(ap: number, rules: Rules): number {
  const { outerRadiusApPenalty, outerRadiusApFloor } = rules.explosion;
  return Math.max(outerRadiusApFloor, ap - outerRadiusApPenalty);
}
