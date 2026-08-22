import type { ResolvedScenario } from '@/hooks/useScenario';
import { Panel } from '@/components/ui/Panel';
import { WeaponFields } from './WeaponFields';
import { TargetFields } from './TargetFields';
import { FiringFields } from './FiringFields';

/** Panel de entrada. Compone los tres grupos de campos; no calcula nada. */
export function FireConsole({ scenario }: { scenario: ResolvedScenario }) {
  return (
    <Panel title="Consola de tiro" tag="entrada">
      <WeaponFields scenario={scenario} />
      <hr className="rule" />
      <TargetFields scenario={scenario} />
      <hr className="rule" />
      <FiringFields scenario={scenario} />

      <button
        type="button"
        className="button button--ghost"
        onClick={() => scenario.dispatch({ type: 'clearOverrides' })}
      >
        Restablecer valores del catálogo
      </button>
    </Panel>
  );
}
