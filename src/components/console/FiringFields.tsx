import type { ResolvedScenario } from '@/hooks/useScenario';
import type { RoundingMode } from '@/domain/types';
import { FieldRow, NumberField, SelectField } from '@/components/ui/Field';

const ROUNDING_OPTIONS: ReadonlyArray<{ value: RoundingMode; label: string }> = [
  { value: 'floor', label: 'Truncar hacia abajo (documentado)' },
  { value: 'none', label: 'Sin redondear (decimales crudos)' },
  { value: 'round', label: 'Redondeo normal (para comparar)' },
];

/** Cadencia, recarga y política de redondeo. */
export function FiringFields({ scenario }: { scenario: ResolvedScenario }) {
  const { dispatch, firing, rules, weapon } = scenario;

  return (
    <>
      <FieldRow columns={3}>
        <NumberField
          label="RPM"
          min={1}
          value={firing.rpm}
          onChange={(rpm) => dispatch({ type: 'overrideFiring', patch: { rpm: rpm ?? 1 } })}
        />
        <NumberField
          label="Tiros/ciclo"
          min={1}
          value={firing.shotsPerCycle}
          onChange={(n) => dispatch({ type: 'overrideFiring', patch: { shotsPerCycle: n ?? 1 } })}
        />
        <NumberField
          label="Recarga s"
          min={0}
          step={0.1}
          value={firing.reloadTime}
          onChange={(t) => dispatch({ type: 'overrideFiring', patch: { reloadTime: t ?? 0 } })}
        />
      </FieldRow>

      {weapon.reload.partial !== null && (
        <p className="field__hint">
          Recarga parcial documentada: {weapon.reload.partial} s por peine de {weapon.reload.clipSize}.
          Pon esos valores en «tiros/ciclo» y «recarga» para modelar el rellenado táctico.
        </p>
      )}

      <SelectField
        label="Redondeo"
        value={rules.rounding.mode}
        options={ROUNDING_OPTIONS}
        onChange={(rounding) => dispatch({ type: 'setRounding', rounding })}
      />
    </>
  );
}
