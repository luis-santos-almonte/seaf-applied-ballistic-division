import { Panel } from '@/components/ui/Panel';

interface GlossaryEntry {
  term: string;
  definition: string;
}

const GLOSSARY: readonly GlossaryEntry[] = [
  {
    term: 'Main HP',
    definition:
      'La vida principal del enemigo. Hay que llegarle a cero (o destruir su parte fatal) para matarlo. Muchas partes no tienen vida propia: todo el daño que reciben pasa directo a Main.',
  },
  {
    term: 'AV (Armor Value)',
    definition:
      'El nivel de armadura de una parte, en una escala de 0 a 11. Se compara contra el AP del arma para decidir si el disparo penetra.',
  },
  {
    term: 'AP (Armor Penetration)',
    definition:
      'La capacidad de penetración del arma contra esa parte. Un arma declara hasta cuatro valores de AP distintos, uno por rango de ángulo de impacto: golpear de frente penetra más que golpear de costado.',
  },
  {
    term: 'Durabilidad',
    definition:
      'El porcentaje de la vida de una parte que se calcula con el valor "durable" del arma en vez del "standard". Una parte con 30% de durabilidad reparte el impacto: 70% de daño standard y 30% de daño durable.',
  },
  {
    term: 'ExDR (resistencia a explosión)',
    definition:
      'Cuánto reduce una parte el daño que recibe de explosiones. Con 100% de ExDR la parte es inmune a explosiones, y ese daño puede redirigirse a Main HP en vez de perderse.',
  },
  {
    term: '% a Main',
    definition:
      'Qué porcentaje del daño que recibe una parte se transfiere también a la vida principal del enemigo. Puede superar el 100%: la carne interior del Charger, por ejemplo, transfiere el triple.',
  },
  {
    term: 'Overflow cap',
    definition:
      'Si está activo, el total transferido a Main desde una parte no puede superar su vida más su constitution. Si no está activo, el excedente se transfiere completo.',
  },
  {
    term: 'Constitution',
    definition:
      'Un colchón de vida adicional que algunas partes usan únicamente para calcular el tope de overflow. No se puede dañar de forma directa.',
  },
  {
    term: 'TTK (time to kill)',
    definition:
      'El tiempo real, en segundos, que toma matar al objetivo con un arma puntual, contando cadencia de disparo y recargas.',
  },
  {
    term: 'DPS',
    definition:
      'Daño por segundo. El "bruto" ignora recargas; el "sostenido" las incluye y por eso es siempre menor o igual.',
  },
  {
    term: 'Hitmarker',
    definition:
      'La señal visual del juego al impactar. Rojo: el disparo penetra al 100%. Blanco: penetra al 65%, porque el AP del arma iguala el AV de la parte. Sin marca (ricochet): el disparo rebota sin hacer daño.',
  },
  {
    term: 'FLAK',
    definition:
      'Metralla: en vez de un solo proyectil, el arma reparte muchos fragmentos pequeños. El máximo teórico (todos los fragmentos impactando la misma parte) casi nunca ocurre contra un blanco único, porque la metralla se dispersa.',
  },
];

export function Guide() {
  return (
    <div className="guide">
      <p className="guide__lede">
        Esta calculadora no reduce el combate a <em>vida ÷ daño</em>. Cada parte de un enemigo
        tiene su propia vida, su propia armadura y su propia forma de repartir el daño hacia la
        vida principal, y un proyectil y la explosión que dispara se resuelven como dos golpes
        separados, cada uno con su propia armadura y su propia resistencia. Esta pestaña explica
        los términos que vas a ver en la consola y el recibo, y el orden exacto en que se aplican.
      </p>

      <Panel title="Vocabulario del juego" tag="guía">
        <dl>
          {GLOSSARY.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.definition}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Cómo se calcula un impacto, paso a paso" tag="guía">
        <ol className="steps">
          <li>
            <div className="steps__label">Durabilidad</div>
            <div className="steps__math">
              daño = standard × (1 − durabilidad) + durable × durabilidad
            </div>
            <div className="steps__note">
              Mezcla los dos valores de daño del arma según qué tan durable es la parte. Las
              explosiones no siguen esta regla: siempre aplican su valor durable completo.
            </div>
          </li>
          <li>
            <div className="steps__label">Penetración de armadura</div>
            <div className="steps__note">
              Se compara el AP del arma contra el AV de la parte. Si el AP es mayor, el disparo
              penetra al 100%. Si son iguales, penetra al 65%. Si el AP es menor, el disparo
              rebota y no hace daño.
            </div>
          </li>
          <li>
            <div className="steps__label">Redondeo</div>
            <div className="steps__note">
              El juego trunca el resultado hacia abajo, una sola vez, al final de la cuenta. No
              redondea en pasos intermedios.
            </div>
          </li>
          <li>
            <div className="steps__label">Resistencia a explosión (ExDR)</div>
            <div className="steps__math">daño a la parte = daño × (1 − ExDR)</div>
            <div className="steps__note">
              Solo aplica al daño de explosión. Si la parte tiene 100% de ExDR, ese daño no le
              hace nada y en cambio se redirige a Main HP, siempre que el AP de la explosión
              alcance el AV de Main.
            </div>
          </li>
          <li>
            <div className="steps__label">Transferencia a Main HP</div>
            <div className="steps__math">daño a Main = daño a la parte × % a Main</div>
            <div className="steps__note">
              Puede pasar de 100%. Si la parte tiene overflow cap activado, el total transferido
              en toda la simulación no supera su vida más su constitution; si no lo tiene, el
              excedente pasa entero.
            </div>
          </li>
          <li>
            <div className="steps__label">Muerte</div>
            <div className="steps__note">
              El enemigo muere cuando Main HP llega a cero, o cuando se destruye una parte
              marcada como fatal. Destruir una parte que no es fatal no mata al enemigo: hay que
              seguir disparando, a esa parte o a otra.
            </div>
          </li>
          <li>
            <div className="steps__label">TTK</div>
            <div className="steps__math">
              t = (disparos − 1) × 60 / RPM + recargas × tiempo de recarga
            </div>
            <div className="steps__note">
              El primer disparo ocurre en t = 0. El resultado es teórico: cadencia perfecta, sin
              tiempo de apuntado ni de movimiento.
            </div>
          </li>
        </ol>
      </Panel>

      <Panel title="Qué no simula este modelo" tag="guía">
        <p className="guide__scope">
          Los números son un modelo de las reglas de daño del juego, no una medición hecha dentro
          del juego. A propósito, quedan fuera de alcance:
        </p>
        <ul className="sources">
          <li>
            La geometría real del enemigo: el ángulo de impacto se elige a mano, no se calcula
            según por dónde entraría la bala en un modelo 3D.
          </li>
          <li>La caída de daño por distancia.</li>
          <li>
            La dispersión real de la metralla: el desglose de FLAK estima cuántos fragmentos
            conectan, no simula su trayectoria.
          </li>
          <li>
            La sobrepenetración encadenada, cuando un disparo atraviesa una parte y sigue dañando
            la siguiente.
          </li>
          <li>La cancelación de recarga y el movimiento del objetivo durante el combate.</li>
          <li>El cronómetro de desangrado de los enemigos que lo tienen.</li>
        </ul>
      </Panel>
    </div>
  );
}
