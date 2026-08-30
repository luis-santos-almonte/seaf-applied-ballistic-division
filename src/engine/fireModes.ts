import type { Attack, Weapon } from '@/domain/types';

export interface FireMode {
  /** = id del ataque de entrada. Compatible con el `attackId` guardado en el estado. */
  id: string;
  label: string;
  /** Ataque de entrada: el proyectil, o la propia explosión si el arma dispara directo (granadas). */
  attack: Attack;
  explosion: Attack | null;
  shrapnel: Attack | null;
  /** Cuantos fragmentos/submuniciones dispara, si `shrapnel` no es null. */
  shrapnelCount: number | null;
  /** Explosion propia del fragmento al impactar (ej. las submuniciones del G-7 Pineapple). */
  shrapnelExplosion: Attack | null;
}

const findAttack = (weapon: Weapon, id: string): Attack | undefined =>
  weapon.attacks.find((a) => a.id === id);

const MODE_LABEL_SUFFIX = /\s*·\s*(proyectil|explosión)\s*$/i;

/**
 * Agrupa los `attacks` planos de un arma en los modos de fuego que el jugador
 * elige de verdad (ej. AC-8: FLAK / APHET, no 5 perfiles sueltos).
 *
 * No depende de ningún dato nuevo: usa los links que ya declara el esquema
 * (`triggersExplosion`, `shrapnel.attackId`). Un ataque que otro referencia
 * como su explosión o su metralla no es un modo de fuego por sí mismo.
 */
export function deriveFireModes(weapon: Weapon): FireMode[] {
  const referenced = new Set<string>();
  for (const attack of weapon.attacks) {
    if (attack.triggersExplosion) referenced.add(attack.triggersExplosion);
    if (attack.shrapnel) referenced.add(attack.shrapnel.attackId);
  }

  const entries = weapon.attacks.filter((a) => !referenced.has(a.id));

  return entries.map((attack): FireMode => {
    const explosion = attack.triggersExplosion ? (findAttack(weapon, attack.triggersExplosion) ?? null) : null;
    /**
     * El campo `shrapnel` puede vivir en la explosión disparada (AC-8: proyectil
     * → explosión → metralla) o directamente en el ataque de entrada, cuando ese
     * ataque YA ES la explosión (granadas de fragmentación: no hay proyectil
     * intermedio, la granada en sí lleva su `shrapnel`).
     */
    const shrapnelCarrier = explosion?.shrapnel ? explosion : attack.shrapnel ? attack : null;
    const shrapnel = shrapnelCarrier?.shrapnel
      ? (findAttack(weapon, shrapnelCarrier.shrapnel.attackId) ?? null)
      : null;
    /** El propio fragmento puede disparar su propia explosión al impactar (submuniciones). */
    const shrapnelExplosion = shrapnel?.triggersExplosion
      ? (findAttack(weapon, shrapnel.triggersExplosion) ?? null)
      : null;

    return {
      id: attack.id,
      label: attack.label.replace(MODE_LABEL_SUFFIX, '') || attack.label,
      attack,
      explosion,
      shrapnel,
      shrapnelCount: shrapnel ? (shrapnelCarrier?.shrapnel?.count ?? null) : null,
      shrapnelExplosion,
    };
  });
}
