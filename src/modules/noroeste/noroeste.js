// Lógica pura del método de la Esquina Noroeste (sin React).
const EPS = 1e-9;
const limpiar = (x) => (Math.abs(x) < EPS ? 0 : Math.round(x * 1e9) / 1e9);
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
  const steps = [];
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
    steps.push({ i, j, qty, ofertaAntes, demandaAntes, cierra });
    // Empate: se baja una fila y la siguiente asignación será 0 (degenerada),
    // así siempre quedan m + n − 1 variables básicas.
    if (cierra === "ambas") i < m - 1 ? i++ : j++;
    else if (cierra === "fila") i++;
    else j++;
  }

  const terms = steps
    .filter((t) => t.qty > 0)
    .map((t) => ({ ...t, costo: p.costs[t.i][t.j], sub: t.qty * p.costs[t.i][t.j] }));
  const total = limpiar(suma(terms.map((t) => t.sub)));
  const degenerada = steps.some((t) => t.qty === 0);

  return { problem: { ...p, m, n }, steps, terms, total, degenerada };
}