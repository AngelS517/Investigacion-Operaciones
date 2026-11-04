import { useEffect, useRef } from "react";

// Cuadrícula en perspectiva que avanza hacia el horizonte, dibujada en un canvas.
// Props principales:
//   color      color de las líneas
//   speed      qué tan rápido avanza (líneas por segundo)
//   lines      cantidad de líneas horizontales visibles
//   columns    separación de las líneas verticales (más alto = más líneas)
//   lineWidth  grosor de las líneas
//   glow       intensidad del resplandor
export default function PerspectiveGrid({
  color = "#b388ff",
  speed = 0.35,
  lines = 14,
  columns = 9,
  lineWidth = 1.2,
  glow = 6,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let w = 0;
    let h = 0;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      const t = ((now - start) / 1000) * speed; // cuántas líneas ha avanzado
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.beginPath();

      // Líneas horizontales: la profundidad z avanza y la altura es h / z,
      // así se juntan hacia el horizonte (arriba) y se separan al acercarse.
      for (let n = 0; n < lines; n++) {
        const z = 1 + (((n - t) % lines) + lines) % lines;
        const y = h / z;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }

      // Líneas verticales: salen del punto de fuga (centro, arriba)
      // y se abren hacia abajo.
      const vx = w / 2;
      const spread = w / columns;
      const count = 20;
      for (let i = -count; i <= count; i++) {
        ctx.moveTo(vx, 0);
        ctx.lineTo(vx + i * spread, h);
      }
      ctx.stroke();

      // Desvanecido: transparente en el horizonte y en los bordes laterales.
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "destination-in";

      const vertical = ctx.createLinearGradient(0, 0, 0, h);
      vertical.addColorStop(0, "rgba(0,0,0,0)");
      vertical.addColorStop(0.45, "rgba(0,0,0,0.7)");
      vertical.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = vertical;
      ctx.fillRect(0, 0, w, h);

      const sides = ctx.createLinearGradient(0, 0, w, 0);
      sides.addColorStop(0, "rgba(0,0,0,0)");
      sides.addColorStop(0.18, "rgba(0,0,0,1)");
      sides.addColorStop(0.82, "rgba(0,0,0,1)");
      sides.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sides;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "source-over";
    };

    const loop = (now) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) draw(start); // sin movimiento: se dibuja un solo cuadro
    else raf = requestAnimationFrame(loop);

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) draw(start);
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [color, speed, lines, columns, lineWidth, glow]);

  return <canvas ref={canvasRef} className={className} />;
}