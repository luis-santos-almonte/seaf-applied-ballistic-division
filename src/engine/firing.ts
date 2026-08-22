import type { DpsResult, FiringProfile } from '@/domain/types';

/** Segundos entre dos disparos consecutivos. */
export const shotInterval = (rpm: number): number => 60 / rpm;

/**
 * PASO 7 — TTK teorico.
 *
 *   t = (disparos - 1) x 60/RPM + recargas x tiempoDeRecarga
 *
 * El primer disparo ocurre en t = 0: el reloj mide el tiempo que pasa entre el
 * primer impacto y el ultimo, no el tiempo de apuntar.
 */
export function timeToKill(shots: number, firing: FiringProfile): number {
  if (!Number.isFinite(shots) || shots <= 0) return Number.POSITIVE_INFINITY;
  const reloads = reloadsNeeded(shots, firing.shotsPerCycle);
  return (shots - 1) * shotInterval(firing.rpm) + reloads * firing.reloadTime;
}

export function reloadsNeeded(shots: number, shotsPerCycle: number): number {
  if (shotsPerCycle <= 0) return 0;
  return Math.floor((shots - 1) / shotsPerCycle);
}

/**
 * DPS bruto ignora las recargas; el sostenido las incluye. No son
 * intercambiables: contra un enemigo que muere dentro de un cargador manda el
 * bruto, en una defensa larga manda el sostenido.
 */
export function damagePerSecond(damagePerShot: number, firing: FiringProfile): DpsResult {
  const interval = shotInterval(firing.rpm);
  const cycleTime = firing.shotsPerCycle * interval + firing.reloadTime;
  return {
    raw: damagePerShot * (firing.rpm / 60),
    sustained: cycleTime > 0 ? (damagePerShot * firing.shotsPerCycle) / cycleTime : 0,
    interval,
    cycleTime,
  };
}
