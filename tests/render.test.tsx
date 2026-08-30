import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '@/App';

/**
 * Prueba de humo de la interfaz: si algún componente rompe al montarse, o si
 * el catálogo no valida, esto falla antes de llegar al despliegue.
 */
describe('render de la aplicación', () => {
  const html = renderToString(<App />);

  it('monta sin lanzar', () => {
    expect(html.length).toBeGreaterThan(1000);
  });

  it('muestra el recibo con el veredicto de penetración', () => {
    expect(html).toContain('Recibo de disparo');
    expect(html).toContain('Penetra');
  });

  it('muestra el comparador y la matriz', () => {
    expect(html).toContain('Dónde disparar');
    expect(html).toContain('Matriz armadura');
  });

  it('no muestra el panel de FLAK con el arma por defecto (Liberator, sin metralla)', () => {
    expect(html).not.toContain('máximo teórico');
  });
});
