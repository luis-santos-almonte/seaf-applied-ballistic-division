import type {
  AngleIndex,
  Attack,
  DamageTarget,
  ExplosionBypass,
  HitBreakdown,
  MainBody,
  Rules,
} from '@/domain/types';
import { blendDurability, durableContribution, standardContribution } from './durability';
import { outerRadiusAp, resolveAp, resolveArmor } from './armor';
import { applyRounding, clampFraction } from './rounding';

export type ExplosionZone = 'inner' | 'outer';

export interface HitOptions {
  rules: Rules;
  angle?: AngleIndex;
  /** Zona de la explosion. En `outer` baja el AP y se aplica caida lineal. */
  zone?: ExplosionZone;
  /** Factor 0..1 de caida en el radio exterior. 1 = borde interior. */
  falloff?: number;
}

/** Damage durable efectivo: si no se declara, es igual al standard. */
export const durableOf = (attack: Attack): number => attack.durable ?? attack.standard;

/**
 * Resuelve un unico evento de daño contra una parte.
 *
 * El proyectil y su explosion son eventos SEPARADOS: hay que llamar a esta
 * funcion una vez por cada uno. No se suman automaticamente porque tienen
 * AP distinto y pueden dar veredictos distintos contra la misma parte.
 */
export function resolveHit(attack: Attack, target: DamageTarget, options: HitOptions): HitBreakdown {
  const { rules, angle = 0, zone = 'inner', falloff = 1 } = options;
  const isExplosion = attack.kind === 'explosion';
  const exdr = clampFraction(target.exdr);

  let ap = isExplosion ? resolveAp(attack, 0) : resolveAp(attack, angle);
  let standard = attack.standard;
  let durable = durableOf(attack);

  if (isExplosion && zone === 'outer') {
    ap = outerRadiusAp(ap, rules);
    const f = clampFraction(falloff);
    standard *= f;
    durable *= f;
  }

  // Paso 1: durabilidad. Las explosiones la ignoran.
  const raw =
    isExplosion && rules.explosion.ignoresDurability
      ? durable
      : blendDurability(standard, durable, target.durability);

  // Paso 2: armadura.
  const armor = resolveArmor(ap, target.av, rules);

  // Paso 3: resistencia a explosion, solo para explosiones.
  const exdrFactor = isExplosion ? 1 - exdr : 1;

  const beforeRounding = raw * armor.multiplier * exdrFactor;

  return {
    kind: attack.kind,
    ap,
    av: target.av,
    raw,
    standardContribution: isExplosion ? 0 : standardContribution(standard, target.durability),
    durableContribution: isExplosion ? durable : durableContribution(durable, target.durability),
    armorMultiplier: armor.multiplier,
    verdict: armor.verdict,
    exdr,
    explosionImmune: isExplosion && exdr >= 1,
    beforeRounding,
    finalDamage: applyRounding(beforeRounding, rules.rounding.mode),
    penetrated: armor.multiplier > 0,
  };
}

/**
 * Mecanica "Affected By Explosion".
 *
 * Cuando una parte tiene ExDR 100% no recibe daño de explosion; en su lugar el
 * daño se redirige a Main, ignorando el AV y el ExDR de Main. Solo ocurre una
 * vez por explosion y exige que el AP de la explosion alcance el AV de Main.
 */
export function resolveExplosionBypass(
  explosion: Attack,
  main: MainBody,
  options: HitOptions,
): ExplosionBypass {
  const { rules, zone = 'inner', falloff = 1 } = options;

  let ap = resolveAp(explosion, 0);
  let damage = durableOf(explosion);

  if (zone === 'outer') {
    ap = outerRadiusAp(ap, rules);
    damage *= clampFraction(falloff);
  }

  if (ap < main.av) {
    return {
      applies: false,
      reason: `El AP ${ap} de la explosión no alcanza el AV ${main.av} de Main.`,
      damage: 0,
      ap,
      mainAv: main.av,
    };
  }

  return {
    applies: true,
    reason: 'La explosión se redirige a Main, ignorando su AV y su ExDR. Solo una vez por explosión.',
    damage: applyRounding(damage, rules.rounding.mode),
    ap,
    mainAv: main.av,
  };
}
