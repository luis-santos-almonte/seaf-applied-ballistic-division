import { describe, expect, it } from 'vitest';
import { enemySchema, weaponSchema } from '@/domain/schemas';
import { ac8, charger, devastator } from './fixtures';

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
