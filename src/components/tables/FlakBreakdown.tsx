import type { FlakResult } from '@/engine';
import type { HitBreakdown } from '@/domain/types';
import { Panel } from '@/components/ui/Panel';
import { Notice } from '@/components/ui/Notice';
import { NumberField } from '@/components/ui/Field';
import { VerdictPill } from '@/components/ui/Pill';
import { formatNumber } from '@/lib/format';

interface Props {
  flak: FlakResult;
  partName: string;
  onFragmentsChange: (count: number) => void;
}

function Line({ name, hit, count }: { name: string; hit: HitBreakdown; count: number }) {
  return (
    <tr>
      <td style={{ textAlign: 'left' }}>{name}</td>
      <td>
        {hit.ap} vs {hit.av} <VerdictPill verdict={hit.verdict} />
      </td>
      <td>{formatNumber(hit.finalDamage)}</td>
      <td>{count}</td>
      <td>
        <b>{formatNumber(hit.finalDamage * count)}</b>
      </td>
    </tr>
  );
}

/** Desglose del disparo FLAK, separando la cota teórica de la estimación real. */
export function FlakBreakdown({ flak, partName, onFragmentsChange }: Props) {
  return (
    <Panel title="FLAK · máximo teórico vs. realidad" tag="metralla">
      <Notice>
        <strong>30 × 110 = 3.300 no es el daño del FLAK.</strong> Es la cota superior si los treinta
        fragmentos impactaran y penetraran la misma parte, cosa que no ocurre contra un objetivo
        único: la metralla se dispersa. La secuencia <code>3 / 3 / 2 / 0</code> del fragmento tampoco
        es una cadena de penetraciones, son sus cuatro valores de AP según el ángulo.
      </Notice>

      <div style={{ maxWidth: 280 }}>
        <NumberField
          label="Fragmentos que conectan"
          min={0}
          max={flak.fragmentCount}
          value={flak.fragmentsHitting}
          onChange={(count) => onFragmentsChange(count ?? 0)}
        />
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Componente</th>
              <th>AP vs AV</th>
              <th>Daño unitario</th>
              <th>Cantidad</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <Line name="Proyectil FLAK" hit={flak.projectile} count={1} />
            <Line name="Explosión FLAK" hit={flak.explosion} count={1} />
            <Line name="Fragmento" hit={flak.fragment} count={flak.fragmentsHitting} />
            <tr>
              <td colSpan={4} style={{ textAlign: 'left' }}>
                <b>Total realista contra {partName}</b>
              </td>
              <td>
                <b>{formatNumber(flak.realistic)}</b>
              </td>
            </tr>
            <tr className="cell--muted">
              <td colSpan={4} style={{ textAlign: 'left' }}>
                Máximo teórico ({flak.fragmentCount}/{flak.fragmentCount} fragmentos, inalcanzable
                contra un solo objetivo)
              </td>
              <td>{formatNumber(flak.theoreticalMax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
