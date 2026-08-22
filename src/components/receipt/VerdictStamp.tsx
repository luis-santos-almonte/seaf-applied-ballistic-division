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
  combined: boolean;
}

/**
 * Elemento firma de la página: el sello de penetración.
 * Reproduce la semántica de los hitmarkers del juego, que es la señal que el
 * jugador ya sabe leer en pantalla.
 */
export function VerdictStamp({ verdict, damage, combined }: Props) {
  return (
    <div className="verdict">
      <div className={cx('stamp', TONE[verdict])}>
        {VERDICT_LABEL[verdict]}
        <small>{VERDICT_DETAIL[verdict]}</small>
      </div>
      <div className="verdict__figure">
        <b>{formatNumber(damage)}</b>
        <span>
          daño a la parte por impacto{combined ? ' (proyectil + explosión)' : ''}
        </span>
      </div>
    </div>
  );
}
