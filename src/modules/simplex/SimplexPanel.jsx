import React, { useState } from 'react';
import './simplex.css'; // Asegúrate de importar tu CSS aquí

export default function SimplexPanel() {
  // Estados para el formulario (puedes conectarlos luego a tu lógica en methods.js)
  const [tipoProblema, setTipoProblema] = useState('max');
  const [funcionObjetivo, setFuncionObjetivo] = useState('');
  const [variables, setVariables] = useState('');
  const [restricciones, setRestricciones] = useState([
    { id: 1, coeficientes: '', signo: '<=', valor: '' },
    { id: 2, coeficientes: '', signo: '<=', valor: '' },
    { id: 3, coeficientes: '', signo: '<=', valor: '' },
  ]);

  const agregarRestriccion = () => {
    setRestricciones([
      ...restricciones,
      { id: Date.now(), coeficientes: '', signo: '<=', valor: '' }
    ]);
  };

  const eliminarRestriccion = (id) => {
    setRestricciones(restricciones.filter((r) => r.id !== id));
  };

  return (
    <div className="method simplex-layout">
      {/* Cabecera del método */}
      {/* <div className="method__head">
        <div className="icon">🧮</div>
        <div>
          <h2>Método Simplex</h2>
          <small>Investigación de Operaciones</small>
        </div>
      </div> */}

      {/* Contenedor Principal de Entrada */}
      <div className="simplex-grid">
        
        {/* Columna Izquierda: Configuración y Función Objetivo */}
        <div className="simplex-col-left">
          <div className="input-group">
            <label>Tipo de problema</label>
            <div className="toggle-group">
              <button 
                className={`btn ${tipoProblema === 'max' ? 'is-active' : ''}`}
                onClick={() => setTipoProblema('max')}
              >Maximizar</button>
              <button 
                className={`btn ${tipoProblema === 'min' ? 'is-active' : ''}`}
                onClick={() => setTipoProblema('min')}
              >Minimizar</button>
            </div>
          </div>

          <div className="input-group">
            <label>Función objetivo (Z)</label>
            <input type="text" className="simplex-input" placeholder="Ej: 3x + 2y + z" value={funcionObjetivo} onChange={(e) => setFuncionObjetivo(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Variables</label>
            <input type="text" className="simplex-input" placeholder="Ej: x, y, z" value={variables} onChange={(e) => setVariables(e.target.value)} />
          </div>
        </div>

        {/* Columna Derecha: Restricciones y Botones */}
        <div className="simplex-col-right">
          <label className="restricciones-title">Restricciones</label>
          
          <div className="restricciones-header">
            <span>#</span>
            <span>Coeficientes (x, y, z, ...)</span>
            <span>Signo</span>
            <span>Valor</span>
            <span></span>
          </div>

          <div className="restricciones-list">
            {restricciones.map((res, index) => (
              <div key={res.id} className="restriccion-row">
                <span className="row-num">{index + 1}</span>
                <input type="text" className="simplex-input" placeholder="Ej: 2, 1, 0" />
                <select className="simplex-input simplex-select">
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="=">=</option>
                </select>
                <input type="text" className="simplex-input" placeholder="Ej: 10" />
                <button className="btn-icon delete" onClick={() => eliminarRestriccion(res.id)}>🗑️</button>
              </div>
            ))}
          </div>

          <div className="simplex-actions">
            <button className="btn btn-add" onClick={agregarRestriccion}>+ Agregar restricción</button>
            <div className="action-buttons">
              <button className="btn btn--primary">Calcular</button>
              <button className="btn">Limpiar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Resultados (Oculta por defecto o visible según tu lógica) */}
      <div className="simplex-results mt-4">
        <h3>Resultado</h3>
        
        <div className="results-grid">
          {/* Panel de Solución Óptima */}
          <div className="optimal-solution">
            <h4>Solución óptima</h4>
            <div className="variables-result">
              <div className="var-box"><span>X</span><input type="text" disabled value="0" /></div>
              <div className="var-box"><span>Y</span><input type="text" disabled value="0" /></div>
              <div className="var-box"><span>Z</span><input type="text" disabled value="0" /></div>
            </div>
            <div className="z-result">
              <label>Valor de Z</label>
              <input type="text" disabled value="0" />
            </div>
          </div>

          {/* Tabla Final */}
          <div className="final-table-container">
            <div className="table-header">
              <span>Tabla final</span>
            </div>
            <table className="simplex-table">
              <thead>
                <tr>
                  <th>Base</th>
                  <th>x</th>
                  <th>y</th>
                  <th>z</th>
                  <th>S1</th>
                  <th>S2</th>
                  <th>S3</th>
                  <th>LD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Z</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>1</td>
                  <td>1</td>
                  <td>1</td>
                  <td>26</td>
                </tr>
                <tr>
                  <td>S1</td>
                  <td>0</td>
                  <td>1</td>
                  <td>0</td>
                  <td>1</td>
                  <td>0</td>
                  <td>-1</td>
                  <td>3</td>
                </tr>
                <tr>
                  <td>S2</td>
                  <td>1</td>
                  <td>0</td>
                  <td>0</td>
                  <td>0</td>
                  <td>1</td>
                  <td>1</td>
                  <td>4</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}