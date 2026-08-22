import type { ResolvedScenario } from '@/hooks/useScenario';
import { CAUSE_MESSAGE } from '@/domain/constants';
import { Panel } from '@/components/ui/Panel';
import { VerdictStamp } from './VerdictStamp';
import { StepList } from './StepList';
import { OutcomeStats } from './OutcomeStats';

/** Panel de salida: la derivación completa de un impacto, paso a paso. */
export function DamageReceipt({ scenario }: { scenario: ResolvedScenario }) {
  const { simulation, steps, effectiveAttack, enemy, part, effectiveEnemy } = scenario;

  const plate = part.requiresBroken
    ? effectiveEnemy.parts.find((p) => p.id === part.requiresBroken)
    : null;

  return (
    <Panel
      title="Recibo de disparo"
      tag={`${effectiveAttack.label} → ${enemy.name} / ${part.name}`}
      flush
    >
      <VerdictStamp
        verdict={simulation.projectile.verdict}
        damage={simulation.damagePerShotToPart}
        combined={(simulation.explosion?.finalDamage ?? 0) > 0}
      />

      <StepList steps={steps} />
      <OutcomeStats simulation={simulation} />

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
