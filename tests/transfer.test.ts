import { describe, expect, it } from 'vitest';
import { transferToMain } from '@/engine';
import { charger, partOf } from './fixtures';

const basePart = {
  id: 'test',
  name: 'test',
  count: 1,
  hpIsMain: false,
  av: 0,
  durability: 0,
  constitution: null,
  constitutionDecay: null,
  fatal: false,
  fatalNote: null,
  exdr: 0,
  breakablePlating: false,
  protects: null,
  requiresBroken: null,
  notes: null,
  internalName: null,
};

describe('transferencia a Main', () => {
  it('sin tope, el exceso se transfiere entero (ejemplo del Trooper)', () => {
    const arm = { ...basePart, hp: 65, toMain: 0.5, overflowCap: false };
    expect(transferToMain(300, arm, 0, 'floor').mainDamage).toBe(150);
  });

  it('con tope, la transferencia se limita a vida + constitution', () => {
    const head = { ...basePart, hp: 110, toMain: 1, overflowCap: true };
    expect(transferToMain(300, head, 0, 'floor').mainDamage).toBe(110);
  });

  it('el tope es acumulativo entre disparos', () => {
    const head = { ...basePart, hp: 110, toMain: 1, overflowCap: true };
    expect(transferToMain(80, head, 80, 'floor').mainDamage).toBe(30);
    expect(transferToMain(80, head, 110, 'floor').mainDamage).toBe(0);
  });

  it('una parte sin vida propia transfiere todo, con su multiplicador', () => {
    const innerFlesh = partOf(charger, 'inner-flesh');
    expect(innerFlesh.hpIsMain).toBe(true);
    expect(transferToMain(100, innerFlesh, 0, 'floor').mainDamage).toBe(300);
  });
});
