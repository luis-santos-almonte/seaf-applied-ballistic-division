import type { PenetrationVerdict } from '@/domain/types';
import { VERDICT_DETAIL, VERDICT_LABEL } from '@/domain/constants';
import { formatNumber } from '@/lib/format';
import { cx } from '@/lib/classNames';

const TONE: Record<PenetrationVerdict, string> = {
  PENETRATED: 'stamp--red',
  EQUAL: 'stamp--white',
  RICOCHET: 'stamp--none',
};

interface Props {
  verdict: PenetrationVerdict;
  damage: number;
  /** Perdigones que conectan, si el ataque los tiene (escopetas). 1 o undefined = un solo proyectil. */
  pelletsHitting?: number;
  /** Componentes además del proyectil que ya están sumados en `damage` (ej. ["explosión", "metralla"]). */
  extra: string[];
}

/**
 * Elemento firma de la página: el sello de penetración.
 * Reproduce la semántica de los hitmarkers del juego, que es la señal que el
 * jugador ya sabe leer en pantalla.
 */
export function VerdictStamp({ verdict, damage, pelletsHitting, extra }: Props) {
  const base = pelletsHitting && pelletsHitting > 1 ? `${pelletsHitting} perdigones` : 'proyectil';
  const showBreakdown = extra.length > 0 || (pelletsHitting !== undefined && pelletsHitting > 1);

  return (
    <div className="verdict">
      <div className={cx('stamp', TONE[verdict])}>
        {VERDICT_LABEL[verdict]}
        <small>{VERDICT_DETAIL[verdict]}</small>
      </div>
      <div className="verdict__figure">
        <b>{formatNumber(damage)}</b>
        <span>
          daño a la parte por impacto{showBreakdown ? ` (${[base, ...extra].join(' + ')})` : ''}
        </span>
      </div>
    </div>
  );
}
