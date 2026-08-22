import type { DerivationStep } from '@/engine';
import { cx } from '@/lib/classNames';

/**
 * La numeración aquí no es decorativa: los pasos son una secuencia real y el
 * orden cambia el resultado (la armadura se aplica después de la durabilidad,
 * el redondeo después de la armadura).
 */
export function StepList({ steps }: { steps: readonly DerivationStep[] }) {
  return (
    <ol className="steps">
      {steps.map((step) => (
        <li key={step.key} className={cx(step.muted && 'is-muted')}>
          <div className="steps__label">{step.label}</div>
          <div className="steps__math">{step.math}</div>
          {step.note && <div className="steps__note">{step.note}</div>}
        </li>
      ))}
    </ol>
  );
}
