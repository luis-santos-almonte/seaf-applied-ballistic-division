/** Datos compartidos por las pruebas, cargados desde el catálogo real. */
import { describe } from 'vitest';
import type { Attack, Enemy, EnemyPart, FiringProfile, Rules, Weapon } from '@/domain/types';
import rawRules from '@data/rules.json';
import rawAc8 from '@data/weapons/ac8-autocannon.json';
import rawDevastator from '@data/enemies/automatons/devastator.json';
import rawCharger from '@data/enemies/terminids/charger.json';
import { enemySchema, rulesSchema, weaponSchema } from '@/domain/schemas';

export const rules: Rules = rulesSchema.parse(rawRules);
export const ac8: Weapon = weaponSchema.parse(rawAc8);
export const devastator: Enemy = enemySchema.parse(rawDevastator);
export const charger: Enemy = enemySchema.parse(rawCharger);

export function attackOf(weapon: Weapon, id: string): Attack {
  const attack = weapon.attacks.find((a) => a.id === id);
  if (!attack) throw new Error(`No existe el perfil de ataque "${id}"`);
  return attack;
}

export function partOf(enemy: Enemy, id: string): EnemyPart {
  const part = enemy.parts.find((p) => p.id === id);
  if (!part) throw new Error(`No existe la parte "${id}" en ${enemy.id}`);
  return part;
}

export const APHET = attackOf(ac8, 'aphet-projectile');
export const APHET_EXPLOSION = attackOf(ac8, 'aphet-explosion');
export const FLAK = attackOf(ac8, 'flak-projectile');
export const FLAK_EXPLOSION = attackOf(ac8, 'flak-explosion');
export const SHRAPNEL = attackOf(ac8, 'shrapnel');

export const AC8_FIRING: FiringProfile = {
  rpm: ac8.rpm,
  shotsPerCycle: ac8.magazine,
  reloadTime: ac8.reload.full,
};

/** Objetivo sintético para probar el motor sin depender de un enemigo real. */
export const target = (av: number, durability: number, exdr = 0) => ({ av, durability, exdr });

// Evita el aviso de "archivo sin pruebas" cuando vitest lo recoge por el glob.
describe.skip('fixtures', () => {});
