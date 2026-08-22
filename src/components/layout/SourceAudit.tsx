import type { Provenance } from '@/domain/types';
import { enemies, rules, weapons } from '@/data/catalog';
import { Panel } from '@/components/ui/Panel';
import { Notice } from '@/components/ui/Notice';
import { ConfidencePill } from '@/components/ui/Pill';

interface Entry {
  label: string;
  source: Provenance;
}

function collectEntries(): Entry[] {
  return [
    { label: 'Reglas de penetración', source: rules.armorPenetration.source },
    { label: 'Política de redondeo', source: rules.rounding.source },
    { label: 'Mecánica de explosiones', source: rules.explosion.source },
    ...weapons.map((w) => ({ label: w.name, source: w.source })),
    ...enemies.map((e) => ({ label: e.name, source: e.source })),
  ];
}

/** Procedencia de cada dato. Sin esto los números no son auditables. */
export function SourceAudit() {
  const entries = collectEntries();
  const conflicts = entries.filter((e) => e.source.conflict !== null);

  return (
    <Panel title="Procedencia de los datos" tag="auditoría">
      <ul className="sources">
        {entries.map((entry) => (
          <li key={`${entry.label}-${entry.source.url}`}>
            <b>{entry.label}</b> —{' '}
            <a href={entry.source.url} target="_blank" rel="noopener noreferrer">
              {entry.source.name}
            </a>{' '}
            · verificado {entry.source.dateChecked} ·{' '}
            <ConfidencePill confidence={entry.source.confidence} /> · {entry.source.status}
          </li>
        ))}
      </ul>

      {conflicts.map((entry) => (
        <Notice key={entry.label}>
          <strong>Conflicto de fuentes en «{entry.label}».</strong> {entry.source.conflict}
        </Notice>
      ))}

      <p className="field__hint">
        Regla del proyecto: si un valor no se puede verificar se deja en <code>null</code> con
        estado <code>unverified</code>. Una celda vacía es mejor que un número inventado. Cuando dos
        fuentes se contradicen se registran ambas en vez de elegir en silencio.
      </p>
    </Panel>
  );
}
