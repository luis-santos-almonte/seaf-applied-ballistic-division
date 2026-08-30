import type { ResolvedScenario } from '@/hooks/useScenario';
import type { AngleIndex } from '@/domain/types';
import { weapons } from '@/data/catalog';
import { deriveFireModes, resolveAp } from '@/engine';
import { CheckField, FieldRow, NumberField, SelectField } from '@/components/ui/Field';

/** Selección del arma, su modo de fuego y los números que lo definen. */
export function WeaponFields({ scenario }: { scenario: ResolvedScenario }) {
  const { state, dispatch, weapon, fireMode, attack, effectiveAttack, rules } = scenario;

  const currentAp = resolveAp(effectiveAttack, state.angle);
  const isExplosion = attack.kind === 'explosion';
  const hasExplosion = fireMode.explosion !== null;
  const hasShrapnel = fireMode.shrapnel !== null;
  const fragmentCount = fireMode.shrapnelCount ?? 0;
  const pelletsPerShot = attack.pelletsPerShot;

  return (
    <>
      <SelectField
        label="Arma"
        value={state.weaponId}
        options={weapons.map((w) => ({ value: w.id, label: w.name }))}
        onChange={(weaponId) => {
          const next = weapons.find((w) => w.id === weaponId);
          const nextMode = next && deriveFireModes(next)[0];
          if (!nextMode) return;
          dispatch({ type: 'selectWeapon', weaponId, attackId: nextMode.id });
        }}
      />

      <SelectField
        label="Modo de fuego"
        value={state.attackId}
        options={deriveFireModes(weapon).map((m) => ({ value: m.id, label: m.label }))}
        onChange={(attackId) => dispatch({ type: 'selectAttack', attackId })}
      />

      <FieldRow columns={3}>
        <NumberField
          label="Standard"
          min={0}
          value={effectiveAttack.standard}
          onChange={(standard) => dispatch({ type: 'overrideWeapon', patch: { standard: standard ?? 0 } })}
        />
        <NumberField
          label="Durable"
          min={0}
          value={effectiveAttack.durable ?? effectiveAttack.standard}
          onChange={(durable) => dispatch({ type: 'overrideWeapon', patch: { durable: durable ?? 0 } })}
        />
        <NumberField
          label="AP"
          min={0}
          max={11}
          value={currentAp}
          onChange={(ap) => dispatch({ type: 'overrideWeapon', patch: { ap: ap ?? 0 } })}
        />
      </FieldRow>

      {pelletsPerShot !== null && (
        <NumberField
          label="Perdigones que conectan"
          min={0}
          max={pelletsPerShot}
          value={Math.min(state.pelletsHitting, pelletsPerShot)}
          onChange={(count) => dispatch({ type: 'setPelletsHitting', count: count ?? 0 })}
          hint={`Este cartucho dispara ${pelletsPerShot} perdigones a la vez, no espaciados por la cadencia del arma. Declara cuántos pegan de verdad en esta parte.`}
        />
      )}

      <SelectField
        label="Ángulo de impacto"
        value={String(state.angle)}
        disabled={isExplosion}
        options={rules.angleBuckets.map((bucket, index) => ({
          value: String(index),
          label: `${bucket.label} · ${bucket.range}`,
        }))}
        onChange={(value) => dispatch({ type: 'setAngle', angle: Number(value) as AngleIndex })}
        hint={
          isExplosion
            ? 'Las explosiones usan un único valor de AP, sin buckets de ángulo.'
            : 'Cada proyectil declara cuatro valores de AP según el ángulo.'
        }
      />

      <CheckField
        label="La explosión asociada alcanza la misma parte"
        checked={state.includeExplosion && hasExplosion}
        disabled={!hasExplosion}
        onChange={(include) => dispatch({ type: 'toggleExplosion', include })}
      />
      <p className="field__hint">
        Desactívalo para aislar el proyectil. La explosión (y su metralla, si tiene) tiene su
        propio AP y puede rebotar donde el proyectil sí entra.
      </p>

      {hasShrapnel && state.includeExplosion && (
        <NumberField
          label="Fragmentos que conectan"
          min={0}
          max={fragmentCount}
          value={Math.min(state.flakFragments, fragmentCount)}
          onChange={(count) => dispatch({ type: 'setFlakFragments', count: count ?? 0 })}
          hint={`De los ${fragmentCount} fragmentos que dispara, cuántos pegan de verdad en esta parte.`}
        />
      )}
    </>
  );
}
