// Lógica pura del método de Costos Mínimos (sin React).
const EPS = 1e-9;
export const limpiar = (x) => (Math.abs(x) < EPS ? 0 : Math.round(x * 1e9) / 1e9);
const suma = (v) => v.reduce((a, b) => a + b, 0);

// Si oferta total ≠ demanda total, agrega un origen o destino ficticio (costo 0).
export function balancear(costs, supply, demand) {
  const c = costs.map((r) => [...r]);
  const s = [...supply];
  const d = [...demand];
  const dif = limpiar(suma(s) - suma(d));
  let ficticio = null;
  if (dif > 0) {
    c.forEach((r) => r.push(0));
    d.push(dif);
    ficticio = "col";
  } else if (dif < 0) {
    c.push(Array(d.length).fill(0));
    s.push(-dif);
    ficticio = "fila";
  }
  return { costs: c, supply: s, demand: d, ficticio };
}

export function costoMinimo(costs, supply, demand) {
  const p = balancear(costs, supply, demand);
  const m = p.supply.length;
  const n = p.demand.length;
  const s = [...p.supply];
  const d = [...p.demand];
  const filaOk = Array(m).fill(true);
  const colOk = Array(n).fill(true);
  const asignadas = new Set();
  const tachadas = new Set();
  const steps = [];
  const inicial = { filas: [], columnas: [], celdas: [] };

  // Tachar una fila o columna: devuelve las celdas libres que quedan inutilizables
  // (todas las de esa línea, estén a la izquierda, derecha, arriba o abajo).
  const nuevas = (celdas) => {
    const out = [];
    celdas.forEach((key) => {
      if (!asignadas.has(key) && !tachadas.has(key)) {
        tachadas.add(key);
        out.push(key);
      }
    });
    return out;
  };
  const tacharFila = (i) => {
    filaOk[i] = false;
    return nuevas(Array.from({ length: n }, (_, j) => `${i},${j}`));
  };
  const tacharCol = (j) => {
    colOk[j] = false;
    return nuevas(Array.from({ length: m }, (_, i) => `${i},${j}`));
  };

  // Filas u columnas que empiezan en 0 ya no participan.
  s.forEach((v, i) => {
    if (v === 0) {
      inicial.filas.push(i);
      inicial.celdas.push(...tacharFila(i));
    }
  });
  d.forEach((v, j) => {
    if (v === 0) {
      inicial.columnas.push(j);
      inicial.celdas.push(...tacharCol(j));
    }
  });

  for (;;) {
    // 1) El menor costo entre las celdas que no están tachadas.
    let cmin = Infinity;
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) if (filaOk[i] && colOk[j] && p.costs[i][j] < cmin) cmin = p.costs[i][j];
    if (cmin === Infinity) break;

    // 2) Empate: gana la que permite asignar más; si siguen iguales, la primera (arriba-izquierda).
    const candidatas = [];
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        if (filaOk[i] && colOk[j] && Math.abs(p.costs[i][j] - cmin) < EPS)
          candidatas.push({ i, j, q: Math.min(s[i], d[j]) });
    const { i, j, q: qty } = candidatas.reduce((a, b) => (b.q > a.q + EPS ? b : a));

    const ofertaAntes = s[i];
    const demandaAntes = d[j];
    s[i] = limpiar(s[i] - qty);
    d[j] = limpiar(d[j] - qty);
    asignadas.add(`${i},${j}`);
    const agotaFila = s[i] === 0;
    const agotaCol = d[j] === 0;
    const celdas = [];
    if (agotaFila) celdas.push(...tacharFila(i));
    if (agotaCol) celdas.push(...tacharCol(j));

    steps.push({
      i, j, qty, costo: cmin, ofertaAntes, demandaAntes,
      cierra: agotaFila && agotaCol ? "ambas" : agotaFila ? "fila" : "col",
      empate: candidatas.length > 1,
      tachaFila: agotaFila ? i : null,
      tachaCol: agotaCol ? j : null,
      celdas,
    });
  }

  const terms = steps.map((t) => ({ ...t, sub: t.qty * t.costo }));
  const total = limpiar(suma(terms.map((t) => t.sub)));
  const degenerada = steps.length < m + n - 1;

  return { problem: { ...p, m, n }, steps, inicial, terms, total, degenerada };
}

// Filas, columnas y celdas tachadas tras `hasta` pasos. Cada mapa guarda el paso en que
// apareció el tachado (0 = desde el inicio), para animar solo lo nuevo.
export function marcas({ inicial, steps }, hasta) {
  const filas = new Map();
  const columnas = new Map();
  const celdas = new Map();
  inicial.filas.forEach((i) => filas.set(i, 0));
  inicial.columnas.forEach((j) => columnas.set(j, 0));
  inicial.celdas.forEach((k) => celdas.set(k, 0));
  steps.slice(0, hasta).forEach((t, k) => {
    if (t.tachaFila !== null) filas.set(t.tachaFila, k + 1);
    if (t.tachaCol !== null) columnas.set(t.tachaCol, k + 1);
    t.celdas.forEach((c) => celdas.set(c, k + 1));
  });
  return { filas, columnas, celdas };
}