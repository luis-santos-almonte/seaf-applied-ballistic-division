import type { ResolvedScenario } from '@/hooks/useScenario';
import { enemies } from '@/data/catalog';
import { CheckField, FieldRow, NumberField, SelectField } from '@/components/ui/Field';
import { fromPercentInput, toPercentInput } from '@/lib/format';

/** Selección del enemigo y de la parte, con todos sus atributos editables. */
export function TargetFields({ scenario }: { scenario: ResolvedScenario }) {
  const { state, dispatch, enemy, effectivePart, effectiveEnemy } = scenario;

  return (
    <>
      <SelectField
        label="Enemigo"
        value={state.enemyId}
        options={enemies.map((e) => ({ value: e.id, label: `${e.name} · ${e.faction}` }))}
        onChange={(enemyId) => {
          const next = enemies.find((e) => e.id === enemyId);
          if (!next?.parts[0]) return;
          dispatch({ type: 'selectEnemy', enemyId, partId: next.parts[0].id });
        }}
      />

      <SelectField
        label="Parte objetivo"
        value={state.partId}
        options={enemy.parts.map((p) => ({
          value: p.id,
          label: p.count > 1 ? `${p.name} (×${p.count})` : p.name,
        }))}
        onChange={(partId) => dispatch({ type: 'selectPart', partId })}
      />

      <FieldRow>
        <NumberField
          label="Vida de la parte"
          min={0}
          nullable
          placeholder="vacío = sin vida propia"
          value={effectivePart.hp ?? ''}
          onChange={(hp) => dispatch({ type: 'overrideTarget', patch: { hp } })}
        />
        <NumberField
          label="AV de la parte"
          min={0}
          max={11}
          value={effectivePart.av}
          onChange={(av) => dispatch({ type: 'overrideTarget', patch: { av: av ?? 0 } })}
        />
      </FieldRow>

      <FieldRow>
        <NumberField
          label="Durabilidad %"
          min={0}
          max={100}
          value={toPercentInput(effectivePart.durability)}
          onChange={(v) =>
            dispatch({ type: 'overrideTarget', patch: { durability: fromPercentInput(v ?? 0) } })
          }
        />
        <NumberField
          label="% a Main"
          min={0}
          value={toPercentInput(effectivePart.toMain)}
          onChange={(v) =>
            dispatch({ type: 'overrideTarget', patch: { toMain: fromPercentInput(v ?? 0) } })
          }
        />
      </FieldRow>

      <FieldRow>
        <NumberField
          label="ExDR %"
          min={0}
          max={100}
          value={toPercentInput(effectivePart.exdr)}
          onChange={(v) =>
            dispatch({ type: 'overrideTarget', patch: { exdr: fromPercentInput(v ?? 0) } })
          }
        />
        <NumberField
          label="Constitution"
          min={0}
          nullable
          value={effectivePart.constitution ?? ''}
          onChange={(constitution) => dispatch({ type: 'overrideTarget', patch: { constitution } })}
        />
      </FieldRow>

      <CheckField
        label="Parte fatal: destruirla mata al enemigo"
        checked={effectivePart.fatal}
        onChange={(fatal) => dispatch({ type: 'overrideTarget', patch: { fatal } })}
      />
      <CheckField
        label="Overflow con tope: la transferencia no supera vida + constitution"
        checked={effectivePart.overflowCap}
        onChange={(overflowCap) => dispatch({ type: 'overrideTarget', patch: { overflowCap } })}
      />

      <FieldRow>
        <NumberField
          label="Main HP"
          min={1}
          value={effectiveEnemy.main.hp}
          onChange={(hp) => dispatch({ type: 'overrideMain', patch: { hp: hp ?? 1 } })}
        />
        <NumberField
          label="Main AV"
          min={0}
          max={11}
          value={effectiveEnemy.main.av}
          onChange={(av) => dispatch({ type: 'overrideMain', patch: { av: av ?? 0 } })}
        />
      </FieldRow>
    </>
  );
}
