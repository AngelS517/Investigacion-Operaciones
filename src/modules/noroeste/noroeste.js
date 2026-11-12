// Lógica pura del método de la Esquina Noroeste (sin React).
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

export function esquinaNoroeste(costs, supply, demand) {
  const p = balancear(costs, supply, demand);
  const m = p.supply.length;
  const n = p.demand.length;
  const s = [...p.supply];
  const d = [...p.demand];
  const raw = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    const ofertaAntes = s[i];
    const demandaAntes = d[j];
    const qty = Math.min(ofertaAntes, demandaAntes);
    s[i] = limpiar(s[i] - qty);
    d[j] = limpiar(d[j] - qty);
    const agotaFila = s[i] === 0;
    const agotaCol = d[j] === 0;
    const cierra = agotaFila && agotaCol ? "ambas" : agotaFila ? "fila" : "col";
    raw.push({ i, j, qty, ofertaAntes, demandaAntes, cierra });
    // Empate: se baja una fila y la siguiente asignación será 0 (degenerada),
    // así siempre quedan m + n − 1 variables básicas.
    if (cierra === "ambas") i < m - 1 ? i++ : j++;
    else if (cierra === "fila") i++;
    else j++;
  }

  // Pasos visibles: solo asignaciones > 0. Las de valor 0 (degeneradas) no se
  // muestran como paso: se representan con la celda tachada (diagonales moradas).
  let vis = 0;
  raw.forEach((t, r) => {
    if (t.qty > 0) {
      vis++;
      t.raw = r;
    }
    t.vis = vis; // cuántos pasos visibles hay hasta este punto
  });
  const steps = raw.filter((t) => t.qty > 0);

  const terms = steps.map((t) => ({ ...t, costo: p.costs[t.i][t.j], sub: t.qty * p.costs[t.i][t.j] }));
  const total = limpiar(suma(terms.map((t) => t.sub)));
  const degenerada = raw.some((t) => t.qty === 0);

  return { problem: { ...p, m, n }, steps, raw, terms, total, degenerada };
}

// Qué filas, columnas y celdas están "tachadas" tras `hasta` pasos visibles.
// Cada mapa guarda en qué paso apareció el tachado (para animar solo lo nuevo).
export function marcas(raw, steps, hasta, m, n) {
  const limite = hasta < steps.length ? steps[hasta].raw : raw.length;
  const usadas = new Set(steps.map((t) => `${t.i},${t.j}`));
  const filas = new Map();
  const columnas = new Map();
  const celdas = new Map();
  const tachar = (i, j, k) => {
    const key = `${i},${j}`;
    if (!usadas.has(key) && !celdas.has(key)) celdas.set(key, k);
  };
  raw.slice(0, limite).forEach((t) => {
    if (t.qty === 0) tachar(t.i, t.j, t.vis); // el "0" se muestra como celda tachada
    if (t.cierra === "col") {
      columnas.set(t.j, t.vis);
      for (let i = t.i + 1; i < m; i++) tachar(i, t.j, t.vis);
    } else {
      filas.set(t.i, t.vis);
      for (let j = t.j + 1; j < n; j++) tachar(t.i, j, t.vis);
    }
  });
  return { filas, columnas, celdas };
}