// Registro de módulos: relaciona el id de cada método con su componente.
// Este archivo se edita una sola vez; después cada quien trabaja en su carpeta.
import SimplexPanel from "./simplex/SimplexPanel";
import NoroestePanel from "./noroeste/NoroestePanel";
import MinimosPanel from "./minimos/MinimosPanel";

export const MODULES = {
  simplex: SimplexPanel,
  noroeste: NoroestePanel,
  minimos: MinimosPanel,
};