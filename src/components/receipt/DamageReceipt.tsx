import type { ResolvedScenario } from '@/hooks/useScenario';
import { CAUSE_MESSAGE } from '@/domain/constants';
import { Panel } from '@/components/ui/Panel';
import { VerdictStamp } from './VerdictStamp';
import { StepList } from './StepList';
import { OutcomeStats } from './OutcomeStats';
import { ShrapnelSection } from './ShrapnelSection';
import { PelletSection } from './PelletSection';

/** Panel de salida: la derivación completa de un impacto, paso a paso. */
export function DamageReceipt({ scenario }: { scenario: ResolvedScenario }) {
  const { simulation, steps, fireMode, enemy, part, effectiveEnemy } = scenario;

  const plate = part.requiresBroken
    ? effectiveEnemy.parts.find((p) => p.id === part.requiresBroken)
    : null;

  const extra: string[] = [];
  if ((simulation.explosion?.finalDamage ?? 0) > 0) extra.push('explosión');
  if (simulation.shrapnel) extra.push('metralla');

  return (
    <Panel title="Recibo de disparo" tag={`${fireMode.label} → ${enemy.name} / ${part.name}`} flush>
      <VerdictStamp
        verdict={simulation.projectile.verdict}
        damage={simulation.damagePerShotToPart}
        pelletsHitting={simulation.pellets?.hitting}
        extra={extra}
      />

      <StepList steps={steps} />
      <OutcomeStats simulation={simulation} />
      {simulation.pellets && <PelletSection simulation={simulation} partName={part.name} />}
      {simulation.shrapnel && <ShrapnelSection simulation={simulation} partName={part.name} />}

      <p className="receipt__note">
        <strong>{simulation.killed ? 'Muere.' : 'Atención.'}</strong> {CAUSE_MESSAGE[simulation.cause]}
        {plate && (
          <>
            {' '}
            Esta parte está debajo de <strong>{plate.name}</strong>: hay que romper esa placa primero
            y su daño sobrante no pasa a través.
          </>
        )}
      </p>
    </Panel>
  );
}
