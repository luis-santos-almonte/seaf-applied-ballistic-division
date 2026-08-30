import type { SimulationResult } from '@/domain/types';
import { Notice } from '@/components/ui/Notice';
import { formatNumber } from '@/lib/format';
import { Line } from './ShrapnelSection';

/**
 * Desglose de perdigones dentro del recibo: ya están sumados al veredicto de
 * arriba, esto solo muestra que el "proyectil" de una escopeta son varios
 * impactos simultáneos, no uno solo espaciado por la cadencia del arma.
 */
export function PelletSection({ simulation, partName }: { simulation: SimulationResult; partName: string }) {
  const p = simulation.pellets;
  if (!p) return null;

  return (
    <div className="shrapnel-section">
      <Notice>
        <strong>
          {p.count} × {formatNumber(simulation.projectile.finalDamage)} = {formatNumber(p.theoreticalMax)} no
          es el daño de este cartucho.
        </strong>{' '}
        Es la cota superior si los {p.count} perdigones impactaran y penetraran la misma parte. Los{' '}
        {p.count} llegan en el mismo instante de disparo, no espaciados por el rpm del arma — el total
        de arriba ya usa los {p.hitting} perdigones que declaraste en la consola.
      </Notice>

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
            <Line name="Perdigón" hit={simulation.projectile} count={p.hitting} />
            <tr>
              <td colSpan={4} style={{ textAlign: 'left' }}>
                <b>Total contra {partName}</b>
              </td>
              <td>
                <b>{formatNumber(p.damagePerShot)}</b>
              </td>
            </tr>
            <tr className="cell--muted">
              <td colSpan={4} style={{ textAlign: 'left' }}>
                Máximo teórico ({p.count}/{p.count} perdigones, inalcanzable contra un solo objetivo)
              </td>
              <td>{formatNumber(p.theoreticalMax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
