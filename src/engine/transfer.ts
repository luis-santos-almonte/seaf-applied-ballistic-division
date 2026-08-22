import type { EnemyPart, RoundingMode, TransferResult } from '@/domain/types';
import { applyRounding } from './rounding';

/** Reserva total de una parte: vida propia mas constitution. */
export function partPool(part: EnemyPart): number {
  if (part.hpIsMain) return Number.POSITIVE_INFINITY;
  return (part.hp ?? 0) + (part.constitution ?? 0);
}

/**
 * PASO 5 — Transferencia a Main HP.
 *
 *   mainDamage = damageAplicadoALaParte x toMain
 *
 * `toMain` puede pasar de 1: la carne interior del Charger transfiere 300%.
 *
 * Si `overflowCap` es true, el total acumulado que cuenta para la
 * transferencia queda topado por la reserva de la parte (vida + constitution).
 * Si es false, el exceso se transfiere entero — es lo que permite que un
 * disparo de 300 a un brazo de 65 HP mate a un Trooper.
 */
export function transferToMain(
  damageToPart: number,
  part: EnemyPart,
  alreadyDealt: number,
  rounding: RoundingMode,
): TransferResult {
  if (part.hpIsMain) {
    return {
      counted: damageToPart,
      capped: false,
      capRemaining: Number.POSITIVE_INFINITY,
      mainDamage: applyRounding(damageToPart * part.toMain, rounding),
    };
  }

  const capRemaining = part.overflowCap
    ? Math.max(0, partPool(part) - alreadyDealt)
    : Number.POSITIVE_INFINITY;

  const counted = Math.min(damageToPart, capRemaining);

  return {
    counted,
    capped: part.overflowCap,
    capRemaining,
    mainDamage: applyRounding(counted * part.toMain, rounding),
  };
}
