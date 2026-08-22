import type { ResolvedScenario } from '@/hooks/useScenario';
import type { AngleIndex } from '@/domain/types';
import { weapons } from '@/data/catalog';
import { resolveAp } from '@/engine';
import { CheckField, FieldRow, NumberField, SelectField } from '@/components/ui/Field';

/** Selección del arma, su perfil de ataque y los números que lo definen. */
export function WeaponFields({ scenario }: { scenario: ResolvedScenario }) {
  const { state, dispatch, weapon, attack, effectiveAttack, rules } = scenario;

  const currentAp = resolveAp(effectiveAttack, state.angle);
  const isExplosion = attack.kind === 'explosion';
  const hasExplosion = attack.triggersExplosion !== null;

  return (
    <>
      <SelectField
        label="Arma"
        value={state.weaponId}
        options={weapons.map((w) => ({ value: w.id, label: w.name }))}
        onChange={(weaponId) => {
          const next = weapons.find((w) => w.id === weaponId);
          if (!next?.attacks[0]) return;
          dispatch({ type: 'selectWeapon', weaponId, attackId: next.attacks[0].id });
        }}
      />

      <SelectField
        label="Perfil de ataque"
        value={state.attackId}
        options={weapon.attacks.map((a) => ({ value: a.id, label: a.label }))}
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
        Desactívalo para aislar el proyectil. La explosión tiene su propio AP y puede rebotar donde
        el proyectil sí entra.
      </p>
    </>
  );
}
