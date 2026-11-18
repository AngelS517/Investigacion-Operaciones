/* src/modules/simplex/inputFilters.js */

// Limpia expresiones matemáticas (ej: "3x + 2y"). 
// Permite letras, números, +, -, *, /, espacios y paréntesis.
export const cleanExpression = (value, { equals = false } = {}) => {
  if (!value) return "";
  
  let regex = /[^a-zA-Z0-9+\-*/().\s]/g;
  if (equals) {
    regex = /[^a-zA-Z0-9+\-*/().=\s]/g;
  }

  return value.replace(regex, "").trimStart();
};

// Limpia nombres de variables (ej: "x, y, z")
export const cleanNames = (value) => {
  if (!value) return "";
  return value.replace(/[^a-zA-Z0-9,\s]/g, "").trimStart();
};

// Limpia números (permite decimales y negativos)
export const cleanNumber = (value) => {
  if (!value) return "";
  
  // 1. Permitir números, un punto decimal y el signo menos (-) al principio
  let clean = value.replace(/[^0-9.-]/g, "");
  
  // 2. Asegurarnos de que el signo menos solo esté al inicio
  if (clean.indexOf("-") > 0) {
    clean = clean.replace(/-/g, ""); // Quita guiones que estén en medio
    clean = "-" + clean; // Vuelve a ponerlo al principio si el usuario lo escribió mal
  }

  // 3. Evitar múltiples puntos decimales
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = parts[0] + "." + parts.slice(1).join("");
  }
  
  return clean;
};