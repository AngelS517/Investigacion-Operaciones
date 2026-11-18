/* src/modules/simplex/simplex.js */

// Función auxiliar para dar formato a los números (enteros o fracciones)
function formatNumber(num) {
    if (Math.abs(num) < 0.001) return "0"; // Evitar -0

    // Si es prácticamente un entero, lo dejamos como entero
    if (Math.abs(num - Math.round(num)) < 0.001) {
        return Math.round(num).toString();
    }

    // Si no, intentamos convertirlo a fracción
    const tolerance = 1.0e-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = num;

    do {
        const a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(num - h1 / k1) > num * tolerance && k1 < 1000);

    // Si el denominador no es muy grande, mostramos la fracción
    if (k1 < 1000 && k1 !== 1) {
        return `${h1}/${k1}`;
    }

    // Si es muy complejo, mostramos el decimal con 2 cifras
    return num.toFixed(2);
}

function parseExpression(expr, allVars) {
    const coefs = {};
    allVars.forEach(v => coefs[v] = 0);
    if (!expr || expr.trim() === "") return coefs;

    let normalized = expr.replace(/\s+/g, "").replace(/-/g, "+-");
    if (normalized.startsWith("+")) normalized = normalized.slice(1);

    const terms = normalized.split("+");

    terms.forEach(term => {
        if (!term) return;
        const match = term.match(/^(-?\d*\.?\d*)([a-zA-Z]\w*)?$/);
        if (match) {
            let valStr = match[1];
            let varName = match[2];

            let val = 1;
            if (valStr === "-") val = -1;
            else if (valStr !== "" && valStr !== "+") val = parseFloat(valStr);

            if (varName && coefs[varName] !== undefined) {
                coefs[varName] += val;
            }
        }
    });
    return coefs;
}

export function buildProblem({ type, objective, varsText, rows }) {
    let vars = [];
    if (varsText && varsText.trim() !== "") {
        vars = varsText.split(",").map(v => v.trim()).filter(Boolean);
    } else {
        const regex = /[a-zA-Z]\w*/g;
        const allExpr = objective + " " + rows.map(r => r.coefs).join(" ");
        const matches = allExpr.match(regex) || [];
        vars = [...new Set(matches)];
    }

    if (vars.length === 0) throw new Error("No se detectaron variables en el problema.");

    const objCoefs = parseExpression(objective, vars);
    const constraints = rows.map(r => ({
        coefs: parseExpression(r.coefs, vars),
        sign: r.sign,
        value: parseFloat(r.value) || 0
    }));

    return { type, vars, objCoefs, constraints };
}

