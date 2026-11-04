import NeonReveal from "./NeonReveal";
import PerspectiveGrid from "./PerspectiveGrid";
import "./intro-decor.css";

// Decoración exclusiva de la portada: línea de neón arriba y cuadrícula abajo.
// Aquí se cambian los colores de las dos piezas.
const NEON_COLORS = ["#b388ff", "#ff9ffc"];
const GRID_COLOR = "#b388ff";

export default function IntroDecor({ leaving }) {
  return (
    <div
      className={`intro-decor${leaving ? " is-leaving" : ""}`}
      aria-hidden="true"
    >
      <NeonReveal colors={NEON_COLORS} />
      <PerspectiveGrid className="intro-decor__grid" color={GRID_COLOR} />
    </div>
  );
}