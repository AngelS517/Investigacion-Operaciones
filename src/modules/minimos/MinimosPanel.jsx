import { useState } from "react";
import { costoMinimo, marcas, limpiar } from "./minimos";
import "./minimos.css";

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
      className="minimos-input"
      inputMode="decimal"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function MinimosPanel() {
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
    setRes(costoMinimo(costs, supply, demand));
    setShown(0); // el recorrido empieza desde el primer paso
    setError("");
  };

  return (
    <div className="minimos">
      <p className="minimos-desc">
        El método de costos mínimos comienza identificando la celda que tiene el menor costo en la tabla, donde se asigna la mayor cantidad posible teniendo en cuenta la oferta disponible y la demanda requerida. Después, se actualizan estos valores y se continúa seleccionando la siguiente celda con el menor costo disponible. Este proceso se repite hasta satisfacer toda la demanda y distribuir toda la oferta.
      </p>

      <div className="minimos-dims">
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
        <button type="button" className="btn minimos-ghost" onClick={() => editar(EJEMPLO)}>
          Cargar ejemplo
        </button>
        <button type="button" className="btn minimos-ghost" onClick={() => editar(redim(VACIO, p.m, p.n))}>
          Limpiar
        </button>
      </div>

      <div className="minimos-scroll">
        <table className="minimos-table">
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
                <td className="minimos-edge">
                  <Campo value={p.supply[i]} label={`Oferta del origen ${i + 1}`} onChange={(v) => setLista("supply", i, v)} />
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Demanda</th>
              {p.demand.map((d, j) => (
                <td key={j} className="minimos-edge">
                  <Campo value={d} label={`Demanda del destino ${j + 1}`} onChange={(v) => setLista("demand", j, v)} />
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {error && <p className="minimos-error" role="alert">{error}</p>}
      <button type="button" className="btn btn--primary minimos-go" onClick={calcular}>
        Calcular
      </button>

      {res && <Resultado res={res} shown={shown} setShown={setShown} />}
    </div>
  );
}

function Resultado({ res, shown, setShown }) {
  const { problem: q, steps, terms, total, degenerada } = res;
  const N = steps.length;
  const hechos = steps.slice(0, shown);
  const asignado = new Map(hechos.map((t) => [`${t.i},${t.j}`, t.qty]));
  const actual = shown > 0 ? steps[shown - 1] : null;
  const sig = shown < N ? steps[shown] : null;
  const tach = marcas(res, shown);

  const restoO = q.supply.map((s, i) => limpiar(s - hechos.filter((t) => t.i === i).reduce((a, t) => a + t.qty, 0)));
  const restoD = q.demand.map((d, j) => limpiar(d - hechos.filter((t) => t.j === j).reduce((a, t) => a + t.qty, 0)));
  const nombreO = (i) => (q.ficticio === "fila" && i === q.m - 1 ? "Ficticio" : `Origen ${i + 1}`);
  const nombreD = (j) => (q.ficticio === "col" && j === q.n - 1 ? "Ficticio" : `Destino ${j + 1}`);

  const porque = (t) => {
    if (shown === N) return "Ya no quedan celdas disponibles: el método termina aquí.";
    if (t.cierra === "fila")
      return `Se tacha la fila de ${nombreO(t.i)}: su oferta quedó en 0, así que todas sus celdas libres (a la izquierda o a la derecha) ya no se pueden usar.`;
    if (t.cierra === "col")
      return `Se tacha la columna de ${nombreD(t.j)}: su demanda quedó cubierta (0), así que todas sus celdas libres (arriba o abajo) ya no se pueden usar.`;
    return `La oferta de ${nombreO(t.i)} y la demanda de ${nombreD(t.j)} se agotan a la vez: se tachan la fila y la columna (solución degenerada: una variable básica vale 0 y las diagonales la representan).`;
  };

  return (
    <section className="minimos-res" aria-live="polite">
      {q.ficticio && (
        <p className="minimos-note">
          Oferta y demanda no coinciden: se agregó un {q.ficticio === "fila" ? "origen" : "destino"} ficticio
          con costo 0 para balancear el problema.
        </p>
      )}

      <div className="minimos-scroll">
        <table className="minimos-table minimos-out">
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
                    "minimos-cell",
                    asignado.has(k) && "is-on",
                    actual && actual.i === i && actual.j === j && "is-now",
                    sig && sig.i === i && sig.j === j && "is-next",
                    corte !== undefined && "is-cut",
                    corte === shown && "is-new",
                  ].filter(Boolean).join(" ");
                  return (
                    <td key={j} className={cls}>
                      <span className="minimos-cost">{fmt(c)}</span>
                      {asignado.has(k) && <b className="minimos-qty">{fmt(asignado.get(k))}</b>}
                    </td>
                  );
                })}
                <td className="minimos-edge">
                  {fmt(q.supply[i])}
                  <small>queda {fmt(restoO[i])}</small>
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Demanda</th>
              {q.demand.map((d, j) => (
                <td key={j} className="minimos-edge">
                  {fmt(d)}
                  <small>queda {fmt(restoD[j])}</small>
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="minimos-steps">
        <button type="button" className="btn minimos-ghost" disabled={shown === 0} onClick={() => setShown(0)}>Reiniciar</button>
        <button type="button" className="btn minimos-ghost" disabled={shown === 0} onClick={() => setShown(shown - 1)} aria-label="Paso anterior">‹</button>
        <input type="range" min="0" max={N} value={shown} onChange={(e) => setShown(+e.target.value)} aria-label="Paso del método" />
        <button type="button" className="btn minimos-ghost" disabled={shown === N} onClick={() => setShown(shown + 1)} aria-label="Paso siguiente">›</button>
        <button type="button" className="btn minimos-ghost" disabled={shown === N} onClick={() => setShown(N)}>Ver todo</button>
      </div>
      <p className="minimos-count">{shown === 0 ? "Inicio" : `Paso ${shown} de ${N}`}</p>

      <div className="minimos-info">
        {actual && (
          <article className="minimos-card">
            <h4>Lo que se hizo</h4>
            <p>
              En {nombreO(actual.i)} → {nombreD(actual.j)} (costo {fmt(actual.costo)}) se asignaron <strong>{fmt(actual.qty)}</strong> unidades:
              el menor entre la oferta disponible ({fmt(actual.ofertaAntes)}) y la demanda pendiente ({fmt(actual.demandaAntes)}).
            </p>
            <p className="minimos-why">{porque(actual)}</p>
          </article>
        )}
        {sig && (
          <article className="minimos-card is-next">
            <h4>{shown === 0 ? "Cómo se empieza" : "Lo que sigue"}</h4>
            <p>
              {shown === 0
                ? "Se busca el menor costo de toda la tabla, esté donde esté: "
                : "Entre las celdas que no están tachadas, el menor costo es "}
              <strong>{fmt(sig.costo)}</strong> en {nombreO(sig.i)} → {nombreD(sig.j)}.{" "}
              {sig.empate && "Hay empate de costo: se elige la celda que permite asignar más (si siguen iguales, la primera de arriba a la izquierda). "}
              Oferta disponible {fmt(sig.ofertaAntes)}, demanda pendiente {fmt(sig.demandaAntes)}:
              se toma min({fmt(sig.ofertaAntes)}, {fmt(sig.demandaAntes)}) = <strong>{fmt(sig.qty)}</strong>.
            </p>
          </article>
        )}
      </div>

      {shown === N && (
        <div className="minimos-total">
          <p className="minimos-eq">
            Z = {terms.map((t) => `${fmt(t.qty)}×${fmt(t.costo)}`).join(" + ")} = <strong>{fmt(total)}</strong>
          </p>
          <p className="minimos-note">
            {N} asignaciones.
            {degenerada && " Es degenerada: una variable básica vale 0 y se representa con las diagonales."}
          </p>
        </div>
      )}
    </section>
  );
}