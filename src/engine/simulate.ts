import type {
  AngleIndex,
  Attack,
  Enemy,
  EnemyPart,
  FiringProfile,
  KillCause,
  Rules,
  ShotRecord,
  SimulationResult,
} from '@/domain/types';
import { MAX_SIMULATED_SHOTS } from '@/domain/constants';
import { resolveExplosionBypass, resolveHit } from './hit';
import { partPool, transferToMain } from './transfer';
import { damagePerSecond, timeToKill } from './firing';

export interface SimulationInput {
  attack: Attack;
  /** Explosion asociada al proyectil, si aplica y si alcanza esta misma parte. */
  explosion: Attack | null;
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
    enemy,
    part,
    firing,
    rules,
    angle = 0,
    maxShots = MAX_SIMULATED_SHOTS,
  } = input;

  const projectile = resolveHit(attack, part, { rules, angle });

  const explosionHit = explosion ? resolveHit(explosion, part, { rules }) : null;
  const explosionBypass =
    explosion && explosionHit?.explosionImmune
      ? resolveExplosionBypass(explosion, enemy.main, { rules })
      : null;

  const damageToPart = projectile.finalDamage + (explosionHit?.finalDamage ?? 0);
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
