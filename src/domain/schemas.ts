/**
 * Esquemas de datos.
 *
 * Fuente unica de verdad: los tipos de TypeScript se derivan de aqui con
 * `z.infer`, asi que no hay forma de que el tipo y la validacion se separen.
 * Cualquier JSON en `data/` se valida contra esto al arrancar; si algo esta
 * mal, falla ruidosamente en vez de producir numeros silenciosamente erroneos.
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Primitivas                                                          */
/* ------------------------------------------------------------------ */

/** Nivel de confianza en un dato. Nunca se omite. */
export const confidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

/** Estado de auditoria de un registro. */
export const verificationStatusSchema = z.enum(['verified', 'partially_verified', 'unverified']);

/** Valor de armadura o de penetracion: 0..11 en el juego. */
export const armorValueSchema = z.number().int().min(0).max(11);

/** Fraccion 0..1. Se guarda asi, nunca como porcentaje, para evitar ambiguedad. */
export const fractionSchema = z.number().min(0);

export const provenanceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  dateChecked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'usa formato YYYY-MM-DD'),
  confidence: confidenceSchema,
  status: verificationStatusSchema.default('verified'),
  /** Cuando dos fuentes se contradicen no se elige en silencio: se marca. */
  conflict: z.string().nullable().default(null),
});

/* ------------------------------------------------------------------ */
/* Armas                                                               */
/* ------------------------------------------------------------------ */

export const attackKindSchema = z.enum(['projectile', 'explosion']);

/**
 * AP por angulo de impacto. Un proyectil tiene cuatro valores
 * (directo / leve / grande / extremo); una explosion tiene uno solo.
 */
export const armorPenetrationSchema = z.union([
  armorValueSchema,
  z.tuple([armorValueSchema, armorValueSchema, armorValueSchema, armorValueSchema]),
]);

export const attackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  internalName: z.string().nullable().default(null),
  kind: attackKindSchema,

  standard: z.number().nonnegative(),
  /** Si falta, se asume igual al standard (caso tipico de explosiones). */
  durable: z.number().nonnegative().nullable().default(null),
  ap: armorPenetrationSchema,

  /** id del ataque de explosion que dispara este proyectil al impactar. */
  triggersExplosion: z.string().nullable().default(null),

  radiusInner: z.number().nonnegative().nullable().default(null),
  radiusOuter: z.number().nonnegative().nullable().default(null),
  radiusShockwave: z.number().nonnegative().nullable().default(null),

  shrapnel: z
    .object({ count: z.number().int().positive(), attackId: z.string() })
    .nullable()
    .default(null),

  demolition: z.number().nullable().default(null),
  stagger: z.number().nullable().default(null),
  push: z.number().nullable().default(null),

  confidence: confidenceSchema,
  notes: z.string().nullable().default(null),
});

export const reloadSchema = z.object({
  clipSize: z.number().int().positive().nullable().default(null),
  partial: z.number().nonnegative().nullable().default(null),
  full: z.number().nonnegative(),
  confidence: confidenceSchema,
  notes: z.string().nullable().default(null),
});

export const changeEntrySchema = z.object({
  patch: z.string(),
  date: z.string(),
  field: z.string(),
  from: z.union([z.string(), z.number()]).nullable(),
  to: z.union([z.string(), z.number()]).nullable(),
  note: z.string().nullable().default(null),
});

export const weaponSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string(),
  rpm: z.number().positive(),
  magazine: z.number().int().positive(),
  reload: reloadSchema,
  attacks: z.array(attackSchema).min(1),
  source: provenanceSchema,
  history: z.array(changeEntrySchema).default([]),
});

/* ------------------------------------------------------------------ */
/* Enemigos                                                            */
/* ------------------------------------------------------------------ */

export const factionSchema = z.enum(['TERMINIDS', 'AUTOMATONS', 'ILLUMINATE']);
export const sizeClassSchema = z.enum(['small', 'medium', 'large', 'heavy', 'boss', 'structure']);

export const enemyPartSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Cuantas copias tiene el enemigo. Cada copia tiene su propia vida. */
  count: z.number().int().positive().default(1),

  /** `null` + hpIsMain=true cuando la wiki dice "Main" en la columna Health. */
  hp: z.number().positive().nullable(),
  hpIsMain: z.boolean().default(false),

  av: armorValueSchema,
  durability: fractionSchema.max(1),
  toMain: fractionSchema,
  overflowCap: z.boolean(),

  constitution: z.number().positive().nullable().default(null),
  constitutionDecay: z.number().nonnegative().nullable().default(null),

  fatal: z.boolean(),
  fatalNote: z.string().nullable().default(null),
  exdr: fractionSchema.max(1),

  /** Placa rompible: no deja pasar el exceso a lo que hay debajo. */
  breakablePlating: z.boolean().default(false),
  /** id de la parte que esta placa protege. */
  protects: z.string().nullable().default(null),
  /** id de la placa que hay que romper para poder tocar esta parte. */
  requiresBroken: z.string().nullable().default(null),

  notes: z.string().nullable().default(null),
});

export const mainBodySchema = z.object({
  hp: z.number().positive(),
  av: armorValueSchema,
  durability: fractionSchema.max(1),
  exdr: fractionSchema.max(1),
  constitution: z.number().positive().nullable().default(null),
  constitutionDecay: z.number().nonnegative().nullable().default(null),
});

export const enemySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    faction: factionSchema,
    size: sizeClassSchema,
    fireDamageMultiplier: z.number().positive().nullable().default(null),
    staggerThreshold: z.number().nonnegative().nullable().default(null),
    main: mainBodySchema,
    parts: z.array(enemyPartSchema).min(1),
    source: provenanceSchema,
  })
  .superRefine((enemy, ctx) => {
    const ids = new Set(enemy.parts.map((p) => p.id));

    for (const part of enemy.parts) {
      if (part.hp === null && !part.hpIsMain) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${enemy.id}/${part.id}: hp es null pero hpIsMain es false. Una parte necesita vida propia o transferir todo a Main.`,
        });
      }
      for (const ref of [part.protects, part.requiresBroken]) {
        if (ref && !ids.has(ref)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${enemy.id}/${part.id}: referencia a la parte inexistente "${ref}".`,
          });
        }
      }
    }
  });

/* ------------------------------------------------------------------ */
/* Reglas del modelo                                                   */
/* ------------------------------------------------------------------ */

export const roundingModeSchema = z.enum(['floor', 'round', 'ceil', 'none']);

export const rulesSchema = z.object({
  referenceDate: z.string(),
  gameVersion: z.string(),
  armorPenetration: z.object({
    greater: z.number(),
    equal: z.number(),
    lesser: z.number(),
    source: provenanceSchema,
  }),
  rounding: z.object({
    mode: roundingModeSchema,
    source: provenanceSchema,
  }),
  explosion: z.object({
    ignoresDurability: z.boolean(),
    outerRadiusApPenalty: z.number(),
    outerRadiusApFloor: z.number(),
    source: provenanceSchema,
  }),
  angleBuckets: z
    .array(z.object({ id: z.string(), label: z.string(), range: z.string() }))
    .length(4),
});
