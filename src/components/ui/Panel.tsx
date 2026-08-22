import type { ReactNode } from 'react';
import { cx } from '@/lib/classNames';

interface PanelProps {
  title: string;
  /** Etiqueta corta a la derecha del título: contexto, no decoración. */
  tag?: string;
  children: ReactNode;
  /** El contenido ya trae su propio padding (tablas, listas a sangre). */
  flush?: boolean;
  className?: string;
}

/** Contenedor estándar. Todo bloque de la página es un Panel. */
export function Panel({ title, tag, children, flush = false, className }: PanelProps) {
  return (
    <section className={cx('panel', className)}>
      <h2 className="panel__title">
        <span>{title}</span>
        {tag && <span className="panel__tag">{tag}</span>}
      </h2>
      <div className={flush ? undefined : 'panel__body'}>{children}</div>
    </section>
  );
}
