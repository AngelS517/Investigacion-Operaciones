import { useEffect, useRef, useState } from "react";
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

function TableModal({ isOpen, onClose, title, headers, rows }) {
  if (!isOpen) return null;
  return (
    <div className="simplex-modal" onClick={onClose}>
      <div className="simplex-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="simplex-modal__head">
          <h2>{title}</h2>
          <button className="btn simplex-mini" onClick={onClose}>Cerrar</button>
        </div>
        <div className="simplex-modal__body">
          <div className="simplex-table-wrap">
            <table className="simplex-table simplex-table--large">
              <thead>
                <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={row[0] === "Z" ? "simplex-table__z" : ""}>
                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimplexPanel() {
  const nextId = useRef(4);
  const resultsRef = useRef(null);

  const [type, setType] = useState("max");
  const [objective, setObjective] = useState("");
  const [varsText, setVarsText] = useState("");
  const [rows, setRows] = useState(() => [newRow(1), newRow(2), newRow(3)]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [showProcedure, setShowProcedure] = useState(false);

  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    if (!result) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [result]);

  useEffect(() => {
    let interval;
    if (showProcedure) {
      setAnimPhase(1);
      interval = setInterval(() => {
        setAnimPhase(prev => prev === 0 ? 1 : 0);
      }, 3000);
    } else {
      setAnimPhase(0);
    }
    return () => clearInterval(interval);
  }, [showProcedure]);

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
    setShowProcedure(false);
    setAnimPhase(0);
  };

  const loadExample = () => {
    setType(EXAMPLE.type);
    setObjective(EXAMPLE.objective);
    setVarsText("");
    setRows(EXAMPLE.rows.map((r) => ({ ...r, id: takeId() })));
    setResult(null);
    setError("");
    setShowProcedure(false);
    setAnimPhase(0);
  };

  const calculate = (e) => {
    e.preventDefault();
    try {
      setResult(solve(buildProblem({ type, objective, varsText, rows })));
      setError("");
      setShowProcedure(false);
    } catch (err) {
      setResult(null);
      setError(err.message || "No se pudo resolver el problema. Verifica los datos.");
    }
  };

  const openModal = (title, headers, rows) => {
    setModalData({ title, headers, rows });
    setModalOpen(true);
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
          <div className="simplex-col-left">
            <div className="simplex-input-group">
              <span className="simplex-label" id="sx-type-label">Tipo de problema</span>
              <div className="simplex-toggle-wrap">
                <div className="simplex-toggle-group" role="group" aria-labelledby="sx-type-label">
                  <button type="button" className={`btn${type === "max" ? " is-active" : ""}`} onClick={() => setType("max")}>Maximizar</button>
                  <button type="button" className={`btn${type === "min" ? " is-active" : ""}`} onClick={() => setType("min")}>Minimizar</button>
                </div>
                <div className="simplex-tooltip-wrap">
                  <span className="simplex-tip-icon" aria-label="Ayuda">¡</span>
                  <div className="simplex-tooltip-text">
                    <p><strong>Maximizar:</strong> busca el mayor valor de Z (ganancias, producción). Restricciones suelen ser ≤.</p>
                    <p><strong>Minimizar:</strong> busca el menor valor de Z (costos, tiempo). Restricciones suelen ser ≥.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="simplex-input-group">
              <label className="simplex-label" htmlFor="sx-objective">Función objetivo ( Z )</label>
              <input id="sx-objective" type="text" className="simplex-input" placeholder="Ej: 3x + 2y" value={objective} onChange={(e) => setObjective(cleanExpression(e.target.value, { equals: true }))} autoComplete="off" spellCheck={false} />
            </div>

            <div className="simplex-input-group">
              <label className="simplex-label" htmlFor="sx-vars">Variables</label>
              <input id="sx-vars" type="text" className="simplex-input" placeholder="Ej: x, y" value={varsText} onChange={(e) => setVarsText(cleanNames(e.target.value))} autoComplete="off" spellCheck={false} />
              <small className="simplex-hint">Opcional: si lo dejas vacío se toman de la función objetivo.</small>
            </div>
          </div>

          <div className="simplex-col-right">
            <span className="simplex-restricciones-title">Restricciones</span>
            <div className="simplex-restricciones-header" aria-hidden="true">
              <span>#</span><span>Coeficientes (x, y, ...)</span><span>Signo</span><span>Valor</span><span />
            </div>
            <div className="simplex-restricciones-list">
              {rows.map((row, i) => (
                <div key={row.id} className="simplex-restriccion-row">
                  <span className="simplex-row-num">{i + 1}</span>
                  <input type="text" className="simplex-input" placeholder="Ej: 2x + y" value={row.coefs} onChange={(e) => updateRow(row.id, "coefs", cleanExpression(e.target.value))} autoComplete="off" spellCheck={false} />
                  <select className="simplex-input simplex-select" value={row.sign} onChange={(e) => updateRow(row.id, "sign", e.target.value)}>
                    <option value="<=">≤</option><option value=">=">≥</option><option value="=">=</option>
                  </select>
                  <input type="text" inputMode="decimal" className="simplex-input" placeholder="Ej: 10" value={row.value} onChange={(e) => updateRow(row.id, "value", cleanNumber(e.target.value))} autoComplete="off" />
                  <button type="button" className="simplex-btn-icon" disabled={rows.length === 1} onClick={() => removeRow(row.id)}><TrashIcon /></button>
                </div>
              ))}
            </div>
            <div className="simplex-actions">
              <button type="button" className="btn simplex-btn-add" onClick={addRow} disabled={rows.length >= MAX_ROWS}>+ Agregar restricción</button>
              <div className="simplex-action-buttons">
                <button type="button" className="btn" onClick={loadExample}>Ejemplo</button>
                <button type="button" className="btn" onClick={reset}>Limpiar</button>
                <button type="submit" className="btn btn--primary">Calcular</button>
              </div>
            </div>
          </div>
        </div>
        {error && <p className="simplex-error" role="alert">{error}</p>}
      </form>

      <div ref={resultsRef}>
        {result && (
          <div className="simplex-results">
            <div className="simplex-results__top"><h3>Resultado</h3></div>
            <div className="simplex-results-grid">
              <div className="simplex-optimal">
                <div className="simplex-optimal__title"><span>Solución óptima</span></div>
                {result.status === "optimal" ? (
                  <>
                    <div className="simplex-vars">
                      {Object.entries(result.variables).map(([name, val]) => (
                        <div className="simplex-var" key={name}><span>{name}</span><strong>{val}</strong></div>
                      ))}
                    </div>
                    <div className="simplex-z"><span>Valor de Z</span><strong>{result.zValue}</strong></div>
                  </>
                ) : (
                  <p className="simplex-status simplex-status--infeasible">{result.message || "El problema no tiene solución factible."}</p>
                )}
              </div>

              {result.status === "optimal" && result.finalTable && (
                <div className="simplex-final">
                  <div className="simplex-final__head">
                    <span className="simplex-final__title">Tabla final</span>
                    <button className="btn simplex-mini" onClick={() => openModal("Tabla Final", result.finalTable.headers, result.finalTable.rows)}>Ampliar</button>
                  </div>
                  <div className="simplex-table-wrap">
                    <table className="simplex-table">
                      <thead><tr>{result.finalTable.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                      <tbody>
                        {result.finalTable.rows.map((row, i) => (
                          <tr key={i} className={row[0] === "Z" ? "simplex-table__z" : ""}>
                            {row.map((cell, j) => <td key={j}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {result.status === "optimal" && result.steps && result.steps.length > 0 && (
              <div className="simplex-procedure-section">
                <button className="btn" onClick={() => setShowProcedure(!showProcedure)}>
                  {showProcedure ? "Ocultar procedimiento" : "Ver procedimiento paso a paso"}
                </button>

                {showProcedure && (
                  <div className="simplex-steps">
                    {result.steps.map((step, idx) => (
                      <div key={idx} className="simplex-step">
                        <h4 className="simplex-step__title">{step.title}</h4>
                        <p className="simplex-text">{step.description}</p>
                        <div className="simplex-table-wrap">
                          <table className="simplex-table">
                            <thead>
                              <tr>
                                {step.headers.map((h, i) => {
                                  const isEnteringCol = (i - 2) === step.pivotCol;
                                  // La cabecera de la columna pivote hace el destello si estamos en fase 1
                                  return (
                                    <th key={i} className={isEnteringCol ? (animPhase === 1 ? "simplex-header-flash" : "simplex-pivot-col") : ""}>
                                      {h}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {step.rows.map((row, i) => (
                                <tr key={`${idx}-${i}`} className={row.isZ ? "simplex-table__z" : ""}>
                                  {row.cells.map((cell, j) => {
                                    const isPivotCol = (j - 2) === step.pivotCol;
                                    const isPivotRow = row.isPivotRow;
                                    const isPivotCell = isPivotCol && isPivotRow;
                                    const isBaseCell = j === 0 && isPivotRow;

                                    let cellClass = "";
                                    // Colores fijos de fondo (se quedan siempre)
                                    if (isPivotCell) cellClass = "simplex-pivot-cell";
                                    else if (isPivotCol) cellClass = "simplex-pivot-col";
                                    else if (isPivotRow) cellClass = "simplex-pivot-row";

                                    // Si es la celda de la base, solo animamos el texto (no el fondo)
                                    if (isBaseCell) {
                                      if (animPhase === 1) cellClass += " simplex-base-flash";
                                    }

                                    let cellText = cell;
                                    if (isBaseCell) {
                                      cellText = animPhase === 1 ? step.enteringVar : cell;
                                    }

                                    return (
                                      <td key={`${idx}-${i}-${j}`} className={cellClass}>
                                        {cellText}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modalData && <TableModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalData.title} headers={modalData.headers} rows={modalData.rows} />}
    </div>
  );
}