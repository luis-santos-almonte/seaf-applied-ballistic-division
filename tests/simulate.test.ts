import { describe, expect, it } from 'vitest';
import { rankTargets, simulate } from '@/engine';
import {
  AC8_FIRING,
  APHET,
  APHET_EXPLOSION,
  charger,
  devastator,
  partOf,
  rules,
} from './fixtures';

const shoot = (enemy: typeof devastator, partId: string) =>
  simulate({
    attack: APHET,
    explosion: APHET_EXPLOSION,
    enemy,
    part: partOf(enemy, partId),
    firing: AC8_FIRING,
    rules,
  });

describe('Devastator con AC-8 APHET', () => {
  it('la cabeza muere de un disparo', () => {
    const head = shoot(devastator, 'head');
    expect(head.damagePerShotToPart).toBe(325);
    expect(head.shotsToKill).toBe(1);
    expect(head.ttk).toBe(0);
    expect(head.cause).toBe('FATAL_PART_DESTROYED');
  });

  it('la explosión se redirige a Main porque la cabeza es inmune (ExDR 100%)', () => {
    const head = shoot(devastator, 'head');
    expect(head.explosion?.explosionImmune).toBe(true);
    expect(head.explosionBypass?.applies).toBe(true);
    expect(head.explosionBypass?.damage).toBe(150);
  });

  it('el torso, 30% durable, recibe 305 y cae en dos disparos', () => {
    const torso = shoot(devastator, 'torso');
    expect(torso.damagePerShotToPart).toBe(305);
    expect(torso.shotsToKill).toBe(2);
  });

  it('destruir un brazo no mata: no es una parte fatal', () => {
    const arms = shoot(devastator, 'arms');
    expect(arms.killed).toBe(false);
    expect(arms.partDestroyed).toBe(true);
    expect(arms.cause).toBe('PART_DESTROYED_NOT_FATAL');
  });
});

describe('Charger con AC-8 APHET', () => {
  it('la cabeza iguala el AV4: 276.25 × 0.65 = 179, siete disparos', () => {
    const head = shoot(charger, 'head');
    expect(head.projectile.verdict).toBe('EQUAL');
    expect(head.damagePerShotToPart).toBe(179);
    expect(head.shotsToKill).toBe(7);
  });

  it('el trasero suma proyectil 273 más explosión 112 y cae en tres', () => {
    const butt = shoot(charger, 'butt');
    expect(butt.projectile.finalDamage).toBe(273);
    expect(butt.explosion?.finalDamage).toBe(112);
    expect(butt.damagePerShotToPart).toBe(385);
    expect(butt.shotsToKill).toBe(3);
  });

  it('romper una placa de torso no mata al Charger', () => {
    const plate = shoot(charger, 'torso-armor');
    expect(plate.partDestroyed).toBe(true);
    expect(plate.killed).toBe(false);
  });
});

describe('ranking de objetivos', () => {
  const ranking = rankTargets({
    attack: APHET,
    explosion: APHET_EXPLOSION,
    enemy: charger,
    firing: AC8_FIRING,
    rules,
  });

  it('recomienda el trasero como mejor objetivo del Charger', () => {
    expect(ranking[0]?.part.id).toBe('butt');
  });

  it('suma el coste de abrir la placa que cubre la carne de pata', () => {
    const legFlesh = ranking.find((row) => row.part.id === 'leg-flesh');
    expect(legFlesh?.setupShots).toBeGreaterThan(0);
    expect(legFlesh?.setupPlate?.id).toBe('front-leg-armor');
    expect(legFlesh?.totalShots).toBe(
      (legFlesh?.setupShots ?? 0) + (legFlesh?.simulation.shotsToKill ?? 0),
    );
  });

  it('sin contar la placa, la carne de pata parecería mejor que el trasero', () => {
    const legFlesh = ranking.find((row) => row.part.id === 'leg-flesh');
    const butt = ranking.find((row) => row.part.id === 'butt');
    expect(legFlesh?.simulation.shotsToKill).toBeLessThanOrEqual(
      butt?.simulation.shotsToKill ?? Infinity,
    );
    expect(legFlesh?.totalShots).toBeGreaterThan(butt?.totalShots ?? 0);
  });
});
