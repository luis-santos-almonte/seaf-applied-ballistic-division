/**
 * Tipos del dominio.
 *
 * Todos derivan de los esquemas de Zod, de modo que el tipo y la validacion
 * en tiempo de ejecucion no pueden divergir. Aqui solo se agregan los tipos
 * que describen resultados de calculo, que no viven en ningun JSON.
 */
import type { z } from 'zod';
import type {
  attackSchema,
  enemySchema,
  enemyPartSchema,
  mainBodySchema,
  weaponSchema,
  rulesSchema,
  provenanceSchema,
  changeEntrySchema,
  roundingModeSchema,
  factionSchema,
  confidenceSchema,
} from './schemas';

export type Attack = z.infer<typeof attackSchema>;
export type Weapon = z.infer<typeof weaponSchema>;
export type Enemy = z.infer<typeof enemySchema>;
export type EnemyPart = z.infer<typeof enemyPartSchema>;
export type MainBody = z.infer<typeof mainBodySchema>;
export type Rules = z.infer<typeof rulesSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type ChangeEntry = z.infer<typeof changeEntrySchema>;
export type RoundingMode = z.infer<typeof roundingModeSchema>;
export type Faction = z.infer<typeof factionSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;

/* ------------------------------------------------------------------ */
/* Resultados de calculo                                               */
/* ------------------------------------------------------------------ */

/** Indice del bucket de angulo: 0 directo, 3 extremo. */
export type AngleIndex = 0 | 1 | 2 | 3;

export type PenetrationVerdict = 'PENETRATED' | 'EQUAL' | 'RICOCHET';

export interface ArmorResult {
  multiplier: number;
  verdict: PenetrationVerdict;
}

/** Objetivo minimo que necesita el motor. Desacopla el calculo de `EnemyPart`. */
export interface DamageTarget {
  av: number;
  durability: number;
  exdr: number;
}

export interface HitBreakdown {
  kind: Attack['kind'];
  ap: number;
  av: number;
  /** Damage tras mezclar standard y durable, antes de armadura. */
  raw: number;
  standardContribution: number;
  durableContribution: number;
  armorMultiplier: number;
  verdict: PenetrationVerdict;
  exdr: number;
  /** La parte es inmune a explosion (ExDR 100%). */
  explosionImmune: boolean;
  beforeRounding: number;
  finalDamage: number;
  penetrated: boolean;
}

export interface ExplosionBypass {
  applies: boolean;
  reason: string;
  damage: number;
  ap: number;
  mainAv: number;
}

export interface TransferResult {
  /** Damage que efectivamente cuenta para la transferencia (puede estar topado). */
  counted: number;
  capped: boolean;
  capRemaining: number;
  mainDamage: number;
}

export interface FiringProfile {
  rpm: number;
  shotsPerCycle: number;
  reloadTime: number;
}

export interface DpsResult {
  raw: number;
  sustained: number;
  interval: number;
  cycleTime: number;
}

export interface ShotRecord {
  shot: number;
  time: number;
  partDamage: number;
  mainDamage: number;
  partRemaining: number | null;
  mainRemaining: number;
  cappedThisShot: boolean;
}

export type KillCause =
  | 'FATAL_PART_DESTROYED'
  | 'MAIN_DEPLETED'
  | 'PART_DESTROYED_NOT_FATAL'
  | 'NO_PENETRATION'
  | 'OUT_OF_BUDGET';

export interface SimulationResult {
  projectile: HitBreakdown;
  explosion: HitBreakdown | null;
  explosionBypass: ExplosionBypass | null;

  damagePerShotToPart: number;
  damagePerShotToMain: number;
  partPool: number | null;

  shotsToDestroyPart: number;
  shotsToKill: number;
  ttk: number;
  dps: DpsResult;

  partDestroyed: boolean;
  killed: boolean;
  cause: KillCause;
  ledger: ShotRecord[];
}

export interface RankedTarget {
  part: EnemyPart;
  simulation: SimulationResult;
  /** Impactos para abrir la placa que cubre esta parte, si hay alguna. */
  setupShots: number;
  setupPlate: EnemyPart | null;
  /** setupShots + shotsToKill. Es el numero honesto. */
  totalShots: number;
  totalTtk: number;
}
