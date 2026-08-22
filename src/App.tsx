import { useScenario } from '@/hooks/useScenario';
import { Masthead } from '@/components/layout/Masthead';
import { Intro } from '@/components/layout/Intro';
import { Footer } from '@/components/layout/Footer';
import { SourceAudit } from '@/components/layout/SourceAudit';
import { FireConsole } from '@/components/console/FireConsole';
import { DamageReceipt } from '@/components/receipt/DamageReceipt';
import { TargetRanking } from '@/components/tables/TargetRanking';
import { ShotLedger } from '@/components/tables/ShotLedger';
import { ArmorDurabilityMatrix } from '@/components/tables/ArmorDurabilityMatrix';
import { FlakBreakdown } from '@/components/tables/FlakBreakdown';
import { resolveAp } from '@/engine';

/**
 * Composición de la página. Un único `useScenario` sostiene el estado y todos
 * los resultados derivados; los componentes solo pintan.
 */
export default function App() {
  const scenario = useScenario();
  const { effectiveAttack, enemy, state, dispatch, simulation, ranking, matrix, flak } = scenario;

  return (
    <>
      <div className="hazard-strip" aria-hidden="true" />
      <div className="page">
        <Masthead />
        <Intro />

        <div className="page__split">
          <FireConsole scenario={scenario} />
          <DamageReceipt scenario={scenario} />
        </div>

        <TargetRanking ranking={ranking} tag={`${enemy.name} · ${effectiveAttack.label}`} />

        <ShotLedger ledger={simulation.ledger} />

        <ArmorDurabilityMatrix
          matrix={matrix}
          tag={`${effectiveAttack.label} · AP ${resolveAp(effectiveAttack, state.angle)}`}
        />

        {flak && (
          <FlakBreakdown
            flak={flak}
            partName={scenario.part.name}
            onFragmentsChange={(count) => dispatch({ type: 'setFlakFragments', count })}
          />
        )}

        <SourceAudit />
        <Footer />
      </div>
    </>
  );
}
