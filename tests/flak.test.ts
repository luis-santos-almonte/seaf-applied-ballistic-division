import { describe, expect, it } from 'vitest';
import { resolveFlak } from '@/engine';
import { FLAK, FLAK_EXPLOSION, SHRAPNEL, rules, target } from './fixtures';

const soft = target(0, 0);

describe('FLAK', () => {
  it('declara treinta fragmentos', () => {
    const result = resolveFlak({
      projectile: FLAK,
      explosion: FLAK_EXPLOSION,
      shrapnel: SHRAPNEL,
      target: soft,
      fragmentsHitting: 0,
      rules,
    });
    expect(result.fragmentCount).toBe(30);
  });

  it('separa la cota teórica de la estimación realista', () => {
    const result = resolveFlak({
      projectile: FLAK,
      explosion: FLAK_EXPLOSION,
      shrapnel: SHRAPNEL,
      target: soft,
      fragmentsHitting: 3,
      rules,
    });
    expect(result.theoreticalMax).toBe(150 + 190 + 30 * 110);
    expect(result.realistic).toBe(150 + 190 + 3 * 110);
    expect(result.realistic).toBeLessThan(result.theoreticalMax);
  });

  it('contra una parte 100% durable el fragmento hace 35, no 110', () => {
    const result = resolveFlak({
      projectile: FLAK,
      explosion: FLAK_EXPLOSION,
      shrapnel: SHRAPNEL,
      target: target(0, 1),
      fragmentsHitting: 30,
      rules,
    });
    expect(result.fragment.finalDamage).toBe(35);
  });
});
