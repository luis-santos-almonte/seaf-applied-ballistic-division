import type { MatrixRow } from '@/engine';
import { Panel } from '@/components/ui/Panel';
import { formatNumber } from '@/lib/format';
import { cx } from '@/lib/classNames';

interface Props {
  matrix: readonly MatrixRow[];
  tag: string;
}

/**
 * Matriz durabilidad x armadura. Es la tabla que responde de un vistazo
 * «cuánto pierde esta arma contra AV4» y «cuánto contra 80% durable».
 */
export function ArmorDurabilityMatrix({ matrix, tag }: Props) {
  const header = matrix[0]?.cells ?? [];

  return (
    <Panel title="Matriz armadura × durabilidad" tag={tag} flush>
      <p className="panel__lede">
        Daño final del perfil seleccionado contra cada combinación. Celda apagada = rebote.
      </p>
      <div className="table-scroll">
        <table className="data-table matrix">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Durabilidad</th>
              {header.map((cell) => (
                <th key={cell.av} style={{ textAlign: 'center' }}>
                  AV {cell.av}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.durabilityPercent}>
                <td style={{ textAlign: 'left' }}>{row.durabilityPercent}%</td>
                {row.cells.map((cell) => (
                  <td
                    key={cell.av}
                    style={{ textAlign: 'center' }}
                    className={cx(
                      cell.multiplier === 0 && 'matrix__cell--zero',
                      cell.multiplier === 1 && 'matrix__cell--full',
                      cell.multiplier > 0 && cell.multiplier < 1 && 'matrix__cell--partial',
                    )}
                  >
                    {cell.multiplier === 0 ? '—' : formatNumber(cell.damage)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
