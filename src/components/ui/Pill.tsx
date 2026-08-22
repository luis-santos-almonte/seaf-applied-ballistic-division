import type { PenetrationVerdict } from '@/domain/types';
import { VERDICT_LABEL } from '@/domain/constants';
import { cx } from '@/lib/classNames';

type Tone = 'red' | 'white' | 'none' | 'amber' | 'ok';

export function Pill({ tone = 'none', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={cx('pill', `pill--${tone}`)}>{children}</span>;
}

const VERDICT_TONE: Record<PenetrationVerdict, Tone> = {
  PENETRATED: 'red',
  EQUAL: 'white',
  RICOCHET: 'none',
};

export function VerdictPill({ verdict }: { verdict: PenetrationVerdict }) {
  return <Pill tone={VERDICT_TONE[verdict]}>{VERDICT_LABEL[verdict]}</Pill>;
}

export function ConfidencePill({ confidence }: { confidence: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  const tone: Tone = confidence === 'HIGH' ? 'ok' : confidence === 'MEDIUM' ? 'amber' : 'red';
  return <Pill tone={tone}>{confidence}</Pill>;
}
