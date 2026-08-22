import type { ReactNode } from 'react';

/** Aviso enmarcado. Se usa para advertencias del modelo, no para decorar. */
export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}
