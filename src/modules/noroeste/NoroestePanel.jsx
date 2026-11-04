import { useState } from "react";
import { esquinaNoroeste } from "./noroeste";
import "./noroeste.css";

const EJEMPLO = {
  m: 3,
  n: 4,
  costs: [["8", "6", "10", "9"], ["9", "12", "13", "7"], ["14", "9", "16", "5"]],
  supply: ["35", "50", "40"],
  demand: ["45", "20", "30", "30"],
};

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
    const r = esquinaNoroeste(costs, supply, demand);
    setRes(r);
    setShown(r.steps.length);
    setError("");
  };

  return (
    <div className="noroeste">
      <p className="noroeste-formula" aria-hidden="true">
        Z = Σ c<sub>ij</sub> x<sub>ij</sub>
      </p>

      <div className="noroeste-dims">
        <label>
          Orígenes
          <select value={p.m} onChange={(e) => editar(redim(p, +e.target.value, p.n))}>
            {[2, 3, 4, 5, 6].map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label>
          Destinos
          <select value={p.n} onChange={(e) => editar(redim(p, p.m, +e.target.value))}>
            {[2, 3, 4, 5, 6].map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <button type="button" className="btn noroeste-ghost" onClick={() => editar(EJEMPLO)}>
          Cargar ejemplo
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
console.log("NOROESTE NUEVO CARGADO");
function Resultado({ res, shown, setShown }) {
  const { problem: q, steps, terms, total, degenerada } = res;
  const asignado = new Map(steps.slice(0, shown).map((t) => [`${t.i},${t.j}`, t.qty]));
  const actual = shown > 0 ? steps[shown - 1] : null;
  const nombreO = (i) => (q.ficticio === "fila" && i === q.m - 1 ? "Ficticio" : `Origen ${i + 1}`);
  const nombreD = (j) => (q.ficticio === "col" && j === q.n - 1 ? "Ficticio" : `Destino ${j + 1}`);

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
              {q.demand.map((_, j) => <th key={j} scope="col">{nombreD(j)}</th>)}
              <th scope="col">Oferta</th>
            </tr>
          </thead>
          <tbody>
            {q.costs.map((fila, i) => (
              <tr key={i}>
                <th scope="row">{nombreO(i)}</th>
                {fila.map((c, j) => {
                  const k = `${i},${j}`;
                  const on = actual && actual.i === i && actual.j === j;
                  return (
                    <td key={j} className={`noroeste-cell${asignado.has(k) ? " is-on" : ""}${on ? " is-now" : ""}`}>
                      <span className="noroeste-cost">{fmt(c)}</span>
                      {asignado.has(k) && <b className="noroeste-qty">{fmt(asignado.get(k))}</b>}
                    </td>
                  );
                })}
                <td className="noroeste-edge">{fmt(q.supply[i])}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Demanda</th>
              {q.demand.map((d, j) => <td key={j} className="noroeste-edge">{fmt(d)}</td>)}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="noroeste-steps">
        <button type="button" className="btn noroeste-ghost" disabled={shown === 0} onClick={() => setShown(shown - 1)} aria-label="Paso anterior">‹</button>
        <input type="range" min="0" max={steps.length} value={shown} onChange={(e) => setShown(+e.target.value)} aria-label="Paso del método" />
        <button type="button" className="btn noroeste-ghost" disabled={shown === steps.length} onClick={() => setShown(shown + 1)} aria-label="Paso siguiente">›</button>
      </div>
      <p className="noroeste-explain">
        {actual
          ? `Paso ${shown} de ${steps.length}: en ${nombreO(actual.i)} → ${nombreD(actual.j)} se asigna el menor entre oferta ${fmt(actual.ofertaAntes)} y demanda ${fmt(actual.demandaAntes)}, es decir ${fmt(actual.qty)}. ${
              actual.cierra === "fila" ? "Se agota la oferta: baja una fila."
              : actual.cierra === "col" ? "Se cubre la demanda: avanza una columna."
              : "Se agotan ambas: baja una fila y la siguiente asignación será 0."
            }`
          : "Mueve el control para ver cada asignación, empezando por la esquina superior izquierda."}
      </p>

      {shown === steps.length && (
        <div className="noroeste-total">
          <p className="noroeste-eq">
            Z = {terms.map((t) => `${fmt(t.qty)}×${fmt(t.costo)}`).join(" + ")} = <strong>{fmt(total)}</strong>
          </p>
          <p className="noroeste-note">
            {steps.length} variables básicas ({q.m} + {q.n} − 1).
            {degenerada && " La solución es degenerada: incluye una asignación igual a 0."}
          </p>
        </div>
      )}
    </section>
  );
}