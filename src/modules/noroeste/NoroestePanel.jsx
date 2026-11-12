import { useState } from "react";
import { esquinaNoroeste, marcas, limpiar } from "./noroeste";
import "./noroeste.css";

const EJEMPLO = {
  m: 3,
  n: 4,
  costs: [["8", "6", "10", "9"], ["9", "12", "13", "7"], ["14", "9", "16", "5"]],
  supply: ["35", "50", "40"],
  demand: ["45", "20", "30", "30"],
};

const VACIO = { m: 0, n: 0, costs: [], supply: [], demand: [] };

const fmt = (x) => x.toLocaleString("es-CO", { maximumFractionDigits: 4 });
const num = (v) => {
  const t = v.trim().replace(",", ".");
  return t !== "" && Number.isFinite(+t) && +t >= 0 ? +t : null;
};
const redim = (p, m, n) => ({
  m,
  n,
  costs: Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => p.costs[i]?.[j] ?? "")
  ),
  supply: Array.from({ length: m }, (_, i) => p.supply[i] ?? ""),
  demand: Array.from({ length: n }, (_, j) => p.demand[j] ?? ""),
});

function Campo({ value, onChange, label }) {
  return (
    <input
      className="noroeste-input"
      inputMode="decimal"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function NoroestePanel() {
  const [p, setP] = useState(EJEMPLO);
  const [res, setRes] = useState(null);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState("");

  const editar = (nuevo) => {
    setP(nuevo);
    setRes(null);
    setError("");
  };
  const setCosto = (i, j, v) =>
    editar({ ...p, costs: p.costs.map((r, a) => r.map((c, b) => (a === i && b === j ? v : c))) });
  const setLista = (k, i, v) => editar({ ...p, [k]: p[k].map((x, a) => (a === i ? v : x)) });

  const calcular = () => {
    const costs = p.costs.map((r) => r.map(num));
    const supply = p.supply.map(num);
    const demand = p.demand.map(num);
    if ([...costs.flat(), ...supply, ...demand].some((x) => x === null))
      return setError("Completa todas las casillas con números mayores o iguales a 0.");
    if (supply.every((x) => x === 0) || demand.every((x) => x === 0))
      return setError("La oferta y la demanda deben tener al menos un valor mayor que 0.");
    setRes(esquinaNoroeste(costs, supply, demand));
    setShown(0); // el recorrido empieza desde el primer paso
    setError("");
  };

  return (
    <div className="noroeste">
      <p className="noroeste-desc">
        El método de la esquina noroeste comienza en la primera celda de la tabla, donde se asigna la mayor cantidad posible teniendo en cuenta la oferta disponible y la demanda requerida. Después, se actualizan estos valores y se avanza hacia la siguiente celda, ya sea bajando de fila o avanzando de columna, dependiendo de cuál se haya completado. Este proceso se repite hasta satisfacer toda la demanda y distribuir toda la oferta.
      </p>
 
      <div className="noroeste-dims">
        <label>
          Orígenes
          <select value={p.m} onChange={(e) => editar(redim(p, +e.target.value, p.n))}>
            {[2, 3, 4, 5, 6].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label>
          Destinos
          <select value={p.n} onChange={(e) => editar(redim(p, p.m, +e.target.value))}>
            {[2, 3, 4, 5, 6].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <button type="button" className="btn noroeste-ghost" onClick={() => editar(EJEMPLO)}>
          Cargar ejemplo
        </button>
        <button type="button" className="btn noroeste-ghost" onClick={() => editar(redim(VACIO, p.m, p.n))}>
          Limpiar
        </button>
      </div>

      <div className="noroeste-scroll">
        <table className="noroeste-table">
          <caption>Costos unitarios, oferta y demanda</caption>
          <thead>
            <tr>
              <th />
              {p.demand.map((_, j) => <th key={j} scope="col">Destino {j + 1}</th>)}
              <th scope="col">Oferta</th>
            </tr>
          </thead>
          <tbody>
            {p.costs.map((fila, i) => (
              <tr key={i}>
                <th scope="row">Origen {i + 1}</th>
                {fila.map((c, j) => (
                  <td key={j}>
                    <Campo value={c} label={`Costo origen ${i + 1} a destino ${j + 1}`} onChange={(v) => setCosto(i, j, v)} />
                  </td>
                ))}
                <td className="noroeste-edge">
                  <Campo value={p.supply[i]} label={`Oferta del origen ${i + 1}`} onChange={(v) => setLista("supply", i, v)} />
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Demanda</th>
              {p.demand.map((d, j) => (
                <td key={j} className="noroeste-edge">
                  <Campo value={d} label={`Demanda del destino ${j + 1}`} onChange={(v) => setLista("demand", j, v)} />
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {error && <p className="noroeste-error" role="alert">{error}</p>}
      <button type="button" className="btn btn--primary noroeste-go" onClick={calcular}>
        Calcular
      </button>

      {res && <Resultado res={res} shown={shown} setShown={setShown} />}
    </div>
  );
}

function Resultado({ res, shown, setShown }) {
  const { problem: q, steps, raw, terms, total, degenerada } = res;
  const N = steps.length;
  const hechos = steps.slice(0, shown);
  const asignado = new Map(hechos.map((t) => [`${t.i},${t.j}`, t.qty]));
  const actual = shown > 0 ? steps[shown - 1] : null;
  const sig = shown < N ? steps[shown] : null;
  const tach = marcas(raw, steps, shown, q.m, q.n);

  const restoO = q.supply.map((s, i) => limpiar(s - hechos.filter((t) => t.i === i).reduce((a, t) => a + t.qty, 0)));
  const restoD = q.demand.map((d, j) => limpiar(d - hechos.filter((t) => t.j === j).reduce((a, t) => a + t.qty, 0)));
  const nombreO = (i) => (q.ficticio === "fila" && i === q.m - 1 ? "Ficticio" : `Origen ${i + 1}`);
  const nombreD = (j) => (q.ficticio === "col" && j === q.n - 1 ? "Ficticio" : `Destino ${j + 1}`);

  const porque = (t) => {
    if (shown === N) return "Ya no queda oferta ni demanda por repartir: el método termina aquí.";
    if (t.cierra === "fila")
      return `Se tacha la fila de ${nombreO(t.i)}: su oferta quedó en 0 y no puede enviar más. Se baja a ${nombreO(t.i + 1)}.`;
    if (t.cierra === "col")
      return `Se tacha la columna de ${nombreD(t.j)}: su demanda quedó cubierta (0) y no necesita más. Se avanza a ${nombreD(t.j + 1)}.`;
    return `La oferta de ${nombreO(t.i)} y la demanda de ${nombreD(t.j)} se agotan a la vez. Se tachan la fila y la columna: la celda tachada que sigue equivale a una asignación de 0 (solución degenerada).`;
  };

  return (
    <section className="noroeste-res" aria-live="polite">
      {q.ficticio && (
        <p className="noroeste-note">
          Oferta y demanda no coinciden: se agregó un {q.ficticio === "fila" ? "origen" : "destino"} ficticio
          con costo 0 para balancear el problema.
        </p>
      )}

      <div className="noroeste-scroll">
        <table className="noroeste-table noroeste-out">
          <caption>Asignación inicial</caption>
          <thead>
            <tr>
              <th />
              {q.demand.map((_, j) => (
                <th key={j} scope="col" className={tach.columnas.has(j) ? "is-struck" : ""}>{nombreD(j)}</th>
              ))}
              <th scope="col">Oferta</th>
            </tr>
          </thead>
          <tbody>
            {q.costs.map((fila, i) => (
              <tr key={i}>
                <th scope="row" className={tach.filas.has(i) ? "is-struck" : ""}>{nombreO(i)}</th>
                {fila.map((c, j) => {
                  const k = `${i},${j}`;
                  const corte = tach.celdas.get(k);
                  const cls = [
                    "noroeste-cell",
                    asignado.has(k) && "is-on",
                    actual && actual.i === i && actual.j === j && "is-now",
                    sig && sig.i === i && sig.j === j && "is-next",
                    corte !== undefined && "is-cut",
                    corte === shown && "is-new",
                  ].filter(Boolean).join(" ");
                  return (
                    <td key={j} className={cls}>
                      <span className="noroeste-cost">{fmt(c)}</span>
                      {asignado.has(k) && <b className="noroeste-qty">{fmt(asignado.get(k))}</b>}
                    </td>
                  );
                })}
                <td className="noroeste-edge">
                  {fmt(q.supply[i])}
                  <small>queda {fmt(restoO[i])}</small>
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Demanda</th>
              {q.demand.map((d, j) => (
                <td key={j} className="noroeste-edge">
                  {fmt(d)}
                  <small>queda {fmt(restoD[j])}</small>
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="noroeste-steps">
        <button type="button" className="btn noroeste-ghost" disabled={shown === 0} onClick={() => setShown(0)}>Reiniciar</button>
        <button type="button" className="btn noroeste-ghost" disabled={shown === 0} onClick={() => setShown(shown - 1)} aria-label="Paso anterior">‹</button>
        <input type="range" min="0" max={N} value={shown} onChange={(e) => setShown(+e.target.value)} aria-label="Paso del método" />
        <button type="button" className="btn noroeste-ghost" disabled={shown === N} onClick={() => setShown(shown + 1)} aria-label="Paso siguiente">›</button>
        <button type="button" className="btn noroeste-ghost" disabled={shown === N} onClick={() => setShown(N)}>Ver todo</button>
      </div>
      <p className="noroeste-count">{shown === 0 ? "Inicio" : `Paso ${shown} de ${N}`}</p>

      <div className="noroeste-info">
        {actual && (
          <article className="noroeste-card">
            <h4>Lo que se hizo</h4>
            <p>
              En {nombreO(actual.i)} → {nombreD(actual.j)} se asignaron <strong>{fmt(actual.qty)}</strong> unidades:
              el menor entre la oferta disponible ({fmt(actual.ofertaAntes)}) y la demanda pendiente ({fmt(actual.demandaAntes)}).
            </p>
            <p className="noroeste-why">{porque(actual)}</p>
          </article>
        )}
        {sig && (
          <article className="noroeste-card is-next">
            <h4>{shown === 0 ? "Cómo se empieza" : "Lo que sigue"}</h4>
            <p>
              {shown === 0 && "El método siempre arranca en la esquina noroeste, la celda de arriba a la izquierda. "}
              Se evalúa {nombreO(sig.i)} → {nombreD(sig.j)}: oferta disponible {fmt(sig.ofertaAntes)}, demanda pendiente {fmt(sig.demandaAntes)}.
              Se toma el menor: min({fmt(sig.ofertaAntes)}, {fmt(sig.demandaAntes)}) = <strong>{fmt(sig.qty)}</strong>.
            </p>
          </article>
        )}
      </div>

      {shown === N && (
        <div className="noroeste-total">
          <p className="noroeste-eq">
            Z = {terms.map((t) => `${fmt(t.qty)}×${fmt(t.costo)}`).join(" + ")} = <strong>{fmt(total)}</strong>
          </p>
          <p className="noroeste-note">
            {raw.length} variables básicas ({q.m} + {q.n} − 1).
            {degenerada && " Es degenerada: una variable básica vale 0 y se representa con las diagonales."}
          </p>
        </div>
      )}
    </section>
  );
}