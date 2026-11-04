// Tubo de neón que se enciende desde el centro hacia los lados
// y derrama luz sobre el contenido que queda debajo.
// Props:
//   colors     [color A, color B] del degradado del tubo
//   delay      segundos antes de encenderse
//   duration   segundos que tarda en recorrer todo el ancho
//   thickness  grosor del tubo en píxeles
export default function NeonReveal({
  colors = ["#b388ff", "#ff9ffc"],
  delay = 0.6,
  duration = 3.4,
  thickness = 3,
}) {
  const style = {
    "--neon-a": colors[0],
    "--neon-b": colors[1],
    "--neon-delay": `${delay}s`,
    "--neon-duration": `${duration}s`,
    "--neon-thickness": `${thickness}px`,
  };

  return (
    <div className="neon" style={style}>
      <div className="neon__spill" />
      <div className="neon__tube" />
    </div>
  );
}