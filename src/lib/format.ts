/** Formateo para presentacion. Nada de esto pertenece al motor de calculo. */

const decimal = new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 });

export const formatNumber = (value: number): string =>
  Number.isFinite(value) ? decimal.format(value) : '—';

export const formatInteger = (value: number): string =>
  Number.isFinite(value) ? String(value) : '—';

export const formatPercent = (fraction: number): string => `${decimal.format(fraction * 100)}%`;

export const formatSeconds = (value: number): string =>
  Number.isFinite(value) ? `${decimal.format(value)} s` : '—';

/** Convierte 0..1 a 0..100 para los inputs, y de vuelta. */
export const toPercentInput = (fraction: number): number => Math.round(fraction * 1000) / 10;
export const fromPercentInput = (percent: number): number => percent / 100;
