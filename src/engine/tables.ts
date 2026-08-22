import type { AngleIndex, Attack, PenetrationVerdict, Rules } from '@/domain/types';
import { MATRIX_DURABILITY_STEP, MATRIX_MAX_ARMOR_VALUE } from '@/domain/constants';
import { blendDurability } from './durability';
import { resolveAp, resolveArmor } from './armor';
import { applyRounding } from './rounding';
import { durableOf } from './hit';

export interface DurabilityRow {
  durabilityPercent: number;
  standardContribution: number;
  durableContribution: number;
  raw: number;
  finalDamage: number;
}

export interface MatrixCell {
  av: number;
  multiplier: number;
  verdict: PenetrationVerdict;
  damage: number;
}

export interface MatrixRow {
  durabilityPercent: number;
  raw: number;
  cells: MatrixCell[];
}

export interface TableOptions {
  rules: Rules;
  angle?: AngleIndex;
  step?: number;
  maxArmorValue?: number;
  /** AV contra el que se calcula la columna "final" de la tabla de durabilidad. */
  av?: number;
}

/** Tabla de durabilidad 0-100% para un perfil de ataque. */
export function durabilityTable(attack: Attack, options: TableOptions): DurabilityRow[] {
  const { rules, angle = 0, step = 1, av = 0 } = options;
  const armor = resolveArmor(resolveAp(attack, angle), av, rules);
  const durable = durableOf(attack);
  const rows: DurabilityRow[] = [];

  for (let percent = 0; percent <= 100; percent += step) {
    const d = percent / 100;
    const raw = blendDurability(attack.standard, durable, d);
    rows.push({
      durabilityPercent: percent,
      standardContribution: attack.standard * (1 - d),
      durableContribution: durable * d,
      raw,
      finalDamage: applyRounding(raw * armor.multiplier, rules.rounding.mode),
    });
  }
  return rows;
}

/** Matriz durabilidad x armadura: el daño final de este ataque contra todo. */
export function armorDurabilityMatrix(attack: Attack, options: TableOptions): MatrixRow[] {
  const {
    rules,
    angle = 0,
    step = MATRIX_DURABILITY_STEP,
    maxArmorValue = MATRIX_MAX_ARMOR_VALUE,
  } = options;

  const ap = resolveAp(attack, angle);
  const durable = durableOf(attack);
  const rows: MatrixRow[] = [];

  for (let percent = 0; percent <= 100; percent += step) {
    const raw = blendDurability(attack.standard, durable, percent / 100);
    const cells: MatrixCell[] = [];

    for (let av = 0; av <= maxArmorValue; av++) {
      const armor = resolveArmor(ap, av, rules);
      cells.push({
        av,
        multiplier: armor.multiplier,
        verdict: armor.verdict,
        damage: applyRounding(raw * armor.multiplier, rules.rounding.mode),
      });
    }
    rows.push({ durabilityPercent: percent, raw, cells });
  }
  return rows;
}
