import { useEffect, useRef, useState } from "react";
import InfoTip from "./InfoTip"; // Asumo que este sí existe en tu carpeta
import { buildProblem, solve } from "./simplex";
import { cleanExpression, cleanNames, cleanNumber } from "./inputFilters";
import "./simplex.css";

const MAX_ROWS = 12;
const newRow = (id) => ({ id, coefs: "", sign: "<=", value: "" });

const EXAMPLE = {
  type: "max",
  objective: "3x + 5y",
  rows: [
    { coefs: "x", sign: "<=", value: "4" },
    { coefs: "2y", sign: "<=", value: "12" },
    { coefs: "3x + 2y", sign: "<=", value: "18" },
  ],
};

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

// ==========================================
// COMPONENTE DE RESULTADOS (Integrado aquí)
// ==========================================
function SimplexResults({ result }) {
  if (!result) return null;

  return (
    <div className="simplex-results">
      <div className="simplex-results__top">
        <h3>Resultado</h3>
      </div>

      <div className="simplex-results-grid">
        {/* Panel de Solución Óptima */}
        <div className="simplex-optimal">
          <div className="simplex-optimal__title">
            <span>Solución óptima</span>
          </div>
          
          {result.status === "optimal" ? (
            <>
              <div className="simplex-vars">
                {Object.entries(result.variables).map(([name, val]) => (
                  <div className="simplex-var" key={name}>
                    <span>{name}</span>
                    <strong>{val}</strong>
                  </div>
                ))}
              </div>
              <div className="simplex-z">
                <span>Valor de Z</span>
                <strong>{result.zValue}</strong>
              </div>
            </>
          ) : (
            <p className="simplex-status simplex-status--infeasible">
              El problema no tiene solución óptima factible.
            </p>
          )}
        </div>

        {/* Tabla Final */}
        {result.status === "optimal" && result.finalTable && (
          <div className="simplex-final">
            <div className="simplex-final__head">
              <span className="simplex-final__title">Tabla final</span>
            </div>
            <div className="simplex-table-wrap">
              <table className="simplex-table">
                <thead>
                  <tr>
                    {result.finalTable.headers.map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.finalTable.rows.map((row, i) => (
                    <tr key={i} className={row[0] === "Z" ? "simplex-table__z" : ""}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function SimplexPanel() {
  const nextId = useRef(4);
  const resultsRef = useRef(null);

  const [type, setType] = useState("max");
  const [objective, setObjective] = useState("");
  const [varsText, setVarsText] = useState("");
  const [rows, setRows] = useState(() => [newRow(1), newRow(2), newRow(3)]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Al calcular, se lleva la vista hasta los resultados
  useEffect(() => {
    if (!result) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [result]);

  const takeId = () => nextId.current++;

  const addRow = () => {
    const id = takeId();
    setRows((r) => (r.length >= MAX_ROWS ? r : [...r, newRow(id)]));
  };
  const removeRow = (id) => setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const updateRow = (id, field, value) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const reset = () => {
    setType("max");
    setObjective("");
    setVarsText("");
    setRows([newRow(takeId()), newRow(takeId()), newRow(takeId())]);
    setResult(null);
    setError("");
  };

  const loadExample = () => {
    setType(EXAMPLE.type);
    setObjective(EXAMPLE.objective);
    setVarsText("");
    setRows(EXAMPLE.rows.map((r) => ({ ...r, id: takeId() })));
    setResult(null);
    setError("");
  };

  const calculate = (e) => {
    e.preventDefault();
    try {
      setResult(solve(buildProblem({ type, objective, varsText, rows })));
      setError("");
    } catch (err) {
      setResult(null);
      setError(err.message || "No se pudo resolver el problema.");
    }
  };

  return (
    <div className="simplex-layout">
      <p className="simplex-intro">
        El método simplex resuelve problemas de programación lineal: encuentra el mayor o el menor
        valor de una función objetivo (Z) respetando un conjunto de restricciones lineales. Parte de una
        solución factible y, tabla por tabla, se mueve a una vecina que mejora Z hasta llegar al
        óptimo. Se usa, por ejemplo, para decidir cuánto producir con recursos limitados, preparar
        mezclas o dietas al menor costo, planificar transporte y repartir personal o inversiones.
      </p>

      <form onSubmit={calculate} noValidate>
        <div className="simplex-grid">
          {/* ----- Columna izquierda ----- */}
          <div className="simplex-col-left">
            <div className="simplex-input-group">
              <span className="simplex-label" id="sx-type-label">
                Tipo de problema
              </span>
              <div className="simplex-toggle-wrap">
                <div className="simplex-toggle-group" role="group" aria-labelledby="sx-type-label">
                  <button
                    type="button"
                    className={`btn${type === "max" ? " is-active" : ""}`}
                    aria-pressed={type === "max"}
                    onClick={() => setType("max")}
                  >
                    Maximizar
                  </button>
                  <button
                    type="button"
                    className={`btn${type === "min" ? " is-active" : ""}`}
                    aria-pressed={type === "min"}
                    onClick={() => setType("min")}
                  >
                    Minimizar
                  </button>
                </div>

                <InfoTip label="¿En qué se diferencian maximizar y minimizar?">
                  <p>
                    <strong>Maximizar:</strong> busca el mayor valor posible de Z...
                  </p>
                  <p>
                    <strong>Minimizar:</strong> busca el menor valor posible de Z...
                  </p>
                </InfoTip>
              </div>
            </div>

            <div className="simplex-input-group">
              <label className="simplex-label" htmlFor="sx-objective">
                Función objetivo ( Z )
              </label>
              <input
                id="sx-objective"
                type="text"
                className="simplex-input"
                placeholder="Ej: 3x + 2y + z"
                value={objective}
                onChange={(e) => setObjective(cleanExpression(e.target.value, { equals: true }))}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="simplex-input-group">
              <label className="simplex-label" htmlFor="sx-vars">
                Variables
              </label>
              <input
                id="sx-vars"
                type="text"
                className="simplex-input"
                placeholder="Ej: x, y, z"
                value={varsText}
                onChange={(e) => setVarsText(cleanNames(e.target.value))}
                autoComplete="off"
                spellCheck={false}
              />
              <small className="simplex-hint">Opcional: si lo dejas vacío se toman de la función objetivo.</small>
            </div>
          </div>

          {/* ----- Columna derecha ----- */}
          <div className="simplex-col-right">
            <span className="simplex-restricciones-title">Restricciones</span>

            <div className="simplex-restricciones-header" aria-hidden="true">
              <span>#</span>
              <span>Coeficientes (x, y, z, ...)</span>
              <span>Signo</span>
              <span>Valor</span>
              <span />
            </div>

            <div className="simplex-restricciones-list">
              {rows.map((row, i) => (
                <div key={row.id} className="simplex-restriccion-row">
                  <span className="simplex-row-num">{i + 1}</span>
                  <input
                    type="text"
                    className="simplex-input"
                    placeholder="Ej: 2x + y"
                    aria-label={`Coeficientes de la restricción ${i + 1}`}
                    value={row.coefs}
                    onChange={(e) => updateRow(row.id, "coefs", cleanExpression(e.target.value))}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <select
                    className="simplex-input simplex-select"
                    aria-label={`Signo de la restricción ${i + 1}`}
                    value={row.sign}
                    onChange={(e) => updateRow(row.id, "sign", e.target.value)}
                  >
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="=">=</option>
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="simplex-input"
                    placeholder="Ej: 10"
                    title="Solo números (enteros o decimales)"
                    aria-label={`Valor de la restricción ${i + 1}`}
                    value={row.value}
                    onChange={(e) => updateRow(row.id, "value", cleanNumber(e.target.value))}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="simplex-btn-icon"
                    aria-label={`Eliminar la restricción ${i + 1}`}
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            <p className="simplex-hint">
              Puedes escribir los coeficientes como expresión (2x + y) o solo con números en el orden de las
              variables (2 1). Todas las variables son ≥ 0.
            </p>

            <div className="simplex-actions">
              <button type="button" className="btn simplex-btn-add" onClick={addRow} disabled={rows.length >= MAX_ROWS}>
                + Agregar restricción
              </button>
              <div className="simplex-action-buttons">
                <button type="button" className="btn" onClick={loadExample}>
                  Ejemplo
                </button>
                <button type="button" className="btn" onClick={reset}>
                  Limpiar
                </button>
                <button type="submit" className="btn btn--primary">
                  Calcular
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="simplex-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <div ref={resultsRef}>
        {/* Aquí usamos el componente que acabamos de crear arriba */}
        <SimplexResults result={result} />
      </div>
    </div>
  );
}