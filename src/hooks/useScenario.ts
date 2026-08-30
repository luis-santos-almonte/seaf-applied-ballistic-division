/**
 * Puente entre el estado de la UI y el motor de calculo.
 *
 * Aqui se resuelve el escenario efectivo (catalogo + overrides) y se derivan
 * todos los resultados con `useMemo`. Los componentes no calculan nada: reciben
 * datos ya resueltos.
 */
import { useMemo, useReducer } from 'react';
import type {
  Attack,
  Enemy,
  EnemyPart,
  FiringProfile,
  RankedTarget,
  Rules,
  SimulationResult,
  Weapon,
} from '@/domain/types';
import {
  armorDurabilityMatrix,
  deriveFireModes,
  explainSimulation,
  rankTargets,
  simulate,
  type DerivationStep,
  type FireMode,
  type MatrixRow,
  type ShrapnelInput,
  type SimulationInput,
} from '@/engine';
import { enemies, findEnemy, findWeapon, rules as baseRules, weapons } from '@/data/catalog';
import {
  createInitialState,
  scenarioReducer,
  type ScenarioAction,
  type ScenarioState,
} from './scenarioReducer';

export interface ResolvedScenario {
  state: ScenarioState;
  dispatch: React.Dispatch<ScenarioAction>;

  /** Entradas de catálogo seleccionadas, sin overrides. */
  weapon: Weapon;
  fireMode: FireMode;
  attack: Attack;
  enemy: Enemy;
  part: EnemyPart;

  /** Valores efectivos que consume el motor, con overrides ya aplicados. */
  effectiveAttack: Attack;
  effectiveExplosion: Attack | null;
  effectiveEnemy: Enemy;
  effectivePart: EnemyPart;
  firing: FiringProfile;
  rules: Rules;

  /** Resultados derivados. */
  simulation: SimulationResult;
  steps: DerivationStep[];
  ranking: RankedTarget[];
  matrix: MatrixRow[];
}

/** Arma con la que arranca la consola: la primera que recibe el jugador en el juego. */
const DEFAULT_WEAPON_ID = 'ar23-liberator';
/** Enemigo con el que arranca la consola: el ejemplo original del proyecto, no un accidente alfabético. */
const DEFAULT_ENEMY_ID = 'charger';

/** Semilla: el arma y el enemigo por defecto (o los primeros disponibles si faltan). */
function seed() {
  const weapon = findWeapon(DEFAULT_WEAPON_ID) ?? weapons[0];
  const enemy = findEnemy(DEFAULT_ENEMY_ID) ?? enemies[0];
  if (!weapon || !enemy) throw new Error('El catálogo está vacío: no hay armas o enemigos.');
  const fireMode = deriveFireModes(weapon)[0];
  const part = enemy.parts[0];
  if (!fireMode || !part) throw new Error('El catálogo tiene entradas incompletas.');
  return { weaponId: weapon.id, attackId: fireMode.id, enemyId: enemy.id, partId: part.id };
}

