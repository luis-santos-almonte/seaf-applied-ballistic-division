import { useState } from 'react';
import { useScenario } from '@/hooks/useScenario';
import { Masthead } from '@/components/layout/Masthead';
import { Footer } from '@/components/layout/Footer';
import { FireConsole } from '@/components/console/FireConsole';
import { DamageReceipt } from '@/components/receipt/DamageReceipt';
import { TargetRanking } from '@/components/tables/TargetRanking';
import { ShotLedger } from '@/components/tables/ShotLedger';
import { ArmorDurabilityMatrix } from '@/components/tables/ArmorDurabilityMatrix';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Guide } from '@/components/guide/Guide';
import { resolveAp } from '@/engine';

const TABS: readonly TabItem[] = [
  { id: 'calculator', label: 'Calculadora' },
  { id: 'guide', label: 'Guía' },
];

/**
 * Composición de la página. Un único `useScenario` sostiene el estado y todos
 * los resultados derivados; los componentes solo pintan.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const scenario = useScenario();
  const { fireMode, effectiveAttack, enemy, state, simulation, ranking, matrix } = scenario;

  return (
    <>
      <div className="hazard-strip" aria-hidden="true" />
      <div className="page">
        <Masthead />
        <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

        {activeTab === 'calculator' && (
          <>
            <div className="page__split">
              <FireConsole scenario={scenario} />
              <DamageReceipt scenario={scenario} />
            </div>

            <TargetRanking ranking={ranking} tag={`${enemy.name} · ${fireMode.label}`} />

            <ShotLedger ledger={simulation.ledger} />

            <ArmorDurabilityMatrix
              matrix={matrix}
              tag={`${fireMode.label} · AP ${resolveAp(effectiveAttack, state.angle)}`}
            />
          </>
        )}

        {activeTab === 'guide' && <Guide />}

        <Footer />
      </div>
    </>
  );
}
