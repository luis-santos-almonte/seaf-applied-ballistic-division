/** Concatena clases descartando falsy. Evita traer una dependencia por esto. */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
