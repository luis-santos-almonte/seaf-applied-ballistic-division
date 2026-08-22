import type { SimulationResult } from '@/domain/types';
import { formatInteger, formatNumber, formatSeconds } from '@/lib/format';
import { cx } from '@/lib/classNames';

interface Stat {
  label: string;
  value: string;
  tone?: 'good' | 'warn';
}

export function OutcomeStats({ simulation }: { simulation: SimulationResult }) {
  const stats: Stat[] = [
    { label: 'daño / impacto', value: formatNumber(simulation.damagePerShotToPart) },
    { label: 'daño a Main / impacto', value: formatNumber(simulation.damagePerShotToMain) },
    {
      label: 'impactos para matar',
      value: formatInteger(simulation.shotsToKill),
      tone: simulation.killed ? 'good' : 'warn',
    },
    { label: 'TTK teórico', value: formatSeconds(simulation.ttk) },
    { label: 'DPS bruto', value: formatNumber(simulation.dps.raw) },
    { label: 'DPS sostenido', value: formatNumber(simulation.dps.sustained) },
  ];

  return (
    <div className="outcome">
      {stats.map((stat) => (
        <div key={stat.label} className={cx('stat', stat.tone && `stat--${stat.tone}`)}>
          <b>{stat.value}</b>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
