import { catalogStats } from '@/data/catalog';

export function Footer() {
  const { enemies, parts, weapons, attackProfiles } = catalogStats;
  return (
    <footer className="footer">
      <span>
        {enemies} enemigos · {parts} partes · {weapons} armas · {attackProfiles} perfiles de ataque
      </span>
      <span>Proyecto de fans. Sin afiliación con Arrowhead Game Studios.</span>
    </footer>
  );
}
