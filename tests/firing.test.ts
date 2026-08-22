import { describe, expect, it } from 'vitest';
import { damagePerSecond, reloadsNeeded, shotInterval, timeToKill } from '@/engine';
import { AC8_FIRING } from './fixtures';

const interval = 60 / 190;

describe('cadencia y TTK', () => {
  it('el primer disparo ocurre en t = 0', () => {
    expect(timeToKill(1, AC8_FIRING)).toBe(0);
  });

  it('acumula el intervalo entre disparos', () => {
    expect(timeToKill(2, AC8_FIRING)).toBeCloseTo(interval);
    expect(timeToKill(10, AC8_FIRING)).toBeCloseTo(9 * interval);
  });

  it('añade una recarga al vaciar el cargador', () => {
    expect(timeToKill(11, AC8_FIRING)).toBeCloseTo(10 * interval + 4.5);
    expect(timeToKill(21, AC8_FIRING)).toBeCloseTo(20 * interval + 9);
  });

  it('cuenta las recargas necesarias', () => {
    expect(reloadsNeeded(10, 10)).toBe(0);
    expect(reloadsNeeded(11, 10)).toBe(1);
    expect(reloadsNeeded(31, 10)).toBe(3);
  });

  it('distingue DPS bruto de DPS sostenido', () => {
    const dps = damagePerSecond(325, AC8_FIRING);
    expect(dps.interval).toBeCloseTo(shotInterval(190));
    expect(dps.raw).toBeGreaterThan(dps.sustained);
  });
});
