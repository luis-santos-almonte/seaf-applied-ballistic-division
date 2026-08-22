/**
 * Estado del escenario.
 *
 * Separa lo que el usuario ELIGE (arma, enemigo, parte) de lo que el usuario
 * SOBRESCRIBE (un HP distinto, otro AP, otra cadencia). Los overrides se
 * guardan aparte y se aplican encima del dato de catálogo, de modo que
 * "restablecer" es simplemente vaciarlos y cambiar de enemigo no arrastra
 * valores tecleados para otro.
 */
import type { AngleIndex, RoundingMode } from '@/domain/types';

export interface WeaponOverrides {
  standard?: number;
  durable?: number;
  ap?: number;
}

export interface TargetOverrides {
  hp?: number | null;
  av?: number;
  durability?: number;
  toMain?: number;
  exdr?: number;
  constitution?: number | null;
  fatal?: boolean;
  overflowCap?: boolean;
}

export interface MainOverrides {
  hp?: number;
  av?: number;
}

export interface FiringOverrides {
  rpm?: number;
  shotsPerCycle?: number;
  reloadTime?: number;
}

export interface ScenarioState {
  weaponId: string;
  attackId: string;
  enemyId: string;
  partId: string;
  angle: AngleIndex;
  includeExplosion: boolean;
  rounding: RoundingMode | null;
  flakFragments: number;
  weapon: WeaponOverrides;
  target: TargetOverrides;
  main: MainOverrides;
  firing: FiringOverrides;
}

export type ScenarioAction =
  | { type: 'selectWeapon'; weaponId: string; attackId: string }
  | { type: 'selectAttack'; attackId: string }
  | { type: 'selectEnemy'; enemyId: string; partId: string }
  | { type: 'selectPart'; partId: string }
  | { type: 'setAngle'; angle: AngleIndex }
  | { type: 'toggleExplosion'; include: boolean }
  | { type: 'setRounding'; rounding: RoundingMode | null }
  | { type: 'setFlakFragments'; count: number }
  | { type: 'overrideWeapon'; patch: WeaponOverrides }
  | { type: 'overrideTarget'; patch: TargetOverrides }
  | { type: 'overrideMain'; patch: MainOverrides }
  | { type: 'overrideFiring'; patch: FiringOverrides }
  | { type: 'clearOverrides' };

const NO_OVERRIDES = {
  weapon: {} as WeaponOverrides,
  target: {} as TargetOverrides,
  main: {} as MainOverrides,
  firing: {} as FiringOverrides,
};

export function createInitialState(seed: {
  weaponId: string;
  attackId: string;
  enemyId: string;
  partId: string;
}): ScenarioState {
  return {
    ...seed,
    angle: 0,
    includeExplosion: true,
    rounding: null,
    flakFragments: 3,
    ...NO_OVERRIDES,
  };
}

export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    // Cambiar de arma invalida los overrides de arma y de cadencia.
    case 'selectWeapon':
      return {
        ...state,
        weaponId: action.weaponId,
        attackId: action.attackId,
        weapon: {},
        firing: {},
      };

    // Cambiar de perfil invalida los numeros del arma, no los del objetivo.
    case 'selectAttack':
      return { ...state, attackId: action.attackId, weapon: {} };

    // Cambiar de enemigo invalida objetivo y Main.
    case 'selectEnemy':
      return {
        ...state,
        enemyId: action.enemyId,
        partId: action.partId,
        target: {},
        main: {},
      };

    case 'selectPart':
      return { ...state, partId: action.partId, target: {} };

    case 'setAngle':
      // El AP tecleado a mano deja de tener sentido si cambia el ángulo.
      return { ...state, angle: action.angle, weapon: { ...state.weapon, ap: undefined } };

    case 'toggleExplosion':
      return { ...state, includeExplosion: action.include };

    case 'setRounding':
      return { ...state, rounding: action.rounding };

    case 'setFlakFragments':
      return { ...state, flakFragments: clampFragments(action.count) };

    case 'overrideWeapon':
      return { ...state, weapon: { ...state.weapon, ...action.patch } };

    case 'overrideTarget':
      return { ...state, target: { ...state.target, ...action.patch } };

    case 'overrideMain':
      return { ...state, main: { ...state.main, ...action.patch } };

    case 'overrideFiring':
      return { ...state, firing: { ...state.firing, ...action.patch } };

    case 'clearOverrides':
      return { ...state, ...NO_OVERRIDES, rounding: null, angle: 0, includeExplosion: true };

    default:
      return state;
  }
}

const clampFragments = (n: number): number => Math.max(0, Math.min(30, Math.round(n) || 0));
