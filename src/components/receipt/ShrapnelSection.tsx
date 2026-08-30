import type { HitBreakdown, SimulationResult } from '@/domain/types';
import { Notice } from '@/components/ui/Notice';
import { VerdictPill } from '@/components/ui/Pill';
import { formatNumber } from '@/lib/format';

export function Line({ name, hit, count }: { name: string; hit: HitBreakdown; count: number }) {
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

/**
 * Desglose de metralla dentro del recibo: ya está sumada al veredicto y al
 * breakpoint de arriba, esto solo muestra de dónde sale cada parte del total.
 */
export function ShrapnelSection({ simulation, partName }: { simulation: SimulationResult; partName: string }) {
  const s = simulation.shrapnel;
  if (!s) return null;

  const unitDamage = s.hit.finalDamage + (s.explosionHit?.finalDamage ?? 0);

  return (
    <div className="shrapnel-section">
      <Notice>
        <strong>
          {s.fragmentCount} × {formatNumber(unitDamage)} = {formatNumber(s.theoreticalMax)} no es el
          daño de la metralla.
        </strong>{' '}
        Es la cota superior si los {s.fragmentCount} fragmentos impactaran y penetraran la misma
        parte, cosa que no ocurre contra un objetivo único: la metralla se dispersa. El total de
        arriba ya usa los {s.fragmentsHitting} fragmentos que declaraste en la consola.
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
            <Line name="Proyectil" hit={simulation.projectile} count={1} />
            {simulation.explosion && <Line name="Explosión" hit={simulation.explosion} count={1} />}
            <Line name="Fragmento" hit={s.hit} count={s.fragmentsHitting} />
            {s.explosionHit && (
              <Line name="Explosión del fragmento" hit={s.explosionHit} count={s.fragmentsHitting} />
            )}
            <tr>
              <td colSpan={4} style={{ textAlign: 'left' }}>
                <b>Total contra {partName}</b>
              </td>
              <td>
                <b>{formatNumber(simulation.damagePerShotToPart)}</b>
              </td>
            </tr>
            <tr className="cell--muted">
              <td colSpan={4} style={{ textAlign: 'left' }}>
                Máximo teórico ({s.fragmentCount}/{s.fragmentCount} fragmentos, inalcanzable contra
                un solo objetivo)
              </td>
              <td>{formatNumber(s.theoreticalMax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
