# HD2 Damage Lab

Calculadora de daño por partes para **HELLDIVERS 2**. No es `vida ÷ daño`: reproduce el sistema
real donde cada parte del enemigo tiene su propia vida, armadura, durabilidad, resistencia a
explosión y porcentaje de transferencia al Main HP, y donde el proyectil y su explosión son
**dos eventos de daño independientes**.

React + TypeScript + Vite. Datos validados con Zod. Despliegue estático en Vercel.

- **Parche de referencia:** 1.007.001
- **Datos verificados:** 2026-08-21

---

## Arrancar

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # 43 pruebas
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + bundle a dist/
```

## Desplegar en Vercel

1. Sube el repo a GitHub.
2. Vercel → **Add New → Project → Import**.
3. No hay que configurar nada: el `vercel.json` declara preset `vite`, build `npm run build` y
   salida `dist`.

Cada `git push` redespliega. El build corre `tsc --noEmit` antes de empaquetar, así que un dato
mal formado o un tipo roto **falla el despliegue** en vez de llegar a producción.

---

## Arquitectura

```
data/                        datos editables a mano, un archivo por entidad
  rules.json                 constantes del modelo (multiplicadores, redondeo, explosiones)
  weapons/<arma>.json
  enemies/<facción>/<enemigo>.json

src/
  domain/                    el lenguaje del proyecto, sin lógica
    schemas.ts               esquemas Zod — fuente única de verdad
    types.ts                 tipos derivados con z.infer + tipos de resultado
    constants.ts             constantes que no cambian con los parches

  engine/                    motor de cálculo puro: sin React, sin DOM, sin fetch
    rounding.ts              política de redondeo
    durability.ts            paso 1 — mezcla standard/durable
    armor.ts                 paso 2 — penetración y buckets de ángulo
    hit.ts                   resolución de un evento de daño + bypass de explosión
    transfer.ts              paso 5 — transferencia a Main y tope de overflow
    firing.ts                cadencia, recargas, TTK, DPS
    simulate.ts              simulador disparo a disparo
    ranking.ts               comparador de puntos de impacto
    tables.ts                tabla de durabilidad y matriz armadura × durabilidad
    flak.ts                  desglose FLAK
    explain.ts               convierte una simulación en la derivación paso a paso
    index.ts                 superficie pública

  data/catalog.ts            carga los JSON, los valida y expone consultas
  hooks/
    scenarioReducer.ts       todas las transiciones de estado
    useScenario.ts           resuelve catálogo + overrides y deriva resultados
  components/
    ui/                      primitivas: Panel, Field, DataTable, Pill, Notice
    console/                 panel de entrada, dividido por grupo de campos
    receipt/                 panel de salida: sello, pasos, estadísticas
    tables/                  ranking, registro, matriz, FLAK
    layout/                  cabecera, intro, auditoría de fuentes, pie
  lib/                       formateo y utilidades de presentación
  styles/                    tokens + una hoja por área
