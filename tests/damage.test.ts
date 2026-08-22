import { describe, expect, it } from 'vitest';
import { applyRounding, blendDurability, resolveArmor, resolveAp, resolveHit } from '@/engine';
import { APHET, APHET_EXPLOSION, rules, target } from './fixtures';

describe('durabilidad', () => {
  it('mezcla standard y durable según la durabilidad de la parte', () => {
    expect(blendDurability(325, 260, 0)).toBe(325);
    expect(blendDurability(325, 260, 0.5)).toBe(292.5);
    expect(blendDurability(325, 260, 1)).toBe(260);
    expect(blendDurability(325, 260, 0.8)).toBe(273);
  });

  it('reproduce el ejemplo publicado del Adjudicator (95/23 contra 30% durable)', () => {
    expect(applyRounding(blendDurability(95, 23, 0.3), 'floor')).toBe(73);
  });
});

describe('penetración de armadura', () => {
  it('aplica 100 / 65 / 0 por ciento según la relación AP-AV', () => {
    expect(resolveArmor(4, 3, rules)).toEqual({ multiplier: 1, verdict: 'PENETRATED' });
    expect(resolveArmor(4, 4, rules)).toEqual({ multiplier: 0.65, verdict: 'EQUAL' });
    expect(resolveArmor(4, 5, rules)).toEqual({ multiplier: 0, verdict: 'RICOCHET' });
  });

  it('elige el AP según el bucket de ángulo', () => {
    expect(resolveAp(APHET, 0)).toBe(4);
    expect(resolveAp(APHET, 2)).toBe(4);
    expect(resolveAp(APHET, 3)).toBe(0);
  });
});

describe('resolución de un impacto', () => {
  it('AC-8 contra AV4 sin durabilidad: 325 × 0.65 = 211.25 → 211', () => {
    const hit = resolveHit(APHET, target(4, 0), { rules });
    expect(hit.raw).toBe(325);
    expect(hit.armorMultiplier).toBe(0.65);
    expect(hit.beforeRounding).toBe(211.25);
    expect(hit.finalDamage).toBe(211);
  });

  it('no hace daño cuando el AP no alcanza el AV', () => {
    const hit = resolveHit(APHET, target(5, 0), { rules });
    expect(hit.finalDamage).toBe(0);
    expect(hit.penetrated).toBe(false);
    expect(hit.verdict).toBe('RICOCHET');
  });

  it('la explosión AP3 rebota en AV4 aunque el proyectil AP4 entre', () => {
    expect(resolveHit(APHET_EXPLOSION, target(4, 0), { rules }).finalDamage).toBe(0);
    expect(resolveHit(APHET, target(4, 0), { rules }).finalDamage).toBeGreaterThan(0);
  });

  it('la explosión ignora la durabilidad de la parte', () => {
    expect(resolveHit(APHET_EXPLOSION, target(0, 1), { rules }).finalDamage).toBe(150);
  });

  it('la explosión se reduce por el ExDR de la parte', () => {
    expect(resolveHit(APHET_EXPLOSION, target(0, 0, 0.25), { rules }).finalDamage).toBe(112);
  });
});
