/** Tesis de la página: qué hace esta herramienta y qué no. */
export function Intro() {
  return (
    <p className="intro">
      No calcula <em>vida ÷ daño</em>. Reproduce el sistema real por partes: cada parte tiene su
      propia vida, armadura, durabilidad, resistencia a explosión y porcentaje de transferencia al{' '}
      <strong>Main HP</strong>. El proyectil y su explosión se resuelven como{' '}
      <strong>dos eventos independientes</strong>. Modelo <strong>LEVEL 2</strong> — mecánicas del
      juego, sin geometría ni caída por distancia.
    </p>
  );
}