```

Tres reglas que mantienen esto ordenado:

1. **El motor no sabe que existe una interfaz.** `src/engine/` no importa React ni toca el DOM.
   Se puede ejecutar tal cual desde un script de Node para generar Excel, CSV o reportes.
2. **Los componentes no calculan.** Todo se deriva en `useScenario` y llega ya resuelto.
3. **Los tipos salen del esquema.** No hay una interfaz escrita a mano que pueda desincronizarse
   del validador.

---

## Por qué los datos siguen en JSON

Porque los edita una persona copiando tablas de la wiki tras cada parche, y JSON da diffs
legibles en GitHub y cero fricción para editar. Lo que sí cambió respecto al primer borrador:

- **Un archivo por entidad**, no un JSON gigante. Agregar un enemigo es crear un archivo; el diff
  de un parche se lee de un vistazo y dos personas pueden trabajar sin conflictos de merge.
- **Se empaquetan en el bundle** con `import.meta.glob(..., { eager: true })`. No hay `fetch`, no
  hay CORS, no hay estado de carga, y el catálogo está disponible de forma síncrona.
- **Se validan con Zod al importarse.** Un `durability` de `70` en vez de `0.7`, una referencia a
  una parte que no existe o una fecha con formato raro revientan el build con la ruta del archivo
  culpable.

Lo que sí salió del JSON: las constantes que no cambian con los parches (`src/domain/constants.ts`)
y la lógica de explicación, que es código y necesita tipos.

---

## El modelo, paso a paso

**1 · Durabilidad** — `raw = standard × (1 − durability) + durable × durability`.
Las explosiones la ignoran: aplican su valor durable completo.

**2 · Penetración de armadura**

| Relación | Multiplicador | Hitmarker |
|---|---|---|
| AP > AV | 100 % | rojo |
| AP = AV | 65 % | blanco |
| AP < AV | 0 % | ricochet |

Cada proyectil declara **cuatro** valores de AP según el ángulo de impacto
(0–25° / 26–60° / 61–80° / 81–90°). Las explosiones usan uno solo, que baja en 1 (piso 2) en el
radio exterior.

**3 · Redondeo** — truncado hacia abajo, una sola vez al final. Verificado contra dos ejemplos
publicados. No está verificado si el juego trunca también en pasos intermedios; el selector
permite comparar.

**4 · ExDR** — `daño × (1 − ExDR)`. Con ExDR 100 % la parte es inmune y el daño se redirige a Main
(*Affected By Explosion*), una vez por explosión y solo si el AP de la explosión alcanza el AV de
Main.

**5 · Transferencia a Main** — `mainDamage = dañoALaParte × toMain`. Puede pasar de 100 %: la carne
interior del Charger transfiere 300 %. Con `overflowCap` el total transferido se limita a
`hp + constitution`; sin él, el exceso se transfiere entero.

**6 · Muerte** — Main a 0, o parte fatal destruida. Destruir una parte no fatal no mata: el
simulador se detiene y lo dice.

**7 · TTK** — `t = (disparos − 1) × 60/RPM + recargas × tiempoDeRecarga`, primer disparo en `t = 0`.

### Lo que NO modela

Modelo **LEVEL 2** (mecánicas del juego). Fuera de alcance a propósito: ángulos reales contra la
geometría del enemigo, caída de daño por distancia, dispersión real de la metralla, sobrepenetración
encadenada, cancelación de recarga, movimiento del objetivo, cronómetro del desangrado.

No presentes estos números como una medición del juego. Son un modelo.

---

## Agregar un arma

Crea `data/weapons/<id>.json`. El esquema está en `src/domain/schemas.ts` (`weaponSchema`) y el
editor te autocompleta si tienes el JSON schema activo.

```jsonc
{
  "id": "gl21-grenade-launcher",
  "name": "GL-21 Grenade Launcher",
  "category": "Support Weapon",
  "rpm": 60,
  "magazine": 6,
  "reload": { "clipSize": null, "partial": null, "full": 4.0, "confidence": "LOW", "notes": null },
  "source": {
    "name": "Helldivers Wiki — GL-21",
    "url": "https://helldivers.wiki.gg/wiki/GL-21_Grenade_Launcher",
    "dateChecked": "2026-08-21",
    "confidence": "HIGH",
    "status": "verified",
    "conflict": null
  },
  "attacks": [
    {
      "id": "grenade-projectile",
      "label": "Granada · proyectil",
      "kind": "projectile",
      "standard": 0,
      "durable": 0,
      "ap": [3, 3, 3, 0],
      "triggersExplosion": "grenade-explosion",
      "confidence": "HIGH"
    },
    {
      "id": "grenade-explosion",
      "label": "Granada · explosión",
      "kind": "explosion",
      "standard": 0,
      "durable": 0,
      "ap": 3,
      "confidence": "HIGH"
    }
  ]
}
```

## Agregar un enemigo

Crea `data/enemies/<facción>/<id>.json` y copia la tabla **Anatomy** de su página en la wiki. Las
columnas mapean una a una:

| Columna de la wiki | Campo JSON | Ojo |
|---|---|---|
| Health | `hp` | Si dice `Main`: `"hp": null, "hpIsMain": true` |
| AV | `av` | entero 0–11 |
| Durable | `durability` | **fracción 0–1**, no porcentaje: 30 % → `0.3` |
| % To Main | `toMain` | fracción; 300 % → `3.0` |
| Overflow Cap? | `overflowCap` | `Yes` → `true` |
| Constitution | `constitution` / `constitutionDecay` | `750 [100/s]` → `750` y `100` |
| Fatal? | `fatal` | |
| ExDR | `exdr` | fracción 0–1 |

Campos extra que la wiki no tiene en columna pero sí en el texto: `breakablePlating`, `protects`
(id de la parte que la placa cubre) y `requiresBroken` (id de la placa que hay que abrir primero).
Sin `requiresBroken`, el comparador recomienda partes imposibles de alcanzar.

Los campos opcionales se pueden omitir: el esquema les pone valor por defecto.

**Regla del proyecto:** si un valor no se puede verificar, va en `null` con
`"status": "unverified"` y `"confidence": "LOW"`. Una celda vacía es mejor que un número
inventado. Si dos fuentes se contradicen, rellena `conflict` con ambas versiones en vez de elegir
en silencio — la app muestra esos conflictos en el panel de auditoría.

Después de tocar cualquier JSON: `npm test`. Las pruebas de `tests/catalog.test.ts` atrapan ids
duplicados, referencias rotas y fuentes sin fecha.

---

## Cobertura actual

| | |
|---|---|
| Armas | 1 (AC-8 Autocannon) con 5 perfiles de ataque |
| Enemigos | 2 (Devastator, Charger) |
| Partes | 17 |
| Pruebas | 43 |
| Conflictos de fuentes registrados | 2 |

Solo se incluyen enemigos con la tabla de anatomía verificada entera. Mientras el catálogo crece,
todos los campos del objetivo son editables en la consola: puedes teclear cualquier combinación de
vida, armadura, durabilidad, % a Main y ExDR sin tocar archivos.

## Fuentes

- Sistema de daño, penetración, durabilidad, ExDR, overflow: <https://helldivers.wiki.gg/wiki/Damage>
- AC-8 Autocannon: <https://helldivers.wiki.gg/wiki/AC-8_Autocannon>
- Devastator: <https://helldivers.wiki.gg/wiki/Devastator>
- Charger: <https://helldivers.wiki.gg/wiki/Charger>

Los datos de la wiki vienen de datamining de la comunidad; Arrowhead no publica estos números.
Cada entrada lleva su URL, fecha de verificación y nivel de confianza.

## Roadmap

- [ ] Resto del roster (Terminids, Automatons, Illuminate)
- [ ] Más armas
- [ ] Exportar a Excel/CSV desde el motor en Node
- [ ] Comparador de varias armas contra un mismo objetivo
- [ ] Sobrepenetración encadenada
- [ ] Permalinks con el escenario codificado en la URL

Proyecto de fans. Sin afiliación con Arrowhead Game Studios.
