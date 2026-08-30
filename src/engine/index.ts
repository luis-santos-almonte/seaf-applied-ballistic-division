/**
 * Superficie publica del motor de calculo.
 *
 * El motor es puro: no importa React, no toca el DOM y no lee `fetch`. Se puede
 * ejecutar tal cual desde un script de Node para generar Excel, CSV o reportes.
 */
export { applyRounding, clampFraction } from './rounding';
export { blendDurability, standardContribution, durableContribution } from './durability';
export { resolveArmor, resolveAp, outerRadiusAp } from './armor';
export { resolveHit, resolveExplosionBypass, durableOf } from './hit';
export type { HitOptions, ExplosionZone } from './hit';
export { transferToMain, partPool } from './transfer';
export { shotInterval, timeToKill, reloadsNeeded, damagePerSecond } from './firing';
export { simulate } from './simulate';
export type { SimulationInput, ShrapnelInput } from './simulate';
export { rankTargets } from './ranking';
export type { RankingInput } from './ranking';
export { durabilityTable, armorDurabilityMatrix } from './tables';
export type { DurabilityRow, MatrixRow, MatrixCell, TableOptions } from './tables';
export { deriveFireModes } from './fireModes';
export type { FireMode } from './fireModes';
export { explainSimulation } from './explain';
export type { DerivationStep } from './explain';
