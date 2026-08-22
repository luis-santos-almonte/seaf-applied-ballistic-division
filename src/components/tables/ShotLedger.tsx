import type { ShotRecord } from '@/domain/types';
import { Panel } from '@/components/ui/Panel';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { formatNumber, formatSeconds } from '@/lib/format';

const columns: ReadonlyArray<Column<ShotRecord>> = [
  { key: 'shot', header: '#', render: (row) => row.shot },
  { key: 'time', header: 't', render: (row) => formatSeconds(row.time) },
  { key: 'part', header: 'Daño a la parte', render: (row) => formatNumber(row.partDamage) },
  {
    key: 'partLeft',
    header: 'Parte restante',
    render: (row) =>
      row.partRemaining === null ? (
        <span className="cell--muted">—</span>
      ) : (
        formatNumber(row.partRemaining)
      ),
  },
  {
    key: 'main',
    header: 'Daño a Main',
    render: (row) => (
      <>
        {formatNumber(row.mainDamage)} {row.cappedThisShot && <Pill tone="none">tope</Pill>}
      </>
    ),
  },
  { key: 'mainLeft', header: 'Main restante', render: (row) => formatNumber(row.mainRemaining) },
];

export function ShotLedger({ ledger }: { ledger: readonly ShotRecord[] }) {
  return (
    <Panel title="Registro disparo a disparo" tag="simulación" flush>
      <DataTable
        columns={columns}
        rows={ledger}
        rowKey={(row) => String(row.shot)}
        emptyMessage="Sin progreso: el ataque no penetra esta parte."
      />
    </Panel>
  );
}
