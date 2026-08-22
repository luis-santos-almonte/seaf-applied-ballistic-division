import type { EnemyPart, RankedTarget } from '@/domain/types';
import { simulate, type SimulationInput } from './simulate';
import { timeToKill } from './firing';

export type RankingInput = Omit<SimulationInput, 'part'>;

/**
 * Ordena todas las partes de un enemigo por lo que de verdad importa: cuantos
 * impactos totales cuesta matarlo apuntando ahi.
 *
 * No basta con mirar la vida de la parte. Una parte puede tener poca vida y ser
 * mal objetivo porque no es fatal, porque transfiere poco a Main, o porque esta
 * debajo de una placa rompible que hay que abrir primero. El coste de abrir esa
 * placa se suma aqui; ignorarlo produce recomendaciones falsas.
 */
export function rankTargets(input: RankingInput): RankedTarget[] {
  const rows = input.enemy.parts.map((part): RankedTarget => {
    const simulation = simulate({ ...input, part });
    const { shots: setupShots, plate: setupPlate } = setupCost(input, part);
    const totalShots = simulation.shotsToKill + setupShots;

    return {
      part,
      simulation,
      setupShots,
      setupPlate,
      totalShots,
      totalTtk: Number.isFinite(totalShots)
        ? timeToKill(totalShots, input.firing)
        : Number.POSITIVE_INFINITY,
    };
  });

  return rows.sort(
    (a, b) =>
      a.totalShots - b.totalShots ||
      b.simulation.damagePerShotToPart - a.simulation.damagePerShotToPart,
  );
}

function setupCost(
  input: RankingInput,
  part: EnemyPart,
): { shots: number; plate: EnemyPart | null } {
  if (!part.requiresBroken) return { shots: 0, plate: null };

  const plate = input.enemy.parts.find((p) => p.id === part.requiresBroken) ?? null;
  if (!plate) return { shots: 0, plate: null };

  const plateSim = simulate({ ...input, part: plate });
  return {
    shots: Number.isFinite(plateSim.shotsToDestroyPart)
      ? plateSim.shotsToDestroyPart
      : Number.POSITIVE_INFINITY,
    plate,
  };
}
