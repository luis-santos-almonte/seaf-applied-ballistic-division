/**
 * Carga y validacion del catalogo.
 *
 * Los datos viven en `data/` como un archivo por entidad, no en un JSON
 * gigante: agregar un enemigo es crear un archivo, lo que evita conflictos de
 * merge y hace que el diff de un parche sea legible.
 *
 * Vite los recoge con `import.meta.glob(..., { eager: true })`, asi que quedan
 * dentro del bundle: no hay `fetch`, no hay CORS, no hay estado de carga y un
 * dato mal formado revienta el build en vez de producir numeros erroneos en
 * produccion.
 */
import { enemySchema, rulesSchema, weaponSchema } from '@/domain/schemas';
import type { Attack, Enemy, Rules, Weapon } from '@/domain/types';
import rawRules from '@data/rules.json';

const weaponModules = import.meta.glob<{ default: unknown }>('@data/weapons/*.json', {
  eager: true,
});
const enemyModules = import.meta.glob<{ default: unknown }>('@data/enemies/**/*.json', {
  eager: true,
});

/** Valida una coleccion de modulos y acumula los errores con su ruta. */
function parseAll<T>(
  modules: Record<string, { default: unknown }>,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } },
  label: string,
): T[] {
  const parsed: T[] = [];
  const problems: string[] = [];

  for (const [path, mod] of Object.entries(modules)) {
    const result = schema.safeParse(mod.default);
    if (result.success && result.data) {
      parsed.push(result.data);
    } else {
      problems.push(`${path}\n${JSON.stringify(result.error, null, 2)}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Datos de ${label} inválidos:\n\n${problems.join('\n\n')}`);
  }
  return parsed;
}

const byName = <T extends { name: string }>(a: T, b: T): number => a.name.localeCompare(b.name, 'es');

export const rules: Rules = rulesSchema.parse(rawRules);

export const weapons: Weapon[] = parseAll<Weapon>(weaponModules, weaponSchema, 'armas').sort(byName);

export const enemies: Enemy[] = parseAll<Enemy>(enemyModules, enemySchema, 'enemigos').sort(byName);

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

export const findWeapon = (id: string): Weapon | undefined => weapons.find((w) => w.id === id);

export const findEnemy = (id: string): Enemy | undefined => enemies.find((e) => e.id === id);

export const findAttack = (weapon: Weapon, id: string): Attack | undefined =>
  weapon.attacks.find((a) => a.id === id);

/** La explosion que dispara un proyectil al impactar, si la declara. */
export function linkedExplosion(weapon: Weapon, attack: Attack): Attack | null {
  if (!attack.triggersExplosion) return null;
  return findAttack(weapon, attack.triggersExplosion) ?? null;
}

/** Los tres perfiles que componen un disparo FLAK, si el arma los tiene. */
export function flakProfiles(
  weapon: Weapon,
): { projectile: Attack; explosion: Attack; shrapnel: Attack } | null {
  const explosion = weapon.attacks.find((a) => a.kind === 'explosion' && a.shrapnel !== null);
  if (!explosion?.shrapnel) return null;

  const shrapnel = findAttack(weapon, explosion.shrapnel.attackId);
  const projectile = weapon.attacks.find((a) => a.triggersExplosion === explosion.id);
  if (!shrapnel || !projectile) return null;

  return { projectile, explosion, shrapnel };
}

/** Resumen para el pie de pagina y la auditoria. */
export const catalogStats = {
  weapons: weapons.length,
  attackProfiles: weapons.reduce((total, w) => total + w.attacks.length, 0),
  enemies: enemies.length,
  parts: enemies.reduce((total, e) => total + e.parts.length, 0),
  conflicts: [
    rules.armorPenetration.source,
    rules.rounding.source,
    rules.explosion.source,
    ...weapons.map((w) => w.source),
    ...enemies.map((e) => e.source),
  ].filter((s) => s.conflict !== null).length,
};
