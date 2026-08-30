import type {
  AngleIndex,
  Attack,
  Enemy,
  EnemyPart,
  FiringProfile,
  KillCause,
  Rules,
  PelletBreakdown,
  ShotRecord,
  ShrapnelBreakdown,
  SimulationResult,
} from '@/domain/types';
import { MAX_SIMULATED_SHOTS } from '@/domain/constants';
import { resolveExplosionBypass, resolveHit } from './hit';
import { partPool, transferToMain } from './transfer';
import { damagePerSecond, timeToKill } from './firing';

export interface ShrapnelInput {
  attack: Attack;
  /** Explosion propia del fragmento al impactar, si tiene (ej. submuniciones). */
  explosion?: Attack | null;
  /** Cuantos fragmentos declara el usuario que conectan con esta parte. */
  fragmentsHitting: number;
  /** Cuantos fragmentos dispara el arma en total (para la cota teorica). */
  fragmentCount: number;
}

export interface SimulationInput {
  attack: Attack;
  /** Explosion asociada al proyectil, si aplica y si alcanza esta misma parte. */
  explosion: Attack | null;
  /** Metralla de esa explosion, si tiene y si la explosion esta incluida. */
  shrapnel?: ShrapnelInput | null;
  /** Cuantos perdigones de `attack.pelletsPerShot` declara el usuario que conectan (escopetas). */
  pelletsHitting?: number;
  enemy: Enemy;
  part: EnemyPart;
  firing: FiringProfile;
  rules: Rules;
  angle?: AngleIndex;
  maxShots?: number;
}

/**
 * Dispara repetidamente a la MISMA parte hasta matar al enemigo o agotar el
 * presupuesto de impactos.
 *
 * El enemigo muere si Main llega a 0 o si se destruye una parte fatal.
 * Destruir una parte no fatal detiene la simulacion: en el juego ya no puedes
 * seguir dañando algo que se cayo al suelo.
 */
export function simulate(input: SimulationInput): SimulationResult {
  const {
    attack,
    explosion,
    shrapnel = null,
    pelletsHitting = 1,
    enemy,
    part,
    firing,
    rules,
    angle = 0,
    maxShots = MAX_SIMULATED_SHOTS,
  } = input;

  const projectile = resolveHit(attack, part, { rules, angle });
  const pelletsResult: PelletBreakdown | null =
    attack.pelletsPerShot !== null
      ? {
          hitting: pelletsHitting,
          count: attack.pelletsPerShot,
          damagePerShot: projectile.finalDamage * pelletsHitting,
          theoreticalMax: projectile.finalDamage * attack.pelletsPerShot,
        }
      : null;

  const explosionHit = explosion ? resolveHit(explosion, part, { rules }) : null;
  const explosionBypass =
    explosion && explosionHit?.explosionImmune
      ? resolveExplosionBypass(explosion, enemy.main, { rules })
      : null;

  const shrapnelHit = shrapnel ? resolveHit(shrapnel.attack, part, { rules, angle }) : null;
  const shrapnelExplosionHit = shrapnel?.explosion ? resolveHit(shrapnel.explosion, part, { rules }) : null;
  const shrapnelUnitDamage = (shrapnelHit?.finalDamage ?? 0) + (shrapnelExplosionHit?.finalDamage ?? 0);
  const shrapnelDamage = shrapnelHit ? shrapnelUnitDamage * shrapnel!.fragmentsHitting : 0;
  const shrapnelResult: ShrapnelBreakdown | null =
    shrapnelHit && shrapnel
      ? {
          hit: shrapnelHit,
          explosionHit: shrapnelExplosionHit,
          fragmentsHitting: shrapnel.fragmentsHitting,
          fragmentCount: shrapnel.fragmentCount,
          damagePerShot: shrapnelDamage,
          theoreticalMax:
            projectile.finalDamage + (explosionHit?.finalDamage ?? 0) + shrapnelUnitDamage * shrapnel.fragmentCount,
        }
      : null;

  const projectileDamage = pelletsResult ? pelletsResult.damagePerShot : projectile.finalDamage;
  const explosionDamage = explosionHit?.finalDamage ?? 0;
  const damageToPart = projectileDamage + explosionDamage + shrapnelDamage;
  const bypassDamage = explosionBypass?.applies ? explosionBypass.damage : 0;

  const pool = partPool(part);
  const hasOwnHp = !part.hpIsMain;

  const ledger: ShotRecord[] = [];
  let dealtToPart = 0;
  let mainHp = enemy.main.hp;
  let partDestroyed = false;
  let killed = false;
  let cause: KillCause = 'OUT_OF_BUDGET';

  const makesProgress = damageToPart > 0 || bypassDamage > 0;

  if (!makesProgress) {
    cause = 'NO_PENETRATION';
  } else {
    for (let shot = 1; shot <= maxShots; shot++) {
      const transfer = transferToMain(damageToPart, part, dealtToPart, rules.rounding.mode);
      dealtToPart += damageToPart;

      const mainDamage = transfer.mainDamage + bypassDamage;
      mainHp -= mainDamage;

      if (hasOwnHp && dealtToPart >= pool) partDestroyed = true;

      ledger.push({
        shot,
        time: timeToKill(shot, firing),
        partDamage: damageToPart,
        mainDamage,
        partRemaining: hasOwnHp ? Math.max(0, pool - dealtToPart) : null,
        mainRemaining: Math.max(0, mainHp),
        cappedThisShot: transfer.capped && transfer.counted < damageToPart,
        projectileDamage,
        explosionDamage,
        shrapnelDamage,
      });

      if (partDestroyed && part.fatal) {
        killed = true;
        cause = 'FATAL_PART_DESTROYED';
        break;
      }
      if (mainHp <= 0) {
        killed = true;
        cause = 'MAIN_DEPLETED';
        break;
      }
      if (partDestroyed) {
        cause = 'PART_DESTROYED_NOT_FATAL';
        break;
      }
    }
  }

  const shotsToKill = killed ? ledger.length : Number.POSITIVE_INFINITY;
  const shotsToDestroyPart =
    hasOwnHp && damageToPart > 0 ? Math.ceil(pool / damageToPart) : Number.POSITIVE_INFINITY;

  return {
    projectile,
    explosion: explosionHit,
    explosionBypass,
    shrapnel: shrapnelResult,
    pellets: pelletsResult,
    damagePerShotToPart: damageToPart,
    damagePerShotToMain: ledger[0]?.mainDamage ?? 0,
    partPool: hasOwnHp ? pool : null,
    shotsToDestroyPart,
    shotsToKill,
    ttk: killed ? timeToKill(shotsToKill, firing) : Number.POSITIVE_INFINITY,
    dps: damagePerSecond(damageToPart, firing),
    partDestroyed,
    killed,
    cause,
    ledger,
  };
}
