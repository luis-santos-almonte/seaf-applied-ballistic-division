import type { EnemyPart, Rules, SimulationResult } from '@/domain/types';
import { VERDICT_DETAIL } from '@/domain/constants';
import { reloadsNeeded } from './firing';
import type { SimulationInput } from './simulate';

/**
 * Un paso de la derivacion. La UI solo lo pinta: la explicacion de POR QUE sale
 * ese numero es conocimiento del dominio y vive aqui, junto al calculo.
 */
export interface DerivationStep {
  key: string;
  label: string;
  /** Expresion matematica con los numeros ya sustituidos. */
  math: string;
  note: string | null;
  /** Paso que no aporta al resultado, se pinta apagado. */
  muted?: boolean;
}

const n = (value: number): string =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value)
    : '—';

const percent = (fraction: number): string => `${n(fraction * 100)}%`;

/** Genera los siete pasos que van del arma al TTK. */
export function explainSimulation(
  input: SimulationInput,
  result: SimulationResult,
  rules: Rules,
): DerivationStep[] {
  const { part, firing } = input;
  const steps: DerivationStep[] = [];

  steps.push(durabilityStep(input, result));
  steps.push(armorStep(result));
  steps.push(roundingStep(result, rules));
  steps.push(explosionStep(result));
  steps.push(transferStep(part, result));
  steps.push(breakpointStep(part, result));

  const shots = result.shotsToKill;
  steps.push({
    key: 'ttk',
    label: 'TTK',
    math: Number.isFinite(shots)
      ? `(${shots} − 1) × 60/${firing.rpm} + ${reloadsNeeded(shots, firing.shotsPerCycle)} recarga(s) × ${firing.reloadTime}s = ${n(result.ttk)} s`
      : 'No alcanza la muerte dentro del presupuesto de impactos',
    note: 'Teórico: primer disparo en t = 0, cadencia perfecta, sin apuntar ni moverse.',
  });

  return steps;
}

function durabilityStep(input: SimulationInput, result: SimulationResult): DerivationStep {
  const { attack, part } = input;
  const p = result.projectile;

  if (attack.kind === 'explosion') {
    return {
      key: 'durability',
      label: 'Durabilidad',
      math: `Las explosiones la ignoran → daño base ${n(p.raw)}`,
      note: 'Una explosión aplica siempre su valor durable completo.',
    };
  }

  const durable = attack.durable ?? attack.standard;
  return {
    key: 'durability',
    label: 'Durabilidad',
    math: `${n(attack.standard)} × (1 − ${n(part.durability)}) + ${n(durable)} × ${n(part.durability)} = ${n(p.raw)}`,
    note: `La parte es ${percent(part.durability)} durable.`,
  };
}

function armorStep(result: SimulationResult): DerivationStep {
  const p = result.projectile;
  return {
    key: 'armor',
    label: 'Penetración de armadura',
    math: `AP ${p.ap} vs AV ${p.av} → ×${p.armorMultiplier} · ${n(p.raw)} × ${p.armorMultiplier} = ${n(p.beforeRounding)}`,
    note: VERDICT_DETAIL[p.verdict],
  };
}

function roundingStep(result: SimulationResult, rules: Rules): DerivationStep {
  const p = result.projectile;
  const mode = rules.rounding.mode;
  return {
    key: 'rounding',
    label: 'Redondeo',
    math:
      mode === 'none'
        ? `Sin redondear → ${n(p.beforeRounding)}`
        : `${n(p.beforeRounding)} → ${n(p.finalDamage)}`,
    note:
      mode === 'floor'
        ? 'El juego trunca hacia abajo al entero.'
        : 'Modo de comparación, no es el comportamiento documentado.',
  };
}

function explosionStep(result: SimulationResult): DerivationStep {
  const e = result.explosion;

  if (!e) {
    return {
      key: 'explosion',
      label: 'Explosión asociada',
      math: 'Excluida del cálculo',
      note: 'Actívala si la explosión también alcanza esta parte.',
      muted: true,
    };
  }

  if (e.explosionImmune) {
    const bypass = result.explosionBypass;
    return {
      key: 'explosion',
      label: 'Explosión asociada',
      math: 'La parte es inmune a explosión (ExDR 100%) → 0 daño a la parte',
      note: bypass?.applies
        ? `Se redirige a Main: ${n(bypass.damage)} de daño. ${bypass.reason}`
        : `Tampoco llega a Main. ${bypass?.reason ?? ''}`,
    };
  }

  return {
    key: 'explosion',
    label: 'Explosión asociada',
    math: `${n(e.raw)} · AP ${e.ap} vs AV ${e.av} → ×${e.armorMultiplier} · ExDR ${percent(e.exdr)} → ${n(e.finalDamage)}`,
    note:
      e.finalDamage === 0
        ? 'La explosión no penetra esta parte aunque el proyectil sí lo haga.'
        : 'Evento de daño independiente del proyectil.',
  };
}

function transferStep(part: EnemyPart, result: SimulationResult): DerivationStep {
  const pool = (part.hp ?? 0) + (part.constitution ?? 0);
  return {
    key: 'transfer',
    label: 'Transferencia a Main HP',
    math: part.hpIsMain
      ? `Parte sin vida propia → todo va a Main × ${percent(part.toMain)} = ${n(result.damagePerShotToMain)}`
      : `${n(result.damagePerShotToPart)} × ${percent(part.toMain)} = ${n(result.damagePerShotToMain)}`,
    note: part.overflowCap
      ? `Con tope: el total transferido no supera ${n(pool)} (vida + constitution).`
      : 'Sin tope: el exceso también se transfiere.',
  };
}

function breakpointStep(part: EnemyPart, result: SimulationResult): DerivationStep {
  const shots = part.hpIsMain ? result.shotsToKill : result.shotsToDestroyPart;
  return {
    key: 'breakpoint',
    label: 'Breakpoint',
    math: part.hpIsMain
      ? `Main ÷ ${n(result.damagePerShotToMain)} por impacto → ${Number.isFinite(shots) ? shots : '—'} impactos`
      : `${n(result.partPool ?? 0)} ÷ ${n(result.damagePerShotToPart)} → ${Number.isFinite(shots) ? shots : '—'} impactos para destruirla`,
    note: part.fatal
      ? `Parte fatal: destruirla mata al enemigo.${part.fatalNote ? ` ${part.fatalNote}` : ''}`
      : 'Parte NO fatal: destruirla no mata; la muerte tiene que llegar por Main.',
  };
}
