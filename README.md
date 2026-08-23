# SEAF Applied Ballistics Division 🪖

Calculadora de daño por partes para **HELLDIVERS 2**, hecha porque me cansé de que la respuesta a
"¿este arma mata al Charger?" siempre fuera un `vida ÷ daño` que ignora armadura, durabilidad y
transferencia a Main HP. Este proyecto reproduce el sistema de daño real del juego: cada parte del
enemigo tiene su propia vida, su propia armadura, su propia resistencia a explosión y su propio
porcentaje de transferencia — y el proyectil y su explosión cuentan como **dos eventos de daño
independientes**.

Es un proyecto personal, hecho para mi propio uso jugando con la comunidad de Helldivers 2, y lo
subo por si le sirve a alguien más.

> Sin afiliación con Arrowhead Game Studios. Los datos vienen de datamining de la comunidad
> (Arrowhead no publica estos números), así que tómalos como un modelo, no como una medición oficial
> del juego.

---

## ¿Qué hace?

- **Calcula el daño real de un disparo**, parte por parte, aplicando durabilidad, penetración de
  armadura por ángulo, redondeo, ExDR (resistencia a explosión) y transferencia a Main HP.
- **Simula una ráfaga completa** disparo a disparo: cuántos impactos necesitas, cuándo recargas y
  el TTK (time-to-kill) resultante.
- **Compara puntos de impacto**: te dice cuál parte conviene disparar según arma y objetivo.
- **Explica el resultado paso a paso**, no solo el número final — para poder discutir con alguien
  que no te cree.
- **Audita las fuentes de los datos**: cada arma y enemigo tiene su URL, fecha de verificación y
  nivel de confianza, y si dos fuentes se contradicen, la app te muestra el conflicto en vez de
  elegir en silencio.
- Todo el catálogo de armas y enemigos vive en JSON versionado, así que agregar contenido nuevo
  después de cada parche es crear un archivo, no tocar código.

## Capturas

*(pendiente — agrego capturas cuando tenga el catálogo más lleno)*

## Stack

- **React 18 + TypeScript** (strict) para la interfaz.
- **Vite** como bundler y servidor de desarrollo.
- **Zod** valida todo el catálogo de datos al importarse — un dato mal formado revienta el build
  con la ruta del archivo culpable, no llega en silencio a producción.
- **Vitest** para las pruebas del motor de cálculo.
- Desplegado en **Vercel** directo desde este repo.

## Cómo correrlo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # suite de pruebas del motor
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle a dist/
```

## Estructura del proyecto

```
data/                        catálogo editable a mano, un archivo por entidad
  rules.json                 constantes del modelo (multiplicadores, redondeo, explosiones)
  weapons/<arma>.json
  enemies/<facción>/<enemigo>.json

src/
  domain/                    tipos y esquemas Zod — fuente única de verdad
  engine/                    motor de cálculo puro (sin React, sin DOM, sin fetch)
  data/catalog.ts            carga y valida los JSON, expone consultas
  hooks/                     estado del escenario + resultados derivados
  components/                UI: consola de entrada, recibo de salida, tablas, layout
  lib/                       formateo y utilidades

tests/                       pruebas del motor por módulo + humo de la UI
```

El motor (`src/engine/`) no sabe que existe una interfaz: no importa React ni toca el DOM, así que
en teoría se podría reusar desde un script de Node para generar reportes. Los componentes no
calculan nada, todo llega ya resuelto desde `useScenario`.

## El modelo, en corto

1. **Durabilidad** — mezcla el daño estándar y el durable según el % de durabilidad de la parte.
2. **Penetración de armadura** — 100% de daño si tu AP supera el AV de la parte, 65% si empatan,
   0% (ricochet) si tu AP es menor. Cada arma tiene 4 valores de AP según el ángulo de impacto.
3. **Redondeo** — trunca hacia abajo, una sola vez al final.
4. **ExDR** — reduce el daño de explosión según la resistencia de la parte; con 100% de ExDR el
   daño se redirige a Main HP si la explosión tiene AP suficiente.
5. **Transferencia a Main** — cada parte transfiere un % del daño recibido a la vida principal
   (puede ser más de 100%), con o sin tope de overflow según el enemigo.
6. **TTK** — cuenta disparos, cadencia y tiempos de recarga.

Lo que **no** modela, a propósito: ángulos reales contra la geometría 3D del enemigo, caída de daño
por distancia, dispersión real de metralla, sobrepenetración encadenada, movimiento del objetivo.
Es un modelo de las reglas del juego, no una simulación física.

## Agregar contenido

**Arma nueva:** creas `data/weapons/<id>.json` siguiendo `weaponSchema` en `src/domain/schemas.ts`.

**Enemigo nuevo:** creas `data/enemies/<facción>/<id>.json` copiando la tabla *Anatomy* de la wiki
de Helldivers. Si un dato no se puede verificar, se deja en `null` con `"confidence": "LOW"` en vez
de inventar un número.

Después de tocar cualquier JSON: `npm test` — las pruebas de `tests/catalog.test.ts` atrapan ids
duplicados, referencias rotas a partes que no existen y fuentes sin fecha.

## Estado actual

| | |
|---|---|
| Armas | 117 (52 primarias · 18 secundarias · 33 de soporte · 14 granadas) |
| Enemigos | 2 (Devastator, Charger) |
| Pruebas | 43 |
| Conflictos de fuentes registrados | 9 |

El roster de armas manejadas por el jugador está completo a la fecha de verificación. Falta el
resto del bestiario (Terminids, Automatons, Illuminate).

## Roadmap

- [x] Catálogo completo de armas del jugador (primarias, secundarias, soporte, granadas)
- [ ] Resto del roster de enemigos (Terminids, Automatons, Illuminate)
- [ ] Comparador de varias armas contra un mismo objetivo
- [ ] Sobrepenetración encadenada
- [ ] Permalinks con el escenario codificado en la URL
- [ ] Exportar resultados a Excel/CSV

## Fuentes

- Sistema de daño, penetración, durabilidad, ExDR, overflow: <https://helldivers.wiki.gg/wiki/Damage>
- AC-8 Autocannon: <https://helldivers.wiki.gg/wiki/AC-8_Autocannon>
- Devastator: <https://helldivers.wiki.gg/wiki/Devastator>
- Charger: <https://helldivers.wiki.gg/wiki/Charger>

---

Hecho por mí, para el escuadrón. Si encontrás un número mal o tenés datos de un arma/enemigo que
falta, abrí un issue o un PR.
