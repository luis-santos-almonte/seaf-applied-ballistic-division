/**
 * Constantes del dominio que no cambian con los parches y que, por tanto,
 * no tienen sentido en un JSON editable.
 */
import type { AngleIndex, FiringProfile } from './types';

/** Cuantos impactos como maximo simula el motor antes de rendirse. */
export const MAX_SIMULATED_SHOTS = 100;

/** AV maximo mostrado en la matriz armadura x durabilidad. */
export const MATRIX_MAX_ARMOR_VALUE = 6;

/** Salto en puntos porcentuales entre filas de la matriz. */
export const MATRIX_DURABILITY_STEP = 10;

export const ANGLE_INDICES: readonly AngleIndex[] = [0, 1, 2, 3] as const;

export const FALLBACK_FIRING: FiringProfile = {
  rpm: 60,
  shotsPerCycle: 1,
  reloadTime: 0,
};

/** Etiquetas legibles del veredicto de penetracion. */
export const VERDICT_LABEL = {
  PENETRATED: 'Penetra',
  EQUAL: 'Igualada',
  RICOCHET: 'Rebota',
} as const;

export const VERDICT_DETAIL = {
  PENETRATED: 'hitmarker rojo · 100%',
  EQUAL: 'hitmarker blanco · 65%',
  RICOCHET: 'ricochet · 0%',
} as const;

export const CAUSE_MESSAGE = {
  FATAL_PART_DESTROYED: 'Parte fatal destruida.',
  MAIN_DEPLETED: 'Main health agotada.',
  PART_DESTROYED_NOT_FATAL:
    'La parte se destruye pero no es fatal: el enemigo sigue vivo. Hay que cambiar de objetivo.',
  NO_PENETRATION: 'Ni el proyectil ni la explosión penetran. Ricochet.',
  OUT_OF_BUDGET: 'Más de 100 impactos. Este no es un objetivo razonable con esta arma.',
} as const;