export function useScenario(): ResolvedScenario {
  const [state, dispatch] = useReducer(scenarioReducer, seed(), createInitialState);

  const weapon = findWeapon(state.weaponId) ?? weapons[0]!;
  const fireModes = useMemo(() => deriveFireModes(weapon), [weapon]);
  const fireMode = fireModes.find((m) => m.id === state.attackId) ?? fireModes[0]!;
  const attack = fireMode.attack;
  const enemy = findEnemy(state.enemyId) ?? enemies[0]!;
  const part = enemy.parts.find((p) => p.id === state.partId) ?? enemy.parts[0]!;

  const rules = useMemo<Rules>(
    () =>
      state.rounding === null
        ? baseRules
        : { ...baseRules, rounding: { ...baseRules.rounding, mode: state.rounding } },
    [state.rounding],
  );

  const effectiveAttack = useMemo<Attack>(() => {
    const { standard, durable, ap } = state.weapon;
    return {
      ...attack,
      standard: standard ?? attack.standard,
      durable: durable ?? attack.durable,
      ap: ap === undefined ? attack.ap : attack.kind === 'explosion' ? ap : [ap, ap, ap, ap],
    };
  }, [attack, state.weapon]);

  const effectiveExplosion = useMemo<Attack | null>(
    () => (state.includeExplosion ? fireMode.explosion : null),
    [fireMode, state.includeExplosion],
  );

  /** Solo tiene sentido si la explosión (que la carga) está incluida. */
  const effectiveShrapnel = useMemo<ShrapnelInput | null>(() => {
    if (!state.includeExplosion || !fireMode.shrapnel || !fireMode.shrapnelCount) return null;
    const fragmentCount = fireMode.shrapnelCount;
    return {
      attack: fireMode.shrapnel,
      explosion: fireMode.shrapnelExplosion,
      fragmentsHitting: Math.min(state.flakFragments, fragmentCount),
      fragmentCount,
    };
  }, [fireMode, state.includeExplosion, state.flakFragments]);

  /** Los perdigones de un mismo disparo no dependen de la explosión: son del proyectil. */
  const effectivePelletsHitting = useMemo<number>(() => {
    if (effectiveAttack.pelletsPerShot === null) return 1;
    return Math.min(state.pelletsHitting, effectiveAttack.pelletsPerShot);
  }, [effectiveAttack, state.pelletsHitting]);

  const effectivePart = useMemo<EnemyPart>(() => {
    const o = state.target;
    const hp = o.hp === undefined ? part.hp : o.hp;
    return {
      ...part,
      hp,
      hpIsMain: hp === null,
      av: o.av ?? part.av,
      durability: o.durability ?? part.durability,
      toMain: o.toMain ?? part.toMain,
      exdr: o.exdr ?? part.exdr,
      constitution: o.constitution === undefined ? part.constitution : o.constitution,
      fatal: o.fatal ?? part.fatal,
      overflowCap: o.overflowCap ?? part.overflowCap,
    };
  }, [part, state.target]);

  const effectiveEnemy = useMemo<Enemy>(
    () => ({
      ...enemy,
      main: {
        ...enemy.main,
        hp: state.main.hp ?? enemy.main.hp,
        av: state.main.av ?? enemy.main.av,
      },
    }),
    [enemy, state.main],
  );

  const firing = useMemo<FiringProfile>(
    () => ({
      rpm: state.firing.rpm ?? weapon.rpm,
      shotsPerCycle: state.firing.shotsPerCycle ?? weapon.magazine,
      reloadTime: state.firing.reloadTime ?? weapon.reload.full,
    }),
    [weapon, state.firing],
  );

  const simulationInput = useMemo<SimulationInput>(
    () => ({
      attack: effectiveAttack,
      explosion: effectiveExplosion,
      shrapnel: effectiveShrapnel,
      pelletsHitting: effectivePelletsHitting,
      enemy: effectiveEnemy,
      part: effectivePart,
      firing,
      rules,
      angle: state.angle,
    }),
    [
      effectiveAttack,
      effectiveExplosion,
      effectiveShrapnel,
      effectivePelletsHitting,
      effectiveEnemy,
      effectivePart,
      firing,
      rules,
      state.angle,
    ],
  );

  const simulation = useMemo(() => simulate(simulationInput), [simulationInput]);

  const steps = useMemo(
    () => explainSimulation(simulationInput, simulation, rules),
    [simulationInput, simulation, rules],
  );

  // El ranking recorre las partes ORIGINALES del enemigo, no la sobrescrita:
  // comparar la parte editada a mano contra las demás sería engañoso.
  const ranking = useMemo(
    () =>
      rankTargets({
        attack: effectiveAttack,
        explosion: effectiveExplosion,
        shrapnel: effectiveShrapnel,
        pelletsHitting: effectivePelletsHitting,
        enemy: effectiveEnemy,
        firing,
        rules,
        angle: state.angle,
      }),
    [
      effectiveAttack,
      effectiveExplosion,
      effectiveShrapnel,
      effectivePelletsHitting,
      effectiveEnemy,
      firing,
      rules,
      state.angle,
    ],
  );

  const matrix = useMemo(
    () => armorDurabilityMatrix(effectiveAttack, { rules, angle: state.angle }),
    [effectiveAttack, rules, state.angle],
  );

  return {
    state,
    dispatch,
    weapon,
    fireMode,
    attack,
    enemy,
    part,
    effectiveAttack,
    effectiveExplosion,
    effectiveEnemy,
    effectivePart,
    firing,
    rules,
    simulation,
    steps,
    ranking,
    matrix,
  };
}
