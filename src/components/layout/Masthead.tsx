import { rules } from '@/data/catalog';

export function Masthead() {
  return (
    <header className="masthead">
      <h1 className="masthead__mark">
        HD2 <span>Damage</span> Lab
      </h1>
      <div className="masthead__meta">
        <div>parche {rules.gameVersion}</div>
        <div>datos verificados {rules.referenceDate}</div>
      </div>
    </header>
  );
}