export function solve(problem) {
    const { type, vars, objCoefs, constraints } = problem;
    const numVars = vars.length;
    const numCons = constraints.length;

    let Z_row = vars.map(v => -(objCoefs[v] || 0));
    let ld_Z = 0;

    let matrix = [];
    let basis = [];
    let colNames = [...vars];

    for (let i = 0; i < numCons; i++) {
        colNames.push(`S${i + 1}`);
        basis.push(`S${i + 1}`);
    }

    for (let i = 0; i < numCons; i++) {
        let row = vars.map(v => constraints[i].coefs[v] || 0);
        for (let j = 0; j < numCons; j++) {
            row.push(i === j ? 1 : 0);
        }
        row.push(constraints[i].value);
        matrix.push(row);
    }

    Z_row = [...Z_row, ...Array(numCons).fill(0), ld_Z];

    const steps = [];

    const getTableState = (pivotRow = -1, pivotCol = -1) => {
        const headers = ["Base", "Z", ...colNames, "TI"];
        const rows = [];

        matrix.forEach((row, i) => {
            rows.push({
                base: basis[i],
                cells: [basis[i], "0", ...row.map(x => formatNumber(x))],
                isPivotRow: i === pivotRow
            });
        });

        rows.push({
            base: "Z",
            cells: ["Z", "1", ...Z_row.map(x => formatNumber(x))],
            isZ: true
        });

        return { headers, rows, pivotCol, pivotRow };
    };

    steps.push({
        title: "Tabla Inicial",
        description: "Se construye la tabla inicial. Las variables de holgura (S) forman la base.",
        ...getTableState()
    });

    let iter = 1;
    const MAX_ITER = 20;

    while (iter <= MAX_ITER) {
        let pivotCol = -1;
        let minZ = -0.00001;

        for (let j = 0; j < numVars; j++) {
            if (Z_row[j] < minZ) {
                minZ = Z_row[j];
                pivotCol = j;
            }
        }

        if (pivotCol === -1) break;

        let pivotRow = -1;
        let minRatio = Infinity;
        for (let i = 0; i < numCons; i++) {
            if (matrix[i][pivotCol] > 0.00001) {
                const ratio = matrix[i][matrix[i].length - 1] / matrix[i][pivotCol];
                if (ratio < minRatio) {
                    minRatio = ratio;
                    pivotRow = i;
                }
            }
        }

        if (pivotRow === -1) throw new Error("Problema ilimitado (no acotado).");

        const pivotVal = matrix[pivotRow][pivotCol];
        const enteringVar = colNames[pivotCol];
        const leavingVar = basis[pivotRow];

        steps.push({
            title: `Iteración ${iter}`,
            description: `Entra '${enteringVar}' (coef. más negativo: ${formatNumber(minZ)}). Sale '${leavingVar}' (menor razón: ${formatNumber(minRatio)}). Pivote: ${formatNumber(pivotVal)}.`,
            enteringVar: enteringVar,
            ...getTableState(pivotRow, pivotCol)
        });

        for (let j = 0; j < matrix[pivotRow].length; j++) {
            matrix[pivotRow][j] /= pivotVal;
        }

        for (let i = 0; i < numCons; i++) {
            if (i !== pivotRow) {
                const factor = matrix[i][pivotCol];
                for (let j = 0; j < matrix[i].length; j++) {
                    matrix[i][j] -= factor * matrix[pivotRow][j];
                }
            }
        }

        const factorZ = Z_row[pivotCol];
        for (let j = 0; j < Z_row.length; j++) {
            Z_row[j] -= factorZ * matrix[pivotRow][j];
        }

        basis[pivotRow] = enteringVar;
        iter++;
    }

    if (iter > MAX_ITER) throw new Error("No convergió. Revisa los datos.");

    const resultVars = {};
    vars.forEach(v => resultVars[v] = 0);

    basis.forEach((b, i) => {
        if (vars.includes(b)) {
            resultVars[b] = Math.abs(matrix[i][matrix[i].length - 1]) < 0.0001 ? 0 : matrix[i][matrix[i].length - 1];
        }
    });

    let zOpt = 0;
    Object.keys(resultVars).forEach(v => {
        zOpt += (objCoefs[v] || 0) * resultVars[v];
    });

    // ---------------------------------------------------------
    // VALIDACIÓN CORREGIDA: Evaluar contra las restricciones originales
    // ---------------------------------------------------------
    for (let i = 0; i < numCons; i++) {
        let realValue = 0;
        vars.forEach((v) => {
            realValue += (constraints[i].coefs[v] || 0) * resultVars[v];
        });

        const originalTiValue = constraints[i].value; // Usamos el valor original, no el de la tabla
        const sign = constraints[i].sign;
        const tolerance = 0.01;

        if (sign === "<=" && realValue > originalTiValue + tolerance) {
            throw new Error(`Infactible. En la restricción ${i + 1} el valor obtenido (${formatNumber(realValue)}) es mayor al límite permitido (${formatNumber(originalTiValue)}).`);
        }
        if (sign === ">=" && realValue < originalTiValue - tolerance) {
            throw new Error(`Infactible. En la restricción ${i + 1} el valor obtenido (${formatNumber(realValue)}) es menor al mínimo requerido (${formatNumber(originalTiValue)}).`);
        }
        if (sign === "=" && Math.abs(realValue - originalTiValue) > tolerance) {
            throw new Error(`Infactible. En la restricción ${i + 1} el valor obtenido (${formatNumber(realValue)}) no es igual a (${formatNumber(originalTiValue)}).`);
        }
    }

    const finalState = getTableState();

    steps.push({
        title: "Solución Óptima",
        description: "No hay más valores negativos en X o Y. Se ha llegado al óptimo.",
        ...finalState
    });

    const finalTableSimpleRows = finalState.rows.map(r => r.cells);

    // Formatear los resultados finales para la vista
    const formattedVars = {};
    Object.keys(resultVars).forEach(v => {
        formattedVars[v] = formatNumber(resultVars[v]);
    });

    return {
        status: "optimal",
        zValue: formatNumber(zOpt),
        variables: formattedVars,
        finalTable: {
            headers: finalState.headers,
            rows: finalTableSimpleRows
        },
        steps: steps
    };
}