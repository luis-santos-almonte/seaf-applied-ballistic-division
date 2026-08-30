import { describe, expect, it } from 'vitest';
import { enemySchema, weaponSchema } from '@/domain/schemas';
import { ac8, charger, devastator } from './fixtures';
import { rules, weapons } from '@/data/catalog';
import { deriveFireModes } from '@/engine/fireModes';
import { damagePerSecond } from '@/engine/firing';
import { simulate } from '@/engine/simulate';
import type { FiringProfile } from '@/domain/types';

/**
 * Estas pruebas protegen la integridad de los datos: son la red que atrapa un
 * error al copiar una tabla de la wiki tras un parche.
 */
describe('integridad del catálogo', () => {
  const catalog = [devastator, charger];

  it('cada enemigo pasa su esquema', () => {
    for (const enemy of catalog) {
      expect(() => enemySchema.parse(enemy)).not.toThrow();
    }
  });

  it('el AC-8 pasa su esquema', () => {
    expect(() => weaponSchema.parse(ac8)).not.toThrow();
  });

  it('los ids de parte son únicos dentro de cada enemigo', () => {
    for (const enemy of catalog) {
      const ids = enemy.parts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('toda parte tiene vida propia o transfiere todo a Main', () => {
    for (const enemy of catalog) {
      for (const part of enemy.parts) {
        expect(part.hp !== null || part.hpIsMain).toBe(true);
      }
    }
  });

  it('las referencias entre partes apuntan a partes existentes', () => {
    for (const enemy of catalog) {
      const ids = new Set(enemy.parts.map((p) => p.id));
      for (const part of enemy.parts) {
        if (part.protects) expect(ids.has(part.protects)).toBe(true);
        if (part.requiresBroken) expect(ids.has(part.requiresBroken)).toBe(true);
      }
    }
  });

  it('cada explosión referenciada por un proyectil existe', () => {
    for (const attack of ac8.attacks) {
      if (!attack.triggersExplosion) continue;
      expect(ac8.attacks.some((a) => a.id === attack.triggersExplosion)).toBe(true);
    }
  });

  it('toda fuente declara fecha de verificación y confianza', () => {
    for (const source of [ac8.source, devastator.source, charger.source]) {
      expect(source.dateChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(source.confidence);
    }
  });
});

/**
 * A diferencia del bloque de arriba (que solo mira el fixture del AC-8), esto
 * corre `deriveFireModes` + `simulate` contra las 117 armas reales del
 * catálogo. Atrapó en su momento dos granadas (G-6 Frag, G-7 Pineapple) cuya
 * metralla vivía fuera de la forma que el motor esperaba y quedaba huérfana.
 */
describe('cobertura del catálogo completo de armas', () => {
  const AIR_PART = {
    id: 'audit-part',
    name: 'Audit',
    count: 1,
    hp: 100000,
    hpIsMain: false,
    av: 0,
    durability: 0,
    toMain: 1,
    overflowCap: false,
    constitution: null,
    constitutionDecay: null,
    fatal: true,
    fatalNote: null,
    exdr: 0,
    breakablePlating: false,
    protects: null,
    requiresBroken: null,
    notes: null,
  };

  const AIR_ENEMY = {
    id: 'audit-enemy',
    name: 'Audit',
    faction: 'TERMINIDS' as const,
    size: 'medium' as const,
    fireDamageMultiplier: null,
    staggerThreshold: null,
    main: { hp: 10, av: 0, durability: 0, exdr: 0, constitution: null, constitutionDecay: null },
    parts: [AIR_PART],
    source: {
      name: 'x',
      url: 'https://x.test',
      dateChecked: '2026-01-01',
      confidence: 'HIGH' as const,
      status: 'verified' as const,
      conflict: null,
    },
  };

  it('cada arma produce al menos un modo de fuego, sin huérfanos ni referencias rotas', () => {
    const problems: string[] = [];

    for (const weapon of weapons) {
      const modes = deriveFireModes(weapon);
      if (modes.length === 0) {
        problems.push(`${weapon.id}: 0 modos de fuego derivados de ${weapon.attacks.length} attacks`);
        continue;
      }

      const accounted = new Set<string>();
      for (const mode of modes) {
        accounted.add(mode.attack.id);
        if (mode.attack.triggersExplosion && !mode.explosion) {
          problems.push(
            `${weapon.id}/${mode.id}: triggersExplosion="${mode.attack.triggersExplosion}" no resolvió`,
          );
        }
        if (mode.explosion) accounted.add(mode.explosion.id);
        if (mode.shrapnel) accounted.add(mode.shrapnel.id);
        if (mode.shrapnelExplosion) accounted.add(mode.shrapnelExplosion.id);
      }

      for (const attack of weapon.attacks) {
        if (!accounted.has(attack.id)) {
          problems.push(`${weapon.id}: attack "${attack.id}" no quedó ligado a ningún modo de fuego (huérfano)`);
        }
      }

      const refCounts = new Map<string, number>();
      for (const a of weapon.attacks) {
        if (a.triggersExplosion) refCounts.set(a.triggersExplosion, (refCounts.get(a.triggersExplosion) ?? 0) + 1);
        if (a.shrapnel) refCounts.set(a.shrapnel.attackId, (refCounts.get(a.shrapnel.attackId) ?? 0) + 1);
      }
      for (const [id, count] of refCounts) {
        if (count > 1) {
          problems.push(`${weapon.id}: attack "${id}" referenciado ${count} veces (compartido entre modos)`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('todo modo de fuego produce daño y TTK coherentes contra un objetivo sin armadura', () => {
    const problems: string[] = [];

    for (const weapon of weapons) {
      const modes = deriveFireModes(weapon);
      const firing: FiringProfile = {
        rpm: weapon.rpm,
        shotsPerCycle: weapon.magazine,
        reloadTime: weapon.reload.full,
      };

      for (const mode of modes) {
        const shrapnelInput =
          mode.shrapnel && mode.shrapnelCount
            ? {
                attack: mode.shrapnel,
                explosion: mode.shrapnelExplosion,
                fragmentsHitting: mode.shrapnelCount,
                fragmentCount: mode.shrapnelCount,
              }
            : null;

        const sim = simulate({
          attack: mode.attack,
          explosion: mode.explosion,
          shrapnel: shrapnelInput,
          pelletsHitting: mode.attack.pelletsPerShot ?? 1,
          enemy: AIR_ENEMY,
          part: AIR_PART,
          firing,
          rules,
          angle: 0,
        });

        const tag = `${weapon.id}/${mode.id}`;
        const declaredZeroDamage = mode.attack.standard === 0 && (mode.attack.durable ?? 0) === 0;

        if (sim.damagePerShotToPart <= 0) {
          if (!declaredZeroDamage) {
            problems.push(
              `${tag}: 0 daño contra AV0/durabilidad0 pero el dato declara standard=${mode.attack.standard} — posible AP<=0 o dato roto`,
            );
          }
          continue;
        }
        if (!sim.killed) {
          problems.push(`${tag}: no mata 10 HP sin armadura dentro del presupuesto de disparos (damagePerShotToPart=${sim.damagePerShotToPart})`);
          continue;
        }
        if (!Number.isFinite(sim.ttk) || sim.ttk < 0) {
          problems.push(`${tag}: TTK inválido = ${sim.ttk} (shotsToKill=${sim.shotsToKill})`);
        }
        if (firing.rpm <= 0 || firing.shotsPerCycle <= 0) {
          problems.push(`${tag}: firing profile inválido rpm=${firing.rpm} shotsPerCycle=${firing.shotsPerCycle}`);
        }

        const dps = damagePerSecond(sim.damagePerShotToPart, firing);
        if (dps.sustained > dps.raw + 1e-6) {
          problems.push(`${tag}: DPS sostenido (${dps.sustained.toFixed(1)}) > DPS bruto (${dps.raw.toFixed(1)})`);
        }
        if (dps.sustained <= 0) {
          problems.push(`${tag}: DPS sostenido <= 0`);
        }

        if (mode.attack.pelletsPerShot !== null) {
          if (!sim.pellets || sim.pellets.count !== mode.attack.pelletsPerShot) {
            problems.push(`${tag}: pelletsPerShot=${mode.attack.pelletsPerShot} pero sim.pellets no lo refleja`);
          } else if (sim.pellets.damagePerShot !== sim.projectile.finalDamage * sim.pellets.hitting) {
            problems.push(`${tag}: damagePerShot de perdigones no coincide con finalDamage × hitting`);
          }
        }
      }
    }

    expect(problems).toEqual([]);
  });
});
