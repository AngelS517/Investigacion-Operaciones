import { useEffect, useRef, useState } from "react";
import { METHODS } from "./methods";
import Intro from "./components/Intro";
import Tabs from "./components/Tabs";
import MethodPanel from "./components/MethodPanel";
import IntroDecor from "./components/intro/IntroDecor";
import Logo from "./components/Logo";
import "./App.css";

// Duración de la animación de salida (debe coincidir con --exit-ms en App.css).
const EXIT_MS = 450;

// Si la URL trae #simplex, #noroeste o #minimos se salta la introducción.
function methodFromHash() {
  const id = window.location.hash.replace("#", "");
  return METHODS.some((m) => m.id === id) ? id : null;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function App() {
  const [active, setActive] = useState(methodFromHash); // null = introducción
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const url = active ? `#${active}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [active]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Cambia entre la introducción y los métodos: primero juega la animación
  // de salida de la pantalla actual y luego aparece la nueva.
  const goTo = (target) => {
    if (leaving) return;
    if (prefersReducedMotion()) {
      setActive(target);
      return;
    }
    setLeaving(true);
    timer.current = setTimeout(() => {
      setActive(target);
      setLeaving(false);
    }, EXIT_MS);
  };

  const current = METHODS.find((m) => m.id === active);
  const screen = current ? "app" : "intro";

  return (
    <>
      <div className="bg" aria-hidden="true" />
      <div className="stars" aria-hidden="true" />

      {/* Neón arriba y cuadrícula abajo: solo se ven en la portada */}
      {!current && <IntroDecor leaving={leaving} />}

      <header className="topbar">
        <a
          href="/"
          className="logo"
          aria-label="Volver al inicio"
          onClick={(e) => {
            e.preventDefault();
            if (current) goTo(null);
          }}
        >
          <Logo />
        </a>
      </header>

      {/* El key hace que cada pantalla se monte de nuevo y reproduzca su entrada */}
      <main
        key={screen}
        className={`screen screen--${screen}${leaving ? " is-leaving" : ""}`}
      >
        {current ? (
          <>
            {/* Entre pestañas el cambio es directo; solo el panel hace un fundido suave */}
            <Tabs active={active} onChange={setActive} />
            <MethodPanel key={active} method={current} />
          </>
        ) : (
          <Intro onContinue={() => goTo("simplex")} />
        )}
      </main>
    </>
  );
}