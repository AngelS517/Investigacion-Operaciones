import ErrorBoundary from "./ErrorBoundary";
import { MODULES } from "../modules";

// Marco común de cada método: encabezado + el módulo correspondiente.
// El contenido real de cada método está en src/modules/<id>/.
export default function MethodPanel({ method }) {
  const Module = MODULES[method.id];

  return (
    <section
      className="panel method"
      role="tabpanel"
      id={`panel-${method.id}`}
      aria-labelledby={`tab-${method.id}`}
    >
      <div className="method__head">
        <div className="icon" aria-hidden="true">▦</div>
        <div>
          <h2>{method.title}</h2>
          <small>Investigación de Operaciones</small>
        </div>
      </div>

      <ErrorBoundary key={method.id} name={method.label}>
        <Module />
      </ErrorBoundary>
    </section>
  );
}