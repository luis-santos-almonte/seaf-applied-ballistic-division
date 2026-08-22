import type { RankedTarget } from '@/domain/types';
import { Panel } from '@/components/ui/Panel';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pill, VerdictPill } from '@/components/ui/Pill';
import { formatInteger, formatNumber, formatPercent, formatSeconds } from '@/lib/format';

const columns: ReadonlyArray<Column<RankedTarget>> = [
  {
    key: 'part',
    header: 'Parte',
    render: (row) => (row.part.count > 1 ? `${row.part.name} ×${row.part.count}` : row.part.name),
  },
  {
    key: 'hp',
    header: 'Vida',
    render: (row) =>
      row.part.hp === null ? <span className="cell--muted">Main</span> : formatNumber(row.part.hp),
  },
  { key: 'av', header: 'AV', render: (row) => row.part.av },
  { key: 'dur', header: 'Durab.', render: (row) => formatPercent(row.part.durability) },
  { key: 'toMain', header: '% Main', render: (row) => formatPercent(row.part.toMain) },
  {
    key: 'damage',
    header: 'Daño/impacto',
    render: (row) => <b>{formatNumber(row.simulation.damagePerShotToPart)}</b>,
  },
  {
    key: 'setup',
    header: 'Abrir placa',
    render: (row) =>
      row.setupShots > 0 ? `+${formatInteger(row.setupShots)}` : <span className="cell--muted">—</span>,
  },
  { key: 'kill', header: 'Impactos', render: (row) => formatInteger(row.simulation.shotsToKill) },
  { key: 'total', header: 'Total', render: (row) => <b>{formatInteger(row.totalShots)}</b> },
  { key: 'ttk', header: 'TTK total', render: (row) => formatSeconds(row.totalTtk) },
  {
    key: 'verdict',
    header: 'Penetración',
    render: (row) => <VerdictPill verdict={row.simulation.projectile.verdict} />,
  },
  {
    key: 'notes',
    header: 'Notas',
    align: 'left',
    render: (row) => (
      <>
        {row.part.fatal && <Pill tone="amber">fatal</Pill>}{' '}
        {row.part.requiresBroken && <Pill tone="none">bajo placa</Pill>}{' '}
        {row.part.hpIsMain && <Pill>sin vida propia</Pill>}
      </>
    ),
  },
];

/** Comparador de puntos de impacto para el enemigo seleccionado. */
export function TargetRanking({ ranking, tag }: { ranking: readonly RankedTarget[]; tag: string }) {
  return (
    <Panel title="Dónde disparar" tag={tag} flush>
      <p className="panel__lede">
        Ordenado por impactos totales hasta la muerte, no por vida. Una parte con menos vida puede
        ser peor objetivo si no es fatal, si transfiere poco a Main o si hay que romper una placa
        antes de tocarla.
      </p>
      <DataTable
        columns={columns}
        rows={ranking}
        rowKey={(row) => row.part.id}
        highlight={(row, index) => index === 0 && Number.isFinite(row.totalShots)}
      />
    </Panel>
  );
}
