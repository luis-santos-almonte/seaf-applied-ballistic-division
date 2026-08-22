import type { RoundingMode } from '@/domain/types';

/**
 * El juego trunca hacia abajo al entero. Verificado contra dos ejemplos
 * publicados: Adjudicator 95/23 contra 30% durable -> 73.4 -> 73, y fuego DoT
 * 100 x 1.5 x 0.65 -> 97.5 -> 97.
 *
 * No esta verificado si tambien trunca en pasos intermedios; el motor aplica
 * un unico redondeo al final y expone el modo para poder comparar.
 */
export function applyRounding(value: number, mode: RoundingMode): number {
  switch (mode) {
    case 'none':
      return value;
    case 'round':
      return Math.round(value);
    case 'ceil':
      return Math.ceil(value);
    case 'floor':
    default:
      return Math.floor(value);
  }
}

export const clampFraction = (n: number): number => Math.min(1, Math.max(0, n));
